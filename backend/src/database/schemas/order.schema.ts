import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderStatus =
  'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
export type ContactChannel =
  'whatsapp' | 'messenger' | 'instagram' | 'zalo' | 'phone' | 'email';
export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderCustomer {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  emailNormalized!: string;

  @Prop({ type: String, required: true, trim: true })
  phone!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['whatsapp', 'messenger', 'instagram', 'zalo', 'phone', 'email'],
  })
  preferredChannel!: ContactChannel;

  @Prop({ type: String, trim: true })
  handle?: string;
}
export const OrderCustomerSchema = SchemaFactory.createForClass(OrderCustomer);

@Schema({ _id: false })
export class ShippingAddressSnapshot {
  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  line1!: string;

  @Prop({ type: String, trim: true, maxlength: 200 })
  line2?: string;

  @Prop({ type: String, trim: true })
  suburb?: string;

  @Prop({ type: String, trim: true })
  state?: string;

  @Prop({ type: String, trim: true })
  postcode?: string;

  @Prop({
    type: String,
    default: 'AU',
    uppercase: true,
    minlength: 2,
    maxlength: 2,
  })
  countryCode!: string;
}
export const ShippingAddressSnapshotSchema = SchemaFactory.createForClass(
  ShippingAddressSnapshot,
);

@Schema({ _id: false })
export class OrderProductSnapshot {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: String, required: true })
  brand!: string;

  @Prop({ type: String, required: true })
  model!: string;

  @Prop({ type: String, required: true })
  size!: string;

  @Prop({ type: String, required: true })
  imageUrl!: string;
}
export const OrderProductSnapshotSchema =
  SchemaFactory.createForClass(OrderProductSnapshot);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: OrderProductSnapshotSchema, required: true })
  productSnapshot!: OrderProductSnapshot;

  @Prop({ type: Number, required: true, min: 1, max: 1, default: 1 })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  unitPriceMinor!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  lineTotalMinor!: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderTotals {
  @Prop({ type: String, enum: ['AUD'], default: 'AUD', required: true })
  currency!: 'AUD';

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  subtotalMinor!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  shippingMinor!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isSafeInteger },
  })
  totalMinor!: number;
}
export const OrderTotalsSchema = SchemaFactory.createForClass(OrderTotals);

@Schema({ _id: false })
export class PaymentRecord {
  @Prop({ type: String, enum: ['manual'], default: 'manual', required: true })
  method!: 'manual';

  @Prop({
    type: String,
    enum: ['manual_pending', 'paid', 'refunded'],
    default: 'manual_pending',
    required: true,
  })
  status!: 'manual_pending' | 'paid' | 'refunded';
}
export const PaymentRecordSchema = SchemaFactory.createForClass(PaymentRecord);

@Schema({ _id: false })
export class OrderStatusChange {
  @Prop({
    type: String,
    enum: ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'],
    required: true,
  })
  status!: OrderStatus;

  @Prop({ type: Date, default: Date.now, required: true })
  changedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop({ type: String, maxlength: 500 })
  note?: string;
}
export const OrderStatusChangeSchema =
  SchemaFactory.createForClass(OrderStatusChange);

@Schema({ timestamps: true, versionKey: false, collection: 'orders' })
export class Order {
  @Prop({ type: String, required: true, unique: true })
  orderNo!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ type: OrderCustomerSchema, required: true })
  customer!: OrderCustomer;

  @Prop({ type: ShippingAddressSnapshotSchema, required: true })
  shippingAddress!: ShippingAddressSnapshot;

  @Prop({
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) =>
        items.length >= 1 && items.length <= 20,
    },
  })
  items!: OrderItem[];

  @Prop({ type: OrderTotalsSchema, required: true })
  totals!: OrderTotals;

  @Prop({
    type: String,
    enum: ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    required: true,
  })
  status!: OrderStatus;

  @Prop({ type: PaymentRecordSchema, default: () => ({}) })
  payment!: PaymentRecord;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  notes?: string;

  @Prop({ type: String, select: false })
  guestAccessTokenHash?: string;

  @Prop({ type: Date })
  guestAccessTokenExpiresAt?: Date;

  @Prop({ type: String, select: false })
  idempotencyKeyHash?: string;

  @Prop({ type: String, select: false })
  idempotencyRequestHash?: string;

  @Prop({
    type: [OrderStatusChangeSchema],
    default: [],
    validate: {
      validator: (history: OrderStatusChange[]) => history.length <= 20,
    },
  })
  statusHistory!: OrderStatusChange[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ idempotencyKeyHash: 1 }, { unique: true, sparse: true });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer.emailNormalized': 1, createdAt: -1 });
