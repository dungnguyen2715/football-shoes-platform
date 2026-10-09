import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class ReviewsQueryDto {
  @IsOptional() @IsEnum(['store', 'product']) kind?: 'store' | 'product';
  @IsOptional() @IsMongoId() productId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() cursor?: string;
}
