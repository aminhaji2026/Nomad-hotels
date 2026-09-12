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
import { ApplicationStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CreateApplicationDto,
  ReviewApplicationDto,
  UpdateApplicationDto,
} from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller()
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Permissions('onboarding:write')
  @Post('onboarding/applications')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.onboarding.create(user, dto).then((d) => ok(d));
  }

  @Permissions('onboarding:write')
  @Get('onboarding/applications/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.onboarding.listMine(user).then((d) => ok(d));
  }

  @Permissions('onboarding:write', 'hotel:approve')
  @Get('onboarding/applications/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.onboarding.get(user, id).then((d) => ok(d));
  }

  @Permissions('onboarding:write')
  @Patch('onboarding/applications/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.onboarding.update(user, id, dto).then((d) => ok(d));
  }

  @Permissions('onboarding:write')
  @Post('onboarding/applications/:id/submit')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.onboarding.submit(user, id).then((d) => ok(d));
  }

  @Permissions('hotel:approve')
  @Get('platform/onboarding/applications')
  platformList(@Query('status') status?: ApplicationStatus) {
    return this.onboarding.platformList(status).then((d) => ok(d));
  }

  @Permissions('hotel:approve')
  @Post('platform/onboarding/applications/:id/review')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.onboarding.review(user, id, dto).then((d) => ok(d));
  }
}
