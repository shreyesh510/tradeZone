import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MessageCleanupService } from './message-cleanup.service';
import { CronController } from './cron.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChatModule, // Import ChatModule to access ChatService
  ],
  controllers: [CronController],
  providers: [MessageCleanupService],
  exports: [MessageCleanupService],
})
export class CronModule {}
