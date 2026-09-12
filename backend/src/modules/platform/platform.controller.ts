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
import {
  Permissions,
  Public,
} from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  UpsertDestinationDto,
  UpsertExchangeRateDto,
  UpsertSettingDto,
} from './dto/platform.dto';
import { PlatformService } from './platform.service';

@ApiTags('Platform')
@Controller()
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Get('platform/settings')
  listSettings() {
    return this.platform.listSettings().then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Post('platform/settings')
  upsertSetting(@CurrentUser() user: AuthUser, @Body() dto: UpsertSettingDto) {
    return this.platform.upsertSetting(user, dto).then((d) => ok(d));
  }

  @Public()
  @Get('destinations')
  listDestinations(@Query('all') all?: string) {
    return this.platform.listDestinations(all !== 'true').then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Post('platform/destinations')
  upsertDestination(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertDestinationDto,
  ) {
    return this.platform.upsertDestination(user, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Patch('platform/destinations/:id')
  toggleDestination(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.platform
      .setDestinationActive(user, id, !!body.isActive)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Get('platform/exchange-rates')
  listFx() {
    return this.platform.listExchangeRates().then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Post('platform/exchange-rates')
  upsertFx(@CurrentUser() user: AuthUser, @Body() dto: UpsertExchangeRateDto) {
    return this.platform.upsertExchangeRate(user, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Get('platform/webhooks/events')
  webhooks(@Query('limit') limit?: string) {
    return this.platform
      .listWebhookEvents(limit ? parseInt(limit, 10) : 100)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('audit:read')
  @Get('platform/audit-logs')
  auditLogs(
    @Query('limit') limit?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.platform
      .listAuditLogs(limit ? parseInt(limit, 10) : 100, propertyId)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('platform:settings')
  @Post('platform/properties/:id/feature')
  feature(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { featured?: boolean },
  ) {
    return this.platform
      .featureProperty(user, id, body.featured !== false)
      .then((d) => ok(d));
  }
}
