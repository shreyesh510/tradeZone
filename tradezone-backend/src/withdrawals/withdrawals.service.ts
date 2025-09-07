import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import type { Withdrawal } from './entities/withdrawal.entity';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly db: FirebaseDatabaseService) {}

  async create(userId: string, amount: number, method?: string, description?: string): Promise<Withdrawal> {
    const base = {
      userId,
      amount,
      status: 'pending' as const,
      requestedAt: new Date(),
    } as any;
    if (method !== undefined) base.method = method;
    if (description !== undefined) base.description = description;
    return await this.db.createWithdrawal(base);
  }

  async list(userId: string): Promise<Withdrawal[]> {
    return await this.db.getWithdrawals(userId);
  }
}
