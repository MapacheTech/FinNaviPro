import React, { useState, useEffect } from 'react';
import { X, Trophy, Calendar, Target, Users, Loader2, Check } from 'lucide-react';
import { socialService, ChallengeType, ChallengeInput } from '../services/socialService';
import { Friend } from '../types';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CHALLENGE_TYPES: { value: ChallengeType; label: string; description: string }[] = [
  { value: 'savings', label: 'Savings', description: 'Save a specific amount' },
  { value: 'no_spend', label: 'No Spend', description: 'Avoid spending on a category' },
  { value: 'debt_payoff', label: 'Debt Payoff', description: 'Pay off debt together' },
  { value: 'custom', label: 'Custom', description: 'Create your own goal' },
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [challengeType, setChallengeType] = useState<ChallengeType>('savings');
  const [endDate, setEndDate] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      resetForm();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendsData = await socialService.getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTarget('');
    setChallengeType('savings');
    setEndDate('');
    setSelectedFriends([]);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !target.trim() || !endDate) return;

    setCreating(true);
    try {
      const input: ChallengeInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        target: target.trim(),
        challengeType,
        endDate,
        participantIds: selectedFriends.length > 0 ? selectedFriends : undefined
      };

      const challengeId = await socialService.createChallenge(input);
      if (challengeId) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    } finally {
      setCreating(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy size={24} className="text-orange-500" />
            New Challenge
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., No Coffee November"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>

          {/* Challenge Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChallengeType(type.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                    challengeType === type.value
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-bold">{type.label}</span>
                  <span className="text-[10px] opacity-70">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Target size={14} /> Goal/Target
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., Save $500, No eating out for 30 days"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about the challenge..."
              rows={2}
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20 resize-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={getMinDate()}
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Invite Friends */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> Invite Friends (optional)
            </label>

            {loadingFriends ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-xs text-textMuted py-2">No friends to invite yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-primary/20 border-primary text-white'
                          : 'bg-surfaceHighlight border-white/10 text-textMuted hover:border-white/20'
                      }`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatarSeed}`}
                        alt={friend.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs font-bold">{friend.name}</span>
                      {isSelected && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || !target.trim() || !endDate}
          className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Trophy size={18} />
              Start Challenge
            </>
          )}
        </button>
      </div>
    </div>
  );
};
