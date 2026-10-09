import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthSession, AuthSessionSchema } from './schemas/auth-session.schema';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from './schemas/password-reset-token.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import {
  StoreSettings,
  StoreSettingsSchema,
} from './schemas/store-settings.schema';
import { User, UserSchema } from './schemas/user.schema';
import {
  WishlistItem,
  WishlistItemSchema,
} from './schemas/wishlist-item.schema';

const schemas = [
  { name: User.name, schema: UserSchema },
  { name: AuthSession.name, schema: AuthSessionSchema },
  { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
  { name: Product.name, schema: ProductSchema },
  { name: Category.name, schema: CategorySchema },
  { name: Order.name, schema: OrderSchema },
  { name: Cart.name, schema: CartSchema },
  { name: WishlistItem.name, schema: WishlistItemSchema },
  { name: StoreSettings.name, schema: StoreSettingsSchema },
  { name: Review.name, schema: ReviewSchema },
];

@Global()
@Module({
  imports: [MongooseModule.forFeature(schemas)],
  exports: [MongooseModule],
})
export class DatabaseModule {}
