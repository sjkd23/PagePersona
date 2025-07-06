// Usage tracking model - separate from User model for better performance and scalability

import { UsageRecord, UsageSummary } from '../types/auth';

// In-memory usage storage (replace with database in production)
const usageRecords: Map<string, UsageRecord[]> = new Map();

export class Usage {
  // Record a new usage event
  static async recordUsage(usageData: Omit<UsageRecord, 'id' | 'timestamp'>): Promise<UsageRecord> {
    const record: UsageRecord = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...usageData,
    };

    // Get existing records for user or create new array
    const userRecords = usageRecords.get(usageData.userId) || [];
    userRecords.push(record);
    usageRecords.set(usageData.userId, userRecords);

    return record;
  }

  // Get usage records for a specific user
  static async getUserUsage(
    userId: string, 
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageRecord[]> {
    let records = usageRecords.get(userId) || [];

    // Filter by date range if provided
    if (startDate || endDate) {
      records = records.filter(record => {
        const recordDate = record.timestamp;
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      });
    }

    // Sort by timestamp (most recent first)
    records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit if provided
    if (limit) {
      records = records.slice(0, limit);
    }

    return records;
  }

  // Get usage summary for a user
  static async getUserSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageSummary | null> {
    const records = await this.getUserUsage(userId, undefined, startDate, endDate);
    
    if (records.length === 0) {
      return null;
    }

    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.success).length;
    const totalTokens = records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
    const lastActive = records[0].timestamp; // Most recent (already sorted)

    return {
      userId,
      totalRequests,
      totalTokens,
      totalCost,
      successRate: (successfulRequests / totalRequests) * 100,
      avgResponseTime: totalDuration / totalRequests,
      lastActive,
      period: {
        start: startDate || records[records.length - 1].timestamp,
        end: endDate || records[0].timestamp,
      },
    };
  }

  // Get usage for all users (admin function)
  static async getAllUsage(
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageRecord[]> {
    const allRecords: UsageRecord[] = [];
    
    for (const userRecords of usageRecords.values()) {
      allRecords.push(...userRecords);
    }

    // Filter by date range if provided
    let filteredRecords = allRecords;
    if (startDate || endDate) {
      filteredRecords = allRecords.filter(record => {
        const recordDate = record.timestamp;
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      });
    }

    // Sort by timestamp (most recent first)
    filteredRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit if provided
    if (limit) {
      filteredRecords = filteredRecords.slice(0, limit);
    }

    return filteredRecords;
  }

  // Delete usage records for a user
  static async deleteUserUsage(userId: string): Promise<boolean> {
    return usageRecords.delete(userId);
  }

  // Helper: Calculate cost based on tokens (example pricing)
  static calculateCost(tokensUsed: number, model: string = 'gpt-4o-mini'): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    // Simplified: assume 50/50 split input/output
    const inputTokens = tokensUsed * 0.5;
    const outputTokens = tokensUsed * 0.5;
    
    return (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1000;
  }
}

export default Usage;
