import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSupportTicketDto,
  ReplySupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateSupportTicketDto) {
    if (dto.reservationId) {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id: dto.reservationId },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (
        !user.isPlatform &&
        reservation.customerId !== user.id &&
        !user.permissions.includes('support:manage')
      ) {
        throw new ForbiddenException('Cannot attach this reservation');
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        requesterId: user.id,
        subject: dto.subject,
        category: dto.category,
        priority: dto.priority ?? 'MEDIUM',
        reservationId: dto.reservationId,
        messages: {
          create: {
            authorId: user.id,
            body: dto.body,
            isInternal: false,
          },
        },
      },
      include: { messages: true },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'support.create',
      resource: 'SupportTicket',
      resourceId: ticket.id,
    });
    return ticket;
  }

  async list(user: AuthUser, status?: string) {
    if (user.isPlatform || user.permissions.includes('support:manage')) {
      return this.prisma.supportTicket.findMany({
        where: status ? { status: status as never } : undefined,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          requester: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      });
    }
    return this.prisma.supportTicket.findMany({
      where: {
        requesterId: user.id,
        ...(status ? { status: status as never } : {}),
      },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async get(user: AuthUser, id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        requester: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignee: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanView(user, ticket.requesterId);
    if (!user.isPlatform && !user.permissions.includes('support:manage')) {
      ticket.messages = ticket.messages.filter((m) => !m.isInternal);
    }
    return ticket;
  }

  async reply(user: AuthUser, id: string, dto: ReplySupportTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertCanView(user, ticket.requesterId);

    const isStaff =
      user.isPlatform || user.permissions.includes('support:manage');
    if (dto.isInternal && !isStaff) {
      throw new ForbiddenException('Internal notes require support access');
    }

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
      },
    });

    if (isStaff && ticket.status === 'OPEN') {
      await this.prisma.supportTicket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (!isStaff && ticket.status === 'WAITING_CUSTOMER') {
      await this.prisma.supportTicket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (isStaff) {
      await this.prisma.supportTicket.update({
        where: { id },
        data: { status: 'WAITING_CUSTOMER' },
      });
    }

    return message;
  }

  async update(user: AuthUser, id: string, dto: UpdateSupportTicketDto) {
    if (!user.isPlatform && !user.permissions.includes('support:manage')) {
      throw new ForbiddenException('Support manage required');
    }
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'support.update',
      resource: 'SupportTicket',
      resourceId: id,
      metadata: { status: dto.status, assigneeId: dto.assigneeId },
    });
    return updated;
  }

  private assertCanView(user: AuthUser, requesterId: string) {
    if (user.isPlatform || user.permissions.includes('support:manage')) return;
    if (user.id === requesterId) return;
    throw new ForbiddenException('No access to this ticket');
  }
}
