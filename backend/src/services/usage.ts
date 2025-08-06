import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from './subscription';

const prisma = new PrismaClient();
const subscriptionService = new SubscriptionService();

export enum UsageEventType {
  REPOSITORY_ANALYZED = 'REPOSITORY_ANALYZED',
  FILES_PROCESSED = 'FILES_PROCESSED',
  EXPORT_GENERATED = 'EXPORT_GENERATED',
  API_REQUEST = 'API_REQUEST',
  ANALYSIS_VIEWED = 'ANALYSIS_VIEWED',
  THEME_APPLIED = 'THEME_APPLIED',
}

export interface UsageEvent {
  userId: string;
  eventType: UsageEventType;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface UsageMetrics {
  repositoriesAnalyzed: number;
  filesProcessed: number;
  exportsGenerated: number;
  apiRequests: number;
  analysisViews: number;
  themesApplied: number;
}

export interface UsagePeriodStats {
  daily: UsageMetrics;
  weekly: UsageMetrics;
  monthly: UsageMetrics;
  total: UsageMetrics;
}

export class UsageService {
  async trackUsage(event: UsageEvent): Promise<void> {
    try {
      // Check if action is allowed based on subscription limits
      const isAllowed = await this.checkUsageAllowed(event);
      
      if (!isAllowed) {
        throw new Error('Usage limit exceeded for current subscription tier');
      }

      // Record the usage event  
      await prisma.analytics.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          eventData: event.metadata || {},
          timestamp: event.timestamp,
        },
      });

      // Update usage counters
      await this.updateUsageCounters(event);

    } catch (error) {
      console.error('Error tracking usage:', error);
      throw new Error('Failed to track usage event');
    }
  }

  async getUserUsageStats(userId: string): Promise<UsagePeriodStats> {
    try {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [daily, weekly, monthly, total] = await Promise.all([
        this.getUsageMetricsForPeriod(userId, dayStart),
        this.getUsageMetricsForPeriod(userId, weekStart),
        this.getUsageMetricsForPeriod(userId, monthStart),
        this.getUsageMetricsForPeriod(userId, new Date(0)),
      ]);

      return { daily, weekly, monthly, total };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw new Error('Failed to fetch usage statistics');
    }
  }

  async getUsageMetricsForPeriod(userId: string, since: Date): Promise<UsageMetrics> {
    try {
      const periodStart = new Date(since);
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      
      const usageData = await prisma.usageTracking.findMany({
        where: {
          userId,
          periodMonth: {
            gte: periodStart,
          },
        },
      });

      const metrics: UsageMetrics = {
        repositoriesAnalyzed: 0,
        filesProcessed: 0,
        exportsGenerated: 0,
        apiRequests: 0,
        analysisViews: 0,
        themesApplied: 0,
      };

      usageData.forEach(usage => {
        switch (usage.resourceType) {
          case 'analyses':
            metrics.repositoriesAnalyzed += usage.resourceCount;
            break;
          case 'files':
            metrics.filesProcessed += usage.resourceCount;
            break;
          case 'exports':
            metrics.exportsGenerated += usage.resourceCount;
            break;
          case 'api_calls':
            metrics.apiRequests += usage.resourceCount;
            break;
          case 'visualizations':
            metrics.analysisViews += usage.resourceCount;
            break;
          case 'themes':
            metrics.themesApplied += usage.resourceCount;
            break;
        }
      });

      return metrics;
    } catch (error) {
      console.error('Error calculating usage metrics:', error);
      throw new Error('Failed to calculate usage metrics');
    }
  }

  async checkUsageAllowed(event: UsageEvent): Promise<boolean> {
    try {
      const subscription = await subscriptionService.getUserSubscription(event.userId);
      
      switch (event.eventType) {
        case UsageEventType.REPOSITORY_ANALYZED:
          return await subscriptionService.checkSubscriptionLimits(
            event.userId,
            'analyze_repository'
          );
        
        case UsageEventType.FILES_PROCESSED:
          return await subscriptionService.checkSubscriptionLimits(
            event.userId,
            'process_files',
            { fileCount: (event.metadata as any)?.fileCount || 0 }
          );
        
        case UsageEventType.EXPORT_GENERATED:
          return await subscriptionService.checkSubscriptionLimits(
            event.userId,
            'export_format',
            { format: (event.metadata as any)?.format }
          );
        
        case UsageEventType.API_REQUEST:
          return await subscriptionService.checkSubscriptionLimits(
            event.userId,
            'api_access'
          );
        
        case UsageEventType.THEME_APPLIED:
          return subscription.limits.customThemes;
        
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking usage allowance:', error);
      return false;
    }
  }

  async getRemainingUsage(userId: string): Promise<Record<string, number>> {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      const monthlyStats = await this.getUsageMetricsForPeriod(
        userId,
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      );

      const remaining: Record<string, number> = {};

      if (subscription.limits.repositoriesPerMonth !== -1) {
        remaining.repositories = Math.max(
          0,
          subscription.limits.repositoriesPerMonth - monthlyStats.repositoriesAnalyzed
        );
      } else {
        remaining.repositories = -1; // Unlimited
      }

      return remaining;
    } catch (error) {
      console.error('Error calculating remaining usage:', error);
      throw new Error('Failed to calculate remaining usage');
    }
  }

  async getUsageTrends(userId: string, days = 30): Promise<Array<{ date: string; usage: UsageMetrics }>> {
    try {
      const trends: Array<{ date: string; usage: UsageMetrics }> = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const usage = await this.getUsageMetricsForPeriod(userId, dayStart);
        
        trends.push({
          date: dayStart.toISOString().split('T')[0],
          usage,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error fetching usage trends:', error);
      throw new Error('Failed to fetch usage trends');
    }
  }

  async getPopularRepositories(userId: string, limit = 10): Promise<Array<{
    repositoryId: number;
    repositoryName: string;
    analysisCount: number;
    lastAnalyzed: Date;
  }>> {
    try {
      const analyses = await prisma.analysisResult.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      const repositoryStats = new Map<number, {
        name: string;
        count: number;
        lastAnalyzed: Date;
      }>();

      analyses.forEach(analysis => {
        const repoId = analysis.repositoryId;
        const existing = repositoryStats.get(repoId);
        
        if (existing) {
          existing.count++;
          if (analysis.updatedAt > existing.lastAnalyzed) {
            existing.lastAnalyzed = analysis.updatedAt;
          }
        } else {
          repositoryStats.set(repoId, {
            name: (analysis.analysisData as any)?.repositoryName || `Repository ${repoId}`,
            count: 1,
            lastAnalyzed: analysis.updatedAt,
          });
        }
      });

      return Array.from(repositoryStats.entries())
        .map(([repositoryId, stats]) => ({
          repositoryId,
          repositoryName: stats.name,
          analysisCount: stats.count,
          lastAnalyzed: stats.lastAnalyzed,
        }))
        .sort((a, b) => b.analysisCount - a.analysisCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular repositories:', error);
      throw new Error('Failed to fetch popular repositories');
    }
  }

  async cleanupOldUsageData(retentionDays = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      await prisma.analytics.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up usage data older than ${retentionDays} days`);
    } catch (error) {
      console.error('Error cleaning up usage data:', error);
      throw new Error('Failed to cleanup old usage data');
    }
  }

  private async updateUsageCounters(event: UsageEvent): Promise<void> {
    try {
      const periodMonth = new Date();
      periodMonth.setDate(1);
      periodMonth.setHours(0, 0, 0, 0);
      
      const resourceType = this.getResourceType(event.eventType);
      const incrementValue = this.getIncrementValue(event);
      
      await prisma.usageTracking.upsert({
        where: {
          userId_organizationId_resourceType_periodMonth: {
            userId: event.userId,
            organizationId: null,
            resourceType: resourceType,
            periodMonth: periodMonth,
          },
        },
        update: {
          resourceCount: {
            increment: incrementValue,
          },
          metadata: event.metadata || {},
        },
        create: {
          userId: event.userId,
          organizationId: null,
          resourceType: resourceType,
          resourceCount: incrementValue,
          periodMonth: periodMonth,
          metadata: event.metadata || {},
        },
      });
    } catch (error) {
      console.error('Error updating usage counters:', error);
      // Don't throw here as this is supplementary data
    }
  }

  private getResourceType(eventType: UsageEventType): string {
    switch (eventType) {
      case UsageEventType.REPOSITORY_ANALYZED:
        return 'analyses';
      case UsageEventType.FILES_PROCESSED:
        return 'files';
      case UsageEventType.EXPORT_GENERATED:
        return 'exports';
      case UsageEventType.API_REQUEST:
        return 'api_calls';
      case UsageEventType.ANALYSIS_VIEWED:
        return 'visualizations';
      case UsageEventType.THEME_APPLIED:
        return 'themes';
      default:
        return 'api_calls';
    }
  }

  private getIncrementValue(event: UsageEvent): number {
    if (event.eventType === UsageEventType.FILES_PROCESSED) {
      return (event.metadata as any)?.fileCount || 1;
    }
    return 1;
  }

  async exportUsageReport(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const events = await prisma.analytics.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (format === 'csv') {
        const csvHeader = 'Date,Event Type,Metadata\n';
        const csvRows = events.map(event => 
          `${event.timestamp.toISOString()},${event.eventType},"${JSON.stringify(event.metadata)}"`
        ).join('\n');
        
        return csvHeader + csvRows;
      }

      return JSON.stringify({
        userId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: await this.getUsageMetricsForPeriod(userId, startDate),
        events,
      }, null, 2);
    } catch (error) {
      console.error('Error exporting usage report:', error);
      throw new Error('Failed to export usage report');
    }
  }

  async getUsageAlerts(userId: string): Promise<Array<{
    type: 'warning' | 'limit_reached' | 'info';
    message: string;
    threshold?: number;
    current?: number;
  }>> {
    try {
      const alerts: Array<{
        type: 'warning' | 'limit_reached' | 'info';
        message: string;
        threshold?: number;
        current?: number;
      }> = [];

      const subscription = await subscriptionService.getUserSubscription(userId);
      const monthlyUsage = await this.getUsageMetricsForPeriod(
        userId,
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      );

      // Check repository limit
      if (subscription.limits.repositoriesPerMonth !== -1) {
        const threshold = subscription.limits.repositoriesPerMonth;
        const current = monthlyUsage.repositoriesAnalyzed;
        const percentage = (current / threshold) * 100;

        if (current >= threshold) {
          alerts.push({
            type: 'limit_reached',
            message: 'Monthly repository analysis limit reached',
            threshold,
            current,
          });
        } else if (percentage >= 80) {
          alerts.push({
            type: 'warning',
            message: 'Approaching monthly repository analysis limit',
            threshold,
            current,
          });
        }
      }

      // Check for inactive users
      const lastWeekUsage = await this.getUsageMetricsForPeriod(
        userId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (lastWeekUsage.repositoriesAnalyzed === 0 && subscription.tier !== 'TRIAL') {
        alerts.push({
          type: 'info',
          message: 'No repository analysis in the past week',
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating usage alerts:', error);
      return [];
    }
  }
}