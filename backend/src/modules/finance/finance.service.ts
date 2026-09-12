import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { parseDateOnly } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { AdjustLedgerDto, CreatePayoutDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async statement(
    user: AuthUser,
    propertyId: string,
    from?: string,
    to?: string,
  ) {
    await this.access.assertPropertyAccess(user, propertyId);
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: parseDateOnly(from) } : {}),
              ...(to ? { lte: parseDateOnly(to) } : {}),
            },
          }
        : {};

    const [payments, refunds, commissions, payouts, ledger] = await Promise.all(
      [
        this.prisma.payment.findMany({
          where: {
            reservation: { propertyId },
            status: 'CAPTURED',
            ...dateFilter,
          },
          include: { reservation: { select: { confirmationNumber: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.refund.findMany({
          where: { payment: { reservation: { propertyId } }, ...dateFilter },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.commissionRecord.findMany({
          where: { propertyId, ...dateFilter },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payout.findMany({
          where: { propertyId, ...dateFilter },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.financialTransaction.findMany({
          where: { propertyId, ...dateFilter },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
      ],
    );

    const captured = payments.reduce((s, p) => s + Number(p.amount), 0);
    const refunded = refunds.reduce((s, r) => s + Number(r.amount), 0);
    const commission = commissions.reduce((s, c) => s + Number(c.amount), 0);
    const paidOut = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + Number(p.amount), 0);

    return {
      propertyId,
      totals: {
        captured,
        refunded,
        commission,
        net: captured - refunded - commission,
        paidOut,
        outstanding: captured - refunded - commission - paidOut,
      },
      payments,
      refunds,
      commissions,
      payouts,
      ledger,
    };
  }

  async createPayout(user: AuthUser, dto: CreatePayoutDto) {
    await this.access.assertPropertyAccess(user, dto.propertyId);
    if (!user.isPlatform && !user.permissions.includes('finance:write')) {
      throw new BadRequestException('Not allowed');
    }
    const start = parseDateOnly(dto.periodStart);
    const end = parseDateOnly(dto.periodEnd);
    if (end < start) throw new BadRequestException('Invalid period');

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'CAPTURED',
        reservation: { propertyId: dto.propertyId },
        createdAt: { gte: start, lte: end },
      },
      include: { refunds: true },
    });
    const commissions = await this.prisma.commissionRecord.findMany({
      where: {
        propertyId: dto.propertyId,
        createdAt: { gte: start, lte: end },
      },
    });

    const captured = payments.reduce((s, p) => s + Number(p.amount), 0);
    const refunded = payments.reduce(
      (s, p) => s + p.refunds.reduce((x, r) => x + Number(r.amount), 0),
      0,
    );
    const commission = commissions.reduce((s, c) => s + Number(c.amount), 0);
    const amount = Math.max(
      0,
      Math.round((captured - refunded - commission) * 100) / 100,
    );
    if (amount <= 0)
      throw new BadRequestException('Nothing to payout for period');

    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          propertyId: dto.propertyId,
          amount,
          currency: property.currency,
          status: 'SCHEDULED',
          periodStart: start,
          periodEnd: end,
        },
      });
      await tx.financialTransaction.create({
        data: {
          propertyId: dto.propertyId,
          type: 'PAYOUT_SCHEDULED',
          amount,
          currency: property.currency,
          reference: created.id,
          metadata: { periodStart: dto.periodStart, periodEnd: dto.periodEnd },
        },
      });
      return created;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'payout.create',
      resource: 'Payout',
      resourceId: payout.id,
      propertyId: dto.propertyId,
      metadata: { amount },
    });
    return payout;
  }

  async markPayoutPaid(user: AuthUser, payoutId: string) {
    if (!user.isPlatform) throw new BadRequestException('Platform only');
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === 'PAID') return payout;

    const updated = await this.prisma.$transaction(async (tx) => {
      const paid = await tx.payout.update({
        where: { id: payoutId },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await tx.financialTransaction.create({
        data: {
          propertyId: payout.propertyId,
          type: 'PAYOUT_PAID',
          amount: payout.amount,
          currency: payout.currency,
          reference: payout.id,
        },
      });
      return paid;
    });
    await this.audit.log({
      actorId: user.id,
      action: 'payout.paid',
      resource: 'Payout',
      resourceId: payoutId,
      propertyId: payout.propertyId,
    });
    return updated;
  }

  async adjustLedger(user: AuthUser, dto: AdjustLedgerDto) {
    await this.access.assertPropertyAccess(user, dto.propertyId);
    const row = await this.prisma.financialTransaction.create({
      data: {
        propertyId: dto.propertyId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        reference: dto.reference,
        metadata: dto.note ? { note: dto.note } : undefined,
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'ledger.adjust',
      resource: 'FinancialTransaction',
      resourceId: row.id,
      propertyId: dto.propertyId,
    });
    return row;
  }
}
