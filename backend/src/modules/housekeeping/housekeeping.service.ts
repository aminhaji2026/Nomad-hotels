import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskDto,
} from './dto/housekeeping.dto';

@Injectable()
export class HousekeepingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthUser, propertyId: string, status?: string) {
    await this.access.assertPropertyAccess(user, propertyId);
    return this.prisma.housekeepingTask.findMany({
      where: {
        propertyId,
        ...(status ? { status: status as any } : {}),
      },
      include: { physicalRoom: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    user: AuthUser,
    propertyId: string,
    dto: CreateHousekeepingTaskDto,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const room = await this.prisma.physicalRoom.findFirst({
      where: { id: dto.physicalRoomId, propertyId, deletedAt: null },
    });
    if (!room) throw new NotFoundException('Room not found');
    const task = await this.prisma.housekeepingTask.create({
      data: {
        propertyId,
        physicalRoomId: dto.physicalRoomId,
        priority: dto.priority ?? 3,
        notes: dto.notes,
        assigneeId: dto.assigneeId,
        status: 'PENDING',
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'housekeeping.create',
      resource: 'HousekeepingTask',
      resourceId: task.id,
      propertyId,
    });
    return task;
  }

  async update(user: AuthUser, taskId: string, dto: UpdateHousekeepingTaskDto) {
    const task = await this.prisma.housekeepingTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.access.assertPropertyAccess(user, task.propertyId);

    const completed =
      dto.status === 'COMPLETED' || dto.status === 'INSPECTED'
        ? { completedAt: new Date() }
        : {};

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.housekeepingTask.update({
        where: { id: taskId },
        data: {
          status: dto.status,
          assigneeId: dto.assigneeId,
          notes: dto.notes,
          priority: dto.priority,
          ...completed,
        },
      });
      if (dto.status === 'COMPLETED') {
        await tx.physicalRoom.update({
          where: { id: task.physicalRoomId },
          data: { status: 'CLEAN' },
        });
      }
      if (dto.status === 'INSPECTED') {
        await tx.physicalRoom.update({
          where: { id: task.physicalRoomId },
          data: { status: 'INSPECTED' },
        });
      }
      return row;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'housekeeping.update',
      resource: 'HousekeepingTask',
      resourceId: taskId,
      propertyId: task.propertyId,
      metadata: { status: dto.status },
    });
    return updated;
  }
}
