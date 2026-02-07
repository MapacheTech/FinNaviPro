import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  Loader2,
  Plus,
  Calendar,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Utensils,
  Smartphone,
  Heart,
  Briefcase,
  MoreHorizontal,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { transactionService, Transaction, TransactionType } from '../services/transactionService';
import { profileService } from '../services/profileService';
import { AdBanner } from '../components/AdBanner';

type FilterType = 'all' | 'expense' | 'income';
type DateFilter = 'all' | 'week' | 'month' | '3months';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Shopping': <ShoppingBag size={18} />,
  'Food': <Utensils size={18} />,
  'Coffee': <Coffee size={18} />,
  'Housing': <Home size={18} />,
  'Transportation': <Car size={18} />,
  'Entertainment': <Smartphone size={18} />,
  'Health': <Heart size={18} />,
  'Work': <Briefcase size={18} />,
  'Other': <MoreHorizontal size={18} />,
};

const getCategoryIcon = (category?: string) => {
  if (!category) return <MoreHorizontal size={18} />;
  return CATEGORY_ICONS[category] || <MoreHorizontal size={18} />;
};

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
    profileService.getProfile().then(p => {
      if (p) setSubscriptionStatus(p.subscriptionStatus);
    });
  }, [dateFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const options: { startDate?: string } = {};

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case '3months':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          default:
            startDate = new Date(0);
        }

        options.startDate = startDate.toISOString().split('T')[0];
      }

      const data = await transactionService.getTransactions(options);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const success = await transactionService.deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesMerchant = t.merchant?.toLowerCase().includes(query);
        const matchesCategory = t.category?.toLowerCase().includes(query);
        const matchesDescription = t.description?.toLowerCase().includes(query);
        if (!matchesMerchant && !matchesCategory && !matchesDescription) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, searchQuery]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expenses += t.amount;
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [filteredTransactions]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    filteredTransactions.forEach(t => {
      const date = t.transactionDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-textMuted">Track your spending</p>
        </div>
        <Link
          to="/add-transaction"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} strokeWidth={3} />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-emerald-500" />
            <span className="text-xs text-emerald-500 font-bold">Income</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-500">
            +${totals.income.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-red-500" />
            <span className="text-xs text-red-500 font-bold">Expenses</span>
          </div>
          <p className="text-xl font-extrabold text-red-500">
            -${totals.expenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 rounded-xl border transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-primary text-black border-primary'
                : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-surfaceHighlight/50 rounded-2xl p-4 space-y-3 border border-white/5">
            {/* Type Filter */}
            <div>
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'expense', label: 'Expenses' },
                  { value: 'income', label: 'Income' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value as FilterType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      typeFilter === opt.value
                        ? 'bg-primary text-black'
                        : 'bg-surface text-textMuted hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">Period</label>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: '7 days' },
                  { value: 'month', label: '30 days' },
                  { value: '3months', label: '3 months' },
                  { value: 'all', label: 'All time' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateFilter(opt.value as DateFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      dateFilter === opt.value
                        ? 'bg-primary text-black'
                        : 'bg-surface text-textMuted hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ad Banner */}
      <AdBanner placement="transactions" subscriptionStatus={subscriptionStatus} />

      {/* Transaction List */}
      {groupedByDate.length === 0 ? (
        <div className="bg-surface/50 rounded-3xl border border-white/5 p-8 text-center">
          <Calendar size={48} className="mx-auto mb-3 text-textMuted opacity-50" />
          <p className="text-sm text-textMuted">No transactions found</p>
          <p className="text-xs text-textMuted mt-1">Start tracking your spending!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, dayTransactions]) => (
            <div key={date}>
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 px-1">
                {formatDate(date)}
              </h3>
              <div className="bg-surface/50 rounded-2xl border border-white/5 overflow-hidden">
                {dayTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center gap-3 p-4 ${
                      index < dayTransactions.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {transaction.merchant || transaction.category || 'Transaction'}
                      </p>
                      <p className="text-xs text-textMuted truncate">
                        {transaction.description || transaction.category || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        transaction.type === 'income' ? 'text-emerald-500' : 'text-white'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deletingId === transaction.id}
                      className="p-2 text-textMuted hover:text-red-500 transition-colors"
                    >
                      {deletingId === transaction.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-20"></div>
    </div>
  );
};
