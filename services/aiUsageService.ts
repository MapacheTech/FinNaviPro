import { supabase } from './supabaseClient';

const FREE_MONTHLY_LIMIT = 10;

interface UsageStatus {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
}

export const aiUsageService = {
  /**
   * Get current month key (e.g., '2026-02')
   */
  getMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  /**
   * Get monthly usage for the current user
   */
  async getMonthlyUsage(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const monthYear = this.getMonthKey();

    const { data, error } = await supabase
      .from('ai_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single();

    if (error || !data) return 0;
    return data.message_count;
  },

  /**
   * Increment usage count for the current month
   */
  async incrementUsage(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const monthYear = this.getMonthKey();

    // Try to upsert: insert if not exists, increment if exists
    const { error } = await supabase.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_month_year: monthYear
    });

    // If RPC doesn't exist, fallback to manual upsert
    if (error) {
      // Check if row exists
      const { data: existing } = await supabase
        .from('ai_usage')
        .select('id, message_count')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('ai_usage')
          .update({
            message_count: existing.message_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('ai_usage')
          .insert({
            user_id: user.id,
            month_year: monthYear,
            message_count: 1,
            last_used: new Date().toISOString()
          });
      }
    }

    return true;
  },

  /**
   * Check if user can use AI based on subscription status
   */
  async canUseAI(subscriptionStatus: string): Promise<UsageStatus> {
    // Pro users have unlimited access
    if (subscriptionStatus === 'pro') {
      return {
        allowed: true,
        remaining: Infinity,
        used: 0,
        limit: Infinity
      };
    }

    const used = await this.getMonthlyUsage();
    const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);

    return {
      allowed: remaining > 0,
      remaining,
      used,
      limit: FREE_MONTHLY_LIMIT
    };
  }
};
