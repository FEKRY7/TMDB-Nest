import { IsNotEmpty, IsNumber } from 'class-validator';

export class RatingMovieDto {
  @IsNumber()
  @IsNotEmpty()
  rating: number;  
}
