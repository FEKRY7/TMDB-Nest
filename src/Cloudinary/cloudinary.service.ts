import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.COLUD_NAME, // Corrected the typo from COLUD_NAME
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
  }

  public async destroyImage(publicId: string): Promise<{ result: string }> {
    if (!publicId) {
      throw new BadRequestException('Public ID is required to delete an image');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(new Error('Image deletion failed: ' + error.message));
        }
        resolve(result);
      });
    });
  }

  public async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file or file buffer is missing');
    }
    console.log('File:', file);

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'ProfileImage' },
        (error, result) => {
          if (error) {
            console.error('Image upload failed:', error); // Log the error
            return reject(
              new InternalServerErrorException(
                'Image upload failed: ' + error.message,
              ),
            );
          }
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  } 
 
}