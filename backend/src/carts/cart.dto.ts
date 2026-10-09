import { IsIn, IsInt, IsMongoId } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId() productId!: string;
  @IsInt() @IsIn([1]) quantity!: number;
}
