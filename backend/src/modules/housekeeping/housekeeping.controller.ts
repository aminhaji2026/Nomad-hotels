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
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskDto,
} from './dto/housekeeping.dto';
import { HousekeepingService } from './housekeeping.service';

@ApiTags('Housekeeping')
@ApiBearerAuth()
@Controller()
export class HousekeepingController {
  constructor(private readonly housekeeping: HousekeepingService) {}

  @Permissions('housekeeping:operate')
  @Get('properties/:propertyId/housekeeping/tasks')
  list(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('status') status?: string,
  ) {
    return this.housekeeping.list(user, propertyId, status).then((d) => ok(d));
  }

  @Permissions('housekeeping:operate')
  @Post('properties/:propertyId/housekeeping/tasks')
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateHousekeepingTaskDto,
  ) {
    return this.housekeeping.create(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('housekeeping:operate')
  @Patch('housekeeping/tasks/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHousekeepingTaskDto,
  ) {
    return this.housekeeping.update(user, id, dto).then((d) => ok(d));
  }
}
