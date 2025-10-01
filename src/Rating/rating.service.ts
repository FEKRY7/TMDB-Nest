import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { User } from 'src/Users/users.entity';
import { Movie } from 'src/Movie/movie.entity';
import { RatingMovieDto } from './dtos/create-rating.dto';

@Injectable()
export class RatingService {
    constructor(
        @InjectRepository(Rating)
        private readonly ratingRepository: Repository<Rating>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
    ) { }


    public async rateMovie(userId: number, movieId: number, ratingMovieDto: RatingMovieDto) {
        const { value } = ratingMovieDto
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const movie = await this.movieRepository.findOne({ where: { id: movieId } });
        if (!movie) throw new NotFoundException('Movie not found');

        let rating = await this.ratingRepository.findOne({
            where: { user: { id: userId }, movie: { id: movieId } },
            relations: ['user', 'movie'],
        });

        if (rating) {
            rating.value = value;
        } else {
            rating = this.ratingRepository.create({ user, movie, value });
        }

        await this.ratingRepository.save(rating);


        const { avg, count } = await this.ratingRepository
            .createQueryBuilder('r')
            .select('AVG(r.value)', 'avg')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.movieId = :movieId', { movieId })
            .getRawOne();

        movie.rating = avg ? Number(parseFloat(avg).toFixed(2)) : 0;
        movie.ratingCount = parseInt(count, 10);

        await this.movieRepository.save(movie);

        return {
            averageRating: movie.rating,
            ratingCount: movie.ratingCount,
        };
    }


    public async getMovieRating(movieId: number): Promise<{ average: number; count: number }> {
        const { avg, count } = await this.ratingRepository
            .createQueryBuilder('rating')
            .select('AVG(rating.value)', 'avg')
            .addSelect('COUNT(rating.id)', 'count')
            .where('rating.movieId = :movieId', { movieId })
            .getRawOne();

        return {
            average: avg ? Number(parseFloat(avg).toFixed(2)) : 0,
            count,
        };
    }


    public async getUserRatings(userId: number): Promise<Rating[]> {
        const ratings = await this.ratingRepository.find({
            where: { user: { id: userId } },
            relations: ['movie'],
        });

        if (ratings.length === 0) {
            throw new NotFoundException(`No ratings found for user with id ${userId}`);
        }

        return ratings;
    }



    public async deleteRating(userId: number, movieId: number): Promise<void> {
        const rating = await this.ratingRepository.findOne({
            where: {
                user: { id: userId },
                movie: { id: movieId },
            },
        });

        if (!rating) {
            throw new NotFoundException(`Rating not found for user ${userId} and movie ${movieId}`);
        }

        await this.ratingRepository.remove(rating);
    }

}
