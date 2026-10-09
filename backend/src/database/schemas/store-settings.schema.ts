import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreSettingsDocument = HydratedDocument<StoreSettings>;

@Schema({ _id: false })
export class FulfillmentSettings {
  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 30000,
    validate: { validator: Number.isSafeInteger },
  })
  freeShippingThresholdMinor!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 1500,
    validate: { validator: Number.isSafeInteger },
  })
  standardShippingFeeMinor!: number;

  @Prop({ type: String, enum: ['manual'], default: 'manual', required: true })
  paymentMode!: 'manual';
}
export const FulfillmentSettingsSchema =
  SchemaFactory.createForClass(FulfillmentSettings);

@Schema({ _id: false })
export class AdminNotifications {
  @Prop({ type: Boolean, default: true })
  orderAlerts!: boolean;

  @Prop({ type: Boolean, default: true })
  inventoryAlerts!: boolean;

  @Prop({ type: Boolean, default: false })
  weeklySummary!: boolean;
}
export const AdminNotificationsSchema =
  SchemaFactory.createForClass(AdminNotifications);

@Schema({ timestamps: true, versionKey: false, collection: 'store_settings' })
export class StoreSettings {
  @Prop({ type: String, default: 'store' })
  _id!: string;

  @Prop({ type: String, required: true, trim: true, default: 'Bootyard' })
  storeName!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: 'owner@example.com',
  })
  contactEmail!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    default: '+61 000 000 000',
  })
  contactPhone!: string;

  @Prop({ type: String, required: true, trim: true, default: '@bootyard.au' })
  instagram!: string;

  @Prop({ type: Boolean, required: true, default: true })
  isOpen!: boolean;

  @Prop({
    type: FulfillmentSettingsSchema,
    required: true,
    default: () => ({}),
  })
  fulfillment!: FulfillmentSettings;

  @Prop({ type: AdminNotificationsSchema, required: true, default: () => ({}) })
  notifications!: AdminNotifications;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const StoreSettingsSchema = SchemaFactory.createForClass(StoreSettings);
