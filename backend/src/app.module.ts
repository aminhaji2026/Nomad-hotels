import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AccessModule } from './modules/access/access.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FrontDeskModule } from './modules/frontdesk/frontdesk.module';
import { HealthModule } from './modules/health/health.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { RatesModule } from './modules/rates/rates.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { SearchModule } from './modules/search/search.module';
import { SupportModule } from './modules/support/support.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
      },
    ]),
    PrismaModule,
    AuditModule,
    AccessModule,
    AvailabilityModule,
    HealthModule,
    AuthModule,
    HotelsModule,
    OnboardingModule,
    RoomsModule,
    RatesModule,
    InventoryModule,
    SearchModule,
    ReservationsModule,
    PaymentsModule,
    FinanceModule,
    FrontDeskModule,
    HousekeepingModule,
    MaintenanceModule,
    MessagingModule,
    NotificationsModule,
    ReviewsModule,
    PromotionsModule,
    SupportModule,
    ReportsModule,
    PlatformModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
