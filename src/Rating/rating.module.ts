import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RatingService } from './rating.service';
import { Rating } from './rating.entity';
import { RatingController } from './rating.controller';
import { User } from 'src/Users/users.entity';
import { Movie } from 'src/Movie/movie.entity';
import { UsersModule } from 'src/Users/users.module';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService], 
    imports: [
      TypeOrmModule.forFeature([Rating,User,Movie]),
      forwardRef(() => UsersModule),
      JwtModule,
    ],
})
export class RatingModule {}