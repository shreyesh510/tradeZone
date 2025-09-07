import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly svc: WithdrawalsService) {}

  @Get()
  async list(@Request() req) {
    const userId = req.user.userId;
    return await this.svc.list(userId);
  }

  @Post()
  async create(@Body() dto: CreateWithdrawalDto, @Request() req) {
    const userId = req.user.userId;
    return await this.svc.create(userId, dto.amount, dto.method, dto.description);
  }
}
