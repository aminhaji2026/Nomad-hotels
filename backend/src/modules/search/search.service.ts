import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { nightsBetween, parseDateOnly } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { HotelDetailQueryDto, SearchQueryDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async search(query: SearchQueryDto) {
    const checkIn = parseDateOnly(query.checkIn);
    const checkOut = parseDateOnly(query.checkOut);
    if (checkOut <= checkIn) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const rooms = query.rooms ?? 1;
    const adults = query.adults;
    const children = query.children ?? 0;

    const where: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      publishedAt: { not: null },
      ...(query.city
        ? { city: { equals: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.countryCode
        ? { countryCode: query.countryCode.toUpperCase() }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { city: { contains: query.q, mode: 'insensitive' } },
              { slug: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const candidates = await this.prisma.property.findMany({
      where,
      include: {
        amenities: { include: { amenity: true } },
        temporaryClosures: {
          where: {
            startDate: { lte: checkOut },
            endDate: { gte: checkIn },
          },
        },
      },
      take: 200,
    });

    const results: Array<{
      property: (typeof candidates)[number];
      fromPrice: number;
      currency: string;
      offersCount: number;
      nights: number;
    }> = [];

    for (const property of candidates) {
      if (property.temporaryClosures.length) continue;
      const offers = await this.availability.offersForProperty(property.id, {
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        adults,
        children,
        rooms,
      });
      let filtered = offers;
      if (query.minPrice != null) {
        filtered = filtered.filter((o) => o.total >= query.minPrice!);
      }
      if (query.maxPrice != null) {
        filtered = filtered.filter((o) => o.total <= query.maxPrice!);
      }
      if (!filtered.length) continue;
      results.push({
        property,
        fromPrice: filtered[0].total,
        currency: filtered[0].currency,
        offersCount: filtered.length,
        nights: nightsBetween(checkIn, checkOut),
      });
    }

    if (query.sort === 'rating') {
      results.sort(
        (a, b) => (b.property.starRating ?? 0) - (a.property.starRating ?? 0),
      );
    } else {
      results.sort((a, b) => a.fromPrice - b.fromPrice);
    }

    const total = results.length;
    const slice = results.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: slice.map((r) => ({
        id: r.property.id,
        name: r.property.name,
        slug: r.property.slug,
        city: r.property.city,
        countryCode: r.property.countryCode,
        starRating: r.property.starRating,
        propertyType: r.property.propertyType,
        latitude: r.property.latitude,
        longitude: r.property.longitude,
        currency: r.currency,
        fromPrice: r.fromPrice,
        nights: r.nights,
        offersCount: r.offersCount,
        amenities: r.property.amenities.map((a) => a.amenity.code),
      })),
      meta: { page, pageSize, total },
    };
  }

  async hotelDetails(slugOrId: string, query: HotelDetailQueryDto) {
    const property = await this.prisma.property.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        translations: true,
        amenities: { include: { amenity: true } },
        policies: true,
      },
    });
    if (!property) throw new NotFoundException('Hotel not found');

    const offers = await this.availability.offersForProperty(property.id, {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: query.adults,
      children: query.children ?? 0,
      rooms: query.rooms ?? 1,
    });

    return {
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        city: property.city,
        countryCode: property.countryCode,
        starRating: property.starRating,
        propertyType: property.propertyType,
        checkInFrom: property.checkInFrom,
        checkOutUntil: property.checkOutUntil,
        currency: property.currency,
        amenities: property.amenities.map((a) => a.amenity),
        policies: property.policies,
        translations: property.translations,
      },
      offers,
    };
  }
}
