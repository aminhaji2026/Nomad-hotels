import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignRoomDto {
  @ApiProperty() @IsUUID() physicalRoomId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class FrontDeskNoteDto {
  @ApiProperty() @IsString() note!: string;
}

export class ArrivalsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
}
