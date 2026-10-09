import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(32, 512)
  token!: string;

  @IsString()
  @Length(8, 128)
  password!: string;
}
