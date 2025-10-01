import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Genre } from 'src/untils/enums';

export class CreateMovieDto {

  @IsNumber()
  tmdbId?: number;

  @IsString()
  title: string;  

  @IsOptional()
  @IsString()
  overview?: string;  

  @IsOptional()
  @IsString()
  releaseDate?: string;  

  @IsOptional()
  @IsNumber()
  voteAverage?: number;  

  @IsOptional()
  @IsNumber()
  voteCount?: number;  

  @IsOptional()
  @IsNumber()
  popularity?: number; 

  @IsOptional()
  @IsBoolean()
  adult?: boolean;  

  @IsEnum(Genre)
  genre: Genre;
}
