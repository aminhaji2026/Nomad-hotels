import { BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Phase 6 critical scenario guards — pure logic coverage for
 * double-booking, refund caps, cross-hotel isolation, and review eligibility.
 */

export function assertInventoryClaim(updatedCount: number) {
  if (updatedCount !== 1) {
    throw new BadRequestException('Double-booking prevented');
  }
}

export function assertRefundAmount(requested: number, remaining: number) {
  if (requested > remaining + 0.0001) {
    throw new BadRequestException('Refund exceeds remaining amount');
  }
}

export function assertPropertyScope(input: {
  isPlatform: boolean;
  membershipPropertyIds: string[];
  targetPropertyId: string;
}) {
  if (input.isPlatform) return;
  if (!input.membershipPropertyIds.includes(input.targetPropertyId)) {
    throw new ForbiddenException('No access to this property');
  }
}

export function assertReviewEligible(input: {
  customerId: string;
  actorId: string;
  isPlatform: boolean;
  reservationStatus: string;
  hasExistingReview: boolean;
}) {
  if (input.customerId !== input.actorId && !input.isPlatform) {
    throw new BadRequestException('Only the guest can review this stay');
  }
  if (input.reservationStatus !== 'CHECKED_OUT') {
    throw new BadRequestException('Reviews require a completed stay');
  }
  if (input.hasExistingReview) {
    throw new BadRequestException('Review already exists');
  }
}

describe('Phase 6 critical scenarios', () => {
  it('prevents double-booking when conditional inventory update fails', () => {
    expect(() => assertInventoryClaim(0)).toThrow(BadRequestException);
    expect(() => assertInventoryClaim(1)).not.toThrow();
  });

  it('rejects refunds that exceed remaining capturable amount', () => {
    expect(() => assertRefundAmount(50, 40)).toThrow(BadRequestException);
    expect(() => assertRefundAmount(40, 40)).not.toThrow();
  });

  it('blocks cross-hotel property access for non-platform staff', () => {
    expect(() =>
      assertPropertyScope({
        isPlatform: false,
        membershipPropertyIds: ['prop-a'],
        targetPropertyId: 'prop-b',
      }),
    ).toThrow(ForbiddenException);

    expect(() =>
      assertPropertyScope({
        isPlatform: true,
        membershipPropertyIds: [],
        targetPropertyId: 'prop-b',
      }),
    ).not.toThrow();
  });

  it('rejects reviews without a completed stay', () => {
    expect(() =>
      assertReviewEligible({
        customerId: 'guest-1',
        actorId: 'guest-1',
        isPlatform: false,
        reservationStatus: 'CONFIRMED',
        hasExistingReview: false,
      }),
    ).toThrow(/completed stay/);

    expect(() =>
      assertReviewEligible({
        customerId: 'guest-1',
        actorId: 'guest-2',
        isPlatform: false,
        reservationStatus: 'CHECKED_OUT',
        hasExistingReview: false,
      }),
    ).toThrow(/Only the guest/);

    expect(() =>
      assertReviewEligible({
        customerId: 'guest-1',
        actorId: 'guest-1',
        isPlatform: false,
        reservationStatus: 'CHECKED_OUT',
        hasExistingReview: false,
      }),
    ).not.toThrow();
  });
});
