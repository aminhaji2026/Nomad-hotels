import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
} from './dto/maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller()
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Permissions('maintenance:operate')
  @Get('properties/:propertyId/maintenance/tickets')
  list(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('status') status?: string,
  ) {
    return this.maintenance.list(user, propertyId, status).then((d) => ok(d));
  }

  @Permissions('maintenance:operate')
  @Post('properties/:propertyId/maintenance/tickets')
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateMaintenanceTicketDto,
  ) {
    return this.maintenance.create(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('maintenance:operate')
  @Patch('maintenance/tickets/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTicketDto,
  ) {
    return this.maintenance.update(user, id, dto).then((d) => ok(d));
  }
}
