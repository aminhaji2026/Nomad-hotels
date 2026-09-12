import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import {
  eachNight,
  parseDateOnly,
  toDateOnlyString,
} from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';

export type StayQuery = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  childrenAges?: number[];
  rooms?: number;
};

export type PricedOffer = {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  currency: string;
  nights: { date: string; amount: number }[];
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  isRefundable: boolean;
  ratePlanName: string;
  roomTypeName: string;
  availableUnits: number;
};

function num(value: Decimal | number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  canAccommodate(
    roomType: {
      maxAdults: number;
      maxChildren: number;
      maxOccupancy: number;
    },
    adults: number,
    children: number,
  ): boolean {
    if (adults > roomType.maxAdults) return false;
    if (children > roomType.maxChildren) return false;
    if (adults + children > roomType.maxOccupancy) return false;
    return true;
  }

  async getMinAvailable(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date,
    roomsNeeded: number,
  ): Promise<number> {
    const nights = eachNight(checkIn, checkOut);
    if (!nights.length) return 0;
    const days = await this.prisma.inventoryDay.findMany({
      where: {
        roomTypeId,
        date: { in: nights },
        state: { not: 'STOP_SELL' },
      },
    });
    if (days.length !== nights.length) return 0;
    const minAvail = Math.min(...days.map((d) => d.available));
    return minAvail >= roomsNeeded ? minAvail : 0;
  }

  async priceStay(input: {
    propertyId: string;
    roomTypeId: string;
    ratePlanId: string;
    checkIn: Date;
    checkOut: Date;
    rooms: number;
  }): Promise<PricedOffer | null> {
    const plan = await this.prisma.ratePlan.findFirst({
      where: {
        id: input.ratePlanId,
        propertyId: input.propertyId,
        roomTypeId: input.roomTypeId,
        isActive: true,
      },
      include: { roomType: true },
    });
    if (!plan) return null;

    const nights = eachNight(input.checkIn, input.checkOut);
    if (!nights.length) return null;
    const stayNights = nights.length;
    if (plan.minStay && stayNights < plan.minStay) return null;
    if (plan.maxStay && stayNights > plan.maxStay) return null;

    const restrictions = await this.prisma.rateRestriction.findMany({
      where: {
        ratePlanId: plan.id,
        startDate: { lte: input.checkOut },
        endDate: { gte: input.checkIn },
      },
    });
    for (const r of restrictions) {
      if (r.stopSell) return null;
      if (
        r.closedToArrival &&
        input.checkIn >= r.startDate &&
        input.checkIn <= r.endDate
      ) {
        return null;
      }
      if (
        r.closedToDeparture &&
        input.checkOut >= r.startDate &&
        input.checkOut <= r.endDate
      ) {
        return null;
      }
      if (r.minStay && stayNights < r.minStay) return null;
      if (r.maxStay && stayNights > r.maxStay) return null;
    }

    const daily = await this.prisma.dailyRate.findMany({
      where: { ratePlanId: plan.id, date: { in: nights } },
    });
    const byDate = new Map(
      daily.map((d) => [toDateOnlyString(d.date), num(d.price)]),
    );

    const nightPrices = nights.map((date) => {
      const key = toDateOnlyString(date);
      const amount = (byDate.get(key) ?? num(plan.basePrice)) * input.rooms;
      return { date: key, amount };
    });

    const subtotal = nightPrices.reduce((s, n) => s + n.amount, 0);
    const taxes = Math.round(subtotal * 0.1 * 100) / 100;
    const fees = 0;
    const total = Math.round((subtotal + taxes + fees) * 100) / 100;

    const availableUnits = await this.getMinAvailable(
      input.roomTypeId,
      input.checkIn,
      input.checkOut,
      input.rooms,
    );
    if (availableUnits < input.rooms) return null;

    return {
      propertyId: input.propertyId,
      roomTypeId: input.roomTypeId,
      ratePlanId: plan.id,
      currency: plan.currency,
      nights: nightPrices,
      subtotal,
      taxes,
      fees,
      total,
      isRefundable: plan.isRefundable,
      ratePlanName: plan.name,
      roomTypeName: plan.roomType.name,
      availableUnits,
    };
  }

  async offersForProperty(
    propertyId: string,
    query: StayQuery,
  ): Promise<PricedOffer[]> {
    const checkIn = parseDateOnly(query.checkIn);
    const checkOut = parseDateOnly(query.checkOut);
    const rooms = query.rooms ?? 1;
    const adults = query.adults;
    const children = query.children ?? 0;

    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId, deletedAt: null, isActive: true },
      include: { ratePlans: { where: { isActive: true } } },
    });

    const offers: PricedOffer[] = [];
    for (const rt of roomTypes) {
      if (!this.canAccommodate(rt, adults, children)) continue;
      for (const plan of rt.ratePlans) {
        const offer = await this.priceStay({
          propertyId,
          roomTypeId: rt.id,
          ratePlanId: plan.id,
          checkIn,
          checkOut,
          rooms,
        });
        if (offer) offers.push(offer);
      }
    }
    return offers.sort((a, b) => a.total - b.total);
  }
}
