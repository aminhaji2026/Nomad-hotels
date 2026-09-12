import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreateThreadDto, PostMessageDto } from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async createThread(user: AuthUser, dto: CreateThreadDto) {
    if (dto.propertyId)
      await this.access.assertPropertyAccess(user, dto.propertyId);
    if (dto.reservationId) {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id: dto.reservationId },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (!user.isPlatform && reservation.customerId !== user.id) {
        await this.access.assertPropertyAccess(user, reservation.propertyId);
      }
      dto.propertyId = dto.propertyId ?? reservation.propertyId;
    }
    return this.prisma.messageThread.create({
      data: {
        propertyId: dto.propertyId,
        reservationId: dto.reservationId,
        subject: dto.subject,
        messages: {
          create: {
            senderId: user.id,
            reservationId: dto.reservationId,
            body: dto.body,
          },
        },
      },
      include: { messages: true },
    });
  }

  async listThreads(user: AuthUser, propertyId?: string) {
    if (propertyId) await this.access.assertPropertyAccess(user, propertyId);
    if (user.isPlatform) {
      return this.prisma.messageThread.findMany({
        where: propertyId ? { propertyId } : undefined,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    const propertyIds = user.memberships
      .map((m) => m.propertyId)
      .filter(Boolean) as string[];
    const myReservations = await this.prisma.reservation.findMany({
      where: { customerId: user.id },
      select: { id: true },
      take: 500,
    });
    const reservationIds = myReservations.map((r) => r.id);
    return this.prisma.messageThread.findMany({
      where: {
        OR: [
          propertyId
            ? { propertyId }
            : propertyIds.length
              ? { propertyId: { in: propertyIds } }
              : { id: '00000000-0000-0000-0000-000000000000' },
          { messages: { some: { senderId: user.id } } },
          ...(reservationIds.length
            ? [{ reservationId: { in: reservationIds } }]
            : []),
        ],
      },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getThread(user: AuthUser, threadId: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.propertyId && !user.isPlatform) {
      try {
        await this.access.assertPropertyAccess(user, thread.propertyId);
      } catch {
        const mine = thread.messages.some((m) => m.senderId === user.id);
        if (!mine) throw new ForbiddenException('No access');
      }
    }
    return thread;
  }

  async postMessage(user: AuthUser, threadId: string, dto: PostMessageDto) {
    await this.getThread(user, threadId);
    return this.prisma.message.create({
      data: { threadId, senderId: user.id, body: dto.body },
    });
  }
}
