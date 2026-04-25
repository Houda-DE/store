import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Get or create a conversation about an item' })
  getOrCreate(
    @Body() body: { sellerId: string; itemId: number },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.chatService.getOrCreateConversation(user.id, body.sellerId, body.itemId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the current user' })
  list(@CurrentUser() user: CurrentUserType) {
    return this.chatService.listConversations(user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  messages(
    @Param('id', ParseIntPipe) id: number,
    @Query('before', new ParseIntPipe({ optional: true })) before: number | undefined,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.chatService.getMessages(id, user.id, before);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Total unread message count for the navbar badge' })
  async unread(@CurrentUser() user: CurrentUserType) {
    const count = await this.chatService.getTotalUnread(user.id);
    return { count };
  }
}
