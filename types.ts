export type PaymentType = 'lump_sum' | 'installments_no_interest' | 'installments_with_interest';

export interface Debt {
  id: string;
  name: string;
  provider: string; // e.g., Chase, Wells Fargo
  balance: number; // Current remaining balance (maps to 'amount' in DB)
  apr: number;
  minPayment: number;
  dueDate: string; // ISO date string (legacy, use payment_due_day for recurring)
  category: 'credit_card' | 'loan' | 'mortgage' | 'auto';
  
  // Enhanced payment tracking (Phase 2)
  paymentType?: PaymentType;
  totalMonths?: number; // Total installments
  monthlyPayment?: number; // Fixed monthly payment
  originalAmount?: number; // Original purchase/loan amount
  totalInterest?: number; // Calculated total interest over loan term
  cutOffDay?: number; // Day of month (1-31) for card cut-off
  paymentDueDay?: number; // Day of month (1-31) for payment due
  monthsPaid?: number; // Number of payments already made
}

export enum Strategy {
  SNOWBALL = 'SNOWBALL',
  AVALANCHE = 'AVALANCHE'
}

// Payment tracking (Phase 3)
export interface Payment {
  id: string;
  debtId: string;
  userId: string;
  amount: number;
  paymentDate: string; // ISO date
  note?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  enableSmartNudges: boolean;
  reminderDaysBeforeDue: number;
  paydayDayOfMonth: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  emoji: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or Icon name
  earnedAt?: Date;
}

export interface UserProfile {
  name: string;
  totalDebt: number;
  monthlyIncome: number;
  fixedExpenses: number;
  freeSpendingPower: number; // The "Guilt-free" number (Base, before goal allocation)
  creditScore: number;
  level: number;
  points: number;
  streakDays: number;
  subscriptionStatus: 'trial' | 'pro' | 'expired';
  trialDaysLeft: number;
  notificationPreferences: NotificationPreferences;
  savingsGoals: SavingsGoal[];
  badges: Badge[];
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  type: 'cash' | 'investment' | 'property' | 'crypto' | 'vehicle' | 'other';
}

export interface Friend {
  id: string;
  name: string;
  avatarSeed: string;
  points: number;
  level: number;
  status: 'online' | 'offline';
}

export interface Challenge {
  id: string;
  title: string;
  participants: Friend[];
  daysLeft: number;
  myProgress: number; // 0-100
  target: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type NudgeType = 'payment_due' | 'income_event' | 'milestone' | 'warning';

export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  actionLabel?: string;
  actionLink?: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'saving' | 'warning' | 'opportunity';
  impact?: string;
}