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
  BulkDailyRatesDto,
  CreateRatePlanDto,
  UpdateRatePlanDto,
  UpsertRestrictionDto,
} from './dto/rates.dto';
import { RatesService } from './rates.service';

@ApiTags('Rates')
@ApiBearerAuth()
@Controller()
export class RatesController {
  constructor(private readonly rates: RatesService) {}

  @Permissions('rate:manage')
  @Post('properties/:propertyId/rate-plans')
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRatePlanDto,
  ) {
    return this.rates.create(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:propertyId/rate-plans')
  list(@CurrentUser() user: AuthUser, @Param('propertyId') propertyId: string) {
    return this.rates.list(user, propertyId).then((d) => ok(d));
  }

  @Permissions('rate:manage')
  @Patch('rate-plans/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.rates.update(user, id, dto).then((d) => ok(d));
  }

  @Permissions('rate:manage')
  @Post('rate-plans/:id/daily-rates')
  bulkDaily(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: BulkDailyRatesDto,
  ) {
    return this.rates.bulkDailyRates(user, id, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('rate-plans/:id/daily-rates')
  listDaily(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.rates.listDailyRates(user, id, from, to).then((d) => ok(d));
  }

  @Permissions('rate:manage')
  @Post('rate-plans/:id/restrictions')
  addRestriction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpsertRestrictionDto,
  ) {
    return this.rates.addRestriction(user, id, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('rate-plans/:id/restrictions')
  listRestrictions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.rates.listRestrictions(user, id).then((d) => ok(d));
  }
}
