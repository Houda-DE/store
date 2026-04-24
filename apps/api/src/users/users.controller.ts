import { Controller, Get, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema } from '@repo/validation';
import type { UpdateUserInput } from '@repo/validation';
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
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  async updateUser(
    @CurrentUser() user: CurrentUserType,
    @Body() updateData: UpdateUserInput,
  ): Promise<PublicUser> {
    return this.usersService.updateUser(user.id, updateData);
  }
}