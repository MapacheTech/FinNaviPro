import { supabase } from './supabaseClient';
import { Badge } from '../types';

// Badge definitions - must match AVAILABLE_BADGES in constants.ts
export const BADGE_DEFINITIONS: Record<string, { name: string; description: string; icon: string }> = {
  'first_kill': { name: 'First Kill', description: 'Made your first payment', icon: '⚔️' },
  'streak_master': { name: 'Streak Master', description: '7 day payment streak', icon: '🔥' },
  'debt_destroyer': { name: 'Debt Destroyer', description: 'Paid off a credit card', icon: '🛡️' },
  'snowballer': { name: 'Snowballer', description: 'Stuck to the plan', icon: '❄️' },
  '800_club': { name: '800 Club', description: 'Reached 800 Credit Score', icon: '💎' },
  'freedom_fighter': { name: 'Freedom Fighter', description: 'Paid off 50% of total debt', icon: '🦅' }
};

export const achievementService = {
  /**
   * Get all achievements earned by the current user
   */
  async getUserAchievements(): Promise<Badge[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_achievements')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return (data || []).map(row => {
      const def = BADGE_DEFINITIONS[row.badge_id] || {
        name: row.badge_id,
        description: '',
        icon: '🏆'
      };
      return {
        id: row.badge_id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: new Date(row.earned_at)
      };
    });
  },

  /**
   * Award a badge to the current user (if not already earned)
   */
  async awardBadge(badgeId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if already earned
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      // Already has this badge
      return true;
    }

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: user.id,
        badge_id: badgeId
      });

    if (error) {
      console.error('Error awarding badge:', error);
      return false;
    }

    return true;
  },

  /**
   * Check if user has a specific badge
   */
  async hasBadge(badgeId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single();

    return !!data;
  },

  /**
   * Check and award badges based on current user state
   * Call this after significant actions (payments, profile updates, etc.)
   */
  async checkAndAwardBadges(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const newBadges: string[] = [];

    // Get current user data
    const [profile, debts, payments] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('debts').select('*').eq('user_id', user.id),
      supabase.from('payments').select('*').eq('user_id', user.id)
    ]);

    const profileData = profile.data;
    const debtsData = debts.data || [];
    const paymentsData = payments.data || [];

    // 1. First Kill - Made your first payment
    if (paymentsData.length >= 1) {
      if (await this.awardBadge('first_kill')) {
        const wasNew = !(await this.hasBadge('first_kill'));
        if (!wasNew) newBadges.push('first_kill');
      }
    }

    // 2. Streak Master - 7 day streak
    if (profileData && profileData.streak_days >= 7) {
      if (await this.awardBadge('streak_master')) {
        newBadges.push('streak_master');
      }
    }

    // 3. Debt Destroyer - Paid off a credit card
    const completedCards = debtsData.filter(
      d => d.status === 'completed' && d.category === 'credit_card'
    );
    if (completedCards.length >= 1) {
      if (await this.awardBadge('debt_destroyer')) {
        newBadges.push('debt_destroyer');
      }
    }

    // 4. 800 Club - Credit score >= 800
    if (profileData && profileData.credit_score >= 800) {
      if (await this.awardBadge('800_club')) {
        newBadges.push('800_club');
      }
    }

    // 5. Freedom Fighter - Paid off 50% of total debt
    const activeDebts = debtsData.filter(d => d.status === 'active');
    const completedDebts = debtsData.filter(d => d.status === 'completed');
    const totalOriginal = debtsData.reduce((sum, d) => sum + Number(d.original_amount || d.amount), 0);
    const totalPaidOff = completedDebts.reduce((sum, d) => sum + Number(d.original_amount || d.amount), 0);

    if (totalOriginal > 0 && (totalPaidOff / totalOriginal) >= 0.5) {
      if (await this.awardBadge('freedom_fighter')) {
        newBadges.push('freedom_fighter');
      }
    }

    // 6. Snowballer - This would require tracking strategy adherence over time
    // For now, we'll skip this one as it requires more complex tracking

    return newBadges;
  },

  /**
   * Get all available badges with their earned status for the current user
   */
  async getAllBadgesWithStatus(): Promise<Array<Badge & { isEarned: boolean }>> {
    const earnedBadges = await this.getUserAchievements();
    const earnedIds = new Set(earnedBadges.map(b => b.id));

    return Object.entries(BADGE_DEFINITIONS).map(([id, def]) => ({
      id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      isEarned: earnedIds.has(id),
      earnedAt: earnedBadges.find(b => b.id === id)?.earnedAt
    }));
  }
};
