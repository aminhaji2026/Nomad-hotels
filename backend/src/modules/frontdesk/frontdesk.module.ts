import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { FrontDeskController } from './frontdesk.controller';
import { FrontDeskService } from './frontdesk.service';

@Module({
  imports: [AccessModule, AuditModule],
  controllers: [FrontDeskController],
  providers: [FrontDeskService],
})
export class FrontDeskModule {}
