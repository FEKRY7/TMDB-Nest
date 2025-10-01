import { Test, TestingModule } from '@nestjs/testing';
import { TmdbService } from '../tmdb/tmdb.service';
import { MovieService } from '../Movie/movie.service';
import { CloudinaryService } from '../Cloudinary/cloudinary.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import axios from 'axios';
import { Genre } from '../untils/enums';

jest.mock('axios');

describe('TmdbService', () => {
  let service: TmdbService;
  let movieService: any;
  let cloudinaryService: any;
  let cacheManager: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbService,
        {
          provide: MovieService,
          useValue: { createOrUpdate: jest.fn() },
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
    movieService = module.get(MovieService);
    cloudinaryService = module.get(CloudinaryService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ================= onModuleInit & loadGenres =================
  it('should load genres on init', async () => {
    const genresData = { data: { genres: [{ id: 1, name: Genre.ACTION }, { id: 2, name: Genre.COMEDY }] } };
    (axios.get as jest.Mock).mockResolvedValue(genresData);

    await service.onModuleInit();

    expect(service['genreMap'][1]).toBe(Genre.ACTION);
    expect(service['genreMap'][2]).toBe(Genre.COMEDY);
  });

  // ================= urlToMulterFile =================
  it('should convert url to multer file', async () => {
    const bufferData = Buffer.from('test');
    (axios.get as jest.Mock).mockResolvedValue({ data: bufferData });

    const file = await service['urlToMulterFile']('http://example.com/image.jpg', 'poster');
    expect(file.originalname).toBe('poster');
    expect(file.buffer).toEqual(bufferData);
  });

  // ================= fetchPopularMovies =================
  it('should return cached result if exists', async () => {
    const cached = { count: 5 };
    cacheManager.get.mockResolvedValue(cached);

    const result = await service.fetchPopularMovies();
    expect(result).toBe(cached);
  });

  it('should fetch popular movies and call movieService.createOrUpdate', async () => {
    cacheManager.get.mockResolvedValue(null);

    const moviesData = {
      data: {
        results: [
          {
            id: 1,
            title: 'Movie 1',
            overview: 'Overview 1',
            release_date: '2025-10-01',
            vote_average: 8.5,
            vote_count: 100,
            popularity: 123.4,
            adult: false,
            genre_ids: [1],
            poster_path: '/poster.jpg',
            backdrop_path: '/backdrop.jpg',
          },
        ],
      },
    };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { genres: [{ id: 1, name: Genre.ACTION }] } }); // loadGenres
    (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('image') }); // urlToMulterFile
    (axios.get as jest.Mock).mockResolvedValue(moviesData); // popular movies

    const createOrUpdateSpy = jest.spyOn(movieService, 'createOrUpdate').mockResolvedValue({});

    const result = await service.fetchPopularMovies();

    expect(createOrUpdateSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ count: 1 });
    expect(cacheManager.set).toHaveBeenCalledWith('popular_movies', { count: 1 }, 3600);
  });
});
