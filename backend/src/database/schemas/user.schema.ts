import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'disabled';
export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserProfile {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, trim: true })
  instagram?: string;

  @Prop({ type: String, trim: true })
  whatsapp?: string;

  @Prop({ type: String, trim: true })
  zalo?: string;

  @Prop({ type: String, trim: true })
  location?: string;
}
export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ type: Boolean, default: true })
  dropAlerts!: boolean;

  @Prop({ type: Boolean, default: true })
  priceDrops!: boolean;

  @Prop({ type: Boolean, default: false })
  smsUpdates!: boolean;
}
export const UserPreferencesSchema =
  SchemaFactory.createForClass(UserPreferences);

@Schema()
export class UserAddress {
  @Prop({ type: String, trim: true })
  label?: string;

  @Prop({ type: String, trim: true })
  recipientName?: string;

  @Prop({ type: String, trim: true })
  phone?: string;

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
    required: true,
    default: 'AU',
    uppercase: true,
    minlength: 2,
    maxlength: 2,
  })
  countryCode!: string;

  @Prop({ type: Boolean, default: false })
  isDefault!: boolean;
}
export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

@Schema({ timestamps: true, versionKey: false, collection: 'users' })
export class User {
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  })
  email!: string;

  @Prop({ type: String, select: false })
  passwordHash?: string;

  @Prop({
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
    required: true,
  })
  role!: UserRole;

  @Prop({
    type: String,
    enum: ['active', 'disabled'],
    default: 'active',
    required: true,
  })
  status!: UserStatus;

  @Prop({ type: UserProfileSchema, required: true })
  profile!: UserProfile;

  @Prop({ type: UserPreferencesSchema, default: () => ({}) })
  preferences!: UserPreferences;

  @Prop({
    type: [UserAddressSchema],
    default: [],
    validate: { validator: (value: unknown[]) => value.length <= 10 },
  })
  addresses!: UserAddress[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1, status: 1, createdAt: -1 });
