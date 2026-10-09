import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WishlistItemDocument = HydratedDocument<WishlistItem>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
  collection: 'wishlist_items',
})
export class WishlistItem {
  @Prop({ type: String, required: true })
  ownerKey!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: String })
  sessionId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
WishlistItemSchema.index({ ownerKey: 1, productId: 1 }, { unique: true });
WishlistItemSchema.index({ productId: 1 });
