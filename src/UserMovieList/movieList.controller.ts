import { Controller, Post, Delete, Get, Param, Body, UseGuards } from '@nestjs/common';
import { MovieListService } from './movieList.service';
import { JWTPayloadType } from 'src/untils/types';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { CreateUserMovieListDto } from './dtos/create-movieList.dto';
import { UserType } from 'src/untils/enums';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';
import { Roles } from 'src/Users/decorators/user-role.decorator';

@Controller('api/movielist')
export class MovieListController {
  constructor(private readonly movieListService: MovieListService) {}

    // POST: /api/movielist/:movieId
    @Post(':movieId')
    @Roles(UserType.USER)
    @UseGuards(AuthRolesGuard)
    async addMovieList(
      @CurrentUser() payload: JWTPayloadType,
      @Param('movieId') movieId: number,
      @Body() Body: CreateUserMovieListDto,
    ) {
      return this.movieListService.add(payload, movieId, Body);
    }

    // GET: /api/movielist
    @Get()
    @Roles(UserType.USER)
    @UseGuards(AuthRolesGuard)
    async getMovieList(
      @CurrentUser() payload: JWTPayloadType,
      @Body() Body: CreateUserMovieListDto,
    ) {
      return this.movieListService.getList(payload, Body);
    }

    // DELETE: /api/movielist/:movieId
    @Delete(':movieId')
    @Roles(UserType.USER)
    @UseGuards(AuthRolesGuard)
    async DeleteMovieList(
      @CurrentUser() payload: JWTPayloadType,
      @Param('movieId') movieId: number,
      @Body() Body: CreateUserMovieListDto,
    ) {
      return this.movieListService.remove(payload, movieId, Body);
    }
}
