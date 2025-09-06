import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { CreatePositionsBulkDto } from './dto/create-positions-bulk.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';

@Injectable()
export class PositionsService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService
  ) {}

  async create(createPositionDto: CreatePositionDto, userId: string): Promise<Position> {
    console.log('🔍 Creating position with data:', createPositionDto);
    console.log('🔍 For user ID:', userId);
    
    const positionData = {
      ...createPositionDto,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      timestamp: createPositionDto.timestamp || new Date().toISOString()
    };

    const position = await this.firebaseDatabaseService.createPosition(positionData);
    console.log('✅ Position created successfully:', position.id);
    return position;
  }

  async findAll(userId: string): Promise<Position[]> {
    console.log('🔍 Finding all positions for user:', userId);
    
    try {
      const positions = await this.firebaseDatabaseService.getPositions(userId);
      console.log(`📊 Found ${positions.length} positions for user ${userId}`);
      
      // Log first few positions for debugging
      if (positions.length > 0) {
        console.log('📄 Sample positions:');
        positions.slice(0, 3).forEach((pos, index) => {
          console.log(`  ${index + 1}. ${pos.symbol} - ${pos.side} - ${pos.lots} lots`);
        });
      }
      
      return positions;
    } catch (error) {
      console.error('❌ Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<Position> {
    const position = await this.firebaseDatabaseService.getPositionById(id);
    
    if (!position) {
      throw new Error('Position not found');
    }
    
    if (position.userId !== userId) {
      throw new Error('Unauthorized: Position does not belong to user');
    }
    
    return position;
  }

  async update(id: string, updatePositionDto: UpdatePositionDto, userId: string): Promise<Position> {
    // First check if position exists and belongs to user
    await this.findOne(id, userId);
    
    const updateData = {
      ...updatePositionDto,
      updatedAt: new Date()
    };
    
    await this.firebaseDatabaseService.updatePosition(id, updateData);
    
    // Return the updated position
    return await this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    // First check if position exists and belongs to user
    await this.findOne(id, userId);
    
    await this.firebaseDatabaseService.deletePosition(id);
  }

  async getOpenPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter(position => position.status === 'open');
  }

  async getClosedPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter(position => position.status === 'closed');
  }

  async getBySymbol(userId: string, symbol: string): Promise<Position[]> {
    // Normalize symbol to uppercase to match stored data
    const sym = (symbol || '').toUpperCase();
    return this.firebaseDatabaseService.getPositionsBySymbol(userId, sym);
  }

  // Helper: same calendar day check
  private isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Helper: parse various timestamp formats to a Date. Falls back to today if invalid.
  private parseToDate(value?: string | Date): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    // Fast-path ISO
    const iso = Date.parse(value);
    if (!Number.isNaN(iso)) return new Date(iso);
    // Handle Delta CSV like: "2025-09-05 20:27:42.507554+05:30 IST Asia/Kolkata"
    // Extract the YYYY-MM-DD part and construct a date in local time.
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      // Create date at midnight local time for date-only comparison
      const [y, m, d] = match[1].split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }
    // Last resort: now
    return new Date();
  }

  // Bulk create with dedupe (userId + symbol + entryPrice + same-day timestamp)
  async createBulk(payload: CreatePositionsBulkDto, userId: string): Promise<{ created: Position[]; skipped: CreatePositionDto[]; reason?: string }> {
    const list = (payload.positions || []).map(p => ({ ...p }));
    if (list.length === 0) return { created: [], skipped: [] };

    // Fetch user positions once for dedupe
    const existing = await this.findAll(userId);

    // Build a set of duplicates for quick lookup
    const keep: Omit<Position, 'id'>[] = [];
    const skipped: CreatePositionDto[] = [];

    for (const p of list) {
      const sym = (p.symbol || '').toUpperCase();
      const ts = this.parseToDate(p.timestamp);
      const match = existing.find(e => {
        const eTs = this.parseToDate((e as any).timestamp || (e as any).createdAt);
        return (
          e.userId === userId &&
          (e.symbol || '').toUpperCase() === sym &&
          Number(e.entryPrice) === Number(p.entryPrice) &&
          this.isSameDay(eTs, ts)
        );
      });

      if (match) {
        skipped.push(p);
        continue;
      }

      keep.push({
        ...p,
        userId,
        status: 'open',
        timestamp: p.timestamp ?? new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    if (keep.length === 0) return { created: [], skipped };

    const created = await this.firebaseDatabaseService.createPositionsBatch(keep);
    return { created, skipped };
  }

  // Calculate P&L for a position
  calculatePnL(position: Position): { pnl: number; pnlPercent: number } {
    const priceDiff = position.side === 'buy' 
      ? position.currentPrice - position.entryPrice
      : position.entryPrice - position.currentPrice;
    
    const pnl = priceDiff * position.lots;
    const pnlPercent = (pnl / position.investedAmount) * 100;
    
    return { pnl, pnlPercent };
  }
}
