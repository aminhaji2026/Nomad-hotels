import { PrismaClient, ScopeType } from '@prisma/client';
import {
  HOTEL_ROLE_PERMISSIONS,
  PERMISSIONS,
  PLATFORM_ROLE_PERMISSIONS,
} from '../src/common/constants/permissions';
import { hashPassword } from '../src/common/utils/crypto.util';

const prisma = new PrismaClient();

async function upsertPermission(code: string) {
  return prisma.permission.upsert({
    where: { code },
    update: { name: code },
    create: { code, name: code, description: code },
  });
}

async function upsertRole(
  code: string,
  name: string,
  scopeType: ScopeType,
  permissionCodes: string[],
) {
  const role = await prisma.role.upsert({
    where: { code },
    update: { name, scopeType, isSystem: true },
    create: { code, name, scopeType, isSystem: true },
  });
  for (const permissionCode of permissionCodes) {
    const permission = await prisma.permission.findUnique({ where: { code: permissionCode } });
    if (!permission) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }
  return role;
}

async function main() {
  for (const code of PERMISSIONS) {
    await upsertPermission(code);
  }

  for (const [code, perms] of Object.entries(PLATFORM_ROLE_PERMISSIONS)) {
    await upsertRole(code, code.replace(/_/g, ' '), 'PLATFORM', perms);
  }
  for (const [code, perms] of Object.entries(HOTEL_ROLE_PERMISSIONS)) {
    await upsertRole(
      code,
      code.replace(/_/g, ' '),
      code === 'GROUP_ADMIN' ? 'HOTEL_GROUP' : 'PROPERTY',
      perms,
    );
  }

  const passwordHash = await hashPassword('ChangeMe123!');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@nomadstay.local' },
    update: { passwordHash, status: 'ACTIVE', firstName: 'Super', lastName: 'Admin' },
    create: {
      email: 'superadmin@nomadstay.local',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  const superRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });
  await prisma.staffMembership.upsert({
    where: {
      userId_roleId_hotelGroupId_propertyId: {
        userId: superAdmin.id,
        roleId: superRole.id,
        hotelGroupId: null as any,
        propertyId: null as any,
      },
    },
    update: { isActive: true },
    create: {
      userId: superAdmin.id,
      roleId: superRole.id,
      isActive: true,
      acceptedAt: new Date(),
    },
  }).catch(async () => {
    // compound null unique may not work — fallback find/create
    const existing = await prisma.staffMembership.findFirst({
      where: { userId: superAdmin.id, roleId: superRole.id, hotelGroupId: null, propertyId: null },
    });
    if (!existing) {
      await prisma.staffMembership.create({
        data: {
          userId: superAdmin.id,
          roleId: superRole.id,
          isActive: true,
          acceptedAt: new Date(),
        },
      });
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo-hotel.local' },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: 'owner@demo-hotel.local',
      passwordHash,
      firstName: 'Damal',
      lastName: 'Owner',
      displayName: 'Damal Owner',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      customerProfile: { create: { referralCode: 'OWNER001' } },
    },
  });

  const group = await prisma.hotelGroup.upsert({
    where: { slug: 'demo-hospitality-group' },
    update: { name: 'Demo Hospitality Group', status: 'ACTIVE' },
    create: {
      name: 'Demo Hospitality Group',
      legalName: 'Demo Hospitality LLC',
      slug: 'demo-hospitality-group',
      countryCode: 'SO',
      status: 'ACTIVE',
    },
  });

  const property = await prisma.property.upsert({
    where: { slug: 'damal-hotel-hargeisa' },
    update: { status: 'ACTIVE', name: 'Damal Hotel Hargeisa' },
    create: {
      hotelGroupId: group.id,
      name: 'Damal Hotel Hargeisa',
      slug: 'damal-hotel-hargeisa',
      propertyType: 'HOTEL',
      starRating: 4,
      status: 'ACTIVE',
      timezone: 'Africa/Djibouti',
      currency: 'USD',
      email: 'stay@damal.local',
      phone: '+252630000000',
      addressLine1: 'Airport Road',
      city: 'Hargeisa',
      countryCode: 'SO',
      checkInFrom: '14:00',
      checkOutUntil: '11:00',
      commissionRate: 12.5,
      publishedAt: new Date(),
    },
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { code: 'HOTEL_OWNER' } });
  const existingMembership = await prisma.staffMembership.findFirst({
    where: { userId: owner.id, roleId: ownerRole.id, propertyId: property.id },
  });
  if (!existingMembership) {
    await prisma.staffMembership.create({
      data: {
        userId: owner.id,
        roleId: ownerRole.id,
        hotelGroupId: group.id,
        propertyId: property.id,
        isActive: true,
        acceptedAt: new Date(),
      },
    });
  }

  const roomType = await prisma.roomType.upsert({
    where: { propertyId_code: { propertyId: property.id, code: 'DLX' } },
    update: { name: 'Deluxe Room', sellableUnits: 10 },
    create: {
      propertyId: property.id,
      code: 'DLX',
      name: 'Deluxe Room',
      description: 'Spacious deluxe room with city view',
      sizeSqm: 32,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      baseOccupancy: 2,
      sellableUnits: 10,
      smoking: 'NON_SMOKING',
    },
  });

  for (const roomNumber of ['101', '102', '103']) {
    await prisma.physicalRoom.upsert({
      where: { propertyId_roomNumber: { propertyId: property.id, roomNumber } },
      update: { roomTypeId: roomType.id, status: 'AVAILABLE', isActive: true },
      create: {
        propertyId: property.id,
        roomTypeId: roomType.id,
        roomNumber,
        status: 'AVAILABLE',
      },
    });
  }

  const ratePlan = await prisma.ratePlan.upsert({
    where: { propertyId_code: { propertyId: property.id, code: 'BAR' } },
    update: {
      name: 'Best Available Rate',
      basePrice: 85,
      isActive: true,
      roomTypeId: roomType.id,
    },
    create: {
      propertyId: property.id,
      roomTypeId: roomType.id,
      code: 'BAR',
      name: 'Best Available Rate',
      type: 'STANDARD',
      currency: 'USD',
      basePrice: 85,
      isRefundable: true,
      minStay: 1,
    },
  });

  // Open ~90 days of inventory and weekend premium rates
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < 90; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    await prisma.inventoryDay.upsert({
      where: { roomTypeId_date: { roomTypeId: roomType.id, date } },
      update: { total: 10, available: 10, state: 'OPEN' },
      create: {
        propertyId: property.id,
        roomTypeId: roomType.id,
        date,
        total: 10,
        available: 10,
        state: 'OPEN',
      },
    });
    const dow = date.getUTCDay();
    const weekend = dow === 5 || dow === 6;
    await prisma.dailyRate.upsert({
      where: { ratePlanId_date: { ratePlanId: ratePlan.id, date } },
      update: { price: weekend ? 110 : 85 },
      create: {
        ratePlanId: ratePlan.id,
        date,
        price: weekend ? 110 : 85,
      },
    });
  }

  console.log('Seed complete');
  console.log('  superadmin@nomadstay.local / ChangeMe123!');
  console.log('  owner@demo-hotel.local / ChangeMe123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
