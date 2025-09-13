import { Injectable } from '@nestjs/common';
import { PositionsService } from '../positions/positions.service';
import { WalletsService } from '../wallets/wallets.service';
import { DepositsService } from '../deposits/deposits.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { TradePnLService } from '../trade-pnl/trade-pnl.service';

export interface DashboardSummary {
  positions: {
    totalPositions: number;
    totalInvested: number;
    totalPnL: number;
  };
  wallets: {
    dematWallet: {
      balance: number;
      currency: string;
      count: number;
    };
    bankWallet: {
      balance: number;
      currency: string;
      count: number;
    };
    recentActivity: any[];
  };
  transactions: {
    deposits: {
      list: any[];
      total: number;
      pending: number;
      completed: number;
      recentActivity: any[];
      chartData: {
        weekly: any[];
        monthly: any[];
        yearly: any[];
      };
    };
    withdrawals: {
      list: any[];
      total: number;
      pending: number;
      completed: number;
      recentActivity: any[];
      chartData: {
        weekly: any[];
        monthly: any[];
        yearly: any[];
      };
    };
  };
  tradePnL: {
    today: {
      profit: number;
      loss: number;
      netPnL: number;
      trades: number;
    };
    recent: any[];
    statistics: any;
    chartData: {
      weekly: any[];
      monthly: any[];
      yearly: any[];
    };
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly positionsService: PositionsService,
    private readonly walletsService: WalletsService,
    private readonly depositsService: DepositsService,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly tradePnLService: TradePnLService,
  ) {}

  async getDashboardSummary(
    userId: string,
    days: number = 30,
  ): Promise<DashboardSummary> {
    try {
      // Fetch all data in parallel for better performance with error handling
      const [
        openPositions,
        allPositions,
        wallets,
        deposits,
        withdrawals,
        recentTradePnL,
        tradePnLStats,
        walletHistory,
        allTradePnL,
      ] = await Promise.allSettled([
        this.positionsService.getOpenPositionsAggregated(userId),
        this.positionsService.findAll(userId),
        this.walletsService.list(userId),
        this.depositsService.list(userId),
        this.withdrawalsService.list(userId),
        this.tradePnLService.findAll(userId, days),
        this.tradePnLService.getStatistics(userId, days),
        this.walletsService.history(userId, 10), // Get recent 10 wallet activities
        this.tradePnLService.findAll(userId), // Get all trade PnL data for chart processing
      ]);

      // Extract data with fallbacks for failed promises
      const safeOpenPositions =
        openPositions.status === 'fulfilled' ? openPositions.value : [];
      const safeAllPositions =
        allPositions.status === 'fulfilled' ? allPositions.value : [];
      const safeWallets = wallets.status === 'fulfilled' ? wallets.value : [];
      const safeDeposits =
        deposits.status === 'fulfilled' ? deposits.value : [];
      const safeWithdrawals =
        withdrawals.status === 'fulfilled' ? withdrawals.value : [];
      const safeRecentTradePnL =
        recentTradePnL.status === 'fulfilled' ? recentTradePnL.value : [];
      const safeTradePnLStats =
        tradePnLStats.status === 'fulfilled' ? tradePnLStats.value : null;
      const safeWalletHistory =
        walletHistory.status === 'fulfilled' ? walletHistory.value : [];
      const safeAllTradePnL =
        allTradePnL.status === 'fulfilled' ? allTradePnL.value : [];

      // Process positions data
      const totalPnL = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.pnl || 0),
        0,
      );
      const totalInvested = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.investedAmount || 0),
        0,
      );

      // Process wallets data - separate by platform type
      const dematWallets = safeWallets.filter(
        (w) => w.platform === 'Delta Exchange' || w.platform === 'Groww',
      );
      const bankWallets = safeWallets.filter(
        (w) =>
          w.platform === 'Bank' ||
          w.platform === 'bank' ||
          !w.platform ||
          w.platform === 'Unknown',
      );

      // Calculate demat balance in USD (assuming conversion rate if needed)
      const dematBalanceUSD = dematWallets.reduce((sum, wallet) => {
        const balance = wallet.balance || 0;
        // If wallet currency is INR, convert to USD (approximate rate: 1 USD = 83 INR)
        return wallet.currency === 'INR' ? sum + balance / 83 : sum + balance;
      }, 0);

      // Bank balance in INR
      const bankBalanceINR = bankWallets.reduce(
        (sum, wallet) => sum + (wallet.balance || 0),
        0,
      );

      // Process deposits data
      const depositTotal = safeDeposits.reduce(
        (sum, deposit) => sum + (deposit.amount || 0),
        0,
      );
      const pendingDeposits = safeDeposits.filter(
        (d) => d.status === 'pending',
      ).length;
      const completedDeposits = safeDeposits.filter(
        (d) => d.status === 'completed',
      ).length;

      // Process withdrawals data
      const withdrawalTotal = safeWithdrawals.reduce(
        (sum, withdrawal) => sum + (withdrawal.amount || 0),
        0,
      );
      const pendingWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'pending',
      ).length;
      const completedWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'completed',
      ).length;

      // Process total trade PnL from statistics
      const totalData = {
        profit: safeTradePnLStats?.totalProfit || 0,
        loss: safeTradePnLStats?.totalLoss || 0,
        netPnL: safeTradePnLStats?.netPnL || 0,
        trades: safeTradePnLStats?.totalTrades || 0,
      };

      // Process chart data
      const chartData = this.processChartData(safeAllTradePnL);

      // Process withdrawals chart data
      const withdrawalChartData =
        this.processWithdrawalChartData(safeWithdrawals);

      // Get recent withdrawal activity (last 10)
      const recentWithdrawals = safeWithdrawals
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      // Process deposits chart data
      const depositChartData = this.processDepositChartData(safeDeposits);

      // Get recent deposit activity (last 10)
      const recentDeposits = safeDeposits
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      return {
        positions: {
          totalPositions: safeAllPositions.length,
          totalInvested,
          totalPnL,
        },
        wallets: {
          dematWallet: {
            balance: dematBalanceUSD,
            currency: 'USD',
            count: dematWallets.length,
          },
          bankWallet: {
            balance: bankBalanceINR,
            currency: 'INR',
            count: bankWallets.length,
          },
          recentActivity: safeWalletHistory,
        },
        transactions: {
          deposits: {
            list: safeDeposits,
            total: depositTotal,
            pending: pendingDeposits,
            completed: completedDeposits,
            recentActivity: recentDeposits,
            chartData: depositChartData,
          },
          withdrawals: {
            list: safeWithdrawals,
            total: withdrawalTotal,
            pending: pendingWithdrawals,
            completed: completedWithdrawals,
            recentActivity: recentWithdrawals,
            chartData: withdrawalChartData,
          },
        },
        tradePnL: {
          total: totalData,
          recent: safeRecentTradePnL,
          statistics: safeTradePnLStats,
          chartData,
        },
      };
    } catch (error) {
      console.error('Error in getDashboardSummary:', error);
      // Return safe fallback data instead of throwing
      return {
        positions: {
          totalPositions: 0,
          totalInvested: 0,
          totalPnL: 0,
        },
        wallets: {
          dematWallet: {
            balance: 0,
            currency: 'USD',
            count: 0,
          },
          bankWallet: {
            balance: 0,
            currency: 'INR',
            count: 0,
          },
          recentActivity: [],
        },
        transactions: {
          deposits: {
            list: [],
            total: 0,
            pending: 0,
            completed: 0,
            recentActivity: [],
            chartData: { weekly: [], monthly: [], yearly: [] },
          },
          withdrawals: {
            list: [],
            total: 0,
            pending: 0,
            completed: 0,
            recentActivity: [],
            chartData: { weekly: [], monthly: [], yearly: [] },
          },
        },
        tradePnL: {
          total: {
            profit: 0,
            loss: 0,
            netPnL: 0,
            trades: 0,
          },
          recent: [],
          statistics: null,
          chartData: { weekly: [], monthly: [], yearly: [] },
        },
      };
    }
  }

  private processChartData(allTradePnL: any[]): {
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const weekly = this.aggregateByWeek(allTradePnL);
    const monthly = this.aggregateByMonth(allTradePnL);
    const yearly = this.aggregateByYear(allTradePnL);

    return { weekly, monthly, yearly };
  }

  private aggregateByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      if (!item.date) return; // Skip items without dates
      try {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates
        const week = this.getWeekKey(date);

        if (!weekMap.has(week)) {
          weekMap.set(week, {
            period: week,
            profit: 0,
            loss: 0,
            netPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
          });
        }

        const weekData = weekMap.get(week)!;
        weekData.profit += item.profit || 0;
        weekData.loss += item.loss || 0;
        weekData.netPnL += item.netPnL || 0;
        weekData.totalTrades += item.totalTrades || 0;
        weekData.winningTrades += item.winningTrades || 0;
        weekData.losingTrades += item.losingTrades || 0;
      } catch (e) {
        // Skip items with invalid dates
        return;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          profit: 0,
          loss: 0,
          netPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.profit += item.profit || 0;
      monthData.loss += item.loss || 0;
      monthData.netPnL += item.netPnL || 0;
      monthData.totalTrades += item.totalTrades || 0;
      monthData.winningTrades += item.winningTrades || 0;
      monthData.losingTrades += item.losingTrades || 0;
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.date);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          profit: 0,
          loss: 0,
          netPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.profit += item.profit || 0;
      yearData.loss += item.loss || 0;
      yearData.netPnL += item.netPnL || 0;
      yearData.totalTrades += item.totalTrades || 0;
      yearData.winningTrades += item.winningTrades || 0;
      yearData.losingTrades += item.losingTrades || 0;
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private processWithdrawalChartData(withdrawals: any[]): {
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const weekly = this.aggregateWithdrawalsByWeek(withdrawals);
    const monthly = this.aggregateWithdrawalsByMonth(withdrawals);
    const yearly = this.aggregateWithdrawalsByYear(withdrawals);

    return { weekly, monthly, yearly };
  }

  private aggregateWithdrawalsByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const week = this.getWeekKey(date);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          period: week,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalAmount += item.amount || 0;
      weekData.count += 1;

      if (item.status === 'pending') {
        weekData.pendingAmount += item.amount || 0;
        weekData.pendingCount += 1;
      } else if (item.status === 'completed') {
        weekData.completedAmount += item.amount || 0;
        weekData.completedCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateWithdrawalsByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.totalAmount += item.amount || 0;
      monthData.count += 1;

      if (item.status === 'pending') {
        monthData.pendingAmount += item.amount || 0;
        monthData.pendingCount += 1;
      } else if (item.status === 'completed') {
        monthData.completedAmount += item.amount || 0;
        monthData.completedCount += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateWithdrawalsByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalAmount += item.amount || 0;
      yearData.count += 1;

      if (item.status === 'pending') {
        yearData.pendingAmount += item.amount || 0;
        yearData.pendingCount += 1;
      } else if (item.status === 'completed') {
        yearData.completedAmount += item.amount || 0;
        yearData.completedCount += 1;
      }
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private processDepositChartData(deposits: any[]): {
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const weekly = this.aggregateDepositsByWeek(deposits);
    const monthly = this.aggregateDepositsByMonth(deposits);
    const yearly = this.aggregateDepositsByYear(deposits);

    return { weekly, monthly, yearly };
  }

  private aggregateDepositsByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const week = this.getWeekKey(date);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          period: week,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalAmount += item.amount || 0;
      weekData.count += 1;

      if (item.status === 'pending') {
        weekData.pendingAmount += item.amount || 0;
        weekData.pendingCount += 1;
      } else if (item.status === 'completed') {
        weekData.completedAmount += item.amount || 0;
        weekData.completedCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateDepositsByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.totalAmount += item.amount || 0;
      monthData.count += 1;

      if (item.status === 'pending') {
        monthData.pendingAmount += item.amount || 0;
        monthData.pendingCount += 1;
      } else if (item.status === 'completed') {
        monthData.completedAmount += item.amount || 0;
        monthData.completedCount += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateDepositsByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalAmount += item.amount || 0;
      yearData.count += 1;

      if (item.status === 'pending') {
        yearData.pendingAmount += item.amount || 0;
        yearData.pendingCount += 1;
      } else if (item.status === 'completed') {
        yearData.completedAmount += item.amount || 0;
        yearData.completedCount += 1;
      }
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  // New separate API methods
  async getPositionsData(userId: string, timeframe: string) {
    try {
      const [openPositions, allPositions] = await Promise.allSettled([
        this.positionsService.getOpenPositionsAggregated(userId),
        this.positionsService.findAll(userId),
      ]);

      const safeOpenPositions =
        openPositions.status === 'fulfilled' ? openPositions.value : [];
      const safeAllPositions =
        allPositions.status === 'fulfilled' ? allPositions.value : [];

      // Calculate summary data
      const totalPnL = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.pnl || 0),
        0,
      );
      const totalInvested = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.investedAmount || 0),
        0,
      );

      // Generate chart data based on positions (mock for now)
      const chartData = this.generatePositionsChartData(
        safeAllPositions,
        timeframe,
      );

      return {
        summary: {
          totalPositions: safeAllPositions.length,
          totalInvested,
          totalPnL,
        },
        chartData,
        performance: {
          dayChange: totalPnL * 0.1, // Mock calculation
          percentChange:
            totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Error in getPositionsData:', error);
      return {
        summary: { totalPositions: 0, totalInvested: 0, totalPnL: 0 },
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        performance: { dayChange: 0, percentChange: 0 },
      };
    }
  }

  async getWalletsData(userId: string, timeframe: string) {
    try {
      const [wallets, walletHistory] = await Promise.allSettled([
        this.walletsService.list(userId),
        this.walletsService.history(userId, this.getHistoryLimit(timeframe)),
      ]);

      const safeWallets = wallets.status === 'fulfilled' ? wallets.value : [];
      const safeWalletHistory =
        walletHistory.status === 'fulfilled' ? walletHistory.value : [];

      // Process wallets data - separate by platform type
      const dematWallets = safeWallets.filter(
        (w) => w.platform === 'Delta Exchange' || w.platform === 'Groww',
      );
      const bankWallets = safeWallets.filter(
        (w) =>
          w.platform === 'Bank' ||
          w.platform === 'bank' ||
          !w.platform ||
          w.platform === 'Unknown',
      );

      // Calculate balances
      const dematBalanceUSD = dematWallets.reduce((sum, wallet) => {
        const balance = wallet.balance || 0;
        return wallet.currency === 'INR' ? sum + balance / 83 : sum + balance;
      }, 0);

      const bankBalanceINR = bankWallets.reduce(
        (sum, wallet) => sum + (wallet.balance || 0),
        0,
      );

      // Generate chart data from wallet history
      const chartData = this.generateWalletChartData(
        safeWalletHistory,
        timeframe,
      );

      return {
        summary: {
          dematWallet: {
            balance: dematBalanceUSD,
            currency: 'USD',
            count: dematWallets.length,
          },
          bankWallet: {
            balance: bankBalanceINR,
            currency: 'INR',
            count: bankWallets.length,
          },
        },
        chartData,
        recentActivity: safeWalletHistory.slice(0, 10),
      };
    } catch (error) {
      console.error('Error in getWalletsData:', error);
      return {
        summary: {
          dematWallet: { balance: 0, currency: 'USD', count: 0 },
          bankWallet: { balance: 0, currency: 'INR', count: 0 },
        },
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        recentActivity: [],
      };
    }
  }

  async getTradePnLData(userId: string, timeframe: string) {
    try {
      const [recentTradePnL, tradePnLStats, allTradePnL] =
        await Promise.allSettled([
          this.tradePnLService.findAll(
            userId,
            this.getTimeframeDays(timeframe),
          ),
          this.tradePnLService.getStatistics(
            userId,
            this.getTimeframeDays(timeframe),
          ),
          this.tradePnLService.findAll(userId),
        ]);

      const safeRecentTradePnL =
        recentTradePnL.status === 'fulfilled' ? recentTradePnL.value : [];
      const safeTradePnLStats =
        tradePnLStats.status === 'fulfilled' ? tradePnLStats.value : null;
      const safeAllTradePnL =
        allTradePnL.status === 'fulfilled' ? allTradePnL.value : [];

      // Process total trade PnL from statistics
      const totalData = {
        profit: safeTradePnLStats?.totalProfit || 0,
        loss: safeTradePnLStats?.totalLoss || 0,
        netPnL: safeTradePnLStats?.netPnL || 0,
        trades: safeTradePnLStats?.totalTrades || 0,
      };

      // Process chart data
      const chartData = this.processChartData(safeAllTradePnL);

      return {
        total: totalData,
        statistics: safeTradePnLStats,
        chartData,
        recent: safeRecentTradePnL.slice(0, 10),
      };
    } catch (error) {
      console.error('Error in getTradePnLData:', error);
      return {
        total: { profit: 0, loss: 0, netPnL: 0, trades: 0 },
        statistics: null,
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        recent: [],
      };
    }
  }

  async getTransactionsData(userId: string, timeframe: string) {
    try {
      const [deposits, withdrawals] = await Promise.allSettled([
        this.depositsService.list(userId),
        this.withdrawalsService.list(userId),
      ]);

      const safeDeposits =
        deposits.status === 'fulfilled' ? deposits.value : [];
      const safeWithdrawals =
        withdrawals.status === 'fulfilled' ? withdrawals.value : [];

      // Process deposits data
      const depositTotal = safeDeposits.reduce(
        (sum, deposit) => sum + (deposit.amount || 0),
        0,
      );
      const pendingDeposits = safeDeposits.filter(
        (d) => d.status === 'pending',
      ).length;
      const completedDeposits = safeDeposits.filter(
        (d) => d.status === 'completed',
      ).length;

      // Process withdrawals data
      const withdrawalTotal = safeWithdrawals.reduce(
        (sum, withdrawal) => sum + (withdrawal.amount || 0),
        0,
      );
      const pendingWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'pending',
      ).length;
      const completedWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'completed',
      ).length;

      // Process chart data
      const withdrawalChartData =
        this.processWithdrawalChartData(safeWithdrawals);
      const depositChartData = this.processDepositChartData(safeDeposits);

      // Get recent activities
      const recentWithdrawals = safeWithdrawals
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      const recentDeposits = safeDeposits
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      return {
        deposits: {
          total: depositTotal,
          pending: pendingDeposits,
          completed: completedDeposits,
          chartData: depositChartData,
          recentActivity: recentDeposits,
        },
        withdrawals: {
          total: withdrawalTotal,
          pending: pendingWithdrawals,
          completed: completedWithdrawals,
          chartData: withdrawalChartData,
          recentActivity: recentWithdrawals,
        },
      };
    } catch (error) {
      console.error('Error in getTransactionsData:', error);
      return {
        deposits: {
          total: 0,
          pending: 0,
          completed: 0,
          chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
          recentActivity: [],
        },
        withdrawals: {
          total: 0,
          pending: 0,
          completed: 0,
          chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
          recentActivity: [],
        },
      };
    }
  }

  // Helper methods
  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '1W':
        return 7;
      case '1M':
        return 30;
      case '1Y':
        return 365;
      case '5Y':
        return 1825;
      default:
        return 30;
    }
  }

  private getHistoryLimit(timeframe: string): number {
    switch (timeframe) {
      case '1W':
        return 20;
      case '1M':
        return 50;
      case '1Y':
        return 200;
      case '5Y':
        return 500;
      default:
        return 50;
    }
  }

  private generatePositionsChartData(positions: any[], timeframe: string) {
    // Mock chart data generation for positions - this would be replaced with real data processing
    const mockData = {
      daily: Array.from({ length: 7 }, (_, i) => ({
        period: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        totalValue: Math.random() * 10000 + 45000,
        pnl: Math.random() * 500 - 250,
        count: positions.length + Math.floor(Math.random() * 3),
      })),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        period: `2025-W${36 + i}`,
        totalValue: Math.random() * 15000 + 40000,
        pnl: Math.random() * 1000 - 500,
        count: positions.length + Math.floor(Math.random() * 5),
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        period: `${2025}-${String(i + 1).padStart(2, '0')}`,
        totalValue: Math.random() * 20000 + 35000,
        pnl: Math.random() * 2000 - 1000,
        count: positions.length + Math.floor(Math.random() * 8),
      })),
      yearly: Array.from({ length: 5 }, (_, i) => ({
        period: `${2021 + i}`,
        totalValue: Math.random() * 30000 + 30000,
        pnl: Math.random() * 5000 - 2500,
        count: positions.length + Math.floor(Math.random() * 10),
      })),
    };

    return mockData;
  }

  private generateWalletChartData(history: any[], timeframe: string) {
    // Mock chart data generation for wallets - this would be replaced with real data processing
    const mockData = {
      daily: Array.from({ length: 7 }, (_, i) => ({
        period: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        totalBalance: Math.random() * 5000 + 8000,
        deposits: Math.random() * 1000,
        withdrawals: Math.random() * 500,
      })),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        period: `2025-W${36 + i}`,
        totalBalance: Math.random() * 8000 + 7000,
        deposits: Math.random() * 2000,
        withdrawals: Math.random() * 1000,
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        period: `${2025}-${String(i + 1).padStart(2, '0')}`,
        totalBalance: Math.random() * 10000 + 6000,
        deposits: Math.random() * 3000,
        withdrawals: Math.random() * 1500,
      })),
      yearly: Array.from({ length: 5 }, (_, i) => ({
        period: `${2021 + i}`,
        totalBalance: Math.random() * 15000 + 5000,
        deposits: Math.random() * 10000,
        withdrawals: Math.random() * 5000,
      })),
    };

    return mockData;
  }
}
