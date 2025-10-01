import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './movie.entity';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { CloudinaryModule } from 'src/Cloudinary/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/Users/users.module';

@Module({
  controllers: [MovieController],
  providers: [MovieService],
  exports: [MovieService], 
  imports: [
    TypeOrmModule.forFeature([Movie]),
    forwardRef(() => UsersModule),
    CloudinaryModule,
    JwtModule,
  ],
})
export class MovieModule {}
