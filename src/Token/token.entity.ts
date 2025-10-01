import { CURRENT_TIMESTAMP } from 'src/untils/constants';
import { User } from 'src/Users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'tokens' })
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.token, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  token: string;

  @Column({ default: true })
  isValied: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
}
