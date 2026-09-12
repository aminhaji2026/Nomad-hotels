# 3. Module and folder structure

```
backend/
  docs/                         # architecture & checklists
  prisma/
    schema.prisma
    migrations/
    seed.ts
  docker/
    Dockerfile
    docker-compose.yml
  src/
    main.ts
    app.module.ts
    config/                     # env validation (Zod/Joi)
    prisma/                     # PrismaModule / PrismaService
    common/
      constants/
      decorators/               # @CurrentUser @Permissions @Idempotent
      dto/                      # pagination, api response
      filters/
      guards/                   # JwtAuthGuard RolesGuard PermissionsGuard
      interceptors/
      pipes/
      utils/
    modules/
      health/
      auth/                     # register, login, otp, refresh, sessions, 2FA hooks
      users/
      rbac/                     # roles, permissions, assignments
      hotels/                   # groups, properties, staff, content
      onboarding/               # applications, documents, review workflow
      rooms/                    # buildings, floors, room types, physical rooms
      media/                    # uploads metadata + S3 adapter
      audit/
      # later phases:
      rates/
      inventory/
      search/
      reservations/
      payments/
      operations/               # front desk, HK, maintenance
      messaging/
      reviews/
      promotions/
      support/
      reporting/
      platform/                 # super-admin controls
  test/
```

Root monorepo keeps existing `/src` (SPA) and `/server` (legacy Express). New work lives under `/backend`.