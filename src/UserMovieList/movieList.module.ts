import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMovieList } from './movieList.entity';
import { Movie } from 'src/Movie/movie.entity';
import { MovieListController } from './movieList.controller';
import { MovieListService } from './movieList.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';

@Module({
  controllers: [MovieListController],
  providers: [MovieListService],
  exports: [MovieListService], 
  imports: [
    TypeOrmModule.forFeature([UserMovieList,Movie]),
    forwardRef(() => UsersModule),
    JwtModule,
  ],
})
export class UserMovieListModule {}
