import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  decodeCursor,
  encodeCursor,
  parseLimit,
} from '../common/utils/pagination.util';
import { Product } from '../database/schemas/product.schema';
import { WishlistItem } from '../database/schemas/wishlist-item.schema';
import { Cart } from '../database/schemas/cart.schema';

type WishlistRecord = WishlistItem & { _id: Types.ObjectId; createdAt: Date };

@Injectable()
export class WishlistItemsService {
  constructor(
    @InjectModel(WishlistItem.name) private readonly items: Model<WishlistItem>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Cart.name) private readonly carts: Model<Cart>,
  ) {}

  private owner(
    user?: AuthUser,
    guestSessionId?: string,
  ):
    | { ownerKey: string; userId?: Types.ObjectId; sessionId?: string }
    | undefined {
    if (user)
      return {
        ownerKey: `user:${user.id}`,
        userId: new Types.ObjectId(user.id),
      };
    if (guestSessionId)
      return { ownerKey: `guest:${guestSessionId}`, sessionId: guestSessionId };
    return undefined;
  }

  async list(
    user: AuthUser | undefined,
    guestId: string | undefined,
    limit?: number,
    cursorValue?: string,
  ): Promise<Record<string, unknown>> {
    const owner = this.owner(user, guestId);
    if (!owner)
      return { items: [], pageInfo: { nextCursor: null, hasNext: false } };
    const filter: Record<string, unknown> = { ownerKey: owner.ownerKey };
    const cursor = decodeCursor(cursorValue);
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor.id) };
    const pageSize = parseLimit(limit);
    const rows = await this.items
      .find(filter)
      .sort({ _id: -1 })
      .limit(pageSize + 1)
      .lean<WishlistRecord[]>()
      .exec();
    const hasNext = rows.length > pageSize;
    const pageItems = rows.slice(0, pageSize);
    const products = await this.products
      .find({ _id: { $in: pageItems.map((item) => item.productId) } })
      .lean()
      .exec();
    const productById = new Map(
      products.map((product) => [String(product._id), product]),
    );
    const resultItems = pageItems.flatMap((item) => {
      const product = productById.get(String(item.productId));
      return product
        ? [
            {
              id: String(item._id),
              product: { ...product, id: String(product._id), _id: undefined },
              createdAt: item.createdAt,
            },
          ]
        : [];
    });
    const last = pageItems.at(-1);
    return {
      items: resultItems,
      pageInfo: {
        hasNext,
        nextCursor:
          hasNext && last
            ? encodeCursor({
                id: String(last._id),
                sortValue: String(last._id),
              })
            : null,
      },
    };
  }

  async add(
    user: AuthUser | undefined,
    guestId: string | undefined,
    productId: string,
  ): Promise<{ item: unknown; created: boolean }> {
    const owner = this.owner(user, guestId);
    if (!owner)
      throw new NotFoundException({
        code: 'GUEST_SESSION_REQUIRED',
        message: 'Create a guest session before editing wishlist',
      });
    const product = await this.products
      .findOne({ _id: productId, archivedAt: null })
      .lean()
      .exec();
    if (!product)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    const existing = await this.items
      .findOne({
        ownerKey: owner.ownerKey,
        productId: new Types.ObjectId(productId),
      })
      .lean<WishlistRecord>()
      .exec();
    if (existing)
      return {
        item: {
          id: String(existing._id),
          product: { ...product, id: String(product._id), _id: undefined },
          createdAt: existing.createdAt,
        },
        created: false,
      };
    let item: WishlistRecord;
    try {
      item = (await this.items.create({
        ...owner,
        productId: new Types.ObjectId(productId),
      })) as unknown as WishlistRecord;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const raced = await this.items
          .findOne({
            ownerKey: owner.ownerKey,
            productId: new Types.ObjectId(productId),
          })
          .lean<WishlistRecord>()
          .exec();
        if (raced)
          return {
            item: {
              id: String(raced._id),
              product: { ...product, id: String(product._id), _id: undefined },
              createdAt: raced.createdAt,
            },
            created: false,
          };
      }
      throw error;
    }
    return {
      item: {
        id: String(item._id),
        product: { ...product, id: String(product._id), _id: undefined },
        createdAt: item.createdAt,
      },
      created: true,
    };
  }

  async remove(
    user: AuthUser | undefined,
    guestId: string | undefined,
    productId: string,
  ): Promise<void> {
    const owner = this.owner(user, guestId);
    if (!owner || !Types.ObjectId.isValid(productId)) return;
    await this.items.deleteOne({
      ownerKey: owner.ownerKey,
      productId: new Types.ObjectId(productId),
    });
  }

  async merge(
    user: AuthUser,
    guestId?: string,
  ): Promise<{ mergedCount: number }> {
    if (!guestId) return { mergedCount: 0 };
    const guestOwnerKey = `guest:${guestId}`;
    const userOwnerKey = `user:${user.id}`;
    const guestItems = await this.items
      .find({ ownerKey: guestOwnerKey })
      .lean()
      .exec();
    let mergedCount = 0;
    for (const item of guestItems) {
      const result = await this.items.updateOne(
        { ownerKey: userOwnerKey, productId: item.productId },
        {
          $setOnInsert: {
            ownerKey: userOwnerKey,
            userId: new Types.ObjectId(user.id),
            productId: item.productId,
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount) mergedCount += 1;
    }
    await this.items.deleteMany({ ownerKey: guestOwnerKey });
    await this.carts.deleteOne({ ownerKey: guestOwnerKey });
    return { mergedCount };
  }
}
