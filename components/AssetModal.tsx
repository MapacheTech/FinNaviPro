import React, { useState, useEffect } from 'react';
import { X, Wallet, Loader2, Trash2, Building2, TrendingUp, Bitcoin, Car, Package } from 'lucide-react';
import { assetService, AssetType, AssetInput } from '../services/assetService';
import { Asset } from '../types';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  editAsset?: Asset | null; // If provided, we're editing; otherwise, adding
}

const ASSET_TYPES: { value: AssetType; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Wallet size={18} /> },
  { value: 'investment', label: 'Investment', icon: <TrendingUp size={18} /> },
  { value: 'property', label: 'Property', icon: <Building2 size={18} /> },
  { value: 'crypto', label: 'Crypto', icon: <Bitcoin size={18} /> },
  { value: 'vehicle', label: 'Vehicle', icon: <Car size={18} /> },
  { value: 'other', label: 'Other', icon: <Package size={18} /> },
];

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onUpdate, editAsset }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<AssetType>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editAsset) {
        setName(editAsset.name);
        setValue(editAsset.value.toString());
        setType(editAsset.type as AssetType);
        setNotes('');
      } else {
        setName('');
        setValue('');
        setType('cash');
        setNotes('');
      }
    }
  }, [isOpen, editAsset]);

  const handleSave = async () => {
    if (!name.trim() || !value) return;

    setSaving(true);
    try {
      const assetData: AssetInput = {
        name: name.trim(),
        value: parseFloat(value),
        type,
        notes: notes.trim() || undefined
      };

      if (editAsset) {
        await assetService.updateAsset(editAsset.id, assetData);
      } else {
        await assetService.addAsset(assetData);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editAsset) return;

    setDeleting(true);
    try {
      await assetService.deleteAsset(editAsset.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet size={24} className="text-emerald-500" />
            {editAsset ? 'Edit Asset' : 'Add Asset'}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Asset Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund, 401k"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>

          {/* Asset Value */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-textMuted">$</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-8 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
            </div>
          </div>

          {/* Asset Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_TYPES.map((assetType) => (
                <button
                  key={assetType.value}
                  onClick={() => setType(assetType.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    type === assetType.value
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  {assetType.icon}
                  <span className="text-[10px] font-bold">{assetType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {editAsset && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Trash2 size={18} /> Delete
                </>
              )}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim() || !value || saving}
            className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              editAsset ? 'Update Asset' : 'Add Asset'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
