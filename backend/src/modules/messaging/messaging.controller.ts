import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { CreateThreadDto, PostMessageDto } from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messages')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post('threads')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateThreadDto) {
    return this.messaging.createThread(user, dto).then((d) => ok(d));
  }

  @Get('threads')
  list(
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.messaging.listThreads(user, propertyId).then((d) => ok(d));
  }

  @Get('threads/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messaging.getThread(user, id).then((d) => ok(d));
  }

  @Post('threads/:id')
  post(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.messaging.postMessage(user, id, dto).then((d) => ok(d));
  }
}
