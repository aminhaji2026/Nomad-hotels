import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import {
  AdjustInventoryDto,
  CreateHoldDto,
  OpenInventoryDto,
  SetInventoryStateDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Permissions('inventory:manage')
  @Post('properties/:propertyId/inventory/open')
  open(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: OpenInventoryDto,
  ) {
    return this.inventory.openRange(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('property:read')
  @Get('properties/:propertyId/inventory')
  calendar(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Query('roomTypeId') roomTypeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.inventory
      .calendar(user, propertyId, roomTypeId, from, to)
      .then((d) => ok(d));
  }

  @Permissions('inventory:manage')
  @Post('properties/:propertyId/inventory/adjust')
  adjust(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventory.adjust(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('inventory:manage')
  @Post('properties/:propertyId/inventory/state')
  setState(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: SetInventoryStateDto,
  ) {
    return this.inventory.setState(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('inventory:manage')
  @Post('properties/:propertyId/inventory/holds')
  createHold(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateHoldDto,
  ) {
    return this.inventory.createHold(user, propertyId, dto).then((d) => ok(d));
  }

  @Permissions('inventory:manage')
  @Post('inventory/holds/expire')
  expireHolds() {
    return this.inventory.expireHolds().then((d) => ok(d));
  }
}
