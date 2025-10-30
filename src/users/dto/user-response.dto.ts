// src/users/dto/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { Currency, Language, Timezone, AuthProvider } from '../../common/enums';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ enum: Language })
  language: Language;

  @ApiProperty({ enum: Timezone })
  timezone: Timezone;

  @ApiProperty({ enum: AuthProvider })
  authProvider: AuthProvider;

  @ApiPropertyOptional()
  providerId?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  lastLogin: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.currency = user.currency;
    this.language = user.language;
    this.timezone = user.timezone;
    this.authProvider = user.authProvider;
    this.providerId = user.providerId;
    this.profilePictureUrl = user.profilePictureUrl;
    this.isActive = user.isActive;
    this.emailVerified = user.emailVerified;
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}