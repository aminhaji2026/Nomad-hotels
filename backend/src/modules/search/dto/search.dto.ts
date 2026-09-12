import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional({ example: 'Hargeisa' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ example: '2026-10-10' })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: '2026-10-12' })
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ default: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['price', 'rating', 'recommended'] })
  @IsOptional()
  @IsString()
  sort?: 'price' | 'rating' | 'recommended';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class HotelDetailQueryDto {
  @ApiProperty()
  @IsDateString()
  checkIn!: string;

  @ApiProperty()
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ default: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms?: number;
}
