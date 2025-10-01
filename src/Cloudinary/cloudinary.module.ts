import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env', 
    }),
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService], 
})
export class CloudinaryModule {}
