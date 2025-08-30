import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageCleanupService } from './message-cleanup.service';

@Controller('cron')
@UseGuards(JwtAuthGuard)
export class CronController {
  constructor(private readonly messageCleanupService: MessageCleanupService) {}

  @Post('cleanup-messages')
  async manualMessageCleanup() {
    await this.messageCleanupService.manualCleanup();
    return { 
      success: true, 
      message: 'Message cleanup triggered successfully' 
    };
  }

  @Post('cleanup-messages-custom')
  async customMessageCleanup(@Query('minutes') minutes: string = '1') {
    const minutesNumber = parseInt(minutes, 10);
    if (isNaN(minutesNumber) || minutesNumber < 1) {
      return { 
        success: false, 
        message: 'Invalid minutes parameter. Must be a positive number.' 
      };
    }

    await this.messageCleanupService.cleanupMessagesOlderThan(minutesNumber);
    return { 
      success: true, 
      message: `Message cleanup triggered for messages older than ${minutesNumber} minutes` 
    };
  }
}
