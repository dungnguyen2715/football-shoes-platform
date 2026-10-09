import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FulfillmentPatchDto {
  @IsOptional() @IsInt() @Min(0) freeShippingThresholdMinor?: number;
  @IsOptional() @IsInt() @Min(0) standardShippingFeeMinor?: number;
}
export class NotificationsPatchDto {
  @IsOptional() @IsBoolean() orderAlerts?: boolean;
  @IsOptional() @IsBoolean() inventoryAlerts?: boolean;
  @IsOptional() @IsBoolean() weeklySummary?: boolean;
}
export class SettingsPatchDto {
  @IsOptional() @IsString() @MaxLength(100) storeName?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(32) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(100) instagram?: string;
  @IsOptional() @IsBoolean() isOpen?: boolean;
  @IsOptional()
  @ValidateNested()
  @Type(() => FulfillmentPatchDto)
  fulfillment?: FulfillmentPatchDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationsPatchDto)
  notifications?: NotificationsPatchDto;
}
