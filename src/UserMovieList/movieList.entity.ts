import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { ListType } from 'src/untils/enums';
import { CURRENT_TIMESTAMP } from 'src/untils/constants';
import { User } from 'src/Users/users.entity';
import { Movie } from 'src/Movie/movie.entity';


@Entity('UserMovieList')
export class UserMovieList {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.lists, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Movie, (movie) => movie.lists, { onDelete: 'CASCADE' })
  movie: Movie;

  @Column({ type: 'enum', enum: ListType })
  type: ListType;

    @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
    createdAt: Date;
  
    @UpdateDateColumn({
      type: 'timestamp',
      default: () => CURRENT_TIMESTAMP,
      onUpdate: CURRENT_TIMESTAMP,
    })
    updatedAt: Date;
}
