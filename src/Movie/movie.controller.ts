import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, Put, Query, UseGuards, UploadedFiles } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { Genre, UserType } from 'src/untils/enums';
import { Roles } from 'src/Users/decorators/user-role.decorator';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';

@Controller('api/movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  // POST: /api/movies 
  @Post()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'posterImage', maxCount: 1 },
      { name: 'backdropImage', maxCount: 1 },
    ])
  )
  async create(
    @Body() Body: CreateMovieDto,
    @UploadedFiles() files: { posterImage?: Express.Multer.File[], backdropImage?: Express.Multer.File[] }
  ) {
    const posterImage = files.posterImage?.[0];
    const backdropImage = files.backdropImage?.[0];
    return this.movieService.createOrUpdate(Body, posterImage, backdropImage);
  }


  // PUT: /api/movies/:id
  @Put(':id')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'posterImage', maxCount: 1 },
      { name: 'backdropImage', maxCount: 1 },
    ])
  )
  async UpdateMovie(
    @Param('id') id: number,
    @Body() Body: UpdateMovieDto,
    @UploadedFiles() files?: {
      posterImage?: Express.Multer.File[],
      backdropImage?: Express.Multer.File[],
    },
  ) {
    const safeFiles = files || {};
    const posterImage = safeFiles.posterImage?.[0];
    const backdropImage = safeFiles.backdropImage?.[0];

    return this.movieService.updateMovie(id, Body, posterImage, backdropImage);
  }



  // GET: /api/movies
  @Get()
  async findAll() {
    return this.movieService.filterMove();
  }

  // GET: /api/movies/Filter
  @Get('/Filter')
  async FilterMove(
    @Query('title') title?: string,
    @Query('minPopularity') minPopularity?: string,
    @Query('maxPopularity') maxPopularity?: string,
    @Query('year') year?: string,
    @Query('genre') genre?: Genre,
    @Query('sortBy') sortBy?: 'popularity' | 'releaseDate' | 'title' | 'rating',
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const filters = {
      title,
      minPopularity: minPopularity ? Number(minPopularity) : undefined,
      maxPopularity: maxPopularity ? Number(maxPopularity) : undefined,
      year: year ? Number(year) : undefined,
      genre,
      sortBy,
      order,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    };

    return this.movieService.filterMove(filters);
  }

  // GET: /api/movies/:id
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.movieService.GetMovieById(id);
  }

  // DELETE: /api/movies/:id
  @Delete(':id')
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  async remove(@Param('id') id: number) {
    return this.movieService.deleteMovie(id);
  }
}
