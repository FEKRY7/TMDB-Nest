import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from '../Rating/rating.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Rating } from '../Rating/rating.entity';
import { User } from '../Users/users.entity';
import { Movie } from '../Movie/movie.entity';
import { NotFoundException } from '@nestjs/common';

describe('RatingService', () => {
  let service: RatingService;
  let ratingRepository: any;
  let userRepository: any;
  let movieRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: getRepositoryToken(Rating),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
    ratingRepository = module.get(getRepositoryToken(Rating));
    userRepository = module.get(getRepositoryToken(User));
    movieRepository = module.get(getRepositoryToken(Movie));
  });

  // ================= rateMovie =================
  describe('rateMovie', () => {
    it('should throw if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.rateMovie(1, 1, { value: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should throw if movie not found', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 });
      movieRepository.findOne.mockResolvedValue(null);
      await expect(service.rateMovie(1, 1, { value: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should create a new rating and update movie rating', async () => {
      const user = { id: 1 };
      const movie = { id: 1, rating: 0, ratingCount: 0 };
      userRepository.findOne.mockResolvedValue(user);
      movieRepository.findOne.mockResolvedValue(movie);
      ratingRepository.findOne.mockResolvedValue(null);
      ratingRepository.create.mockReturnValue({ user, movie, value: 5 });
      ratingRepository.save.mockResolvedValue({ user, movie, value: 5 });
      ratingRepository.createQueryBuilder().getRawOne.mockResolvedValue({ avg: '5', count: '1' });
      movieRepository.save.mockResolvedValue({ ...movie, rating: 5, ratingCount: 1 });

      const result = await service.rateMovie(1, 1, { value: 5 });
      expect(result).toEqual({ averageRating: 5, ratingCount: 1 });
    });
  });

  // ================= getMovieRating =================
  describe('getMovieRating', () => {
    it('should return average and count', async () => {
      ratingRepository.createQueryBuilder().getRawOne.mockResolvedValue({ avg: '4.5', count: '2' });
      const result = await service.getMovieRating(1);
      expect(result).toEqual({ average: 4.5, count: '2' });
    });

    it('should return 0 if no ratings', async () => {
      ratingRepository.createQueryBuilder().getRawOne.mockResolvedValue({ avg: null, count: '0' });
      const result = await service.getMovieRating(1);
      expect(result).toEqual({ average: 0, count: '0' });
    });
  });

  // ================= getUserRatings =================
  describe('getUserRatings', () => {
    it('should throw if no ratings found', async () => {
      ratingRepository.find.mockResolvedValue([]);
      await expect(service.getUserRatings(1)).rejects.toThrow(NotFoundException);
    });

    it('should return user ratings', async () => {
      const ratings = [{ id: 1, value: 5, movie: { id: 1 } }];
      ratingRepository.find.mockResolvedValue(ratings);
      const result = await service.getUserRatings(1);
      expect(result).toEqual(ratings);
    });
  });

  // ================= deleteRating =================
  describe('deleteRating', () => {
    it('should throw if rating not found', async () => {
      ratingRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteRating(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should remove rating if found', async () => {
      const rating = { id: 1 };
      ratingRepository.findOne.mockResolvedValue(rating);
      ratingRepository.remove.mockResolvedValue(true);

      await service.deleteRating(1, 1);
      expect(ratingRepository.remove).toHaveBeenCalledWith(rating);
    });
  });
});
