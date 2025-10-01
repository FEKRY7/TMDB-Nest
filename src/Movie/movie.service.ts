import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan, LessThan } from 'typeorm';
import { Movie } from './movie.entity';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import { Genre } from 'src/untils/enums';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }


  public async createOrUpdate(
    createMovieDto: CreateMovieDto,
    posterImage?: Express.Multer.File,
    backdropImage?: Express.Multer.File,
  ): Promise<Movie> {
    if (!createMovieDto.tmdbId) throw new BadRequestException('tmdbId is required.');

    const existingMovie = await this.movieRepository.findOne({ where: { tmdbId: createMovieDto.tmdbId } });

    let posterPath = existingMovie?.posterPath || null;
    let backdropPath = existingMovie?.backdropPath || null;

    if (posterImage) {
      const upload = await this.cloudinaryService.uploadProfileImage(posterImage);
      if (existingMovie?.posterPath?.public_id) await this.cloudinaryService.destroyImage(existingMovie.posterPath.public_id);
      posterPath = { secure_url: upload.secure_url, public_id: upload.public_id };
    }

    if (backdropImage) {
      const upload = await this.cloudinaryService.uploadProfileImage(backdropImage);
      if (existingMovie?.backdropPath?.public_id) await this.cloudinaryService.destroyImage(existingMovie.backdropPath.public_id);
      backdropPath = { secure_url: upload.secure_url, public_id: upload.public_id };
    }

    if (existingMovie) {
      const updated = this.movieRepository.merge(existingMovie, { ...createMovieDto, posterPath, backdropPath });
      return await this.movieRepository.save(updated);
    }

    const newMovie = this.movieRepository.create({ ...createMovieDto, posterPath, backdropPath });
    return await this.movieRepository.save(newMovie);
  }

  public async filterMove(filters?: {
    title?: string;
    minPopularity?: number;
    maxPopularity?: number;
    year?: number;
    genre?: Genre;
    sortBy?: 'popularity' | 'releaseDate' | 'title' | 'rating';
    order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const cacheKey = `movies:${JSON.stringify(filters)}`;

    const cached = await this.cacheManager.get<{ data: Movie[]; total: number; page: number; limit: number }>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (filters?.title) where.title = Like(`%${filters.title}%`);
    if (filters?.minPopularity) where.popularity = MoreThan(filters.minPopularity);
    if (filters?.maxPopularity) where.popularity = LessThan(filters.maxPopularity);
    if (filters?.year) where.releaseDate = Like(`${filters.year}%`);
    if (filters?.genre) where.genre = filters.genre;

    const order: any = {};
    if (filters?.sortBy) order[filters.sortBy] = filters.order || 'DESC';

    const skip = (page - 1) * limit;
    const [data, total] = await this.movieRepository.findAndCount({ where, order, skip, take: limit });

    const result = { data, total, page, limit };
    await this.cacheManager.set(cacheKey, result, 3600);

    return result;
  }

  public async GetMovieById(id: number) {
    const cacheKey = `movie:${id}`;
    const cached = await this.cacheManager.get<Movie>(cacheKey);
    if (cached) return cached;

    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException(`Movie with id ${id} not found`);

    await this.cacheManager.set(cacheKey, movie, 3600);
    return movie;
  }

  public async findAll() {
    const cacheKey = `movies:all`;
    const cached = await this.cacheManager.get<Movie[]>(cacheKey);
    if (cached) return cached;

    const movies = await this.movieRepository.find();
    await this.cacheManager.set(cacheKey, movies, 3600);
    return movies;
  }


  public async updateMovie(id: number, updateMovieDto: UpdateMovieDto, posterImage?: Express.Multer.File, backdropImage?: Express.Multer.File) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException(`Movie with ID ${id} not found`);

    if (posterImage) {
      if (movie.posterPath?.public_id) await this.cloudinaryService.destroyImage(movie.posterPath.public_id);
      const upload = await this.cloudinaryService.uploadProfileImage(posterImage);
      movie.posterPath = { public_id: upload.public_id, secure_url: upload.secure_url };
    }

    if (backdropImage) {
      if (movie.backdropPath?.public_id) await this.cloudinaryService.destroyImage(movie.backdropPath.public_id);
      const upload = await this.cloudinaryService.uploadProfileImage(backdropImage);
      movie.backdropPath = { public_id: upload.public_id, secure_url: upload.secure_url };
    }

    Object.assign(movie, updateMovieDto);
    const updated = await this.movieRepository.save(movie);


    await this.cacheManager.del(`movie:${id}`);
    await this.cacheManager.del(`movies:all`);

    return updated;
  }


  public async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException('Movie not found');

    if (movie.posterPath?.public_id) await this.cloudinaryService.destroyImage(movie.posterPath.public_id);
    if (movie.backdropPath?.public_id) await this.cloudinaryService.destroyImage(movie.backdropPath.public_id);

    await this.movieRepository.remove(movie);


    await this.cacheManager.del(`movie:${id}`);
    await this.cacheManager.del(`movies:all`);

    return { message: 'Movie deleted successfully' };
  }
}
