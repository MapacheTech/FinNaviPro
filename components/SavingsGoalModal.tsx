import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '../types';
import { X, Plus, PiggyBank, Trash2, Loader2 } from 'lucide-react';
import { savingsService, SavingsGoalInput } from '../services/savingsService';
import { profileService } from '../services/profileService';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [originalGoals, setOriginalGoals] = useState<SavingsGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({ name: '', targetAmount: 1000, monthlyAllocation: 50, emoji: '🎯' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freeSpendingPower, setFreeSpendingPower] = useState(0);
  const [goalsToDelete, setGoalsToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, profile] = await Promise.all([
        savingsService.getGoals(),
        profileService.getProfile()
      ]);
      setGoals(goalsData);
      setOriginalGoals(JSON.parse(JSON.stringify(goalsData)));
      setFreeSpendingPower(profile?.freeSpendingPower || 0);
      setGoalsToDelete([]);
    } catch (error) {
      console.error('Error loading savings data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const currentTotalAllocation = goals.reduce((sum, g) => sum + g.monthlyAllocation, 0);
  // freeSpendingPower is the BASE power before these allocations
  const remainingBudget = freeSpendingPower - currentTotalAllocation;

  const handleAllocationChange = (id: string, newAmount: number) => {
    setGoals(prev => prev.map(g =>
        g.id === id ? { ...g, monthlyAllocation: newAmount } : g
    ));
  };

  const handleDelete = (id: string) => {
    // Check if this is an existing goal (has a real ID) or a new one
    const goalToDelete = goals.find(g => g.id === id);
    if (goalToDelete && !id.startsWith('temp-')) {
      setGoalsToDelete(prev => [...prev, id]);
    }
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Delete removed goals
      for (const id of goalsToDelete) {
        await savingsService.deleteGoal(id);
      }

      // 2. Process each goal
      for (const goal of goals) {
        const originalGoal = originalGoals.find(og => og.id === goal.id);

        if (goal.id.startsWith('temp-')) {
          // New goal - create it
          const input: SavingsGoalInput = {
            name: goal.name,
            emoji: goal.emoji,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            monthlyAllocation: goal.monthlyAllocation
          };
          await savingsService.createGoal(input);
        } else if (originalGoal) {
          // Existing goal - check if it changed
          if (
            originalGoal.monthlyAllocation !== goal.monthlyAllocation ||
            originalGoal.targetAmount !== goal.targetAmount ||
            originalGoal.name !== goal.name ||
            originalGoal.emoji !== goal.emoji
          ) {
            await savingsService.updateGoal(goal.id, {
              name: goal.name,
              emoji: goal.emoji,
              targetAmount: goal.targetAmount,
              monthlyAllocation: goal.monthlyAllocation
            });
          }
        }
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.name) return;
    const goal: SavingsGoal = {
        id: `temp-${Date.now()}`, // Temporary ID for new goals
        name: newGoal.name,
        targetAmount: newGoal.targetAmount || 1000,
        currentAmount: 0,
        monthlyAllocation: newGoal.monthlyAllocation || 50,
        emoji: newGoal.emoji || '💰'
    };
    setGoals([...goals, goal]);
    setIsAdding(false);
    setNewGoal({ name: '', targetAmount: 1000, monthlyAllocation: 50, emoji: '🎯' });
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <PiggyBank size={24} className="text-primary" />
                      Save for Goals
                  </h2>
                  <button onClick={onClose}><X size={20} className="text-textMuted hover:text-white" /></button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Budget Summary */}
                  <div className="bg-surfaceHighlight rounded-2xl p-4 mb-6 flex justify-between items-center border border-white/5 relative overflow-hidden">
                      <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-300 ${remainingBudget < 0 ? 'bg-red-500/10' : ''}`} />
                      <div className="relative z-10">
                          <p className="text-xs text-textMuted font-bold uppercase tracking-wide">Remaining Free Power</p>
                          <p className={`text-3xl font-extrabold transition-colors ${remainingBudget < 0 ? 'text-red-500' : 'text-white'}`}>
                              ${remainingBudget.toLocaleString()}
                          </p>
                      </div>
                      <div className="relative z-10 text-right">
                          <p className="text-xs text-textMuted font-bold uppercase tracking-wide">Allocated</p>
                          <p className="text-xl font-bold text-primary">${currentTotalAllocation.toLocaleString()}</p>
                      </div>
                  </div>

                  {/* Goals List */}
                  <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                      {goals.map(goal => (
                          <div key={goal.id} className="bg-black/20 rounded-2xl p-4 border border-white/5 group">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-surfaceHighlight flex items-center justify-center text-2xl border border-white/5">
                                          {goal.emoji}
                                      </div>
                                      <div>
                                          <p className="font-bold text-sm text-white">{goal.name}</p>
                                          <p className="text-[10px] text-textMuted">
                                              ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                      <span className="text-sm font-bold text-primary">+${goal.monthlyAllocation}</span>
                                      <button onClick={() => handleDelete(goal.id)} className="text-textMuted hover:text-red-500">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>

                              <input
                                  type="range"
                                  min="0"
                                  max={freeSpendingPower}
                                  step="10"
                                  value={goal.monthlyAllocation}
                                  onChange={(e) => handleAllocationChange(goal.id, parseInt(e.target.value))}
                                  className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                              <div className="flex justify-between text-[10px] text-textMuted mt-1 px-1">
                                  <span>$0</span>
                                  <span>Monthly Allocation</span>
                              </div>
                          </div>
                      ))}

                      {goals.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-textMuted">
                          <PiggyBank size={48} className="mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No savings goals yet</p>
                          <p className="text-xs mt-1">Add one to start saving!</p>
                        </div>
                      )}

                      {isAdding ? (
                          <div className="bg-surfaceHighlight rounded-2xl p-4 border border-dashed border-white/20 animate-in fade-in zoom-in-95">
                               <div className="flex gap-2 mb-2">
                                   <input
                                      placeholder="Name"
                                      className="flex-1 bg-surface border border-white/10 rounded-xl p-2 text-sm focus:outline-none focus:border-primary"
                                      value={newGoal.name}
                                      onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                                      autoFocus
                                   />
                                   <input
                                      placeholder="Emoji"
                                      className="w-12 bg-surface border border-white/10 rounded-xl p-2 text-sm text-center focus:outline-none focus:border-primary"
                                      value={newGoal.emoji}
                                      onChange={e => setNewGoal({...newGoal, emoji: e.target.value})}
                                   />
                               </div>
                               <div className="flex gap-2 mb-3">
                                   <div className="flex-1 relative">
                                        <span className="absolute left-3 top-2 text-textMuted text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Target"
                                            className="w-full bg-surface border border-white/10 rounded-xl p-2 pl-6 text-sm focus:outline-none focus:border-primary"
                                            value={newGoal.targetAmount || ''}
                                            onChange={e => setNewGoal({...newGoal, targetAmount: parseInt(e.target.value)})}
                                        />
                                   </div>
                                   <div className="flex-1 relative">
                                        <span className="absolute left-3 top-2 text-textMuted text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Monthly"
                                            className="w-full bg-surface border border-white/10 rounded-xl p-2 pl-6 text-sm focus:outline-none focus:border-primary"
                                            value={newGoal.monthlyAllocation || ''}
                                            onChange={e => setNewGoal({...newGoal, monthlyAllocation: parseInt(e.target.value)})}
                                        />
                                   </div>
                               </div>
                               <div className="flex gap-2">
                                   <button onClick={handleAddGoal} className="flex-1 bg-primary text-black text-xs font-bold py-2.5 rounded-xl hover:opacity-90">Add Goal</button>
                                   <button onClick={() => setIsAdding(false)} className="flex-1 bg-white/5 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-white/10">Cancel</button>
                               </div>
                          </div>
                      ) : (
                          <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-textMuted hover:bg-white/5 hover:text-white transition-all"
                          >
                              <Plus size={18} /> Add New Goal
                          </button>
                      )}
                  </div>

                  <button
                      onClick={handleSave}
                      disabled={remainingBudget < 0 || saving}
                      className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : remainingBudget < 0 ? (
                        'Over Budget!'
                      ) : (
                        'Confirm Allocation'
                      )}
                  </button>
                </>
              )}
          </div>
      </div>
  );
};
