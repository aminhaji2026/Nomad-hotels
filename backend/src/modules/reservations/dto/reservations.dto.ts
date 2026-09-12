import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class BookingGuestDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class BookingRoomDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty()
  @IsUUID()
  ratePlanId!: string;

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
}

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  propertyId!: string;

  @ApiProperty()
  @IsDateString()
  checkIn!: string;

  @ApiProperty()
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ type: [BookingRoomDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingRoomDto)
  rooms!: BookingRoomDto[];

  @ApiProperty({ type: [BookingGuestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  guests!: BookingGuestDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Pay at property confirms immediately',
  })
  @IsOptional()
  @IsBoolean()
  payAtProperty?: boolean;
}

export class CancelReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ModifyReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
