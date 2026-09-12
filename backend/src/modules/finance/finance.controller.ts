import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { AdjustLedgerDto, CreatePayoutDto } from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller()
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Permissions('finance:read')
  @Get('properties/:propertyId/statements')
  statement(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance
      .statement(user, propertyId, from, to)
      .then((d) => ok(d));
  }

  @Permissions('finance:write')
  @Post('payouts')
  createPayout(@CurrentUser() user: AuthUser, @Body() dto: CreatePayoutDto) {
    return this.finance.createPayout(user, dto).then((d) => ok(d));
  }

  @Permissions('finance:platform')
  @Post('payouts/:id/mark-paid')
  markPaid(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.finance.markPayoutPaid(user, id).then((d) => ok(d));
  }

  @Permissions('finance:write')
  @Post('ledger/adjustments')
  adjust(@CurrentUser() user: AuthUser, @Body() dto: AdjustLedgerDto) {
    return this.finance.adjustLedger(user, dto).then((d) => ok(d));
  }
}
