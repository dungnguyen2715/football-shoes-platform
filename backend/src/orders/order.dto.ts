import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsMongoId() productId!: string;
  @IsInt() @IsIn([1]) quantity!: number;
}
export class OrderCustomerDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(5) @MaxLength(32) phone!: string;
  @IsEnum(['whatsapp', 'messenger', 'instagram', 'zalo', 'phone', 'email'])
  preferredChannel!:
    'whatsapp' | 'messenger' | 'instagram' | 'zalo' | 'phone' | 'email';
  @IsOptional() @IsString() @MaxLength(120) handle?: string;
}
export class ShippingAddressDto {
  @IsString() @MinLength(3) @MaxLength(200) line1!: string;
  @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @IsOptional() @IsString() @MaxLength(100) suburb?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(20) postcode?: string;
  @IsOptional() @IsString() @MaxLength(2) countryCode?: string;
}
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
  @ValidateNested() @Type(() => OrderCustomerDto) customer!: OrderCustomerDto;
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'contacted', 'confirmed', 'completed', 'cancelled'])
  status!: 'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class OrdersQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional()
  @IsEnum(['pending', 'contacted', 'confirmed', 'completed', 'cancelled'])
  status?: UpdateOrderStatusDto['status'];
  @IsOptional()
  @IsEnum(['whatsapp', 'messenger', 'instagram', 'zalo', 'phone', 'email'])
  channel?: OrderCustomerDto['preferredChannel'];
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsEnum(['createdAt_desc', 'createdAt_asc']) sort?:
    'createdAt_desc' | 'createdAt_asc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() cursor?: string;
}
