import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { MovieModule } from 'src/Movie/movie.module';

@Module({
  controllers: [TmdbController],
  providers: [TmdbService],
  imports: [MovieModule],
})
export class TmdbModule {}
