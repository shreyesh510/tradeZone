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
  async findAll(@Request() req, @Query('status') status?: string) {
    console.log('🔍 Getting positions for user:', req.user.userId);
    const userId = req.user.userId;
    
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    
    if (status === 'open') {
      return await this.positionsService.getOpenPositions(userId);
    } else if (status === 'closed') {
      return await this.positionsService.getClosedPositions(userId);
    }
    
    const positions = await this.positionsService.findAll(userId);
    console.log(`🔍 Found ${positions.length} positions for user ${userId}`);
    return positions;
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

  @Get('symbol/:symbol')
  async getBySymbol(@Param('symbol') symbol: string, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getBySymbol(userId, symbol);
  }
}
