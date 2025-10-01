import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingMovieDto } from './dtos/create-rating.dto';
import { Roles } from 'src/Users/decorators/user-role.decorator';
import { UserType } from 'src/untils/enums';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';

@Controller('api/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) { }

  // POST: /api/rating/:userId/:movieId
  @Post(':userId/:movieId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async RateMovie(
    @Param('userId') userId: number,
    @Param('movieId') movieId: number,
    @Body() Body: RatingMovieDto,
  ) {
    return this.ratingService.rateMovie(userId, movieId, Body);
  }

  // GET: /api/rating/mo/:movieId
  @Get('mo/:movieId')
  async findMovieRating(
    @Param('movieId') movieId: number,
  ) {
    return this.ratingService.getMovieRating(movieId);
  }

  // GET: /api/rating/us/:userId
  @Get('us/:userId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async findUserRatings(
    @Param('userId') userId: number,
  ) {
    return this.ratingService.getUserRatings(userId);
  }

  // Delete: /api/rating/:userId/:movieId
  @Delete(':userId/:movieId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async delete(
    @Param('userId') userId: number,
    @Param('movieId') movieId: number,
  ) {
    return this.ratingService.deleteRating(userId, movieId);
  }
}