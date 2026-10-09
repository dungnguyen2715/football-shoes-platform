import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { parseLimit } from '../common/utils/pagination.util';
import { Order } from '../database/schemas/order.schema';
import { User } from '../database/schemas/user.schema';
import { CustomersQueryDto } from './customers-query.dto';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  instagram: string;
  whatsapp: string;
  zalo: string;
  location: string;
  orders: number;
  spentMinor: number;
  lastOrderAt: Date | null;
  recordStatus: 'registered' | 'disabled' | 'guest';
  _sortId: string;
}

interface CustomerFacet {
  items: CustomerRow[];
  total: Array<{ count: number }>;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
  ) {}

  async list(query: CustomersQueryDto): Promise<Record<string, unknown>> {
    const offset = this.decodeOffset(query.cursor);
    const limit = parseLimit(query.limit);
    const base = this.customerRowsPipeline(query.q);
    const sortField =
      query.sort === 'spent_desc' ? 'spentMinor' : 'lastOrderAt';
    const [page] = await this.users
      .aggregate<CustomerFacet>([
        ...base,
        { $sort: { [sortField]: -1, _sortId: 1 } },
        {
          $facet: {
            items: [{ $skip: offset }, { $limit: limit + 1 }],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .allowDiskUse(true)
      .exec();

    const rows = page?.items ?? [];
    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit).map((row) => this.toPublicCustomer(row));
    return {
      items,
      pageInfo: {
        total: page?.total[0]?.count ?? 0,
        hasNext,
        nextCursor: hasNext ? this.encodeOffset(offset + limit) : null,
      },
    };
  }

  async get(id: string): Promise<Record<string, unknown>> {
    let customer: CustomerRow | undefined;
    if (Types.ObjectId.isValid(id)) {
      [customer] = await this.users
        .aggregate<CustomerRow>([
          ...this.customerRowsPipeline(
            undefined,
            new Types.ObjectId(id),
            false,
          ),
          { $limit: 1 },
        ])
        .allowDiskUse(true)
        .exec();
    } else if (id.startsWith('guest-')) {
      const seedOrderId = id.slice('guest-'.length);
      if (Types.ObjectId.isValid(seedOrderId)) {
        const seedOrder = await this.orders
          .findById(seedOrderId)
          .select('customer.emailNormalized customerId')
          .lean<{
            customer: { emailNormalized: string };
            customerId?: Types.ObjectId;
          }>()
          .exec();
        if (seedOrder && !seedOrder.customerId) {
          [customer] = await this.orders
            .aggregate<CustomerRow>(
              this.guestCustomerPipeline(seedOrder.customer.emailNormalized),
            )
            .allowDiskUse(true)
            .exec();
          if (customer?.id !== id) customer = undefined;
        }
      }
    }
    if (!customer)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Customer not found',
      });

    const orderFilter = Types.ObjectId.isValid(id)
      ? {
          $or: [
            { customerId: new Types.ObjectId(id) },
            { 'customer.emailNormalized': customer.email.toLowerCase() },
          ],
        }
      : { 'customer.emailNormalized': customer.email.toLowerCase() };
    const orders = await this.orders
      .find(orderFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .lean()
      .exec();

    return {
      customer: this.toPublicCustomer(customer),
      recentOrders: orders.map((order) => ({
        ...order,
        id: String(order._id),
        _id: undefined,
      })),
      pageInfo: { nextCursor: null, hasNext: false },
    };
  }

  /**
   * Merge registered customers with guest-only checkout contacts inside MongoDB.
   * Only a requested page reaches the Node process, regardless of collection size.
   */
  private customerRowsPipeline(
    search?: string,
    registeredId?: Types.ObjectId,
    includeGuests = true,
  ): PipelineStage[] {
    const registered: PipelineStage[] = [
      {
        $lookup: {
          from: 'orders',
          let: { userId: '$_id', email: '$email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$customerId', '$$userId'] },
                    { $eq: ['$customer.emailNormalized', '$$email'] },
                  ],
                },
              },
            },
            { $sort: { createdAt: 1, _id: 1 } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                spentMinor: {
                  $sum: {
                    $cond: [
                      { $eq: ['$status', 'completed'] },
                      '$totals.totalMinor',
                      0,
                    ],
                  },
                },
                lastOrderAt: { $max: '$createdAt' },
                lastOrderPhone: { $last: '$customer.phone' },
              },
            },
          ],
          as: 'orderStats',
        },
      },
      {
        $set: {
          orderStats: {
            $ifNull: [{ $arrayElemAt: ['$orderStats', 0] }, {}],
          },
        },
      },
      {
        $project: {
          id: { $toString: '$_id' },
          _sortId: { $toString: '$_id' },
          name: '$profile.name',
          email: 1,
          phone: {
            $ifNull: [
              { $ifNull: ['$profile.phone', '$orderStats.lastOrderPhone'] },
              '',
            ],
          },
          instagram: { $ifNull: ['$profile.instagram', ''] },
          whatsapp: { $ifNull: ['$profile.whatsapp', ''] },
          zalo: { $ifNull: ['$profile.zalo', ''] },
          location: { $ifNull: ['$profile.location', ''] },
          orders: { $ifNull: ['$orderStats.orders', 0] },
          spentMinor: { $ifNull: ['$orderStats.spentMinor', 0] },
          lastOrderAt: { $ifNull: ['$orderStats.lastOrderAt', null] },
          recordStatus: {
            $cond: [{ $eq: ['$status', 'disabled'] }, 'disabled', 'registered'],
          },
        },
      },
    ];

    const pipeline: PipelineStage[] = [
      ...(registeredId ? [{ $match: { _id: registeredId } }] : []),
      ...registered,
    ];
    if (includeGuests)
      pipeline.push({
        $unionWith: { coll: 'orders', pipeline: this.guestCustomerPipeline() },
      });

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } },
            { phone: { $regex: escaped, $options: 'i' } },
            { location: { $regex: escaped, $options: 'i' } },
          ],
        },
      });
    }
    return pipeline;
  }

  private guestCustomerPipeline(
    emailNormalized?: string,
  ): PipelineStage.UnionWithPipelineStage[] {
    return [
      {
        $match: {
          customerId: { $exists: false },
          ...(emailNormalized
            ? { 'customer.emailNormalized': emailNormalized }
            : {}),
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: '$customer.emailNormalized',
          guestOrderId: { $min: '$_id' },
          name: { $first: '$customer.name' },
          email: { $first: '$customer.email' },
          phone: { $first: '$customer.phone' },
          orders: { $sum: 1 },
          spentMinor: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$totals.totalMinor',
                0,
              ],
            },
          },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { email: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$email', '$$email'] } } },
            { $project: { _id: 1 } },
            { $limit: 1 },
          ],
          as: 'registeredCustomer',
        },
      },
      { $match: { $expr: { $eq: [{ $size: '$registeredCustomer' }, 0] } } },
      {
        $project: {
          id: { $concat: ['guest-', { $toString: '$guestOrderId' }] },
          _sortId: { $toString: '$guestOrderId' },
          name: 1,
          email: 1,
          phone: 1,
          instagram: { $literal: '' },
          whatsapp: { $literal: '' },
          zalo: { $literal: '' },
          location: { $literal: '' },
          orders: 1,
          spentMinor: 1,
          lastOrderAt: 1,
          recordStatus: { $literal: 'guest' },
        },
      },
    ];
  }

  private decodeOffset(value?: string): number {
    if (!value) return 0;
    try {
      const data: unknown = JSON.parse(
        Buffer.from(value, 'base64url').toString(),
      );
      if (
        typeof data === 'object' &&
        data !== null &&
        'offset' in data &&
        typeof data.offset === 'number' &&
        Number.isSafeInteger(data.offset) &&
        data.offset >= 0
      )
        return data.offset;
    } catch {
      // Fall through to a normalized query error.
    }
    throw new NotFoundException({
      code: 'INVALID_QUERY',
      message: 'Invalid cursor',
    });
  }

  private encodeOffset(offset: number): string {
    return Buffer.from(JSON.stringify({ offset })).toString('base64url');
  }

  private toPublicCustomer(row: CustomerRow): Record<string, unknown> {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      instagram: row.instagram,
      whatsapp: row.whatsapp,
      zalo: row.zalo,
      location: row.location,
      orders: row.orders,
      spentMinor: row.spentMinor,
      lastOrderAt: row.lastOrderAt,
      recordStatus: row.recordStatus,
    };
  }
}
