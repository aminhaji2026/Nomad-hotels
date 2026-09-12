import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  SendNotificationDto,
  UpsertTemplateDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me/notifications')
  mine(@CurrentUser() user: AuthUser) {
    return this.notifications.myNotifications(user).then((d) => ok(d));
  }

  @Permissions('platform:settings')
  @Post('notifications/send')
  send(@CurrentUser() user: AuthUser, @Body() dto: SendNotificationDto) {
    return this.notifications.send(user, dto).then((d) => ok(d));
  }

  @Permissions('platform:settings')
  @Post('notification-templates')
  upsertTemplate(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertTemplateDto,
  ) {
    return this.notifications.upsertTemplate(user, dto).then((d) => ok(d));
  }

  @Permissions('platform:settings')
  @Get('notification-templates')
  listTemplates() {
    return this.notifications.listTemplates().then((d) => ok(d));
  }
}
