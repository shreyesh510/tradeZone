import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateTradePnLDto } from './dto/create-trade-pnl.dto';
import { UpdateTradePnLDto } from './dto/update-trade-pnl.dto';

export interface TradePnL {
  id: string;
  date: string;
  profit: number;
  loss: number;
  netPnL: number;
  notes?: string;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TradePnLService {
  constructor(private readonly firebaseDatabaseService: FirebaseDatabaseService) {}

  async create(createTradePnLDto: CreateTradePnLDto, userId: string): Promise<TradePnL> {
    const data = {
      ...createTradePnLDto,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.firebaseDatabaseService.createTradePnL(data);
  }

  async findAll(userId: string): Promise<TradePnL[]> {
    return await this.firebaseDatabaseService.getTradePnL(userId);
  }

  async findOne(id: string, userId: string): Promise<TradePnL> {
    const item = await this.firebaseDatabaseService.getTradePnLById(userId, id);
    if (!item) {
      throw new NotFoundException(`TradeP&L with ID ${id} not found`);
    }
    return item;
  }

  async findByDate(date: string, userId: string): Promise<TradePnL | null> {
    const items = await this.firebaseDatabaseService.getTradePnL(userId);
    return items.find(item => item.date === date) || null;
  }

  async update(id: string, updateTradePnLDto: UpdateTradePnLDto, userId: string): Promise<TradePnL> {
    const existing = await this.findOne(id, userId);
    
    const success = await this.firebaseDatabaseService.updateTradePnL(userId, id, updateTradePnLDto);
    if (!success) {
      throw new NotFoundException(`TradeP&L with ID ${id} not found or access denied`);
    }
    
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const success = await this.firebaseDatabaseService.deleteTradePnL(userId, id);
    if (!success) {
      throw new NotFoundException(`TradeP&L with ID ${id} not found or access denied`);
    }
  }

  async getStatistics(userId: string, days: number = 30): Promise<any> {
    const items = await this.findAll(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentItems = items.filter(item => 
      new Date(item.date) >= cutoffDate
    );

    const totalProfit = recentItems.reduce((sum, item) => sum + item.profit, 0);
    const totalLoss = recentItems.reduce((sum, item) => sum + item.loss, 0);
    const netPnL = recentItems.reduce((sum, item) => sum + item.netPnL, 0);
    const totalTrades = recentItems.reduce((sum, item) => sum + (item.totalTrades || 0), 0);
    const winningTrades = recentItems.reduce((sum, item) => sum + (item.winningTrades || 0), 0);
    const losingTrades = recentItems.reduce((sum, item) => sum + (item.losingTrades || 0), 0);

    return {
      period: `${days} days`,
      totalProfit,
      totalLoss,
      netPnL,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(2) + '%' : '0%',
      averageDailyPnL: recentItems.length > 0 ? (netPnL / recentItems.length).toFixed(2) : 0,
      daysTraded: recentItems.length,
    };
  }
}