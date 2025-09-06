import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';
import { FirebaseDatabaseService } from '../database/firebase-database.service';

@Injectable()
export class PositionsService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(createPositionDto: CreatePositionDto, userId: string): Promise<Position> {
    console.log('Creating position with userId:', userId);
    console.log('CreatePositionDto:', createPositionDto);
    
    if (!userId) {
      throw new Error('UserId is required but was not provided');
    }
    
    const positionData = {
      ...createPositionDto,
      userId: userId, // Explicitly set userId
      status: 'open' as const,
      timestamp: createPositionDto.timestamp || new Date().toLocaleString(),
      // Don't set createdAt and updatedAt here, they're set in the database service
    };

    return await this.firebaseDatabaseService.createPosition(positionData);
  }

  async findAll(userId: string): Promise<Position[]> {
    return await this.firebaseDatabaseService.getPositions(userId);
  }

  async findOne(id: string, userId: string): Promise<Position> {
    const position = await this.firebaseDatabaseService.getPositionById(id);
    
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return position;
  }

  async update(id: string, updatePositionDto: UpdatePositionDto, userId: string): Promise<Position> {
    const existingPosition = await this.findOne(id, userId);
    
    const updateData = {
      ...updatePositionDto,
      updatedAt: new Date(),
    };

    // If closing position, set closedAt
    if (updatePositionDto.status === 'closed' && existingPosition.status === 'open') {
      updateData.closedAt = new Date();
    }

    await this.firebaseDatabaseService.updatePosition(id, updateData);
    
    return await this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // This will throw if not found or not authorized
    await this.firebaseDatabaseService.deletePosition(id);
  }

  async getOpenPositions(userId: string): Promise<Position[]> {
    return await this.firebaseDatabaseService.getOpenPositions(userId);
  }

  async getClosedPositions(userId: string): Promise<Position[]> {
    return await this.firebaseDatabaseService.getClosedPositions(userId);
  }

  async calculatePnL(position: Position, currentPrice: number): Promise<{ pnl: number; pnlPercentage: number }> {
    const { side, lots, entryPrice } = position;
    
    let pnl: number;
    if (side === 'buy') {
      pnl = (currentPrice - entryPrice) * lots;
    } else {
      pnl = (entryPrice - currentPrice) * lots;
    }
    
    const pnlPercentage = (pnl / (entryPrice * lots)) * 100;
    
    return { pnl, pnlPercentage };
  }
}