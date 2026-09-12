import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMaintenanceTicketDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() physicalRoomId?: string;
  @ApiPropertyOptional({ enum: MaintenancePriority })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
}

export class UpdateMaintenanceTicketDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
  @ApiPropertyOptional({ enum: MaintenancePriority })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
