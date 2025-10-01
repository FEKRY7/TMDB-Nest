import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 150)
  @IsOptional()
  firstName?: string;

  @IsString()
  @Length(2, 150)
  @IsOptional()
  lastName?: string;
}
