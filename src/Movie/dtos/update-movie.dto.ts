import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Genre } from 'src/untils/enums';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;

  @IsOptional()
  @IsNumber()
  popularity?: number;

  @IsOptional()
  @IsNumber()
  voteAverage?: number;

  @IsOptional()
  @IsNumber()
  voteCount?: number;

  @IsOptional()
  @IsNumber()
  tmdbId?: number;

  @IsOptional()
  @IsEnum(Genre)
  genre: Genre;

  @IsOptional()
  @IsBoolean()
  adult?: boolean;
}