import { Debt, UserProfile, Asset, Friend, Challenge, Badge } from './types';

export const MOCK_DEBTS: Debt[] = [
  {
    id: '1',
    name: 'Sapphire Preferred',
    provider: 'Chase',
    balance: 850.00,
    apr: 24.99,
    minPayment: 35,
    dueDate: '2023-11-15',
    category: 'credit_card'
  },
  {
    id: '2',
    name: 'Student Loan A',
    provider: 'Navient',
    balance: 4500.00,
    apr: 4.5,
    minPayment: 120,
    dueDate: '2023-11-20',
    category: 'loan'
  },
  {
    id: '3',
    name: 'Platinum Card',
    provider: 'Amex',
    balance: 12400.00,
    apr: 21.99,
    minPayment: 400,
    dueDate: '2023-11-28',
    category: 'credit_card'
  }
];

export const AVAILABLE_BADGES: Badge[] = [
    { id: '1', name: 'First Kill', description: 'Made your first payment', icon: '⚔️' },
    { id: '2', name: 'Streak Master', description: '7 day payment streak', icon: '🔥' },
    { id: '3', name: 'Debt Destroyer', description: 'Paid off a credit card', icon: '🛡️' },
    { id: '4', name: 'Snowballer', description: 'Stuck to the plan', icon: '❄️' },
    { id: '5', name: '800 Club', description: 'Reached 800 Credit Score', icon: '💎' },
    { id: '6', name: 'Freedom Fighter', description: 'Paid off 50% of total debt', icon: '🦅' }
];

export const MOCK_USER: UserProfile = {
  name: 'Alex',
  totalDebt: 17750,
  monthlyIncome: 5200,
  fixedExpenses: 3100,
  freeSpendingPower: 650, 
  creditScore: 680,
  level: 4,
  points: 1250,
  streakDays: 12,
  subscriptionStatus: 'pro', // UPDATED TO PRO
  trialDaysLeft: 0,
  notificationPreferences: {
    enableSmartNudges: true,
    reminderDaysBeforeDue: 5,
    paydayDayOfMonth: 15
  },
  savingsGoals: [
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 1500,
      monthlyAllocation: 100,
      emoji: '🛟'
    }
  ],
  badges: [
      AVAILABLE_BADGES[0], // First Kill
      AVAILABLE_BADGES[1]  // Streak Master
  ]
};

export const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'Emergency Fund', value: 3500, type: 'cash' },
  { id: '2', name: '401k', value: 12000, type: 'investment' },
  { id: '3', name: 'Robinhood', value: 1500, type: 'investment' }
];

export const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Sarah', avatarSeed: 'Sarah', points: 1450, level: 5, status: 'online' },
  { id: '2', name: 'Mike', avatarSeed: 'Mike', points: 1100, level: 3, status: 'offline' },
  { id: '3', name: 'Jess', avatarSeed: 'Jess', points: 950, level: 2, status: 'online' }
];

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Zero Spend Week',
    participants: [MOCK_FRIENDS[0], MOCK_FRIENDS[1]],
    daysLeft: 3,
    myProgress: 80,
    target: 'No discretionary spending'
  }
];

export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 500,
  3: 1000,
  4: 2000,
  5: 5000
};