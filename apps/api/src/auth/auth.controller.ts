import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RegisterSchema, LoginSchema } from '@repo/validation';
import type { RegisterInput, LoginInput } from '@repo/validation';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account and sends an email verification link. The user must verify their email before being able to log in.',
  })
  @ApiBody({
    description: 'User registration data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'Valid email address',
        },
        password: {
          type: 'string',
          minLength: 8,
          example: 'securePassword123',
          description: 'Password must be at least 8 characters',
        },
        cityId: {
          type: 'integer',
          example: 3,
          description: 'ID of the city the user lives in (from /locations/countries/:id/cities)',
        },
        role: {
          type: 'string',
          enum: ['seller', 'customer'],
          example: 'customer',
        },
      },
      required: ['email', 'password', 'cityId', 'role'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Registration successful. Please check your email to verify your account.',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User with this email already exists',
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
          example: [
            'Invalid email address',
            'Password must be at least 8 characters',
          ],
        },
      },
    },
  })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates a user and returns an access token. Email must be verified before login is allowed.',
  })
  @ApiBody({
    description: 'User login credentials',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
        password: {
          type: 'string',
          example: 'securePassword123',
        },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT access token',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'abc123def456' },
            email: { type: 'string', example: 'user@example.com' },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: {
            invalidCredentials: { value: 'Invalid email or password' },
            unverifiedEmail: {
              value: 'Please verify your email before logging in',
            },
          },
        },
      },
    },
  })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verifies a user email address using the token sent via email during registration.',
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token received via email',
    type: 'string',
    example: 'a1b2c3d4e5f6789...',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email verified successfully. You can now log in.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: {
            missingToken: { value: 'Verification token is required' },
            expiredToken: { value: 'Verification token has expired' },
            alreadyVerified: { value: 'Email is already verified' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired verification token',
        },
      },
    },
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
