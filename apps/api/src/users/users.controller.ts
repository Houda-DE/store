import { Controller, Get, Patch, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SellerGuard } from '../common/guards/seller.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateDeliveryCitiesSchema } from '@repo/validation';
import type { UpdateUserInput, UpdateDeliveryCitiesInput } from '@repo/validation';
import { UsersService, PublicUser } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Retrieves the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'abc123def456',
          description: 'User unique identifier',
        },
        email: {
          type: 'string',
          example: 'user@example.com',
          description: 'User email address',
        },
        role: {
          type: 'string',
          enum: ['seller', 'customer'],
          example: 'customer',
        },
        cityId: {
          type: 'integer',
          example: 3,
        },
        isVerified: {
          type: 'boolean',
          example: true,
          description: 'Email verification status',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2023-01-01T00:00:00.000Z',
          description: 'Account creation timestamp',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired token',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
      },
    },
  })
  async getCurrentUser(@CurrentUser() user: CurrentUserType): Promise<PublicUser> {
    return this.usersService.getCurrentUser(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile information of the currently authenticated user.',
  })
  @ApiBody({
    description: 'User profile update data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'newemail@example.com',
          description: 'New email address (optional)',
        },
        cityId: {
          type: 'integer',
          example: 5,
          description: 'New city ID (optional)',
        },
        role: {
          type: 'string',
          enum: ['seller', 'customer'],
          description: 'New role (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'abc123def456',
        },
        email: {
          type: 'string',
          example: 'newemail@example.com',
        },
        role: {
          type: 'string',
          enum: ['seller', 'customer'],
          example: 'customer',
        },
        cityId: { type: 'integer', example: 3 },
        isVerified: {
          type: 'boolean',
          example: true,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Invalid email address'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 409,
    description: 'Email conflict',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email is already taken',
        },
      },
    },
  })
  async updateUser(
    @CurrentUser() user: CurrentUserType,
    @Body(new ZodValidationPipe(UpdateUserSchema)) updateData: UpdateUserInput,
  ): Promise<PublicUser> {
    return this.usersService.updateUser(user.id, updateData);
  }

  @Get('me/delivery-cities')
  @UseGuards(SellerGuard)
  @ApiOperation({
    summary: 'Get seller delivery cities',
    description: 'Returns the cities the authenticated seller currently delivers to.',
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } },
  })
  @ApiResponse({ status: 403, description: 'Sellers only' })
  getDeliveryCities(@CurrentUser() user: CurrentUserType) {
    return this.usersService.getDeliveryCities(user.id);
  }

  @Put('me/delivery-cities')
  @UseGuards(SellerGuard)
  @ApiOperation({
    summary: 'Set seller delivery cities',
    description: 'Sellers only. Replaces the full list of cities the seller delivers to. All cities must be within the seller\'s country.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cityIds'],
      properties: {
        cityIds: {
          type: 'array',
          items: { type: 'integer' },
          example: [1, 3, 7],
          description: 'IDs of cities within the seller\'s country',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { cityIds: { type: 'array', items: { type: 'integer' } } } },
  })
  @ApiResponse({ status: 400, description: 'Invalid city IDs or cities outside seller country' })
  @ApiResponse({ status: 403, description: 'Sellers only' })
  updateDeliveryCities(
    @CurrentUser() user: CurrentUserType,
    @Body(new ZodValidationPipe(UpdateDeliveryCitiesSchema)) body: UpdateDeliveryCitiesInput,
  ) {
    return this.usersService.updateDeliveryCities(user.id, body.cityIds);
  }
}