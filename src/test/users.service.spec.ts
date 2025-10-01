import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../Users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../Users/users.entity';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserType } from 'src/untils/enums';
import * as bcrypt from 'bcrypt';
import { Token } from '../Token/token.entity';
import { CURRENT_TIMESTAMP } from 'src/untils/constants';

describe('UsersService - SignUp', () => {
  let service: UsersService;
  let usersRepository: any;
  let otpService: any;
  let mailService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'OtpService',
          useValue: {
            generateOTP: jest.fn(),
          },
        },
        {
          provide: 'MailService',
          useValue: {
            sendOtpEmailTemplate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    otpService = module.get('OtpService');
    mailService = module.get('MailService');
  });

  it('should throw if email already exists', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 1, email: 'test@test.com' });

    await expect(
      service.SignUp({ firstName: 'A', lastName: 'B', email: 'test@test.com', password: '123', role: UserType.USER })
    ).rejects.toThrow(NotFoundException);
  });

  it('should successfully register user when email does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    otpService.generateOTP.mockReturnValue({ OTPCode: '123456' });

    const createdUser = { firstName: 'A', lastName: 'B', email: 'new@test.com', password: 'hashed', OTP: { OTPCode: '123456' }, role: UserType.USER };
    usersRepository.create.mockReturnValue(createdUser);
    usersRepository.save.mockResolvedValue({ id: 1, ...createdUser });

    jest.spyOn(service as any, 'hashPassword').mockResolvedValue('hashed');
    mailService.sendOtpEmailTemplate.mockResolvedValue(true);

    const result = await service.SignUp({ firstName: 'A', lastName: 'B', email: 'new@test.com', password: '123', role: UserType.USER });

    expect(result.message).toBe('User successfully registered');
    expect(result.newUser.email).toBe('new@test.com');
    expect(result.emailSent).toBe('Email sent successfully');
  });

  it('should register user but fail sending email', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    otpService.generateOTP.mockReturnValue({ OTPCode: '123456' });

    const createdUser = { firstName: 'A', lastName: 'B', email: 'fail@test.com', password: 'hashed', OTP: { OTPCode: '123456' }, role: UserType.USER };
    usersRepository.create.mockReturnValue(createdUser);
    usersRepository.save.mockResolvedValue({ id: 1, ...createdUser });

    jest.spyOn(service as any, 'hashPassword').mockResolvedValue('hashed');
    mailService.sendOtpEmailTemplate.mockRejectedValue(new Error('SMTP failed'));

    const result = await service.SignUp({ firstName: 'A', lastName: 'B', email: 'fail@test.com', password: '123', role: UserType.USER });

    expect(result.message).toBe('User successfully registered');
    expect(result.newUser.email).toBe('fail@test.com');
    expect(result.emailSent).toBe('There is someting Wrong with Email Sender');
  });
});


describe('UsersService - login', () => {
  let service: UsersService;
  let usersRepository: any;
  let tokenRepository: any;
  let otpService: any;
  let mailService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Token),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'OtpService',
          useValue: {
            generateOtpWithExpireDate: jest.fn(),
          },
        },
        {
          provide: 'MailService',
          useValue: {
            sendOtpEmailTemplate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    tokenRepository = module.get(getRepositoryToken(Token));
    otpService = module.get('OtpService');
    mailService = module.get('MailService');
  });

  it('should throw if email does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.login({ email: 'wrong@test.com', password: '123' }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw if password is wrong', async () => {
    const user = { email: 'test@test.com', password: 'hashedPassword', confirmEmail: true, isDeleted: false };
    usersRepository.findOne.mockResolvedValue(user);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw if email not confirmed and send OTP', async () => {
    const user = { email: 'test@test.com', password: 'hashed', confirmEmail: false, id: 1 };
    usersRepository.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const otp = { OTPCode: '123456', expireDate: new Date() };
    otpService.generateOtpWithExpireDate.mockReturnValue(otp);
    mailService.sendOtpEmailTemplate.mockResolvedValue(true);

    await expect(service.login({ email: 'test@test.com', password: 'hashed' }))
      .rejects.toThrow('Confirm Your Email First, OTP sent');

    expect(usersRepository.update).toHaveBeenCalledWith(
      { email: user.email },
      { OTP: otp }
    );
    expect(mailService.sendOtpEmailTemplate).toHaveBeenCalledWith(user.email, otp.OTPCode);
  });

  it('should throw if account is deleted', async () => {
    const user = { email: 'test@test.com', password: 'hashed', confirmEmail: true, isDeleted: true };
    usersRepository.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    await expect(service.login({ email: 'test@test.com', password: 'hashed' }))
      .rejects.toThrow('Not registered email or deleted account');
  });

  it('should login successfully and return token', async () => {
    const user = { 
      id: 1, email: 'test@test.com', password: 'hashed', confirmEmail: true, isDeleted: false, firstName: 'A', lastName: 'B', role: UserType.USER
    };
    usersRepository.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const token = 'fake-jwt-token';
    jest.spyOn(service as any, 'generateJWT').mockResolvedValue(token);

    tokenRepository.findOne.mockResolvedValue(null);
    tokenRepository.create.mockReturnValue({ token, user });
    usersRepository.save.mockResolvedValue(user);
    tokenRepository.save.mockResolvedValue({ token, user });

    const result = await service.login({ email: 'test@test.com', password: 'hashed' });

    expect(result.message).toBe('Sign-in successful');
    expect(result.token).toBe(`Bearer ${token}`);
  });
})

describe('UsersService - Users Methods', () => {
  let service: UsersService;
  let usersRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

describe('UsersService - Users Methods', () => {
  let service: UsersService;
  let usersRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  // ================= getCurrentUser =================
  it('getCurrentUser should return user if found', async () => {
    const mockUser: Partial<User> = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'hashed',
      role: UserType.USER,
      confirmEmail: true,
      isDeleted: false,
      isLoggedIn: true,
      OTP: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersRepository.findOne.mockResolvedValue(mockUser as User);

    const result = await service.getCurrentUser(1);
    expect(result).toEqual(mockUser);
    expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('getCurrentUser should throw NotFoundException if user not found', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.getCurrentUser(1))
      .rejects.toThrow(NotFoundException);
  });

  // ================= ConfirmUser =================
  it('ConfirmUser should throw NotFoundException if email not found', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.ConfirmUser({ email: 'notfound@test.com', otp: '123456' }))
      .rejects.toThrow(NotFoundException);
  });

  it('ConfirmUser should throw BadRequestException if email already confirmed', async () => {
    const user: Partial<User> = {
      email: 'test@test.com',
      confirmEmail: true,
      OTP: { OTPCode: '123456', expireDate: new Date() },
    };
    usersRepository.findOne.mockResolvedValue(user as User);

    await expect(service.ConfirmUser({ email: 'test@test.com', otp: '123456' }))
      .rejects.toThrow(BadRequestException);
  });

  it('ConfirmUser should throw BadRequestException if OTP missing', async () => {
    const user: Partial<User> = {
      email: 'test@test.com',
      confirmEmail: false,
      OTP: null,
    };
    usersRepository.findOne.mockResolvedValue(user as User);

    await expect(service.ConfirmUser({ email: 'test@test.com', otp: '123456' }))
      .rejects.toThrow(BadRequestException);
  });

  it('ConfirmUser should throw BadRequestException if OTP does not match', async () => {
    const user: Partial<User> = {
      email: 'test@test.com',
      confirmEmail: false,
      OTP: { OTPCode: '654321', expireDate: new Date() },
    };
    usersRepository.findOne.mockResolvedValue(user as User);

    await expect(service.ConfirmUser({ email: 'test@test.com', otp: '123456' }))
      .rejects.toThrow(BadRequestException);
  });

  it('ConfirmUser should confirm user successfully', async () => {
    const user: Partial<User> = {
      email: 'test@test.com',
      confirmEmail: false,
      OTP: { OTPCode: '123456', expireDate: new Date() },
    };
    usersRepository.findOne.mockResolvedValue(user as User);
    usersRepository.save.mockImplementation(u => Promise.resolve(u));

    const result = await service.ConfirmUser({ email: 'test@test.com', otp: '123456' });

    expect(result.message).toBe('Email successfully confirmed');
    expect(result.confirmUser.confirmEmail).toBe(true);
    expect(result.confirmUser.OTP).toBeDefined();
  });

  // ================= logOut =================
  it('logOut should set isLoggedIn to false', async () => {
    const user: Partial<User> = {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'hashed',
      role: UserType.USER,
      confirmEmail: true,
      isDeleted: false,
      isLoggedIn: true,
      OTP: null,
    };

    jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
    usersRepository.save.mockResolvedValue(user as User);

    const payload = { id: 1 } as any;
    const result = await service.logOut(payload);

    expect(result.message).toBe('User logged out successfully');
    expect(user.isLoggedIn).toBe(false);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });
});
});

describe('UsersService - Password Methods', () => {
  let service: UsersService;
  let usersRepository: any;
  let authProvider: any;
  let otpService: any;
  let mailService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'AuthProvider',
          useValue: {
            hashPassword: jest.fn(),
          },
        },
        {
          provide: 'OtpService',
          useValue: {
            generatorLimitTimeOTP: jest.fn(),
          },
        },
        {
          provide: 'MailService',
          useValue: {
            sendOtpResetPasswordEmailTemplate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    authProvider = module.get('AuthProvider');
    otpService = module.get('OtpService');
    mailService = module.get('MailService');
  });

  // ================= changeUserPassword =================
  describe('changeUserPassword', () => {
    const payload = { id: 1 } as any;

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(null);

      await expect(
        service.changeUserPassword({ oldPassword: 'old', newPassword: 'new', ConfirmNewPassword: 'new' }, payload)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if old password incorrect', async () => {
      const user: Partial<User> = { password: 'hashed' };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.changeUserPassword({ oldPassword: 'wrong', newPassword: 'new', ConfirmNewPassword: 'new' }, payload)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new password same as old', async () => {
      const user: Partial<User> = { password: 'hashed' };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true) // old password correct
        .mockResolvedValueOnce(true); // new password same as old

      await expect(
        service.changeUserPassword({ oldPassword: 'old', newPassword: 'hashed', ConfirmNewPassword: 'hashed' }, payload)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if new password and confirmation do not match', async () => {
      const user: Partial<User> = { password: 'hashed' };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true) // old password correct
        .mockResolvedValueOnce(false); // new password not same as old

      await expect(
        service.changeUserPassword({ oldPassword: 'old', newPassword: 'new', ConfirmNewPassword: 'different' }, payload)
      ).rejects.toThrow(NotFoundException);
    });

    it('should change password successfully', async () => {
      const user: Partial<User> = { password: 'hashed' };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true) // old password correct
        .mockResolvedValueOnce(false); // new password not same as old
      authProvider.hashPassword.mockResolvedValue('newHashed');
      usersRepository.save.mockResolvedValue(true);

      const result = await service.changeUserPassword({ oldPassword: 'old', newPassword: 'new', ConfirmNewPassword: 'new' }, payload);
      expect(result.message).toBe('Password changed successfully');
      expect(user.password).toBe('newHashed');
    });
  });

  // ================= forgetPassword =================
  describe('forgetPassword', () => {
    it('should throw NotFoundException if email not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.forgetPassword({ email: 'notfound@test.com' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if OTP sent max times', async () => {
      const user: Partial<User> = { email: 'test@test.com', OTPSentTimes: 5 };
      usersRepository.findOne.mockResolvedValue(user as User);
      process.env.MAXOTPSMS = '5';

      await expect(service.forgetPassword({ email: 'test@test.com' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should send OTP successfully', async () => {
      const user: Partial<User> = { email: 'test@test.com', OTPSentTimes: 0 };
      const otpMock = { OTPCode: '123456', expireDate: new Date() };
      usersRepository.findOne.mockResolvedValue(user as User);
      otpService.generatorLimitTimeOTP.mockReturnValue(otpMock);
      mailService.sendOtpResetPasswordEmailTemplate.mockResolvedValue(true);
      usersRepository.save.mockResolvedValue(true);

      const result = await service.forgetPassword({ email: 'test@test.com' });
      expect(result.message).toBe('OTP sent. Check your email.');
      expect(result.emailSent).toBe('Email sent successfully');
      expect(user.OTPSentTimes).toBe(1);
      expect(user.OTP).toBe(otpMock);
    });
  });

  // ================= resetPassword =================
  describe('resetPassword', () => {
    it('should throw NotFoundException if email incorrect', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword({ email: 'wrong@test.com', OTP: { OTPCode: '123' }, newPassword: 'new', confirmNewPassword: 'new' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if OTP invalid', async () => {
      const user: Partial<User> = { email: 'test@test.com', OTP: { OTPCode: '654321', expireDate: new Date() } };
      usersRepository.findOne.mockResolvedValue(user as User);

      await expect(service.resetPassword({ email: 'test@test.com', OTP: { OTPCode: '123' }, newPassword: 'new', confirmNewPassword: 'new' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if OTP expired', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const user: Partial<User> = { email: 'test@test.com', OTP: { OTPCode: '123', expireDate: pastDate } };
      usersRepository.findOne.mockResolvedValue(user as User);

      await expect(service.resetPassword({ email: 'test@test.com', OTP: { OTPCode: '123' }, newPassword: 'new', confirmNewPassword: 'new' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password and confirmation do not match', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60);
      const user: Partial<User> = { email: 'test@test.com', OTP: { OTPCode: '123', expireDate: futureDate } };
      usersRepository.findOne.mockResolvedValue(user as User);

      await expect(service.resetPassword({ email: 'test@test.com', OTP: { OTPCode: '123' }, newPassword: 'new', confirmNewPassword: 'diff' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reset password successfully', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60);
      const user: Partial<User> = { email: 'test@test.com', OTP: { OTPCode: '123', expireDate: futureDate }, OTPSentTimes: 1, isLoggedIn: true };
      usersRepository.findOne.mockResolvedValue(user as User);
      authProvider.hashPassword.mockResolvedValue('hashedNew');
      usersRepository.save.mockResolvedValue(true);

      const result = await service.resetPassword({ email: 'test@test.com', OTP: { OTPCode: '123' }, newPassword: 'new', confirmNewPassword: 'new' });
      expect(result.message).toBe('Password changed successfully');
      expect(user.password).toBe('hashedNew');
      expect(user.isLoggedIn).toBe(false);
      expect(user.OTPSentTimes).toBe(0);
      expect(user.OTP).toBeNull();
    });
  });
});
describe('UsersService - Profile & SoftDelete & Token', () => {
  let service: UsersService;
  let usersRepository: any;
  let tokenRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'TokenRepository',
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    tokenRepository = module.get('TokenRepository');
  });

  // ================= UpdateProfile =================
  describe('UpdateProfile', () => {
    const payload = { id: 1 } as any;

    it('should throw NotFoundException if no fields provided', async () => {
      await expect(service.UpdateProfile(payload, {} as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(null);

      await expect(service.UpdateProfile(payload, { firstName: 'New' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should update profile successfully', async () => {
      const user: Partial<User> = { id: 1 };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      usersRepository.update.mockResolvedValue(true);

      const result = await service.UpdateProfile(payload, { firstName: 'John', lastName: 'Doe' });
      expect(result.message).toBe('Profile updated successfully');
      expect(usersRepository.update).toHaveBeenCalledWith(payload.id, { firstName: 'John', lastName: 'Doe' });
    });
  });

  // ================= softDelete =================
  describe('softDelete', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(null);

      await expect(service.softDelete({ id: 1 } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should soft delete user successfully', async () => {
      const user: Partial<User> = { id: 1, isLoggedIn: true, isDeleted: false };
      jest.spyOn(service, 'getCurrentUser').mockResolvedValue(user as User);
      usersRepository.save.mockResolvedValue(true);

      const result = await service.softDelete({ id: 1 } as any);
      expect(result.message).toBe('User has been soft deleted successfully.');
      expect(user.isLoggedIn).toBe(false);
      expect(user.isDeleted).toBe(true);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });
  });

  // ================= getToken =================
  describe('getToken', () => {
    it('should throw NotFoundException if token not valid', async () => {
      tokenRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getToken('invalidToken'))
        .rejects.toThrow(NotFoundException);
    });

    it('should not throw if token exists and valid', async () => {
      tokenRepository.findOneBy.mockResolvedValue({ token: 'validToken', isValied: true });

      await expect(service.getToken('validToken'))
        .resolves.not.toThrow();
      expect(tokenRepository.findOneBy).toHaveBeenCalledWith({ token: 'validToken', isValied: true });
    });
  });
});