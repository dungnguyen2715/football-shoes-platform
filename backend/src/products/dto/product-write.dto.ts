import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
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

export class ProductPricingDto {
  @IsEnum(['AUD']) currency!: 'AUD';
  @IsInt() @Min(0) priceMinor!: number;
  @IsInt() @Min(0) retailPriceMinor!: number;
}

export class ProductWriteDto {
  @IsString() @MinLength(2) @MaxLength(180) name!: string;
  @IsString() @MinLength(2) @MaxLength(80) brand!: string;
  @IsString() @MinLength(1) @MaxLength(120) model!: string;
  @ValidateNested() @Type(() => ProductPricingDto) pricing!: ProductPricingDto;
  @IsString() @MinLength(2) @MaxLength(20) size!: string;
  @IsInt() @Min(1) @Max(10) conditionScore!: number;
  @IsEnum(['FG', 'SG', 'AG', 'TF', 'IC']) surface!:
    'FG' | 'SG' | 'AG' | 'TF' | 'IC';
  @IsString() @MinLength(1) @MaxLength(100) studType!: string;
  @IsString() @MinLength(1) @MaxLength(120) colorway!: string;
  @IsString() @MinLength(1) @MaxLength(60) color!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  imageUrls!: string[];
  @IsEnum(['available', 'reserved', 'sold']) availability!:
    'available' | 'reserved' | 'sold';
  @IsString() @MinLength(1) @MaxLength(5000) description!: string;
  @IsOptional() @IsDateString() listedAt?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsMongoId({ each: true })
  categoryIds?: string[];
}

export class ProductPatchDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) brand?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) model?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPricingDto)
  pricing?: ProductPricingDto;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(20) size?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10) conditionScore?: number;
  @IsOptional()
  @IsEnum(['FG', 'SG', 'AG', 'TF', 'IC'])
  surface?: ProductWriteDto['surface'];
  @IsOptional() @IsString() @MaxLength(100) studType?: string;
  @IsOptional() @IsString() @MaxLength(120) colorway?: string;
  @IsOptional() @IsString() @MaxLength(60) color?: string;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  imageUrls?: string[];
  @IsOptional()
  @IsEnum(['available', 'reserved', 'sold'])
  availability?: ProductWriteDto['availability'];
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsDateString() listedAt?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsMongoId({ each: true })
  categoryIds?: string[];
}
