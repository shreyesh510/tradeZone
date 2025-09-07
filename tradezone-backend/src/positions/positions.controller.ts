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
  Query,
  Header
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { CreatePositionsBulkDto } from './dto/create-positions-bulk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  async create(@Body() createPositionDto: CreatePositionDto, @Request() req) {
    console.log('🔍 Creating position for user:', req.user.userId);
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    return await this.positionsService.create(createPositionDto, userId);
  }

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('unique') unique?: string,
  @Query('aggregated') aggregated?: string,
  @Query('representative') representative?: 'latest' | 'earliest',
  @Query('compact') compact?: string,
  ) {
    console.log('🔍 Getting positions for user:', req.user.userId);
    const userId = req.user.userId;
    
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }

    const result = await this.positionsService.findAllByQuery(userId, {
      status,
      unique,
      aggregated,
      representative,
      compact,
    });
    if (Array.isArray(result)) {
      console.log(`🔍 Found ${result.length} positions for user ${userId}`);
    }
    return result;
  }

  // Static and specific routes must come before dynamic ':id' to avoid being captured by it
  @Get('getAllPositionsWithPnl')
  async getAll(@Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getAllPositionsWithPnl(userId);
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

  @Get('symbol/:symbol')
  async getBySymbol(@Param('symbol') symbol: string, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getBySymbol(userId, symbol);
  }

  @Post('multiple')
  async createMultiple(@Body() dto: CreatePositionsBulkDto, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.createBulk(dto, userId);
  }

  @Post('close-all')
  async closeAll(@Request() req, @Body('pnl') pnl?: number) {
    const userId = req.user.userId;
    const result = await this.positionsService.closeAllOpenForUser(userId, pnl);
    return { updated: result };
  }

  // Generic ID-based routes last
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
}
