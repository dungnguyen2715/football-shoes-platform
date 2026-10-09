import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ _id: false })
export class ReviewAuthor {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  location?: string;
}
export const ReviewAuthorSchema = SchemaFactory.createForClass(ReviewAuthor);

@Schema({ timestamps: true, versionKey: false, collection: 'reviews' })
export class Review {
  @Prop({ type: String, enum: ['store', 'product'], required: true })
  kind!: 'store' | 'product';

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: ReviewAuthorSchema, required: true })
  author!: ReviewAuthor;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: { validator: Number.isInteger },
  })
  rating!: number;

  @Prop({ type: String, required: true, trim: true, maxlength: 3000 })
  text!: string;

  @Prop({
    type: String,
    enum: ['pending', 'published', 'hidden'],
    default: 'pending',
    required: true,
  })
  status!: 'pending' | 'published' | 'hidden';
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ kind: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
