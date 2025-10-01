import { IsEnum } from 'class-validator';
import { ListType } from 'src/untils/enums';


export class CreateUserMovieListDto {

  @IsEnum(ListType)
  type: ListType; 
} 
