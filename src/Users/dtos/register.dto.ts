import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    MinLength,
    MaxLength,
    IsEnum,
} from 'class-validator';
import { UserType } from 'src/untils/enums';

export class RegisterDto {

    @IsString()
    @Length(2, 150)
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @Length(2, 150)
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @MaxLength(250)
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(5)
    @IsNotEmpty()
    password: string;

    @IsEnum(UserType)
    role: UserType;
}
