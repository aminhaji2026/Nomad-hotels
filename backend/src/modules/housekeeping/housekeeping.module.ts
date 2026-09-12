import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';

@Module({
  imports: [AccessModule, AuditModule],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
})
export class HousekeepingModule {}
