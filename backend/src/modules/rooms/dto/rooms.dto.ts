import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RoomStatus, SmokingPolicy } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;
}

export class CreateFloorDto {
  @ApiProperty()
  @IsUUID()
  buildingId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  level!: number;
}

export class CreateRoomTypeDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sizeSqm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAdults?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxChildren?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccupancy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  baseOccupancy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  extraBeds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cotsAllowed?: boolean;

  @ApiPropertyOptional({ enum: SmokingPolicy })
  @IsOptional()
  @IsEnum(SmokingPolicy)
  smoking?: SmokingPolicy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bathroomType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  viewType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sellableUnits?: number;
}

export class UpdateRoomTypeDto extends PartialType(CreateRoomTypeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePhysicalRoomDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsString()
  roomNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional({ enum: RoomStatus })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  connectingRoomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePhysicalRoomDto extends PartialType(CreatePhysicalRoomDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
