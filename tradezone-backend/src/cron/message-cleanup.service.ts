import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class MessageCleanupService {
  private readonly logger = new Logger(MessageCleanupService.name);

  constructor(private readonly chatService: ChatService) {}

  @Cron('0 0 0 * * *') // Every 24 hours at midnight
  async handleMessageCleanup() {
    this.logger.log('🕐 Running message cleanup cron job (every 24 hours)...');
    
    try {
      await this.chatService.deleteOldMessages();
      this.logger.log('✅ Message cleanup completed successfully');
    } catch (error) {
      this.logger.error('❌ Message cleanup failed:', error);
    }
  }

  // Optional: Manual cleanup trigger for testing
  async manualCleanup(): Promise<void> {
    this.logger.log('🔧 Manual message cleanup triggered...');
    await this.chatService.deleteOldMessages();
  }

  // Optional: Cleanup with custom time range
  async cleanupMessagesOlderThan(minutes: number): Promise<void> {
    this.logger.log(`🕐 Cleaning up messages older than ${minutes} minutes...`);
    
    try {
      const allMessages = await this.chatService.getAllMessages();
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      const messagesToDelete = allMessages.filter(message => {
        const messageTime = new Date(message.createdAt);
        return messageTime < cutoffTime;
      });

      this.logger.log(`🗑️ Found ${messagesToDelete.length} messages to delete (older than ${minutes} minutes)`);

      for (const message of messagesToDelete) {
        await this.chatService.deleteMessage(message.id);
        this.logger.log(`🗑️ Deleted message: ${message.id} (sent at: ${message.createdAt})`);
      }

      this.logger.log(`✅ Custom cleanup completed. Deleted ${messagesToDelete.length} old messages.`);
    } catch (error) {
      this.logger.error('❌ Error during custom cleanup:', error);
    }
  }
}
