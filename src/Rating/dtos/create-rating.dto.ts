import { IsNumber, Min, Max } from 'class-validator';

export class RatingMovieDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}
