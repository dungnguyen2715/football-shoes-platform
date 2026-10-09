import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from '../database/schemas/cart.schema';
import { Product } from '../database/schemas/product.schema';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AddCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly carts: Model<Cart>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
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

  async current(
    user?: AuthUser,
    guestSessionId?: string,
  ): Promise<Record<string, unknown>> {
    const owner = this.owner(user, guestSessionId);
    if (!owner)
      return { items: [], itemCount: 0, subtotalMinor: 0, currency: 'AUD' };
    const cart = await this.carts.findOne(owner).lean().exec();
    if (!cart)
      return { items: [], itemCount: 0, subtotalMinor: 0, currency: 'AUD' };
    const products = await this.products
      .find({
        _id: { $in: cart.items.map((item) => item.productId) },
        archivedAt: null,
      })
      .lean()
      .exec();
    const byId = new Map(
      products.map((product) => [String(product._id), product]),
    );
    const items = cart.items.flatMap((item) => {
      const product = byId.get(String(item.productId));
      return product
        ? [
            {
              productId: String(product._id),
              quantity: item.quantity,
              product: { ...product, id: String(product._id), _id: undefined },
            },
          ]
        : [];
    });
    return {
      id: String(cart._id),
      items,
      itemCount: items.length,
      subtotalMinor: items.reduce(
        (total, item) => total + Number(item.product.pricing.priceMinor),
        0,
      ),
      currency: 'AUD',
    };
  }

  async add(
    user: AuthUser | undefined,
    guestSessionId: string | undefined,
    input: AddCartItemDto,
  ): Promise<{ cart: Record<string, unknown>; created: boolean }> {
    const owner = this.owner(user, guestSessionId);
    if (!owner)
      throw new ConflictException({
        code: 'GUEST_SESSION_REQUIRED',
        message: 'Create a guest session before editing the cart',
      });
    const product = await this.products
      .findOne({
        _id: input.productId,
        availability: 'available',
        archivedAt: null,
      })
      .select('_id')
      .lean()
      .exec();
    if (!product)
      throw new ConflictException({
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product is not available',
      });
    const cart = await this.carts.findOneAndUpdate(
      owner,
      {
        $setOnInsert: {
          ...owner,
          items: [],
          expiresAt: new Date(Date.now() + 90 * 86400000),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    const created = !cart.items.some((item) =>
      item.productId.equals(product._id),
    );
    if (created) {
      if (cart.items.length >= 20)
        throw new ConflictException({
          code: 'CART_LIMIT_REACHED',
          message: 'Cart can contain at most 20 products',
        });
      cart.items.push({ productId: product._id, quantity: 1 });
      await cart.save();
    }
    return { cart: await this.current(user, guestSessionId), created };
  }

  async remove(
    user: AuthUser | undefined,
    guestSessionId: string | undefined,
    productId: string,
  ): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException({
        code: 'INVALID_ID',
        message: 'Product id is invalid',
      });
    const owner = this.owner(user, guestSessionId);
    if (!owner) return { cart: await this.current(user, guestSessionId) };
    await this.carts.updateOne(owner, {
      $pull: { items: { productId: new Types.ObjectId(productId) } },
    });
    return { cart: await this.current(user, guestSessionId) };
  }

  async clear(user?: AuthUser, guestSessionId?: string): Promise<void> {
    const owner = this.owner(user, guestSessionId);
    if (owner) await this.carts.updateOne(owner, { $set: { items: [] } });
  }

  async merge(
    user: AuthUser,
    guestSessionId?: string,
  ): Promise<Record<string, unknown>> {
    if (!guestSessionId) return { cart: await this.current(user) };
    const guest = await this.carts.findOne({
      ownerKey: `guest:${guestSessionId}`,
    });
    if (!guest) return { cart: await this.current(user) };
    const userOwner = this.owner(user)!;
    const target = await this.carts.findOneAndUpdate(
      userOwner,
      {
        $setOnInsert: {
          ...userOwner,
          items: [],
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    const available = new Set(
      (
        await this.products
          .find({
            _id: { $in: guest.items.map((item) => item.productId) },
            availability: 'available',
            archivedAt: null,
          })
          .distinct('_id')
      ).map(String),
    );
    const warnings: string[] = [];
    for (const item of guest.items) {
      const productId = String(item.productId);
      if (!available.has(productId)) {
        warnings.push(productId);
        continue;
      }
      if (
        !target.items.some((current) =>
          current.productId.equals(item.productId),
        ) &&
        target.items.length < 20
      )
        target.items.push({ productId: item.productId, quantity: 1 });
    }
    await target.save();
    return { cart: await this.current(user), warnings };
  }
}
