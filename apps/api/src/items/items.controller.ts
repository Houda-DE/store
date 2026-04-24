import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SellerGuard } from '../common/guards/seller.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { CreateItemSchema, UpdateItemSchema } from '@repo/validation';

const itemSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    sellerId: { type: 'string', example: 'abc123' },
    name: { type: 'string', example: 'Vintage lamp' },
    description: { type: 'string', example: 'Beautiful vintage lamp in great condition' },
    price: { type: 'string', example: '2500.00', description: 'Price in local currency' },
    imageUrl: { type: 'string', example: 'https://pub-xxx.r2.dev/items/abc.jpg' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const itemWithCitiesSchema = {
  ...itemSchema,
  properties: {
    ...itemSchema.properties,
    deliveryCities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 3 },
          name: { type: 'string', example: 'Oran' },
        },
      },
    },
  },
};

const multipartItemBody = {
  schema: {
    type: 'object' as const,
    required: ['image', 'name', 'description', 'price', 'deliveryCityIds'],
    properties: {
      image: { type: 'string' as const, format: 'binary', description: 'Item image (jpeg/png/webp/gif, max 5 MB)' },
      name: { type: 'string' as const, example: 'Vintage lamp' },
      description: { type: 'string' as const, example: 'Beautiful vintage lamp in great condition' },
      price: { type: 'number' as const, example: 2500 },
      deliveryCityIds: { type: 'string' as const, example: '[1,3,7]', description: 'JSON array of city IDs within your country' },
    },
  },
};

const imageInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SellerGuard)
  @UseInterceptors(imageInterceptor)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new item', description: 'Sellers only. Uploads the image to Cloudflare R2 and creates the listing.' })
  @ApiBody(multipartItemBody)
  @ApiResponse({ status: 201, description: 'Item created', schema: itemWithCitiesSchema })
  @ApiResponse({ status: 400, description: 'Validation error or missing image' })
  @ApiResponse({ status: 403, description: 'Only sellers can create items' })
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!file) throw new BadRequestException('Image is required');
    const input = CreateItemSchema.parse(body);
    return this.itemsService.create(user, input, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all items', description: 'Public paginated feed of all marketplace listings.' })
  @ApiQuery({ name: 'page', required: false, type: 'integer', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'integer', example: 20, description: 'Max 100' })
  @ApiResponse({ status: 200, description: 'Paginated list of items', schema: { type: 'array', items: itemSchema } })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.itemsService.findAll(page, Math.min(limit, 100));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single item', description: 'Returns item details including all delivery cities.' })
  @ApiParam({ name: 'id', type: 'integer', example: 1 })
  @ApiResponse({ status: 200, description: 'Item details', schema: itemWithCitiesSchema })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @UseInterceptors(imageInterceptor)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an item', description: 'Sellers only. All fields optional. Providing a new image replaces the old one.' })
  @ApiParam({ name: 'id', type: 'integer', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary', description: 'New image (optional)' },
        name: { type: 'string', example: 'Updated lamp' },
        description: { type: 'string' },
        price: { type: 'number', example: 1999 },
        deliveryCityIds: { type: 'string', example: '[1,3]', description: 'JSON array of city IDs' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated item', schema: itemWithCitiesSchema })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: CurrentUserType,
  ) {
    const input = UpdateItemSchema.parse(body);
    return this.itemsService.update(user.id, id, input, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an item', description: 'Sellers only. Permanently deletes the item and its delivery city associations.' })
  @ApiParam({ name: 'id', type: 'integer', example: 1 })
  @ApiResponse({ status: 200, description: 'Item deleted', schema: { type: 'object', properties: { message: { type: 'string', example: 'Item deleted' } } } })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.itemsService.remove(user.id, id);
  }
}
