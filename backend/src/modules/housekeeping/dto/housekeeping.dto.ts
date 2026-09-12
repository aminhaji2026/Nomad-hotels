import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HousekeepingTaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateHousekeepingTaskDto {
  @ApiProperty() @IsUUID() physicalRoomId!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
}

export class UpdateHousekeepingTaskDto {
  @ApiPropertyOptional({ enum: HousekeepingTaskStatus })
  @IsOptional()
  @IsEnum(HousekeepingTaskStatus)
  status?: HousekeepingTaskStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;
}
