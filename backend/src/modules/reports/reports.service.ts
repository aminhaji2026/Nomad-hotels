import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { parseDateOnly } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private range(from?: string, to?: string) {
    return {
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: parseDateOnly(from) } : {}),
              ...(to ? { lte: parseDateOnly(to) } : {}),
            },
          }
        : {}),
    };
  }

  async occupancy(
    user: AuthUser,
    propertyId: string,
    from?: string,
    to?: string,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const start = from
      ? parseDateOnly(from)
      : parseDateOnly(new Date().toISOString().slice(0, 10));
    const end = to
      ? parseDateOnly(to)
      : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [rooms, reservations] = await Promise.all([
      this.prisma.physicalRoom.count({
        where: { propertyId, deletedAt: null, isActive: true },
      }),
      this.prisma.reservation.findMany({
        where: {
          propertyId,
          status: {
            in: ['CONFIRMED', 'MODIFIED', 'CHECKED_IN', 'CHECKED_OUT'],
          },
          checkIn: { lt: end },
          checkOut: { gt: start },
        },
        select: {
          checkIn: true,
          checkOut: true,
          roomsCount: true,
          total: true,
          currency: true,
        },
      }),
    ]);

    const days: Array<{
      date: string;
      soldRooms: number;
      occupancyPct: number;
    }> = [];
    for (
      let d = new Date(start);
      d < end;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const dateStr = d.toISOString().slice(0, 10);
      const soldRooms = reservations.reduce((sum, r) => {
        if (r.checkIn <= d && r.checkOut > d) return sum + r.roomsCount;
        return sum;
      }, 0);
      days.push({
        date: dateStr,
        soldRooms,
        occupancyPct:
          rooms > 0 ? Math.round((soldRooms / rooms) * 1000) / 10 : 0,
      });
    }

    return { propertyId, roomCount: rooms, days };
  }

  async revenue(
    user: AuthUser,
    propertyId: string,
    from?: string,
    to?: string,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const dateFilter = this.range(from, to);
    const [payments, refunds, commissions, reservations] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: 'CAPTURED',
          reservation: { propertyId },
          ...dateFilter,
        },
      }),
      this.prisma.refund.findMany({
        where: { payment: { reservation: { propertyId } }, ...dateFilter },
      }),
      this.prisma.commissionRecord.findMany({
        where: { propertyId, ...dateFilter },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { propertyId, ...dateFilter },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

    const captured = payments.reduce((s, p) => s + Number(p.amount), 0);
    const refunded = refunds.reduce((s, r) => s + Number(r.amount), 0);
    const commission = commissions.reduce((s, c) => s + Number(c.amount), 0);

    return {
      propertyId,
      totals: {
        captured,
        refunded,
        commission,
        net: captured - refunded - commission,
        adr:
          payments.length > 0
            ? Math.round((captured / payments.length) * 100) / 100
            : 0,
      },
      byStatus: reservations.map((r) => ({
        status: r.status,
        count: r._count._all,
        total: Number(r._sum.total ?? 0),
      })),
    };
  }

  async platformOverview(user: AuthUser, from?: string, to?: string) {
    void user;
    const dateFilter = this.range(from, to);
    const [
      properties,
      reservations,
      payments,
      reviews,
      openTickets,
      pendingApps,
    ] = await Promise.all([
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.reservation.count({ where: dateFilter }),
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED', ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.review.aggregate({
        where: { status: 'PUBLISHED', ...dateFilter },
        _avg: { overallScore: true },
        _count: true,
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } },
      }),
      this.prisma.propertyApplication.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
    ]);

    return {
      properties,
      reservations,
      gmv: Number(payments._sum.amount ?? 0),
      paymentCount: payments._count,
      avgReviewScore: Number(reviews._avg.overallScore ?? 0),
      reviewCount: reviews._count,
      openSupportTickets: openTickets,
      pendingApplications: pendingApps,
    };
  }
}
