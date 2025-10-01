import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovieListService } from '../UserMovieList/movieList.service';
import { UserMovieList } from '../UserMovieList/movieList.entity';
import { Movie } from '../Movie/movie.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ListType } from '../untils/enums';

describe('MovieListService', () => {
  let service: MovieListService;
  let userMovieListRepo: any;
  let movieRepo: any;

  const payload = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER', 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieListService,
        {
          provide: getRepositoryToken(UserMovieList),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MovieListService>(MovieListService);
    userMovieListRepo = module.get(getRepositoryToken(UserMovieList));
    movieRepo = module.get(getRepositoryToken(Movie));
  });

  // ================= add =================
  describe('add', () => {
    it('should throw NotFoundException if movie not found', async () => {
      movieRepo.findOne.mockResolvedValue(null);
      const dto = { type: ListType.FAVORITE }; 
      await expect(service.add(payload, 1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if movie already in list', async () => {
      movieRepo.findOne.mockResolvedValue({ id: 1 });
      userMovieListRepo.findOne.mockResolvedValue({ id: 1 });
      const dto = { type: ListType.FAVORITE };
      await expect(service.add(payload, 1, dto)).rejects.toThrow(ConflictException);
    });

    it('should add movie to list', async () => {
      const movie = { id: 1 };
      movieRepo.findOne.mockResolvedValue(movie);
      userMovieListRepo.findOne.mockResolvedValue(null);
      userMovieListRepo.create.mockReturnValue({ movie });
      userMovieListRepo.save.mockResolvedValue({ id: 1, movie });

      const dto = { type: ListType.FAVORITE };
      const result = await service.add(payload, 1, dto);
      expect(result).toEqual({ id: 1, movie });
    });
  });

  // ================= getList =================
  describe('getList', () => {
    it('should return list of movies', async () => {
      const movies = [{ id: 1 }, { id: 2 }];
      userMovieListRepo.find.mockResolvedValue(movies);

      const dto = { type: ListType.FAVORITE };
      const result = await service.getList(payload, dto);
      expect(result).toBe(movies);
    });
  });

  // ================= remove =================
  describe('remove', () => {
    it('should throw NotFoundException if movie not in list', async () => {
      userMovieListRepo.findOne.mockResolvedValue(null);
      const dto = { type: ListType.FAVORITE };
      await expect(service.remove(payload, 1, dto)).rejects.toThrow(NotFoundException);
    });

    it('should remove movie from list', async () => {
      const entry = { id: 1 };
      userMovieListRepo.findOne.mockResolvedValue(entry);
      userMovieListRepo.remove.mockResolvedValue(true);

      const dto = { type: ListType.FAVORITE };
      const result = await service.remove(payload, 1, dto);
      expect(result).toEqual({ message: 'Movie removed from FAVORITE' });
    });
  });
});
