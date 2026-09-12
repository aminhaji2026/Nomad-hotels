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
  CreateSupportTicketDto,
  ReplySupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller()
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('support/tickets')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupportTicketDto) {
    return this.support.create(user, dto).then((d) => ok(d));
  }

  @Get('support/tickets')
  list(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.support.list(user, status).then((d) => ok(d));
  }

  @Get('support/tickets/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.support.get(user, id).then((d) => ok(d));
  }

  @Post('support/tickets/:id/messages')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.support.reply(user, id, dto).then((d) => ok(d));
  }

  @Permissions('support:manage')
  @Patch('support/tickets/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.support.update(user, id, dto).then((d) => ok(d));
  }
}
