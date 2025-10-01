import { Exclude } from 'class-transformer';
import { CURRENT_TIMESTAMP } from 'src/untils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserType } from 'src/untils/enums';
import { Token } from 'src/Token/token.entity';
import { Rating } from 'src/Rating/rating.entity';
import { UserMovieList } from 'src/UserMovieList/movieList.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  firstName: string;

  @Column({ type: 'varchar', length: 150 })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 250,
    unique: true,
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value,
    },
  })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  confirmEmail: boolean;

  @Column({ type: 'enum', enum: UserType, default: UserType.USER })
  role: UserType;

  @Column({ default: false })
  isLoggedIn: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'json', nullable: true })
  OTP?: { OTPCode: string; expireDate: Date };

  @Column({ type: 'int', default: 0 })
  OTPSentTimes: number;

  @OneToOne(() => Token, (token) => token.user, { cascade: true })
  token: Token;

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @OneToMany(() => UserMovieList, (list) => list.user)
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
