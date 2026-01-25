import { supabase } from './supabaseClient';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category?: string;
  merchant?: string;
  description?: string;
  transactionDate: string; // ISO date string
  receiptUrl?: string;
  createdAt: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category?: string;
  merchant?: string;
  description?: string;
  transactionDate?: string;
  receiptUrl?: string;
}

export const transactionService = {
  /**
   * Get all transactions for the current user
   */
  async getTransactions(options?: {
    limit?: number;
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      type: row.type as TransactionType,
      amount: Number(row.amount),
      category: row.category,
      merchant: row.merchant,
      description: row.description,
      transactionDate: row.transaction_date,
      receiptUrl: row.receipt_url,
      createdAt: row.created_at
    }));
  },

  /**
   * Get recent transactions (last 30 days)
   */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.getTransactions({
      limit,
      startDate: thirtyDaysAgo.toISOString().split('T')[0]
    });
  },

  /**
   * Add a new transaction
   */
  async addTransaction(transaction: TransactionInput): Promise<Transaction | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category || null,
        merchant: transaction.merchant || null,
        description: transaction.description || null,
        transaction_date: transaction.transactionDate || new Date().toISOString().split('T')[0],
        receipt_url: transaction.receiptUrl || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      return null;
    }

    return {
      id: data.id,
      type: data.type as TransactionType,
      amount: Number(data.amount),
      category: data.category,
      merchant: data.merchant,
      description: data.description,
      transactionDate: data.transaction_date,
      receiptUrl: data.receipt_url,
      createdAt: data.created_at
    };
  },

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, updates: Partial<TransactionInput>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {};

    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.merchant !== undefined) updateData.merchant = updates.merchant;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.transactionDate !== undefined) updateData.transaction_date = updates.transactionDate;
    if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl;

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating transaction:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }

    return true;
  },

  /**
   * Get spending summary by category for a given period
   */
  async getSpendingByCategory(startDate: string, endDate: string): Promise<Record<string, number>> {
    const transactions = await this.getTransactions({
      type: 'expense',
      startDate,
      endDate
    });

    const summary: Record<string, number> = {};

    for (const t of transactions) {
      const category = t.category || 'Uncategorized';
      summary[category] = (summary[category] || 0) + t.amount;
    }

    return summary;
  },

  /**
   * Get monthly totals (income vs expenses)
   */
  async getMonthlyTotals(year: number, month: number): Promise<{ income: number; expenses: number }> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const transactions = await this.getTransactions({ startDate, endDate });

    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expenses += t.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  },

  /**
   * Get total expenses for current month
   */
  async getCurrentMonthExpenses(): Promise<number> {
    const now = new Date();
    const { expenses } = await this.getMonthlyTotals(now.getFullYear(), now.getMonth() + 1);
    return expenses;
  }
};
