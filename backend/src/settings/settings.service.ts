import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StoreSettings } from '../database/schemas/store-settings.schema';
import { SettingsPatchDto } from './settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(StoreSettings.name)
    private readonly settings: Model<StoreSettings>,
  ) {}

  private async getOrCreate() {
    return this.settings.findOneAndUpdate(
      { _id: 'store' },
      { $setOnInsert: { _id: 'store' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
  async publicSettings(): Promise<Record<string, unknown>> {
    const setting = await this.getOrCreate();
    return {
      storeName: setting.storeName,
      contactEmail: setting.contactEmail,
      contactPhone: setting.contactPhone,
      instagram: setting.instagram,
      isOpen: setting.isOpen,
      fulfillment: {
        freeShippingThresholdMinor:
          setting.fulfillment.freeShippingThresholdMinor,
        standardShippingFeeMinor: setting.fulfillment.standardShippingFeeMinor,
        paymentMode: setting.fulfillment.paymentMode,
        currency: 'AUD',
      },
    };
  }
  async adminSettings(): Promise<unknown> {
    const setting = await this.getOrCreate();
    return { ...setting.toObject(), id: String(setting._id), _id: undefined };
  }
  async update(actorId: string, patch: SettingsPatchDto): Promise<unknown> {
    const update: Record<string, unknown> = {
      updatedBy: new Types.ObjectId(actorId),
    };
    for (const field of [
      'storeName',
      'contactEmail',
      'contactPhone',
      'instagram',
      'isOpen',
    ] as const) {
      if (patch[field] !== undefined) update[field] = patch[field];
    }
    for (const group of ['fulfillment', 'notifications'] as const) {
      for (const [key, value] of Object.entries(patch[group] ?? {}))
        update[`${group}.${key}`] = value;
    }
    await this.settings.updateOne(
      { _id: 'store' },
      { $setOnInsert: { _id: 'store' }, $set: update },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return this.adminSettings();
  }
}
