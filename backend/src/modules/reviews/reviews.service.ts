import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateReviewDto,
  HotelReplyDto,
  ModerateReviewDto,
} from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateReviewDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { review: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.customerId !== user.id && !user.isPlatform) {
      throw new BadRequestException('Only the guest can review this stay');
    }
    if (reservation.status !== 'CHECKED_OUT') {
      throw new BadRequestException('Reviews require a completed stay');
    }
    if (reservation.review)
      throw new BadRequestException('Review already exists');

    const review = await this.prisma.review.create({
      data: {
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        authorId: user.id,
        overallScore: dto.overallScore,
        categoryScores: dto.categoryScores,
        title: dto.title,
        body: dto.body,
        positive: dto.positive,
        negative: dto.negative,
        isAnonymous: dto.isAnonymous ?? false,
        status: 'PENDING',
      },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'review.create',
      resource: 'Review',
      resourceId: review.id,
      propertyId: reservation.propertyId,
    });
    return review;
  }

  async listForProperty(propertyId: string, includePending = false) {
    return this.prisma.review.findMany({
      where: {
        propertyId,
        status: includePending ? undefined : 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async reply(user: AuthUser, reviewId: string, dto: HotelReplyDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    await this.access.assertPropertyAccess(user, review.propertyId);
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { hotelReply: dto.reply, hotelRepliedAt: new Date() },
    });
  }

  async moderate(user: AuthUser, reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (!user.isPlatform && !user.permissions.includes('content:moderate')) {
      await this.access.assertPropertyAccess(user, review.propertyId);
    }
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: dto.status },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'review.moderate',
      resource: 'Review',
      resourceId: reviewId,
      propertyId: review.propertyId,
      metadata: { status: dto.status },
    });
    return updated;
  }
}
