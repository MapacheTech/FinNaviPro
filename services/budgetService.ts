import { supabase } from './supabaseClient';
import { transactionService } from './transactionService';

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface BudgetInput {
  category: string;
  monthlyLimit: number;
  alertThreshold?: number;
}

// Available budget categories (should match transaction categories)
export const BUDGET_CATEGORIES = [
  'Shopping',
  'Food',
  'Coffee',
  'Housing',
  'Transportation',
  'Entertainment',
  'Health',
  'Work',
  'Other'
] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];

export const budgetService = {
  /**
   * Get all budgets for the current user
   */
  async getBudgets(): Promise<Budget[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      category: row.category,
      monthlyLimit: Number(row.monthly_limit),
      alertThreshold: row.alert_threshold || 80,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  /**
   * Get all budgets with their current spending progress
   */
  async getBudgetsWithProgress(): Promise<BudgetWithProgress[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get budgets
    const budgets = await this.getBudgets();
    if (budgets.length === 0) return [];

    // Get current month's spending by category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending = await transactionService.getSpendingByCategory(
      startOfMonth.toISOString().split('T')[0]
    );

    // Combine budgets with spending
    return budgets.map(budget => {
      const spent = spending[budget.category] || 0;
      const remaining = Math.max(0, budget.monthlyLimit - spent);
      const percentUsed = budget.monthlyLimit > 0
        ? Math.round((spent / budget.monthlyLimit) * 100)
        : 0;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentUsed >= 100) {
        status = 'exceeded';
      } else if (percentUsed >= budget.alertThreshold) {
        status = 'warning';
      }

      return {
        ...budget,
        spent,
        remaining,
        percentUsed,
        status
      };
    });
  },

  /**
   * Create a new budget
   */
  async createBudget(input: BudgetInput): Promise<Budget | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category: input.category,
        monthly_limit: input.monthlyLimit,
        alert_threshold: input.alertThreshold || 80
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return null;
    }

    return {
      id: data.id,
      category: data.category,
      monthlyLimit: Number(data.monthly_limit),
      alertThreshold: data.alert_threshold,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  /**
   * Update an existing budget
   */
  async updateBudget(budgetId: string, updates: Partial<BudgetInput>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.monthlyLimit !== undefined) updateData.monthly_limit = updates.monthlyLimit;
    if (updates.alertThreshold !== undefined) updateData.alert_threshold = updates.alertThreshold;

    const { error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', budgetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating budget:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a budget
   */
  async deleteBudget(budgetId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting budget:', error);
      return false;
    }

    return true;
  },

  /**
   * Get budget alerts (budgets that are at or above their threshold)
   */
  async getBudgetAlerts(): Promise<BudgetWithProgress[]> {
    const budgets = await this.getBudgetsWithProgress();
    return budgets.filter(b => b.status === 'warning' || b.status === 'exceeded');
  },

  /**
   * Check if a category already has a budget
   */
  async categoryHasBudget(category: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category)
      .single();

    return !error && !!data;
  }
};
