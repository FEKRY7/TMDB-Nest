import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMovieList } from './movieList.entity';
import { Movie } from 'src/Movie/movie.entity';
import { JWTPayloadType } from 'src/untils/types';
import { CreateUserMovieListDto } from './dtos/create-movieList.dto';


@Injectable()
export class MovieListService {
    constructor(
        @InjectRepository(UserMovieList)
        private userMovieListRepo: Repository<UserMovieList>,
        @InjectRepository(Movie)
        private movieRepo: Repository<Movie>,
    ) { }

    public async add(payload: JWTPayloadType, movieId: number, dto: CreateUserMovieListDto) {
        const movie = await this.movieRepo.findOne({ where: { id: movieId } });
        if (!movie) throw new NotFoundException('Movie not found');

        const exists = await this.userMovieListRepo.findOne({
            where: { user: { id: payload.id }, movie: { id: movie.id }, type: dto.type },
        });
        if (exists) throw new ConflictException(`Movie already in ${dto.type}`);

        const entry = this.userMovieListRepo.create({
            user: { id: payload.id },
            movie,
            type: dto.type,
        });

        return this.userMovieListRepo.save(entry);
    }

    public async getList(payload: JWTPayloadType, dto: CreateUserMovieListDto) {
        const { type } = dto
        return this.userMovieListRepo.find({
            where: { user: { id: payload.id }, type },
            relations: ['movie'],
            order: { createdAt: 'DESC' },
        });
    }

    public async remove(payload: JWTPayloadType, movieId: number, dto: CreateUserMovieListDto) {
        const { type } = dto
        const entry = await this.userMovieListRepo.findOne({
            where: { user: { id: payload.id }, movie: { id: movieId }, type },
        });
        if (!entry) throw new NotFoundException(`Movie not found in ${type}`);

        this.userMovieListRepo.remove(entry);

        return { message: `Movie removed from ${type}` };
    }
}
