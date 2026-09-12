import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreatePaymentIntentDto,
  RefundPaymentDto,
  WebhookDto,
} from './dto/payments.dto';
import { PaymentGateway, SandboxPaymentGateway } from './payment-gateway';

@Injectable()
export class PaymentsService {
  private readonly gateway: PaymentGateway = new SandboxPaymentGateway();

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async createIntent(user: AuthUser | null, dto: CreatePaymentIntentDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { property: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (user && !user.isPlatform && reservation.customerId !== user.id) {
      await this.access.assertPropertyAccess(user, reservation.propertyId);
    }

    if (
      ['CANCELLED', 'REFUNDED'].includes(reservation.status) ||
      reservation.paymentStatus === 'CAPTURED'
    ) {
      throw new BadRequestException('Reservation is not payable');
    }

    const amount = Number(reservation.total);
    const atProperty =
      dto.method === 'PAY_AT_PROPERTY' || dto.method === 'CASH';
    const intent = atProperty
      ? {
          provider: 'property',
          providerRef: `property_${reservation.id.slice(0, 8)}`,
          status: 'PENDING' as const,
          raw: { method: dto.method },
        }
      : await this.gateway.createIntent({
          amount,
          currency: reservation.currency,
          reservationId: reservation.id,
          idempotencyKey: dto.idempotencyKey,
        });

    const paymentStatus: PaymentStatus =
      intent.status === 'CAPTURED'
        ? 'CAPTURED'
        : intent.status === 'AUTHORIZED'
          ? 'AUTHORIZED'
          : intent.status === 'FAILED'
            ? 'FAILED'
            : 'PENDING';

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount,
          currency: reservation.currency,
          method: dto.method,
          status: paymentStatus,
          provider: intent.provider,
          providerRef: intent.providerRef,
          idempotencyKey: dto.idempotencyKey,
          rawResponse: intent.raw as Prisma.InputJsonValue,
        },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          paymentStatus,
          status:
            paymentStatus === 'CAPTURED' ? 'CONFIRMED' : 'PAYMENT_PROCESSING',
          statusHistory: {
            create: {
              fromStatus: reservation.status,
              toStatus:
                paymentStatus === 'CAPTURED'
                  ? 'CONFIRMED'
                  : 'PAYMENT_PROCESSING',
              actorId: user?.id,
              note: `Payment ${created.id} created`,
            },
          },
        },
      });

      return created;
    });

    if (user) {
      await this.audit.log({
        actorId: user.id,
        action: 'payment.intent',
        resource: 'Payment',
        resourceId: payment.id,
        propertyId: reservation.propertyId,
        metadata: { method: dto.method, status: payment.status },
      });
    }
    return payment;
  }

  async capture(user: AuthUser, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { reservation: { include: { property: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.access.assertPropertyAccess(
      user,
      payment.reservation.propertyId,
    );

    if (payment.status === 'CAPTURED') return payment;
    if (!['PENDING', 'AUTHORIZED'].includes(payment.status)) {
      throw new BadRequestException('Payment cannot be captured');
    }

    if (payment.provider === 'sandbox' && payment.providerRef) {
      await this.gateway.capture(payment.providerRef);
    }

    const commissionRate = Number(payment.reservation.property.commissionRate);
    const commissionAmount =
      Math.round(((Number(payment.amount) * commissionRate) / 100) * 100) / 100;

    const updated = await this.prisma.$transaction(async (tx) => {
      const captured = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'CAPTURED' },
      });

      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          paymentStatus: 'CAPTURED',
          status: 'CONFIRMED',
          commissionAmount,
          statusHistory: {
            create: {
              fromStatus: payment.reservation.status,
              toStatus: 'CONFIRMED',
              actorId: user.id,
              note: 'Payment captured',
            },
          },
        },
      });

      await tx.commissionRecord.upsert({
        where: { reservationId: payment.reservationId },
        update: { ratePercent: commissionRate, amount: commissionAmount },
        create: {
          reservationId: payment.reservationId,
          propertyId: payment.reservation.propertyId,
          ratePercent: commissionRate,
          amount: commissionAmount,
          currency: payment.currency,
        },
      });

      await tx.financialTransaction.create({
        data: {
          propertyId: payment.reservation.propertyId,
          type: 'PAYMENT_CAPTURE',
          amount: payment.amount,
          currency: payment.currency,
          reference: payment.id,
          metadata: { reservationId: payment.reservationId },
        },
      });

      return captured;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'payment.capture',
      resource: 'Payment',
      resourceId: payment.id,
      propertyId: payment.reservation.propertyId,
    });
    return updated;
  }

  async refund(user: AuthUser, paymentId: string, dto: RefundPaymentDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.refund.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { reservation: true, refunds: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.access.assertPropertyAccess(
      user,
      payment.reservation.propertyId,
    );

    if (!['CAPTURED', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
      throw new BadRequestException('Payment is not refundable');
    }

    const alreadyRefunded = payment.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    const remaining = Number(payment.amount) - alreadyRefunded;
    if (dto.amount > remaining + 0.0001) {
      throw new BadRequestException('Refund exceeds remaining amount');
    }

    let providerRef: string | undefined;
    if (payment.provider === 'sandbox' && payment.providerRef) {
      const res = await this.gateway.refund({
        providerRef: payment.providerRef,
        amount: dto.amount,
        idempotencyKey: dto.idempotencyKey,
      });
      providerRef = res.providerRef;
    }

    const isFull = dto.amount >= remaining - 0.0001;
    const refund = await this.prisma.$transaction(async (tx) => {
      const created = await tx.refund.create({
        data: {
          paymentId: payment.id,
          amount: dto.amount,
          reason: dto.reason,
          providerRef,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: isFull ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
      });

      // Keep stay lifecycle intact for partial refunds and in-house/past stays.
      // Only flip reservation.status on a full refund of a pre-arrival booking.
      const preArrival = [
        'PENDING_PAYMENT',
        'PAYMENT_PROCESSING',
        'CONFIRMED',
        'MODIFIED',
        'PARTIALLY_REFUNDED',
      ].includes(payment.reservation.status);
      const lifecycleStatus = isFull && preArrival ? 'REFUNDED' : undefined;

      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          paymentStatus: isFull ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          ...(lifecycleStatus
            ? {
                status: lifecycleStatus,
                statusHistory: {
                  create: {
                    fromStatus: payment.reservation.status,
                    toStatus: lifecycleStatus,
                    actorId: user.id,
                    note: dto.reason ?? 'Refund issued',
                  },
                },
              }
            : {}),
        },
      });

      await tx.financialTransaction.create({
        data: {
          propertyId: payment.reservation.propertyId,
          type: 'REFUND',
          amount: dto.amount,
          currency: payment.currency,
          reference: created.id,
          metadata: { paymentId: payment.id },
        },
      });

      return created;
    });

    await this.audit.log({
      actorId: user.id,
      action: 'payment.refund',
      resource: 'Refund',
      resourceId: refund.id,
      propertyId: payment.reservation.propertyId,
      metadata: { amount: dto.amount },
    });
    return refund;
  }

  async handleWebhook(dto: WebhookDto) {
    const payloadStr = JSON.stringify(dto.payload);
    if (!this.gateway.verifyWebhookSignature(payloadStr, dto.signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (dto.idempotencyKey) {
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing?.processedAt) return existing;
    }

    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: dto.provider,
        eventType: dto.eventType,
        payload: dto.payload as Prisma.InputJsonValue,
        signature: dto.signature,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    try {
      const providerRef = String(
        dto.payload.providerRef ?? dto.payload.id ?? '',
      );
      if (providerRef && dto.eventType.toLowerCase().includes('capture')) {
        const payment = await this.prisma.payment.findFirst({
          where: { providerRef },
          include: { reservation: { include: { property: true } } },
        });
        if (payment && payment.status !== 'CAPTURED') {
          const commissionRate = Number(
            payment.reservation.property.commissionRate,
          );
          const commissionAmount =
            Math.round(
              ((Number(payment.amount) * commissionRate) / 100) * 100,
            ) / 100;
          await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'CAPTURED' },
            });
            await tx.reservation.update({
              where: { id: payment.reservationId },
              data: {
                paymentStatus: 'CAPTURED',
                status: 'CONFIRMED',
                commissionAmount,
              },
            });
            await tx.commissionRecord.upsert({
              where: { reservationId: payment.reservationId },
              update: {
                amount: commissionAmount,
                ratePercent: commissionRate,
              },
              create: {
                reservationId: payment.reservationId,
                propertyId: payment.reservation.propertyId,
                ratePercent: commissionRate,
                amount: commissionAmount,
                currency: payment.currency,
              },
            });
          });
        }
      }

      return this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
    } catch (err) {
      return this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          failedAt: new Date(),
          error: err instanceof Error ? err.message : 'Webhook failed',
        },
      });
    }
  }

  async listForReservation(user: AuthUser, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (!user.isPlatform && reservation.customerId !== user.id) {
      await this.access.assertPropertyAccess(user, reservation.propertyId);
    }
    return this.prisma.payment.findMany({
      where: { reservationId },
      include: { refunds: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
