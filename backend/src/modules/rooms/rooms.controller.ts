import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  CreateBuildingDto,
  CreateFloorDto,
  CreatePhysicalRoomDto,
  CreateRoomTypeDto,
  UpdatePhysicalRoomDto,
  UpdateRoomTypeDto,
} from './dto/rooms.dto';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller()
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Permissions('room:manage')
  @Post('properties/:propertyId/buildings')
  createBuilding(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.rooms.createBuilding(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:propertyId/buildings')
  listBuildings(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.rooms.listBuildings(user, propertyId).then((d) => ok(d));
  }

  @Permissions('room:manage')
  @Post('properties/:propertyId/floors')
  createFloor(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateFloorDto,
  ) {
    return this.rooms.createFloor(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('room:manage')
  @Post('properties/:propertyId/room-types')
  createRoomType(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.rooms.createRoomType(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:propertyId/room-types')
  listRoomTypes(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.rooms.listRoomTypes(user, propertyId).then((d) => ok(d));
  }

  @Permissions('room:manage')
  @Patch('room-types/:id')
  updateRoomType(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.rooms.updateRoomType(user, id, dto).then((d) => ok(d));
  }

  @Permissions('room:manage')
  @Post('properties/:propertyId/rooms')
  createRoom(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreatePhysicalRoomDto,
  ) {
    return this.rooms
      .createPhysicalRoom(user, propertyId, dto)
      .then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:propertyId/rooms')
  listRooms(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.rooms.listPhysicalRooms(user, propertyId).then((d) => ok(d));
  }

  @Permissions('room:manage')
  @Patch('rooms/:id')
  updateRoom(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePhysicalRoomDto,
  ) {
    return this.rooms.updatePhysicalRoom(user, id, dto).then((d) => ok(d));
  }
}
