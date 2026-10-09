import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductAvailability = 'available' | 'reserved' | 'sold';
export type ProductSurface = 'FG' | 'SG' | 'AG' | 'TF' | 'IC';
export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductPricing {
  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  priceMinor!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  retailPriceMinor!: number;

  @Prop({ type: String, enum: ['AUD'], default: 'AUD', required: true })
  currency!: 'AUD';
}
export const ProductPricingSchema =
  SchemaFactory.createForClass(ProductPricing);

@Schema({ timestamps: true, versionKey: false, collection: 'products' })
export class Product {
  @Prop({ type: String, trim: true, unique: true, sparse: true })
  legacyId?: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  })
  slug!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 180 })
  name!: string;

  @Prop({ type: String, required: true, trim: true })
  brand!: string;

  @Prop({ type: String, required: true, trim: true })
  model!: string;

  @Prop({ type: ProductPricingSchema, required: true })
  pricing!: ProductPricing;

  @Prop({ type: String, required: true, trim: true, index: true })
  size!: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: { validator: Number.isInteger },
  })
  conditionScore!: number;

  @Prop({ type: String, enum: ['FG', 'SG', 'AG', 'TF', 'IC'], required: true })
  surface!: ProductSurface;

  @Prop({ type: String, required: true, trim: true })
  studType!: string;

  @Prop({ type: String, required: true, trim: true })
  colorway!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  color!: string;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: (value: string[]) => value.length >= 1 && value.length <= 12,
    },
  })
  imageUrls!: string[];

  @Prop({
    type: String,
    enum: ['available', 'reserved', 'sold'],
    default: 'available',
    required: true,
  })
  availability!: ProductAvailability;

  @Prop({ type: String, required: true, maxlength: 5000 })
  description!: string;

  @Prop({ type: Date, required: true, default: Date.now })
  listedAt!: Date;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
    validate: { validator: Number.isSafeInteger },
  })
  viewsTotal!: number;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  archivedAt!: Date | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ availability: 1, listedAt: -1 });
ProductSchema.index({ brand: 1, availability: 1, 'pricing.priceMinor': 1 });
ProductSchema.index({ surface: 1, size: 1, availability: 1 });
ProductSchema.index({ viewsTotal: -1 });
ProductSchema.index({ categoryIds: 1, availability: 1, listedAt: -1 });
ProductSchema.index(
  { name: 'text', model: 'text', colorway: 'text', size: 'text' },
  {
    weights: { name: 10, model: 8, colorway: 4, size: 2 },
    name: 'catalog_text',
  },
);
