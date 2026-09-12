import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty() @IsUUID() reservationId!: string;
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  overallScore!: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() categoryScores?: Record<
    string,
    number
  >;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() positive?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() negative?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

export class HotelReplyDto {
  @ApiProperty() @IsString() reply!: string;
}

export class ModerateReviewDto {
  @ApiProperty() @IsString() status!: 'PUBLISHED' | 'REJECTED' | 'HIDDEN';
}
