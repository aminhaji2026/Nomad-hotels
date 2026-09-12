import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CreateHotelGroupDto,
  CreatePropertyDto,
  InviteStaffDto,
  UpdatePropertyDto,
} from './dto/hotels.dto';
import { HotelsService } from './hotels.service';

@ApiTags('Hotels')
@ApiBearerAuth()
@Controller()
export class HotelsController {
  constructor(private readonly hotels: HotelsService) {}

  @Permissions('onboarding:write', 'property:write')
  @Post('hotel-groups')
  createGroup(@CurrentUser() user: AuthUser, @Body() dto: CreateHotelGroupDto) {
    return this.hotels.createHotelGroup(user, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('hotel-groups/:id')
  getGroup(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.hotels.getHotelGroup(user, id).then((d) => ok(d));
  }

  @Permissions('property:write')
  @Post('properties')
  createProperty(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.hotels.createProperty(user, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties')
  list(@CurrentUser() user: AuthUser) {
    return this.hotels.listProperties(user).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.hotels.getProperty(user, id).then((d) => ok(d));
  }

  @Permissions('property:write')
  @Patch('properties/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.hotels.updateProperty(user, id, dto).then((d) => ok(d));
  }

  @Permissions('staff:manage')
  @Post('properties/:propertyId/staff/invitations')
  invite(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: InviteStaffDto,
  ) {
    return this.hotels
      .inviteStaff(user, { ...dto, propertyId: dto.propertyId ?? propertyId })
      .then((d) => ok(d));
  }

  @Permissions('staff:manage', 'property:read')
  @Get('properties/:propertyId/staff')
  staff(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.hotels.listStaff(user, propertyId).then((d) => ok(d));
  }
}
