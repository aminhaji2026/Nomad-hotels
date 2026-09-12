import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: {
    actorId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    propertyId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? undefined,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? undefined,
        propertyId: input.propertyId ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  }
}
