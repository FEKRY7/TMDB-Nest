import { Controller, Get, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  // GET: /tmdb/sync?page=1
  @Get('sync')
  async syncMovies(@Query('page') page: number = 1) {
    return this.tmdbService.fetchPopularMovies(page);
  }
}

