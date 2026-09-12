import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  legalBusinessName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tradingName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty()
  @IsString()
  ownerName!: string;

  @ApiProperty()
  @IsEmail()
  ownerEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  propertyName!: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  starCategory?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  amenities?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  policies?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  checklist?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  houseRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkInFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkOutUntil?: string;
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'SUSPEND'] })
  @IsEnum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'SUSPEND'] as const)
  decision!: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'SUSPEND';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
