import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserAddress } from '../database/schemas/user.schema';
import {
  AddressDto,
  UpdateAddressDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

type UserPublicRecord = {
  _id: Types.ObjectId;
  email: string;
  role: string;
  profile: Record<string, unknown>;
  preferences: Record<string, unknown>;
  addresses?: unknown[];
  createdAt?: Date;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async getSelf(userId: string): Promise<Record<string, unknown>> {
    const user = await this.users
      .findById(userId)
      .select('-passwordHash')
      .lean<UserPublicRecord>();
    if (!user)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User not found',
      });
    return this.toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
  ): Promise<Record<string, unknown>> {
    const updates = Object.fromEntries(
      Object.entries(input.profile ?? {}).map(([key, value]) => [
        `profile.${key}`,
        value,
      ]),
    );
    const user = await this.users
      .findByIdAndUpdate(
        userId,
        { $set: updates },
        { returnDocument: 'after', runValidators: true },
      )
      .select('-passwordHash')
      .lean<UserPublicRecord>();
    if (!user)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User not found',
      });
    return this.toPublicUser(user);
  }

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesDto,
  ): Promise<unknown> {
    const updates = Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        `preferences.${key}`,
        value,
      ]),
    );
    const user = await this.users
      .findByIdAndUpdate(
        userId,
        { $set: updates },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<UserPublicRecord>();
    if (!user)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User not found',
      });
    return user.preferences;
  }

  async addresses(userId: string): Promise<unknown[]> {
    const user = await this.users
      .findById(userId)
      .select('addresses')
      .lean<{ addresses?: unknown[] }>();
    if (!user)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User not found',
      });
    return user.addresses ?? [];
  }

  async addAddress(userId: string, input: AddressDto): Promise<unknown> {
    const user = await this.users.findById(userId);
    if (!user)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User not found',
      });
    if (user.addresses.length >= 10)
      throw new BadRequestException({
        code: 'ADDRESS_LIMIT_REACHED',
        message: 'A maximum of 10 addresses is allowed',
      });
    if (input.isDefault)
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    user.addresses.push({
      ...input,
      countryCode: input.countryCode ?? 'AU',
    } as UserAddress);
    await user.save();
    return this.toAddressDto(user.addresses.at(-1));
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressDto,
  ): Promise<unknown> {
    if (!Types.ObjectId.isValid(addressId))
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Address not found',
      });
    const user = await this.users.findById(userId);
    const address = user?.addresses.find(
      (item) =>
        String((item as UserAddress & { _id?: Types.ObjectId })._id) ===
        addressId,
    );
    if (!user || !address)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Address not found',
      });
    if (input.isDefault)
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    Object.assign(address, input);
    user.markModified('addresses');
    await user.save();
    return this.toAddressDto(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!Types.ObjectId.isValid(addressId))
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Address not found',
      });
    const user = await this.users.findById(userId);
    const addressIndex =
      user?.addresses.findIndex(
        (item) =>
          String((item as UserAddress & { _id?: Types.ObjectId })._id) ===
          addressId,
      ) ?? -1;
    if (!user || addressIndex < 0)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Address not found',
      });
    user.addresses.splice(addressIndex, 1);
    user.markModified('addresses');
    await user.save();
  }

  private toPublicUser(user: UserPublicRecord): Record<string, unknown> {
    return {
      id: String(user._id),
      email: user.email,
      role: user.role,
      profile: user.profile,
      preferences: user.preferences,
      addresses: user.addresses ?? [],
      createdAt: user.createdAt,
    };
  }

  private toAddressDto(
    address: UserAddress | undefined,
  ): Record<string, unknown> | undefined {
    if (!address) return undefined;
    const hydrated = address as UserAddress & { _id?: Types.ObjectId };
    return {
      ...address,
      id: hydrated._id ? String(hydrated._id) : undefined,
      _id: undefined,
    };
  }
}
