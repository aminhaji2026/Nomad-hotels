import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsObject()
  value!: Record<string, unknown>;
}

export class UpsertDestinationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsString()
  countryCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertExchangeRateDto {
  @ApiProperty()
  @IsString()
  baseCurrency!: string;

  @ApiProperty()
  @IsString()
  quoteCurrency!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  rate!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asOf?: string;
}
