import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RatePlanType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRatePlanDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(32)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ enum: RatePlanType })
  @IsOptional()
  @IsEnum(RatePlanType)
  type?: RatePlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  derivePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  cancellationJson?: Record<string, unknown>;
}

export class UpdateRatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RatePlanType })
  @IsOptional()
  @IsEnum(RatePlanType)
  type?: RatePlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maxStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  cancellationJson?: Record<string, unknown>;
}

export class DailyRateItemDto {
  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price!: number;
}

export class BulkDailyRatesDto {
  @ApiProperty({ type: [DailyRateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyRateItemDto)
  rates!: DailyRateItemDto[];
}

export class UpsertRestrictionDto {
  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maxStay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  closedToArrival?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  closedToDeparture?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stopSell?: boolean;
}
