import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CURRENT_TIMESTAMP } from 'src/untils/constants';
import { Rating } from 'src/Rating/rating.entity';
import { Genre } from 'src/untils/enums';
import { UserMovieList } from 'src/UserMovieList/movieList.entity';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdbId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  overview: string;


  @Column({
    type: 'json',
    nullable: true,
    default: { secure_url: '', public_id: '' },
  })
  posterPath: { secure_url: string; public_id: string };

  @Column({
    type: 'json',
    nullable: true,
    default: { secure_url: '', public_id: '' },
  })
  backdropPath: { secure_url: string; public_id: string };

  @Column({ nullable: true })
  releaseDate: string;

  @Column({ type: 'float', nullable: true })
  voteAverage: number;

  @Column({ type: 'int', nullable: true })
  voteCount: number;

  @Column({ type: 'float', nullable: true })
  popularity: number;

  @Column({ default: false })
  adult: boolean;

  @Column({ type: 'float', default: 0 })
  rating: number; 

  @Column({ type: 'int', default: 0 })
  ratingCount: number; 

  @Column({
    type: 'enum',
    enum: Genre,
    nullable: true,
  })
  genre: Genre;

  @OneToMany(() => Rating, (rating) => rating.movie)
  ratings: Rating[];

  @OneToMany(() => UserMovieList, (list) => list.movie)
  lists: UserMovieList[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
}
