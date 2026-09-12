import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { AssignRoomDto } from './dto/frontdesk.dto';
import { FrontDeskService } from './frontdesk.service';

@ApiTags('FrontDesk')
@ApiBearerAuth()
@Controller()
export class FrontDeskController {
  constructor(private readonly frontDesk: FrontDeskService) {}

  @Permissions('frontdesk:operate')
  @Get('properties/:propertyId/arrivals')
  arrivals(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('date') date?: string,
  ) {
    return this.frontDesk.arrivals(user, propertyId, date).then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Get('properties/:propertyId/departures')
  departures(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('date') date?: string,
  ) {
    return this.frontDesk.departures(user, propertyId, date).then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Get('properties/:propertyId/in-house')
  inHouse(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.frontDesk.inHouse(user, propertyId).then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Post('bookings/:confirmationNumber/check-in')
  checkIn(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
  ) {
    return this.frontDesk.checkIn(user, confirmationNumber).then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Post('bookings/:confirmationNumber/check-out')
  checkOut(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
  ) {
    return this.frontDesk.checkOut(user, confirmationNumber).then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Post('bookings/:confirmationNumber/rooms/:reservationRoomId/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
    @Param('reservationRoomId') reservationRoomId: string,
    @Body() dto: AssignRoomDto,
  ) {
    return this.frontDesk
      .assignRoom(user, confirmationNumber, reservationRoomId, dto)
      .then((d) => ok(d));
  }

  @Permissions('frontdesk:operate')
  @Post('bookings/:confirmationNumber/no-show')
  noShow(
    @CurrentUser() user: AuthUser,
    @Param('confirmationNumber') confirmationNumber: string,
  ) {
    return this.frontDesk
      .markNoShow(user, confirmationNumber)
      .then((d) => ok(d));
  }
}
