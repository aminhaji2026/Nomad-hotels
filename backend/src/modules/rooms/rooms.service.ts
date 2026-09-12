import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateBuildingDto,
  CreateFloorDto,
  CreatePhysicalRoomDto,
  CreateRoomTypeDto,
  UpdatePhysicalRoomDto,
  UpdateRoomTypeDto,
} from './dto/rooms.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async createBuilding(
    user: AuthUser,
    propertyId: string,
    dto: CreateBuildingDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const building = await this.prisma.building.create({
      data: { propertyId, name: dto.name, code: dto.code },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'building.create',
      resource: 'Building',
      resourceId: building.id,
      propertyId,
    });
    return building;
  }

  async createFloor(user: AuthUser, propertyId: string, dto: CreateFloorDto) {
    await this.access.assertPropertyAccess(user, propertyId);
    const building = await this.prisma.building.findFirst({
      where: { id: dto.buildingId, propertyId },
    });
    if (!building)
      throw new NotFoundException('Building not found on property');
    return this.prisma.floor.create({
      data: { buildingId: dto.buildingId, name: dto.name, level: dto.level },
    });
  }

  async createRoomType(
    user: AuthUser,
    propertyId: string,
    dto: CreateRoomTypeDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const roomType = await this.prisma.roomType.create({
      data: {
        propertyId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        sizeSqm: dto.sizeSqm,
        maxAdults: dto.maxAdults ?? 2,
        maxChildren: dto.maxChildren ?? 0,
        maxOccupancy: dto.maxOccupancy ?? 2,
        baseOccupancy: dto.baseOccupancy ?? 2,
        extraBeds: dto.extraBeds ?? 0,
        cotsAllowed: dto.cotsAllowed ?? false,
        smoking: dto.smoking ?? 'NON_SMOKING',
        bathroomType: dto.bathroomType,
        viewType: dto.viewType,
        sellableUnits: dto.sellableUnits ?? 0,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'room_type.create',
      resource: 'RoomType',
      resourceId: roomType.id,
      propertyId,
    });
    return roomType;
  }

  async updateRoomType(
    user: AuthUser,
    roomTypeId: string,
    dto: UpdateRoomTypeDto,
  ) {
    const existing = await this.prisma.roomType.findFirst({
      where: { id: roomTypeId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Room type not found');
    await this.access.assertPropertyAccess(user, existing.propertyId);
    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: dto,
    });
  }

  async listRoomTypes(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.roomType.findMany({
      where: { propertyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createPhysicalRoom(
    user: AuthUser,
    propertyId: string,
    dto: CreatePhysicalRoomDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, deletedAt: null },
    });
    if (!roomType)
      throw new NotFoundException('Room type not found on property');
    const room = await this.prisma.physicalRoom.create({
      data: {
        propertyId,
        roomTypeId: dto.roomTypeId,
        buildingId: dto.buildingId,
        floorId: dto.floorId,
        roomNumber: dto.roomNumber,
        status: dto.status ?? 'AVAILABLE',
        connectingRoomId: dto.connectingRoomId,
        notes: dto.notes,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'physical_room.create',
      resource: 'PhysicalRoom',
      resourceId: room.id,
      propertyId,
    });
    return room;
  }

  async updatePhysicalRoom(
    user: AuthUser,
    roomId: string,
    dto: UpdatePhysicalRoomDto,
  ) {
    const existing = await this.prisma.physicalRoom.findFirst({
      where: { id: roomId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Room not found');
    await this.access.assertPropertyAccess(user, existing.propertyId);
    return this.prisma.physicalRoom.update({
      where: { id: roomId },
      data: dto,
    });
  }

  async listPhysicalRooms(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.physicalRoom.findMany({
      where: { propertyId, deletedAt: null },
      include: { roomType: true, building: true, floor: true },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async listBuildings(user: AuthUser, propertyId: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.building.findMany({
      where: { propertyId },
      include: { floors: true },
      orderBy: { name: 'asc' },
    });
  }
}
