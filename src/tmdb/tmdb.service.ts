import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import axios from 'axios';
import { MovieService } from 'src/Movie/movie.service';
import { CreateMovieDto } from 'src/Movie/dtos/create-movie.dto';
import { Genre } from 'src/untils/enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TmdbService implements OnModuleInit {
  private readonly apiKey = process.env.TMDB_API_KEY;
  private genreMap: Record<number, Genre> = {};

  constructor(
    private readonly movieService: MovieService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async onModuleInit() {
    await this.loadGenres();
  }

  private async loadGenres() {
    try {
      const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${this.apiKey}&language=en-US`;
      const response = await axios.get(url);
      const genres = response.data.genres;

      for (const g of genres) {
        if (Object.values(Genre).includes(g.name)) {
          this.genreMap[g.id] = g.name as Genre;
        }
      }

      console.log('Genres loaded from TMDB:', this.genreMap);
    } catch (error) {
      console.error('Error loading genres:', error.response?.data || error.message);
    }
  }

  public async fetchPopularMovies(page = 1) {
    try {
      const cacheKey = `popular_movies_page_${page}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;

      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${this.apiKey}&language=en-US&page=${page}`;
      const response = await axios.get(url);
      const movies = response.data.results;

      let count = 0;

      for (const movie of movies) {
        const genre =
          movie.genre_ids?.length && this.genreMap[movie.genre_ids[0]]
            ? this.genreMap[movie.genre_ids[0]]
            : Genre.ACTION;

        const posterPath = movie.poster_path
          ? { secure_url: `https://image.tmdb.org/t/p/original${movie.poster_path}`, public_id: '' }
          : { secure_url: '', public_id: '' };

        const backdropPath = movie.backdrop_path
          ? { secure_url: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`, public_id: '' }
          : { secure_url: '', public_id: '' };

        const createMovieDto: CreateMovieDto & {
          posterPath: { secure_url: string; public_id: string };
          backdropPath: { secure_url: string; public_id: string };
        } = {
          tmdbId: movie.id,
          title: movie.title || 'Untitled',
          overview: movie.overview || '',
          releaseDate: movie.release_date || null,
          voteAverage: movie.vote_average || 0,
          voteCount: movie.vote_count || 0,
          popularity: movie.popularity || 0,
          adult: movie.adult || false,
          genre,
          posterPath,
          backdropPath,
        };

        await this.movieService.createOrUpdate(createMovieDto);
        count++;
      }

      const result = { count, page };
      await this.cacheManager.set(cacheKey, result, 3600);
      console.log(`Saved ${count} movies from TMDB page ${page}`);
      return result;
    } catch (error) {
      console.error(
        'Error while fetching movies:',
        error.response?.data || error.message || error,
      );
      throw error;
    }
  }
}

