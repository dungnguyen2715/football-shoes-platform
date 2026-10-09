import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const asArray = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string')
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return [value];
};

export class ProductsQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional()
  @Transform(asArray)
  @IsString({ each: true })
  brand?: string[];
  @IsOptional()
  @Transform(asArray)
  @IsString({ each: true })
  size?: string[];
  @IsOptional()
  @Transform(asArray)
  @IsIn(['FG', 'SG', 'AG', 'TF', 'IC'], { each: true })
  surface?: string[];
  @IsOptional()
  @Transform(asArray)
  @IsString({ each: true })
  color?: string[];
  @IsOptional()
  @Transform(asArray)
  @IsIn(['available', 'reserved', 'sold'], { each: true })
  availability?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPriceMinor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPriceMinor?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  minCondition?: number;
  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional()
  @IsEnum(['newest', 'price_asc', 'price_desc', 'condition', 'views'])
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'condition' | 'views';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  includeArchived?: boolean;
}
