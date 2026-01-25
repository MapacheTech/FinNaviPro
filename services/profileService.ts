import { supabase } from './supabaseClient';
import { UserProfile, NotificationPreferences, SavingsGoal, Badge } from '../types';

// Database row type (matches Supabase schema)
interface ProfileRow {
  id: string;
  name: string;
  monthly_income: number;
  fixed_expenses: number;
  credit_score: number;
  level: number;
  points: number;
  streak_days: number;
  last_activity_date: string;
  subscription_status: 'trial' | 'pro' | 'expired';
  trial_end_date: string;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.error('Error fetching profile:', error);
      return null;
    }

    const row = data as ProfileRow;

    // Calculate trial days left
    const trialEndDate = new Date(row.trial_end_date);
    const today = new Date();
    const trialDaysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Get total debt for the user
    const { data: debts } = await supabase
      .from('debts')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const totalDebt = debts?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Get savings goals
    const { data: goalsData } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const savingsGoals: SavingsGoal[] = (goalsData || []).map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      monthlyAllocation: Number(g.monthly_allocation),
      emoji: g.emoji || '🎯'
    }));

    // Get badges
    const { data: achievementsData } = await supabase
      .from('user_achievements')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    const badges: Badge[] = (achievementsData || []).map(a => ({
      id: a.badge_id,
      name: getBadgeName(a.badge_id),
      description: getBadgeDescription(a.badge_id),
      icon: getBadgeIcon(a.badge_id),
      earnedAt: new Date(a.earned_at)
    }));

    // Calculate minimum payments from debts
    const { data: minPaymentsData } = await supabase
      .from('debts')
      .select('min_payment')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const totalMinPayments = minPaymentsData?.reduce((sum, d) => sum + Number(d.min_payment || 0), 0) || 0;
    const totalSavingsAllocation = savingsGoals.reduce((sum, g) => sum + g.monthlyAllocation, 0);

    // Free spending power = income - fixed expenses - min payments
    const freeSpendingPower = Number(row.monthly_income) - Number(row.fixed_expenses) - totalMinPayments;

    return {
      name: row.name,
      totalDebt,
      monthlyIncome: Number(row.monthly_income),
      fixedExpenses: Number(row.fixed_expenses),
      freeSpendingPower,
      creditScore: row.credit_score,
      level: row.level,
      points: row.points,
      streakDays: row.streak_days,
      subscriptionStatus: row.subscription_status,
      trialDaysLeft,
      notificationPreferences: row.notification_preferences,
      savingsGoals,
      badges
    };
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: Partial<{
    name: string;
    monthly_income: number;
    fixed_expenses: number;
    credit_score: number;
    notification_preferences: NotificationPreferences;
  }>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },

  /**
   * Update streak days (call this on app open)
   */
  async updateStreak(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('last_activity_date, streak_days')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const lastActivity = new Date(profile.last_activity_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    let newStreakDays = profile.streak_days;

    if (diffDays === 0) {
      // Same day, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      newStreakDays += 1;
    } else {
      // Streak broken, reset to 1
      newStreakDays = 1;
    }

    await supabase
      .from('user_profiles')
      .update({
        streak_days: newStreakDays,
        last_activity_date: today.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
  },

  /**
   * Add points to the user's profile
   */
  async addPoints(amount: number): Promise<{ newPoints: number; newLevel: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { newPoints: 0, newLevel: 1 };

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('points, level')
      .eq('id', user.id)
      .single();

    if (!profile) return { newPoints: 0, newLevel: 1 };

    const newPoints = profile.points + amount;
    const newLevel = calculateLevel(newPoints);

    await supabase
      .from('user_profiles')
      .update({
        points: newPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return { newPoints, newLevel };
  },

  /**
   * Upgrade to Pro subscription
   */
  async upgradeToPro(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'pro',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return !error;
  }
};

// Helper functions for level calculation
function calculateLevel(points: number): number {
  const thresholds = [0, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Badge metadata (should match constants.ts AVAILABLE_BADGES)
function getBadgeName(badgeId: string): string {
  const names: Record<string, string> = {
    'first_kill': 'First Kill',
    'streak_master': 'Streak Master',
    'debt_destroyer': 'Debt Destroyer',
    'snowballer': 'Snowballer',
    '800_club': '800 Club',
    'freedom_fighter': 'Freedom Fighter'
  };
  return names[badgeId] || badgeId;
}

function getBadgeDescription(badgeId: string): string {
  const descriptions: Record<string, string> = {
    'first_kill': 'Made your first payment',
    'streak_master': 'Maintained a 7-day streak',
    'debt_destroyer': 'Paid off a credit card',
    'snowballer': 'Stuck to the snowball plan',
    '800_club': 'Reached 800 credit score',
    'freedom_fighter': 'Paid off 50% of total debt'
  };
  return descriptions[badgeId] || '';
}

function getBadgeIcon(badgeId: string): string {
  const icons: Record<string, string> = {
    'first_kill': '⚔️',
    'streak_master': '🔥',
    'debt_destroyer': '🛡️',
    'snowballer': '❄️',
    '800_club': '💎',
    'freedom_fighter': '🦅'
  };
  return icons[badgeId] || '🏆';
}
