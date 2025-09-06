import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreatePositionDto } from './dto/create-position.dto';
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
