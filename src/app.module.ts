import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { ConfigModule } from '@nestjs/config';
import { User } from './Users/users.entity';
import { Token } from './Token/token.entity';
import { TokenModule } from './Token/token.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { MovieModule } from './Movie/movie.module';
import { RatingModule } from './Rating/rating.module';
import { CloudinaryModule } from './Cloudinary/cloudinary.module';
import { UsersModule } from './Users/users.module';
import { Movie } from './Movie/movie.entity';
import { Rating } from './Rating/rating.entity';
import { UserMovieList } from './UserMovieList/movieList.entity';
import { UserMovieListModule } from './UserMovieList/movieList.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env', 
    }),  
     CacheModule.register({
      ttl: 3600, 
      max: 100, 
      isGlobal: true,
    }),
    TokenModule, 
    TmdbModule,
    MovieModule,
    UsersModule,
    RatingModule,
    UserMovieListModule,  
    CloudinaryModule,
    TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  entities: [
    Token,
    User,
    Movie,
    Rating,
    UserMovieList,
  ],
  retryAttempts: 10,    
  retryDelay: 5000,     
}),
  ], 
})
export class AppModule {}
