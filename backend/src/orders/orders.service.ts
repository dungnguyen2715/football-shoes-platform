import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, QueryFilter, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import {
  createOpaqueToken,
  createPublicOrderNo,
  sha256,
  stableStringify,
} from '../common/utils/crypto.util';
import {
  decodeCursor,
  encodeCursor,
  parseLimit,
} from '../common/utils/pagination.util';
import { Order } from '../database/schemas/order.schema';
import { Product } from '../database/schemas/product.schema';
import { StoreSettings } from '../database/schemas/store-settings.schema';
import {
  CreateOrderDto,
  OrdersQueryDto,
  UpdateOrderStatusDto,
} from './order.dto';

type OrderRecord = Order & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
type ProductRecord = Product & { _id: Types.ObjectId };
type Page<T> = {
  items: T[];
  pageInfo: { nextCursor: string | null; hasNext: boolean };
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(StoreSettings.name)
    private readonly settings: Model<StoreSettings>,
    private readonly config: ConfigService,
  ) {}

  async checkout(
    input: CreateOrderDto,
    owner: { userId?: string; guestSessionId: string },
    idempotencyKey?: string,
  ): Promise<{
    order: Record<string, unknown>;
    guestAccessToken?: string;
    guestAccessExpiresAt?: Date;
    replayed: boolean;
  }> {
    if (
      !idempotencyKey ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idempotencyKey,
      )
    ) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'A valid Idempotency-Key header is required',
      });
    }
    const ownerKey = owner.userId
      ? `user:${owner.userId}`
      : `guest:${owner.guestSessionId}`;
    const keyHash = sha256(`${ownerKey}:${idempotencyKey}`);
    const requestHash = sha256(stableStringify(input));
    const existing = await this.orders
      .findOne({ idempotencyKeyHash: keyHash })
      .select('+idempotencyKeyHash +idempotencyRequestHash')
      .lean<OrderRecord & { idempotencyRequestHash?: string }>()
      .exec();
    if (existing) {
      if (existing.idempotencyRequestHash !== requestHash)
        throw new ConflictException({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key was already used with a different request',
        });
      return { order: this.toDto(existing), replayed: true };
    }

    const store = await this.settings.findOne({ _id: 'store' }).lean().exec();
    if (store?.isOpen === false)
      throw new ConflictException({
        code: 'STORE_CLOSED',
        message: 'The store is not accepting orders right now',
      });
    const orderItems: Array<Record<string, unknown>> = [];
    let subtotalMinor = 0;
    const reservedIds: Types.ObjectId[] = [];
    try {
      for (const requested of input.items) {
        if (requested.quantity !== 1)
          throw new ConflictException({
            code: 'PRODUCT_UNAVAILABLE',
            message: 'One-of-one products only support quantity 1',
          });
        // Conditional inventory update prevents two checkouts reserving the same one-off listing.
        const product = await this.products
          .findOneAndUpdate(
            {
              _id: requested.productId,
              availability: 'available',
              archivedAt: null,
            },
            { $set: { availability: 'reserved' } },
            { returnDocument: 'after' },
          )
          .lean()
          .exec();
        if (!product)
          throw new ConflictException({
            code: 'PRODUCT_UNAVAILABLE',
            message: 'A product in this order is no longer available',
          });
        reservedIds.push(product._id);
        const price = product.pricing.priceMinor;
        subtotalMinor += price;
        orderItems.push({
          productId: product._id,
          productSnapshot: {
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            model: product.model,
            size: product.size,
            imageUrl: product.imageUrls[0],
          },
          quantity: 1,
          unitPriceMinor: price,
          lineTotalMinor: price,
        });
      }
      const threshold = store?.fulfillment?.freeShippingThresholdMinor ?? 30000;
      const standardFee = store?.fulfillment?.standardShippingFeeMinor ?? 1500;
      const shippingMinor = subtotalMinor > threshold ? 0 : standardFee;
      const guestAccessToken = owner.userId ? undefined : createOpaqueToken();
      const guestAccessExpiresAt = guestAccessToken
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined;
      const created = await this.orders.create({
        orderNo: createPublicOrderNo(),
        ...(owner.userId
          ? { customerId: new Types.ObjectId(owner.userId) }
          : {}),
        customer: {
          ...input.customer,
          emailNormalized: input.customer.email.toLowerCase(),
        },
        shippingAddress: {
          ...input.shippingAddress,
          countryCode: input.shippingAddress.countryCode ?? 'AU',
        },
        items: orderItems,
        totals: {
          currency: 'AUD',
          subtotalMinor,
          shippingMinor,
          totalMinor: subtotalMinor + shippingMinor,
        },
        status: 'pending',
        payment: { method: 'manual', status: 'manual_pending' },
        notes: input.notes,
        statusHistory: [{ status: 'pending', changedAt: new Date() }],
        ...(guestAccessToken
          ? {
              guestAccessTokenHash: sha256(guestAccessToken),
              guestAccessTokenExpiresAt: guestAccessExpiresAt,
            }
          : {}),
        idempotencyKeyHash: keyHash,
        idempotencyRequestHash: requestHash,
      });
      return {
        order: this.toDto(created.toObject()),
        ...(guestAccessToken ? { guestAccessToken, guestAccessExpiresAt } : {}),
        replayed: false,
      };
    } catch (error) {
      if (reservedIds.length)
        await this.products.updateMany(
          { _id: { $in: reservedIds }, availability: 'reserved' },
          { $set: { availability: 'available' } },
        );
      if (this.isDuplicateKey(error)) {
        const replay = await this.orders
          .findOne({ idempotencyKeyHash: keyHash })
          .select('+idempotencyRequestHash')
          .lean<OrderRecord & { idempotencyRequestHash?: string }>()
          .exec();
        if (replay) {
          if (replay.idempotencyRequestHash !== requestHash)
            throw new ConflictException({
              code: 'IDEMPOTENCY_CONFLICT',
              message:
                'Idempotency key was already used with a different request',
            });
          return { order: this.toDto(replay), replayed: true };
        }
      }
      throw error;
    }
  }

  async get(
    orderNo: string,
    userId?: string,
    guestToken?: string,
  ): Promise<Record<string, unknown>> {
    const filter: QueryFilter<Order> = { orderNo };
    if (userId) filter.customerId = new Types.ObjectId(userId);
    else if (guestToken) {
      filter.guestAccessTokenHash = sha256(guestToken);
      filter.guestAccessTokenExpiresAt = { $gt: new Date() };
    } else
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    const order = await this.orders
      .findOne(filter)
      .select(
        '+guestAccessTokenHash +idempotencyKeyHash +idempotencyRequestHash',
      )
      .lean<OrderRecord>()
      .exec();
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    return this.toDto(order);
  }

  async listForCustomer(
    userId: string,
    query: OrdersQueryDto,
  ): Promise<Page<Record<string, unknown>>> {
    const filter: QueryFilter<Order> = {
      customerId: new Types.ObjectId(userId),
    };
    this.applyFilters(filter, query);
    const rows = await this.paginate(filter, query);
    return rows;
  }

  async listAdmin(query: OrdersQueryDto): Promise<
    Page<Record<string, unknown>> & {
      summary: { total: number; pending: number };
    }
  > {
    const filter: QueryFilter<Order> = {};
    this.applyFilters(filter, query);
    if (query.q?.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { orderNo: new RegExp(escaped, 'i') },
        { 'customer.name': new RegExp(escaped, 'i') },
        { 'customer.emailNormalized': new RegExp(escaped, 'i') },
        { 'customer.phone': new RegExp(escaped, 'i') },
      ];
    }
    const [page, total, pending] = await Promise.all([
      this.paginate(filter, query),
      this.orders.countDocuments(filter),
      this.orders.countDocuments({ ...filter, status: 'pending' }),
    ]);
    return { ...page, summary: { total, pending } };
  }

  async adminGet(orderNo: string): Promise<Record<string, unknown>> {
    const order = await this.orders
      .findOne({ orderNo })
      .lean<OrderRecord>()
      .exec();
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    return this.toDto(order);
  }

  async updateStatus(
    orderNo: string,
    actorId: string,
    input: UpdateOrderStatusDto,
  ): Promise<Record<string, unknown>> {
    const order = await this.orders.findOne({ orderNo });
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    if (!this.canTransition(order.status, input.status))
      throw new ConflictException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot change order from ${order.status} to ${input.status}`,
      });
    const updatedOrder = await this.orders
      .findOneAndUpdate(
        { _id: order._id, status: order.status },
        {
          $set: { status: input.status },
          $push: {
            statusHistory: {
              $each: [
                {
                  status: input.status,
                  changedAt: new Date(),
                  actorId: new Types.ObjectId(actorId),
                  note: input.note,
                },
              ],
              $slice: -20,
            },
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updatedOrder)
      throw new ConflictException({
        code: 'ORDER_STATUS_CHANGED',
        message: 'Order status changed; reload the order and retry',
      });
    if (input.status === 'completed') {
      await this.products.updateMany(
        {
          _id: { $in: updatedOrder.items.map((item) => item.productId) },
          availability: 'reserved',
        },
        { $set: { availability: 'sold' } },
      );
    } else if (input.status === 'cancelled') {
      await this.products.updateMany(
        {
          _id: { $in: updatedOrder.items.map((item) => item.productId) },
          availability: 'reserved',
        },
        { $set: { availability: 'available' } },
      );
    }
    return this.toDto(updatedOrder.toObject());
  }

  async overview(): Promise<Record<string, unknown>> {
    const [
      statusCounts,
      availableProducts,
      reservedProducts,
      soldProducts,
      recentOrders,
      topViewedProducts,
      revenue,
    ] = await Promise.all([
      this.orders.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.products.countDocuments({
        availability: 'available',
        archivedAt: null,
      }),
      this.products.countDocuments({
        availability: 'reserved',
        archivedAt: null,
      }),
      this.products.countDocuments({ availability: 'sold', archivedAt: null }),
      this.orders
        .find()
        .sort({ createdAt: -1 })
        .limit(8)
        .lean<OrderRecord[]>()
        .exec(),
      this.products
        .find({ archivedAt: null })
        .sort({ viewsTotal: -1 })
        .limit(5)
        .lean()
        .exec(),
      this.orders.aggregate<{ total: number }>([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totals.totalMinor' } } },
      ]),
    ]);
    const count = (status: string): number =>
      statusCounts.find((entry) => entry._id === status)?.count ?? 0;
    return {
      metrics: {
        revenueMinor: revenue[0]?.total ?? 0,
        orders: statusCounts.reduce((sum, item) => sum + item.count, 0),
        pendingOrders: count('pending'),
        availableProducts,
        reservedProducts,
        soldProducts,
      },
      recentOrders: recentOrders.map((item) => this.toDto(item)),
      topViewedProducts: topViewedProducts.map((item) => ({
        id: String(item._id),
        name: item.name,
        brand: item.brand,
        viewsTotal: item.viewsTotal,
        imageUrl: item.imageUrls[0],
      })),
    };
  }

  async analytics(
    from?: string,
    to?: string,
    groupBy = 'month',
    limit = 5,
  ): Promise<Record<string, unknown>> {
    const dateMatch: Record<string, Date> = {};
    if (from) dateMatch.$gte = new Date(from);
    if (to) dateMatch.$lte = new Date(to);
    const match = {
      status: 'completed',
      ...(Object.keys(dateMatch).length ? { createdAt: dateMatch } : {}),
    };
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';
    const [
      metrics,
      series,
      topViewedProducts,
      inventoryBySurface,
      productViews,
    ] = await Promise.all([
      this.orders.aggregate<{
        revenueMinor: number;
        completedOrders: number;
        averageOrderValueMinor: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: null,
            revenueMinor: { $sum: '$totals.totalMinor' },
            completedOrders: { $sum: 1 },
            averageOrderValueMinor: { $avg: '$totals.totalMinor' },
          },
        },
      ]),
      this.orders.aggregate<{
        _id: string;
        revenueMinor: number;
        orders: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            revenueMinor: { $sum: '$totals.totalMinor' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 366 },
      ]),
      this.products
        .find({ archivedAt: null })
        .sort({ viewsTotal: -1 })
        .limit(Math.min(Math.max(limit, 1), 20))
        .lean<ProductRecord[]>()
        .exec(),
      this.products.aggregate<{ _id: string; count: number }>([
        { $match: { archivedAt: null } },
        { $group: { _id: '$surface', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      this.products.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: '$viewsTotal' } } },
      ]),
    ]);
    return {
      period: { from: from ?? null, to: to ?? null, groupBy },
      metrics: {
        revenueMinor: metrics[0]?.revenueMinor ?? 0,
        completedOrders: metrics[0]?.completedOrders ?? 0,
        averageOrderValueMinor: Math.round(
          metrics[0]?.averageOrderValueMinor ?? 0,
        ),
        productViews: productViews[0]?.total ?? 0,
      },
      series: series.map((item) => ({
        period: item._id,
        revenueMinor: item.revenueMinor,
        orders: item.orders,
      })),
      topViewedProducts: topViewedProducts.map((item) => ({
        id: String(item._id),
        name: item.name,
        brand: item.brand,
        viewsTotal: item.viewsTotal,
        imageUrl: item.imageUrls[0],
      })),
      inventoryBySurface: inventoryBySurface.map((item) => ({
        surface: item._id,
        count: item.count,
      })),
    };
  }

  private async paginate(
    filter: QueryFilter<Order>,
    query: OrdersQueryDto,
  ): Promise<Page<Record<string, unknown>>> {
    const direction: 1 | -1 = query.sort === 'createdAt_asc' ? 1 : -1;
    const cursor = decodeCursor(query.cursor);
    const pageFilter: QueryFilter<Order> = { ...filter };
    if (cursor) {
      const operator = direction === 1 ? '$gt' : '$lt';
      const cursorDate = new Date(cursor.sortValue);
      pageFilter.$and = [
        ...(pageFilter.$and ?? []),
        {
          $or: [
            { createdAt: { [operator]: cursorDate } },
            {
              createdAt: cursorDate,
              _id: { [operator]: new Types.ObjectId(cursor.id) },
            },
          ],
        },
      ];
    }
    const limit = parseLimit(query.limit);
    const rows = await this.orders
      .find(pageFilter)
      .sort({ createdAt: direction, _id: direction })
      .limit(limit + 1)
      .lean<OrderRecord[]>()
      .exec();
    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items: items.map((item) => this.toDto(item)),
      pageInfo: {
        hasNext,
        nextCursor:
          hasNext && last?.createdAt
            ? encodeCursor({
                id: String(last._id),
                sortValue: last.createdAt.toISOString(),
              })
            : null,
      },
    };
  }
  private applyFilters(
    filter: QueryFilter<Order>,
    query: OrdersQueryDto,
  ): void {
    if (query.status) filter.status = query.status;
    if (query.channel) filter['customer.preferredChannel'] = query.channel;
    if (query.from || query.to)
      filter.createdAt = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
  }
  private canTransition(current: string, next: string): boolean {
    const transitions: Record<string, string[]> = {
      pending: ['contacted', 'confirmed', 'cancelled'],
      contacted: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return current === next || (transitions[current]?.includes(next) ?? false);
  }
  private toDto(order: OrderRecord): Record<string, unknown> {
    return {
      id: String(order._id),
      orderNo: order.orderNo,
      customerId: order.customerId ? String(order.customerId) : undefined,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totals: order.totals,
      status: order.status,
      payment: order.payment,
      notes: order.notes,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
  private isDuplicateKey(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }
}
