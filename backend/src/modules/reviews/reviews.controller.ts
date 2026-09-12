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
import {
  CreateReviewDto,
  HotelReplyDto,
  ModerateReviewDto,
} from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @ApiBearerAuth()
  @Post('reviews')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user, dto).then((d) => ok(d));
  }

  @Public()
  @Get('properties/:propertyId/reviews')
  list(
    @Param('propertyId') propertyId: string,
    @Query('includePending') includePending?: string,
  ) {
    return this.reviews
      .listForProperty(propertyId, includePending === 'true')
      .then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('property:write')
  @Post('reviews/:id/reply')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: HotelReplyDto,
  ) {
    return this.reviews.reply(user, id, dto).then((d) => ok(d));
  }

  @ApiBearerAuth()
  @Permissions('content:moderate')
  @Patch('reviews/:id/moderate')
  moderate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviews.moderate(user, id, dto).then((d) => ok(d));
  }
}
