import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  Permissions,
  Public,
} from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CreatePaymentIntentDto,
  RefundPaymentDto,
  WebhookDto,
} from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('payments/intents')
  createIntent(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.payments.createIntent(user, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('finance:write')
  @Post('payments/:id/capture')
  capture(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.capture(user, id).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('finance:write')
  @Post('payments/:id/refunds')
  refund(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.payments.refund(user, id, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Get('reservations/:reservationId/payments')
  list(
    @CurrentUser() user: AuthUser,
    @Param('reservationId') reservationId: string,
  ) {
    return this.payments
      .listForReservation(user, reservationId)
      .then((d) => ok(d));
  }

  @Public()
  @Post('webhooks/payments')
  webhook(@Body() dto: WebhookDto) {
    return this.payments.handleWebhook(dto).then((d) => ok(d));
  }
}
