import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

const countrySchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Algeria' },
    code: { type: 'string', example: 'DZ' },
  },
};

const citySchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 3 },
    name: { type: 'string', example: 'Oran' },
    countryId: { type: 'integer', example: 1 },
  },
};

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List all countries', description: 'Returns all available countries sorted by name.' })
  @ApiResponse({ status: 200, description: 'List of countries', schema: { type: 'array', items: countrySchema } })
  getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('countries/:countryId/cities')
  @ApiOperation({ summary: 'List cities for a country', description: 'Returns the 20 seeded cities for the given country, sorted by name.' })
  @ApiParam({ name: 'countryId', type: 'integer', example: 1 })
  @ApiResponse({ status: 200, description: 'List of cities', schema: { type: 'array', items: citySchema } })
  getCities(@Param('countryId', ParseIntPipe) countryId: number) {
    return this.locationsService.getCitiesByCountry(countryId);
  }
}
