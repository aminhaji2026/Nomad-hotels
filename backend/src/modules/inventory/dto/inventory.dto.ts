import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryState } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class OpenInventoryDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-10-31' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Defaults to room type sellableUnits' })
  @IsOptional()
  @IsInt()
  @Min(0)
  total?: number;
}

export class AdjustInventoryDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty()
  @IsInt()
  delta!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetInventoryStateDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: InventoryState })
  @IsEnum(InventoryState)
  state!: InventoryState;
}

export class CreateHoldDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsDateString()
  checkIn!: string;

  @ApiProperty()
  @IsDateString()
  checkOut!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'TTL seconds (default 900)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  ttlSeconds?: number;
}
