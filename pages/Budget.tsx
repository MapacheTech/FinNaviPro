import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Trash2,
  Edit3,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Utensils,
  Smartphone,
  Heart,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import {
  budgetService,
  BudgetWithProgress,
  BudgetInput,
  BUDGET_CATEGORIES,
  BudgetCategory
} from '../services/budgetService';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Shopping': <ShoppingBag size={20} />,
  'Food': <Utensils size={20} />,
  'Coffee': <Coffee size={20} />,
  'Housing': <Home size={20} />,
  'Transportation': <Car size={20} />,
  'Entertainment': <Smartphone size={20} />,
  'Health': <Heart size={20} />,
  'Work': <Briefcase size={20} />,
  'Other': <MoreHorizontal size={20} />,
};

const getCategoryIcon = (category: string) => {
  return CATEGORY_ICONS[category] || <MoreHorizontal size={20} />;
};

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editBudget?: BudgetWithProgress | null;
  existingCategories: string[];
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editBudget,
  existingCategories
}) => {
  const [category, setCategory] = useState<BudgetCategory>('Shopping');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editBudget) {
      setCategory(editBudget.category as BudgetCategory);
      setMonthlyLimit(editBudget.monthlyLimit.toString());
      setAlertThreshold(editBudget.alertThreshold.toString());
    } else {
      // Find first category without a budget
      const available = BUDGET_CATEGORIES.find(c => !existingCategories.includes(c));
      setCategory(available || 'Other');
      setMonthlyLimit('');
      setAlertThreshold('80');
    }
  }, [editBudget, existingCategories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyLimit || Number(monthlyLimit) <= 0) return;

    setSaving(true);
    try {
      const input: BudgetInput = {
        category,
        monthlyLimit: Number(monthlyLimit),
        alertThreshold: Number(alertThreshold)
      };

      if (editBudget) {
        await budgetService.updateBudget(editBudget.id, input);
      } else {
        await budgetService.createBudget(input);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editBudget) return;

    setDeleting(true);
    try {
      await budgetService.deleteBudget(editBudget.id);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const availableCategories = editBudget
    ? BUDGET_CATEGORIES
    : BUDGET_CATEGORIES.filter(c => !existingCategories.includes(c));

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {editBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={!!editBudget}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    category === cat
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white'
                  } ${editBudget ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getCategoryIcon(cat)}
                  <span className="text-[10px] font-bold">{cat}</span>
                </button>
              ))}
            </div>
            {availableCategories.length === 0 && !editBudget && (
              <p className="text-xs text-accent mt-2">
                Ya tienes presupuestos para todas las categorias
              </p>
            )}
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">
              Limite Mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-textMuted">$</span>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                required
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-8 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">
              Alerta al {alertThreshold}%
            </label>
            <input
              type="range"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              min="50"
              max="100"
              step="5"
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-textMuted mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {editBudget && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surfaceHighlight text-textMuted rounded-xl font-bold text-sm hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !monthlyLimit || Number(monthlyLimit) <= 0 || (availableCategories.length === 0 && !editBudget)}
              className="flex-1 px-4 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BudgetCard: React.FC<{
  budget: BudgetWithProgress;
  onClick: () => void;
}> = ({ budget, onClick }) => {
  const statusColors = {
    safe: 'text-primary',
    warning: 'text-yellow-500',
    exceeded: 'text-red-500'
  };

  const progressColors = {
    safe: 'bg-primary',
    warning: 'bg-yellow-500',
    exceeded: 'bg-red-500'
  };

  const StatusIcon = budget.status === 'exceeded'
    ? AlertTriangle
    : budget.status === 'warning'
    ? AlertTriangle
    : CheckCircle;

  return (
    <div
      onClick={onClick}
      className="bg-surface/50 rounded-2xl p-4 border border-white/5 cursor-pointer hover:bg-surface/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            budget.status === 'exceeded'
              ? 'bg-red-500/10 text-red-500'
              : budget.status === 'warning'
              ? 'bg-yellow-500/10 text-yellow-500'
              : 'bg-primary/10 text-primary'
          }`}>
            {getCategoryIcon(budget.category)}
          </div>
          <div>
            <p className="font-bold text-sm">{budget.category}</p>
            <p className="text-[10px] text-textMuted">
              ${budget.spent.toLocaleString()} / ${budget.monthlyLimit.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${statusColors[budget.status]}`}>
            <StatusIcon size={14} />
            <span className="font-bold text-sm">{budget.percentUsed}%</span>
          </div>
          <p className="text-[10px] text-textMuted">
            ${budget.remaining.toLocaleString()} restante
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColors[budget.status]}`}
          style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
        />
      </div>

      {budget.status !== 'safe' && (
        <p className={`text-[10px] mt-2 ${statusColors[budget.status]}`}>
          {budget.status === 'exceeded'
            ? `Excedido por $${(budget.spent - budget.monthlyLimit).toLocaleString()}`
            : `Alerta: ${budget.alertThreshold}% del limite alcanzado`}
        </p>
      )}
    </div>
  );
};

export const Budget: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getBudgetsWithProgress();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleEdit = (budget: BudgetWithProgress) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingBudget(null);
    setShowModal(true);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const alerts = budgets.filter(b => b.status === 'warning' || b.status === 'exceeded');
  const existingCategories = budgets.map(b => b.category);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Presupuestos</h1>
          <p className="text-sm text-textMuted">Controla tus gastos mensuales</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Summary Card */}
      {budgets.length > 0 && (
        <div className="bg-surface rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-1">
                Presupuesto Total
              </p>
              <p className="text-3xl font-extrabold text-white">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-1">
                Gastado
              </p>
              <p className={`text-xl font-bold ${
                overallPercent > 100 ? 'text-red-500' : overallPercent > 80 ? 'text-yellow-500' : 'text-primary'
              }`}>
                ${totalSpent.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercent > 100 ? 'bg-red-500' : overallPercent > 80 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-textMuted">
            <span>{overallPercent}% usado</span>
            <span className={totalRemaining < 0 ? 'text-red-500' : 'text-primary'}>
              {totalRemaining < 0 ? '-' : ''}${Math.abs(totalRemaining).toLocaleString()} restante
            </span>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h3 className="font-bold text-yellow-500">Alertas de Presupuesto</h3>
          </div>
          <div className="space-y-1">
            {alerts.map(alert => (
              <p key={alert.id} className="text-xs text-yellow-200/80">
                {alert.status === 'exceeded'
                  ? `${alert.category}: Excedido por $${(alert.spent - alert.monthlyLimit).toLocaleString()}`
                  : `${alert.category}: ${alert.percentUsed}% usado`
                }
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="bg-surface/50 rounded-3xl border border-white/5 p-8 text-center">
          <PieChart size={48} className="mx-auto mb-3 text-textMuted opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">Sin Presupuestos</h3>
          <p className="text-sm text-textMuted mb-4">
            Crea presupuestos para controlar tus gastos por categoria
          </p>
          <button
            onClick={handleAdd}
            className="bg-primary text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Crear Primer Presupuesto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Por Categoria</h3>
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onClick={() => handleEdit(budget)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBudget(null);
        }}
        onSave={loadBudgets}
        editBudget={editingBudget}
        existingCategories={existingCategories}
      />

      <div className="h-20"></div>
    </div>
  );
};
