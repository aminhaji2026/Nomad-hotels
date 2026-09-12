import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  Permissions,
  Public,
} from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { CreatePromotionDto, ValidatePromoDto } from './dto/promotions.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions')
@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @ApiBearerAuth()
  @Permissions('promo:manage')
  @Post('promotions')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePromotionDto) {
    return this.promotions.create(user, dto).then((d) => ok(d));
  }

  @Public()
  @Get('promotions')
  list(@Query('all') all?: string) {
    return this.promotions.list(all !== 'true').then((d) => ok(d));
  }

  @Public()
  @Post('promotions/validate')
  validate(@Body() dto: ValidatePromoDto) {
    return this.promotions.validate(dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('promo:manage')
  @Patch('promotions/:id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.promotions.deactivate(user, id).then((d) => ok(d));
  }
}
