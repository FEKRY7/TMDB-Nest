import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from '../Movie/movie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from '../Movie/movie.entity';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Genre } from 'src/untils/enums';

describe('MovieService', () => {
  let service: MovieService;
  let movieRepository: any;
  let cloudinaryService: any;
  let cacheManager: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            find: jest.fn(),
            merge: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadProfileImage: jest.fn(),
            destroyImage: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    movieRepository = module.get(getRepositoryToken(Movie));
    cloudinaryService = module.get(CloudinaryService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  // ================= createOrUpdate =================
  describe('createOrUpdate', () => {
    it('should throw BadRequestException if tmdbId missing', async () => {
      await expect(service.createOrUpdate({ title: 'Movie' } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should create a new movie if not exist', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      movieRepository.create.mockReturnValue({ title: 'Movie' });
      movieRepository.save.mockResolvedValue({ id: 1, title: 'Movie' });

      const result = await service.createOrUpdate({ tmdbId: 1, title: 'Movie' } as any);
      expect(result).toEqual({ id: 1, title: 'Movie' });
    });

    it('should update existing movie', async () => {
      const existing = { id: 1, tmdbId: 1, title: 'Old' };
      movieRepository.findOne.mockResolvedValue(existing);
      movieRepository.merge.mockReturnValue({ ...existing, title: 'New' });
      movieRepository.save.mockResolvedValue({ id: 1, title: 'New' });

      const result = await service.createOrUpdate({ tmdbId: 1, title: 'New' } as any);
      expect(result.title).toBe('New');
    });
  });

  // ================= filterMove =================
  describe('filterMove', () => {
    it('should return cached result if exists', async () => {
      const cached = { data: [], total: 0, page: 1, limit: 10 };
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.filterMove({ title: 'Test' });
      expect(result).toBe(cached);
    });

    it('should query repository and cache result if not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      movieRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.filterMove({ title: 'Test', page: 1, limit: 10 });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  // ================= GetMovieById =================
  describe('GetMovieById', () => {
    it('should throw NotFoundException if movie not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      movieRepository.findOne.mockResolvedValue(null);

      await expect(service.GetMovieById(1)).rejects.toThrow(NotFoundException);
    });

    it('should return movie and set cache', async () => {
      const movie = { id: 1, title: 'Movie' };
      cacheManager.get.mockResolvedValue(null);
      movieRepository.findOne.mockResolvedValue(movie);

      const result = await service.GetMovieById(1);
      expect(result).toEqual(movie);
      expect(cacheManager.set).toHaveBeenCalledWith('movie:1', movie, 3600);
    });
  });

  // ================= findAll =================
  describe('findAll', () => {
    it('should return cached movies if exists', async () => {
      const cached = [{ id: 1 }];
      cacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll();
      expect(result).toBe(cached);
    });

    it('should query repository and set cache if not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      movieRepository.find.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAll();
      expect(result).toEqual([{ id: 1 }]);
      expect(cacheManager.set).toHaveBeenCalledWith('movies:all', [{ id: 1 }], 3600);
    });
  });

  // ================= updateMovie =================
  describe('updateMovie', () => {
    it('should throw NotFoundException if movie not found', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      await expect(service.updateMovie(1, { title: 'New', genre: Genre.ACTION })).rejects.toThrow(NotFoundException);
    });

    it('should update movie and delete cache', async () => {
      const movie = { id: 1, title: 'Old', posterPath: null, backdropPath: null };
      movieRepository.findOne.mockResolvedValue(movie);
      movieRepository.save.mockResolvedValue({ ...movie, title: 'New' });

      const result = await service.updateMovie(1, { title: 'New', genre: Genre.ACTION });
      expect(result.title).toBe('New');
      expect(cacheManager.del).toHaveBeenCalledWith('movie:1');
      expect(cacheManager.del).toHaveBeenCalledWith('movies:all');
    });
  });

  // ================= deleteMovie =================
  describe('deleteMovie', () => {
    it('should throw NotFoundException if movie not found', async () => {
      movieRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteMovie(1)).rejects.toThrow(NotFoundException);
    });

    it('should delete movie and cache', async () => {
      const movie = { id: 1, posterPath: null, backdropPath: null };
      movieRepository.findOne.mockResolvedValue(movie);
      movieRepository.remove.mockResolvedValue(true);

      const result = await service.deleteMovie(1);
      expect(result.message).toBe('Movie deleted successfully');
      expect(cacheManager.del).toHaveBeenCalledWith('movie:1');
      expect(cacheManager.del).toHaveBeenCalledWith('movies:all');
    });
  });
});
