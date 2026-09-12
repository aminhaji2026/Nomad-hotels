import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
} from './dto/maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthUser, propertyId: string, status?: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.maintenanceTicket.findMany({
      where: { propertyId, ...(status ? { status: status as any } : {}) },
      include: { physicalRoom: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    user: AuthUser,
    propertyId: string,
    dto: CreateMaintenanceTicketDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    if (dto.physicalRoomId) {
      const room = await this.prisma.physicalRoom.findFirst({
        where: { id: dto.physicalRoomId, propertyId, deletedAt: null },
      });
      if (!room) throw new NotFoundException('Room not found');
    }
    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceTicket.create({
        data: {
          propertyId,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          physicalRoomId: dto.physicalRoomId,
          priority: dto.priority ?? 'MEDIUM',
          assigneeId: dto.assigneeId,
          status: dto.assigneeId ? 'ASSIGNED' : 'OPEN',
        },
      });
      if (
        dto.physicalRoomId &&
        (dto.priority === 'HIGH' || dto.priority === 'CRITICAL')
      ) {
        await tx.physicalRoom.update({
          where: { id: dto.physicalRoomId },
          data: { status: 'OUT_OF_ORDER' },
        });
      }
      return created;
    });
    await this.audit.log({
      actorId: user.id,
      action: 'maintenance.create',
      resource: 'MaintenanceTicket',
      resourceId: ticket.id,
      propertyId,
    });
    return ticket;
  }

  async update(user: AuthUser, id: string, dto: UpdateMaintenanceTicketDto) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.access.assertPropertyAccess(user, ticket.propertyId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.maintenanceTicket.update({
        where: { id },
        data: {
          status: dto.status,
          priority: dto.priority,
          assigneeId: dto.assigneeId,
          description: dto.description,
          resolvedAt:
            dto.status === 'RESOLVED' || dto.status === 'CLOSED'
              ? new Date()
              : undefined,
        },
      });
      if (
        ticket.physicalRoomId &&
        (dto.status === 'RESOLVED' || dto.status === 'CLOSED')
      ) {
        await tx.physicalRoom.update({
          where: { id: ticket.physicalRoomId },
          data: { status: 'DIRTY' },
        });
      }
      return row;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'maintenance.update',
      resource: 'MaintenanceTicket',
      resourceId: id,
      propertyId: ticket.propertyId,
      metadata: { status: dto.status },
    });
    return updated;
  }
}
