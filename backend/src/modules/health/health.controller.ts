import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'nomadstay-api',
      time: new Date().toISOString(),
    };
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'live' };
  }

  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }
}
