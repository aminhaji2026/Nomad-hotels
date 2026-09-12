import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  Permissions,
  Public,
} from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CancelReservationDto,
  CreateReservationDto,
  ModifyReservationDto,
} from './dto/reservations.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Public()
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @Post('bookings')
  create(
    @Body() dto: CreateReservationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (idempotencyKey && !dto.idempotencyKey) {
      dto.idempotencyKey = idempotencyKey;
    }
    return this.reservations.create(user ?? null, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Get('me/bookings')
  mine(@CurrentUser() user: AuthUser) {
    return this.reservations.listMine(user).then((d) => ok(d));
  }

  @Public()
  @Get('bookings/:confirmationNumber')
  getOne(
    @Param('confirmationNumber') confirmationNumber: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.reservations
      .getByConfirmation(confirmationNumber, user ?? null)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('reservation:read')
  @Get('properties/:propertyId/reservations')
  listProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.reservations
      .listForProperty(user, propertyId)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Post('bookings/:confirmationNumber/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservations
      .cancel(user, confirmationNumber, dto)
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Patch('bookings/:confirmationNumber')
  modify(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
    @Body() dto: ModifyReservationDto,
  ) {
    return this.reservations
      .modify(user, confirmationNumber, dto)
      .then((d) => ok(d));
  }
}
