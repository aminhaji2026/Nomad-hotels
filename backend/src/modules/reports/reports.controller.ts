import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Permissions('analytics:read')
  @Get('properties/:propertyId/reports/occupancy')
  occupancy(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports
      .occupancy(user, propertyId, from, to)
      .then((d) => ok(d));
  }

  @Permissions('analytics:read')
  @Get('properties/:propertyId/reports/revenue')
  revenue(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.revenue(user, propertyId, from, to).then((d) => ok(d));
  }

  @Permissions('analytics:platform')
  @Get('platform/reports/overview')
  overview(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.platformOverview(user, from, to).then((d) => ok(d));
  }
}
