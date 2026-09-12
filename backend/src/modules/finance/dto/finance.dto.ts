import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePayoutDto {
  @ApiProperty() @IsUUID() propertyId!: string;
  @ApiProperty() @IsDateString() periodStart!: string;
  @ApiProperty() @IsDateString() periodEnd!: string;
}

export class AdjustLedgerDto {
  @ApiProperty() @IsUUID() propertyId!: string;
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() amount!: number;
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
