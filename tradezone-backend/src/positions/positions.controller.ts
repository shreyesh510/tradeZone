import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  async create(@Body() createPositionDto: CreatePositionDto, @Request() req) {
    console.log('JWT User object:', req.user);
    const userId = req.user.userId; // Changed from sub to userId based on JWT strategy
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    console.log('Extracted userId from token:', userId);
    return await this.positionsService.create(createPositionDto, userId);
  }
  
  @Post('bulk')
  async createBulk(@Body() createPositionDtos: CreatePositionDto[], @Request() req) {
    console.log('Creating multiple positions:', createPositionDtos.length);
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    return await this.positionsService.createBulk(createPositionDtos, userId);
  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    const userId = req.user.userId;
    
    if (status === 'open') {
      return await this.positionsService.getOpenPositions(userId);
    } else if (status === 'closed') {
      return await this.positionsService.getClosedPositions(userId);
    }
    
    return await this.positionsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updatePositionDto: UpdatePositionDto,
    @Request() req
  ) {
    const userId = req.user.userId;
    return await this.positionsService.update(id, updatePositionDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.positionsService.remove(id, userId);
    return { message: 'Position deleted successfully' };
  }

  @Get('open/list')
  async getOpenPositions(@Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getOpenPositions(userId);
  }

  @Get('closed/list')
  async getClosedPositions(@Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getClosedPositions(userId);
  }
}