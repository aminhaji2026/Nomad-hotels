import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { HotelDetailQueryDto, SearchQueryDto } from './dto/search.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get('hotels')
  hotels(@Query() query: SearchQueryDto) {
    return this.search.search(query).then((d) => ok(d.items, d.meta));
  }

  @Public()
  @Get('hotels/:slugOrId')
  details(
    @Param('slugOrId') slugOrId: string,
    @Query() query: HotelDetailQueryDto,
  ) {
    return this.search.hotelDetails(slugOrId, query).then((d) => ok(d));
  }
}
