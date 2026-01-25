import { supabase } from './supabaseClient';
import { SavingsGoal } from '../types';

export interface SavingsGoalInput {
  name: string;
  emoji?: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyAllocation?: number;
}

export const savingsService = {
  /**
   * Get all active savings goals for the current user
   */
  async getGoals(): Promise<SavingsGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings goals:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      monthlyAllocation: Number(row.monthly_allocation),
      emoji: row.emoji || '🎯'
    }));
  },

  /**
   * Get a single savings goal by ID
   */
  async getGoal(id: string): Promise<SavingsGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.error('Error fetching savings goal:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount),
      monthlyAllocation: Number(data.monthly_allocation),
      emoji: data.emoji || '🎯'
    };
  },

  /**
   * Create a new savings goal
   */
  async createGoal(goal: SavingsGoalInput): Promise<SavingsGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        name: goal.name,
        emoji: goal.emoji || '🎯',
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        monthly_allocation: goal.monthlyAllocation || 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating savings goal:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount),
      monthlyAllocation: Number(data.monthly_allocation),
      emoji: data.emoji || '🎯'
    };
  },

  /**
   * Update an existing savings goal
   */
  async updateGoal(id: string, updates: Partial<SavingsGoalInput>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.emoji !== undefined) updateData.emoji = updates.emoji;
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
    if (updates.monthlyAllocation !== undefined) updateData.monthly_allocation = updates.monthlyAllocation;

    const { error } = await supabase
      .from('savings_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating savings goal:', error);
      return false;
    }

    return true;
  },

  /**
   * Add funds to a savings goal
   */
  async addFunds(id: string, amount: number): Promise<boolean> {
    const goal = await this.getGoal(id);
    if (!goal) return false;

    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {
      current_amount: newAmount
    };

    if (isCompleted) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('savings_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error adding funds to savings goal:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a savings goal
   */
  async deleteGoal(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting savings goal:', error);
      return false;
    }

    return true;
  },

  /**
   * Get total monthly allocation across all goals
   */
  async getTotalMonthlyAllocation(): Promise<number> {
    const goals = await this.getGoals();
    return goals.reduce((sum, g) => sum + g.monthlyAllocation, 0);
  },

  /**
   * Get completed savings goals
   */
  async getCompletedGoals(): Promise<SavingsGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed goals:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      monthlyAllocation: Number(row.monthly_allocation),
      emoji: row.emoji || '🎯'
    }));
  }
};
