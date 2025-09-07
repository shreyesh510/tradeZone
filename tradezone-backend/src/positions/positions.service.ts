import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { CreatePositionsBulkDto } from './dto/create-positions-bulk.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';
import { MarketDataService } from './market-data.service';

@Injectable()
export class PositionsService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
    private readonly marketData: MarketDataService,
  ) {}

  async create(
    createPositionDto: CreatePositionDto,
    userId: string,
  ): Promise<Position> {
    console.log('🔍 Creating position with data:', createPositionDto);
    console.log('🔍 For user ID:', userId);

    const positionData = {
      ...createPositionDto,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      timestamp: createPositionDto.timestamp || new Date().toISOString(),
    };

    const position =
      await this.firebaseDatabaseService.createPosition(positionData);
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
          console.log(
            `  ${index + 1}. ${pos.symbol} - ${pos.side} - ${pos.lots} lots`,
          );
        });
      }

      return positions;
    } catch (error) {
      console.error('❌ Error in findAll:', error);
      throw error;
    }
  }

  // Helper: pick most recent position per symbol (case-insensitive)
  public uniqueBySymbol(positions: Position[]): Position[] {
    const bySymbol = new Map<string, Position>();
    const toEpoch = (p: Position): number => {
      const t1 = (p as any).createdAt
        ? new Date((p as any).createdAt).getTime()
        : NaN;
      const t2 = (p as any).updatedAt
        ? new Date((p as any).updatedAt).getTime()
        : NaN;
      const t3 = (p as any).timestamp ? Date.parse((p as any).timestamp) : NaN;
      return Math.max(
        Number.isFinite(t1) ? t1 : 0,
        Number.isFinite(t2) ? t2 : 0,
        Number.isFinite(t3) ? t3 : 0,
      );
    };
    for (const p of positions) {
      const key = (p.symbol || '').toUpperCase();
      const existing = bySymbol.get(key);
      if (!existing) {
        bySymbol.set(key, p);
        continue;
      }
      if (toEpoch(p) >= toEpoch(existing)) {
        bySymbol.set(key, p);
      }
    }
    return Array.from(bySymbol.values());
  }

  async findAllUnique(userId: string): Promise<Position[]> {
    const positions = await this.findAll(userId);
    return this.uniqueBySymbol(positions);
  }

  async findOne(id: string, userId: string): Promise<Position> {
    const position = await this.firebaseDatabaseService.getPositionById(id);

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.userId !== userId) {
      throw new ForbiddenException(
        'Unauthorized: Position does not belong to user',
      );
    }

    return position;
  }

  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
    userId: string,
  ): Promise<Position> {
  // First check if position exists and belongs to user
  const existing = await this.findOne(id, userId);

    const updateData = {
      ...updatePositionDto,
      updatedAt: new Date(),
    };

    // Ensure closedAt is set when closing
    if (updateData.status === 'closed' && !(updateData as any).closedAt) {
      (updateData as any).closedAt = new Date();
    }

    await this.firebaseDatabaseService.updatePosition(id, updateData);

    // Return the updated position
    const updated = await this.findOne(id, userId);

    // If we transitioned to closed, create an exit entry
    if (existing.status !== 'closed' && updateData.status === 'closed') {
      const pnlNumber = Number((updatePositionDto as any).pnl) || 0;
      await this.firebaseDatabaseService.createExitEntrySingle({
        userId,
        position: updated,
        pnl: pnlNumber,
        closedAt: (updateData as any).closedAt,
      });
      // Optionally, close any other open legs for the same symbol for this user to keep state consistent
      try {
        await this.firebaseDatabaseService.closeOpenPositionsBySymbolForUser(userId, updated.symbol);
      } catch (e) {
        // non-fatal
      }
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    // First check if position exists and belongs to user
    await this.findOne(id, userId);

    await this.firebaseDatabaseService.deletePosition(id);
  }

  async getOpenPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter((position) => position.status === 'open');
  }

  async getClosedPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter((position) => position.status === 'closed');
  }

  async getBySymbol(userId: string, symbol: string): Promise<Position[]> {
    // Normalize symbol to uppercase to match stored data
    const sym = (symbol || '').toUpperCase();
    return this.firebaseDatabaseService.getPositionsBySymbol(userId, sym);
  }

  // Helper: same calendar day check
  private isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
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

  // Helper: default leverage by symbol for bulk imports
  private getDefaultLeverageForSymbol(symbol: string): number {
    const sym = (symbol || '').toUpperCase();
  const twoHundred = new Set(['BTCUSD', 'ETHUSD']);
  if (twoHundred.has(sym)) return 200;
  // Requirement: all other symbols default to 100x
  return 100;
  }

  // Bulk create with dedupe (userId + symbol + entryPrice + same-day timestamp)
  async createBulk(
    payload: CreatePositionsBulkDto,
    userId: string,
  ): Promise<{
    created: Position[];
    skipped: CreatePositionDto[];
    reason?: string;
  }> {
    const list = (payload.positions || []).map((p) => ({ ...p }));
    if (list.length === 0) return { created: [], skipped: [] };

    // Fetch user positions once for dedupe
    const existing = await this.findAll(userId);

    // Build a set of duplicates for quick lookup
    const keep: Omit<Position, 'id'>[] = [];
    const skipped: CreatePositionDto[] = [];

    for (const p of list) {
      const sym = (p.symbol || '').toUpperCase();
      const ts = this.parseToDate(p.timestamp);
      const match = existing.find((e) => {
        const eTs = this.parseToDate(
          (e as any).timestamp || (e as any).createdAt,
        );
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
        // Enforce leverage for bulk inserts based on symbol
        // BTCUSD/ETHUSD => 200x, all others => 100x
        leverage: this.getDefaultLeverageForSymbol(sym),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    if (keep.length === 0) return { created: [], skipped };

    const created =
      await this.firebaseDatabaseService.createPositionsBatch(keep);
    return { created, skipped };
  }

  // Calculate P&L for a position
  calculatePnL(position: Position): { pnl: number; pnlPercent: number } {
    const current = (position as any).currentPrice ?? position.entryPrice;
    const priceDiff =
      position.side === 'buy'
        ? current - position.entryPrice
        : position.entryPrice - current;

    const pnl = priceDiff * position.lots;
    const pnlPercent = (pnl / position.investedAmount) * 100;

    return { pnl, pnlPercent };
  }

  // Calculate P&L using lot-size qty when known; fallback to notional-based qty.
  private calcPnlWithLive(
    position: Position,
    current: number | null | undefined,
  ) {
    const live =
      typeof current === 'number' && current > 0
        ? current
        : position.entryPrice;
    const priceDiff =
      position.side === 'buy'
        ? live - position.entryPrice
        : position.entryPrice - live;

    const lotSize = this.marketData.getLotSize(position.symbol);
    let qty = 0;
    let investedUsd = position.investedAmount || 0;
    if (lotSize > 0) {
      qty = (position.lots || 0) * lotSize;
      // for percent, approximate invested as entry*qty/leverage if leverage present
      const notionalAtEntry = position.entryPrice * qty;
      const lev = (position as any).leverage || 1;
      investedUsd = lev > 0 ? notionalAtEntry / lev : notionalAtEntry;
    } else {
      const lev = (position as any).leverage || 1;
      const notional = investedUsd * lev;
      qty = position.entryPrice > 0 ? notional / position.entryPrice : 0;
    }

    const pnl = priceDiff * qty;
    const pnlPercent = investedUsd > 0 ? (pnl / investedUsd) * 100 : 0;
    return { pnl, pnlPercent };
  }

  // Aggregated open positions grouped by symbol with live P&L
  async getOpenPositionsAggregated(
    userId: string,
    representative: 'latest' | 'earliest' = 'latest',
  ): Promise<
    Array<{
      id: string;
      userId: string;
      symbol: string;
      side: 'buy' | 'sell';
      lots: number;
      investedAmount: number;
      platform?: string;
      leverage?: number;
      status?: string;
      timestamp?: any;
      createdAt?: any;
      updatedAt?: any;
      pnl: number;
      currentPrice: number | null;
      ids?: string[];
    }>
  > {
    const open = await this.getOpenPositions(userId);
    if (open.length === 0) return [];

    const round = (val: number, decimals = 2) =>
      Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Group by symbol
    const groups = new Map<string, Position[]>();
    for (const p of open) {
      const key = (p.symbol || '').toUpperCase();
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }

    // Fetch live prices in one shot
    const symbols = Array.from(groups.keys());
    const priceMap = await this.marketData.getUsdPricesForSymbols(symbols);

    // Build summary per symbol
    const result: Array<any> = [];

    for (const [sym, arr] of groups.entries()) {
      const totalLots = arr.reduce((s, p) => s + (p.lots || 0), 0);
      // Normalize invested USD: prefer stored investedAmount per leg, fallback to derived
      const invSum =
        arr.reduce((s, p) => {
          const invested = Number(p.investedAmount) || 0;
          if (invested > 0) return s + invested;
        }, 0) || 0;

      const totalInvested = invSum; // Keep as USD, no conversion needed
      // Representative position (latest/earliest by timestamp/created/updated)
      const toEpoch = (p: Position): number => {
        const t1 = (p as any).createdAt
          ? new Date((p as any).createdAt).getTime()
          : NaN;
        const t2 = (p as any).updatedAt
          ? new Date((p as any).updatedAt).getTime()
          : NaN;
        const t3 = (p as any).timestamp
          ? Date.parse((p as any).timestamp)
          : NaN;
        return Math.max(
          Number.isFinite(t1) ? t1 : 0,
          Number.isFinite(t2) ? t2 : 0,
          Number.isFinite(t3) ? t3 : 0,
        );
      };
      const sorted = [...arr].sort((a, b) => toEpoch(a) - toEpoch(b));
      const rep =
        representative === 'earliest' ? sorted[0] : sorted[sorted.length - 1];
      const side = (rep?.side ?? 'buy') as 'buy' | 'sell';

      const live = priceMap[sym];
      // P&L: sum per-leg; prefer qty from invested & leverage when available
      let pnl = 0;
      if (typeof live === 'number' && live > 0) {
        for (const p of arr) {
          if (!p.entryPrice || p.entryPrice <= 0) continue;
          const lev =
            (p as any).leverage && (p as any).leverage > 0
              ? Number((p as any).leverage)
              : this.getDefaultLeverageForSymbol(p.symbol);
          let qty = 0;
          const lotSize = this.marketData.getLotSize(p.symbol) || 0;
          if (lotSize > 0) {
            qty = (p.lots || 0) * lotSize;
          } else {
            // Fallback when lot size is unknown: derive qty from invested and leverage
            const invested = Number(p.investedAmount) || 0;
            qty =
              invested > 0 && p.entryPrice > 0
                ? (invested * lev) / p.entryPrice
                : 0;
          }
          const diff =
            p.side === 'buy' ? live - p.entryPrice : p.entryPrice - live;
          pnl += diff * qty;
        }
      }

      result.push({
        id: (rep as any)?.id,
        userId: (rep as any)?.userId,
        symbol: sym,
        side,
        lots: totalLots,
        investedAmount: round(totalInvested, 2),
        platform: (rep as any)?.platform,
        leverage: (rep as any)?.leverage,
        status: (rep as any)?.status,
        timestamp: (rep as any)?.timestamp,
        createdAt: (rep as any)?.createdAt,
        updatedAt: (rep as any)?.updatedAt,
        pnl: round(pnl, 2),
        currentPrice: typeof live === 'number' ? round(live, 2) : null,
        ids: arr.map((x: any) => x.id).filter(Boolean),
      });
    }

    return result;
  }

  // Consolidated handler for GET /positions with query params
  async findAllByQuery(
    userId: string,
    query: {
      status?: string;
      unique?: string;
      aggregated?: string;
      representative?: 'latest' | 'earliest';
      compact?: string;
    },
  ): Promise<any> {
    const wantUnique = String(query.unique).toLowerCase() === 'true';
    const wantAggregated = String(query.aggregated).toLowerCase() === 'true';
    const rep = query.representative === 'earliest' ? 'earliest' : 'latest';
    const wantCompact = String(query.compact).toLowerCase() === 'true';

    if (query.status === 'open') {
      if (wantAggregated) {
        const data = await this.getOpenPositionsAggregated(userId, rep);
        if (wantCompact) {
          return data.map(({ pnl, currentPrice, ids, ...rest }) => rest);
        }
        return data;
      }
      const list = await this.getOpenPositions(userId);
      return wantUnique ? this.uniqueBySymbol(list) : list;
    } else if (query.status === 'closed') {
      const list = await this.getClosedPositions(userId);
      return wantUnique ? this.uniqueBySymbol(list) : list;
    }

    const positions = wantUnique
      ? await this.findAllUnique(userId)
      : await this.findAll(userId);
    return positions;
  }

  async getAllPositionsWithPnl(userId: string): Promise<
    Array<{
      symbol: string;
      lots: number;
      investedAmount: number;
      side: 'buy' | 'sell';
      pnl: number;
      currentPrice: number | null;
    }>
  > {
    const round = (val: number, decimals = 2) =>
      Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    // 1) Get open positions only
    const openPositions = await this.getOpenPositions(userId);
    if (openPositions.length === 0) return [];

    // 2) Group by symbol
    const groups = new Map<string, Position[]>();
    for (const pos of openPositions) {
      const key = (pos.symbol || '').toUpperCase();
      const arr = groups.get(key) ?? [];
      arr.push(pos);
      groups.set(key, arr);
    }

    // 3) Fetch live prices in one batch
    const symbols = Array.from(groups.keys());
    const priceMap = await this.marketData.getUsdPricesForSymbols(symbols);
    // e.g., { BTCUSD: 10000, ETHUSD: 3200 }

    // 4) Build result per symbol
    const result: Array<any> = [];

    for (const [sym, arr] of groups.entries()) {
      const totalLots = arr.reduce((s, p) => s + (p.lots || 0), 0);
      // Normalize invested USD per leg: prefer stored investedAmount, fallback to derived
      const invSum =
        arr.reduce((s, p) => {
          const invested = Number(p.investedAmount) || 0;
          if (invested > 0) return s + invested;
        }, 0) || 0;

      const totalInvested = invSum; // Keep as USD, no conversion needed

      // Take latest position as reference for side
      const latest = arr[arr.length - 1];
      const side = (latest?.side ?? 'buy') as 'buy' | 'sell';
      const live = priceMap[sym] ?? null;

      // 5) Calculate PnL by summing across all entry legs (respect lot size and leg side)
      let pnlSum = 0;
      if (typeof live === 'number' && live > 0) {
        for (const p of arr) {
          if (!p.entryPrice || p.entryPrice <= 0) continue;
          const lotSize = this.marketData.getLotSize(p.symbol) || 0;
          let qty = 0;
          if (lotSize > 0) {
            qty = (p.lots || 0) * lotSize;
          } else {
            // Fallback: derive qty from invested amount and leverage
            const invested = Number(p.investedAmount) || 0;
            const lev = (p as any).leverage || 1;
            qty = invested > 0 && p.entryPrice > 0 ? (invested * lev) / p.entryPrice : 0;
          }
          const diff =
            p.side === 'buy' ? live - p.entryPrice : p.entryPrice - live;
          pnlSum += diff * qty;
        }
      }

      result.push({
        symbol: sym,
        lots: totalLots,
        investedAmount: round(totalInvested, 2), // now always USD
        side,
        pnl: round(pnlSum, 2),
        currentPrice: round(live ?? 0, 2),
      });
    }

    return result;
  }

  // Close all open positions for the authenticated user
  async closeAllOpenForUser(userId: string, totalPnl?: number): Promise<number> {
    // get symbols before closing
    const open = await this.getOpenPositions(userId);
    const symbols = Array.from(new Set(open.map((p) => (p.symbol || '').toUpperCase())));
    const updatedCount = await this.firebaseDatabaseService.closeAllOpenPositionsForUser(userId);
    if (updatedCount > 0) {
      await this.firebaseDatabaseService.createExitEntryBulk({
        userId,
        symbols,
        totalPnl: Number(totalPnl) || 0,
        positionsBreakdown: symbols.map((s) => ({ symbol: s, pnl: Number(totalPnl) || 0 })),
        closedAt: new Date(),
      });
    }
    return updatedCount;
  }
}
