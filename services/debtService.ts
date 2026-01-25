import { supabase } from './supabaseClient';
import { Debt, Payment, PaymentType } from '../types';

export type DebtCategory = 'credit_card' | 'loan' | 'mortgage' | 'auto' | 'personal' | 'student' | 'other';

export interface DebtInput {
  name: string;
  provider?: string;
  balance: number;
  apr: number;
  minPayment: number;
  category?: DebtCategory;
  paymentType?: PaymentType;
  totalMonths?: number;
  originalAmount?: number;
  paymentDueDay?: number;
  cutOffDay?: number;
}

// Map Supabase row to Debt interface
const mapDebtFromDB = (row: any): Debt => ({
  id: row.id.toString(),
  name: row.name,
  provider: row.name, // Use name as provider for now
  balance: parseFloat(row.amount) || 0,
  apr: parseFloat(row.apr) || 0,
  minPayment: parseFloat(row.min_payment) || parseFloat(row.monthly_payment) || 0,
  dueDate: row.due_date || '',
  category: 'credit_card', // Default, could be stored in DB later
  paymentType: row.payment_type,
  totalMonths: row.total_months,
  monthlyPayment: parseFloat(row.monthly_payment) || 0,
  originalAmount: parseFloat(row.original_amount) || 0,
  totalInterest: parseFloat(row.total_interest) || 0,
  cutOffDay: row.cut_off_day,
  paymentDueDay: row.payment_due_day,
  monthsPaid: row.months_paid || 0,
});

// Map Payment from DB
const mapPaymentFromDB = (row: any): Payment => ({
  id: row.id.toString(),
  debtId: row.debt_id.toString(),
  userId: row.user_id,
  amount: parseFloat(row.amount) || 0,
  paymentDate: row.payment_date,
  note: row.note,
  createdAt: row.created_at,
});

export const debtService = {
  /**
   * Fetch all ACTIVE debts for the current user
   */
  async getDebts(): Promise<Debt[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active') // Only fetch active debts
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debts:', error);
      return [];
    }

    return (data || []).map(mapDebtFromDB);
  },

  /**
   * Fetch completed debts for history/achievements
   */
  async getCompletedDebts(): Promise<Debt[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed debts:', error);
      return [];
    }

    return (data || []).map(mapDebtFromDB);
  },

  /**
   * Record a payment for a debt
   */
  async recordPayment(debtId: string, amount: number, note?: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Start a transaction-like operation
    // 1. Insert payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        debt_id: parseInt(debtId),
        amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        note: note || null,
      });

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      return false;
    }

    // 2. Get current debt
    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .select('amount, months_paid')
      .eq('id', parseInt(debtId))
      .single();

    if (debtError || !debt) {
      console.error('Error fetching debt:', debtError);
      return false;
    }

    // 3. Update debt balance and months_paid
    const newBalance = Math.max(0, parseFloat(debt.amount) - amount);
    const newMonthsPaid = (debt.months_paid || 0) + 1;
    const isCompleted = newBalance === 0;

    const updateData: any = {
      amount: newBalance,
      months_paid: newMonthsPaid,
    };

    // Mark as completed if fully paid
    if (isCompleted) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('debts')
      .update(updateData)
      .eq('id', parseInt(debtId));

    if (updateError) {
      console.error('Error updating debt:', updateError);
      return false;
    }

    return true;
  },

  /**
   * Get payment history for a specific debt
   */
  async getPaymentHistory(debtId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('debt_id', parseInt(debtId))
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return (data || []).map(mapPaymentFromDB);
  },

  /**
   * Get total paid for a debt
   */
  async getTotalPaid(debtId: string): Promise<number> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('debt_id', parseInt(debtId));

    if (error) {
      console.error('Error fetching total paid:', error);
      return 0;
    }

    return (data || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
  },

  /**
   * Delete a debt
   */
  async deleteDebt(debtId: string): Promise<boolean> {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', parseInt(debtId));

    if (error) {
      console.error('Error deleting debt:', error);
      return false;
    }

    return true;
  },

  /**
   * Create a new debt
   */
  async createDebt(input: DebtInput): Promise<Debt | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('debts')
      .insert({
        user_id: user.id,
        name: input.name,
        amount: input.balance,
        apr: input.apr,
        min_payment: input.minPayment,
        payment_type: input.paymentType || 'lump_sum',
        total_months: input.totalMonths || null,
        original_amount: input.originalAmount || input.balance,
        payment_due_day: input.paymentDueDay || null,
        cut_off_day: input.cutOffDay || null,
        status: 'active',
        months_paid: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating debt:', error);
      return null;
    }

    return mapDebtFromDB(data);
  },

  /**
   * Update an existing debt
   */
  async updateDebt(debtId: string, updates: Partial<DebtInput>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.balance !== undefined) updateData.amount = updates.balance;
    if (updates.apr !== undefined) updateData.apr = updates.apr;
    if (updates.minPayment !== undefined) updateData.min_payment = updates.minPayment;
    if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
    if (updates.totalMonths !== undefined) updateData.total_months = updates.totalMonths;
    if (updates.originalAmount !== undefined) updateData.original_amount = updates.originalAmount;
    if (updates.paymentDueDay !== undefined) updateData.payment_due_day = updates.paymentDueDay;
    if (updates.cutOffDay !== undefined) updateData.cut_off_day = updates.cutOffDay;

    const { error } = await supabase
      .from('debts')
      .update(updateData)
      .eq('id', parseInt(debtId))
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating debt:', error);
      return false;
    }

    return true;
  },
};
