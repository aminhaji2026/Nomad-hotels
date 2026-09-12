import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';

@Module({
  imports: [AccessModule, AuditModule],
  controllers: [RatesController],
  providers: [RatesService],
  exports: [RatesService],
})
export class RatesModule {}
