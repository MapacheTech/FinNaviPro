import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Star, Camera } from 'lucide-react';
import { profileService } from '../services/profileService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentName: string;
  currentCreditScore: number;
}

// DiceBear avatar styles
const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'shapes',
  'thumbs'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentName,
  currentCreditScore
}) => {
  const [name, setName] = useState(currentName);
  const [creditScore, setCreditScore] = useState(currentCreditScore.toString());
  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [avatarSeed, setAvatarSeed] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setCreditScore(currentCreditScore.toString());
      setAvatarSeed(currentName);
      // Load saved avatar style from localStorage
      const savedStyle = localStorage.getItem('avatarStyle');
      if (savedStyle) {
        setAvatarStyle(savedStyle);
      }
    }
  }, [isOpen, currentName, currentCreditScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const score = Math.min(850, Math.max(300, parseInt(creditScore) || 0));

      const success = await profileService.updateProfile({
        name: name.trim(),
        credit_score: score
      });

      if (success) {
        // Save avatar preferences to localStorage
        localStorage.setItem('avatarStyle', avatarStyle);
        localStorage.setItem('avatarSeed', name.trim());
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a2e`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Perfil</h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={getAvatarUrl(avatarStyle, avatarSeed || name)}
                alt="Avatar"
                className="w-24 h-24 rounded-full bg-surfaceHighlight border-2 border-primary"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black hover:bg-primary/90 transition-colors"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-xs text-textMuted mt-2">Toca para cambiar avatar</p>
          </div>

          {/* Avatar Style Picker */}
          {showAvatarPicker && (
            <div className="bg-surfaceHighlight rounded-xl p-3 border border-white/10">
              <p className="text-xs font-bold text-textMuted uppercase mb-2">Estilo de Avatar</p>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setAvatarStyle(style);
                      setShowAvatarPicker(false);
                    }}
                    className={`p-1 rounded-lg border transition-all ${
                      avatarStyle === style
                        ? 'border-primary bg-primary/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(style, name || 'user')}
                      alt={style}
                      className="w-10 h-10 rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">
              Nombre
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-3.5 text-textMuted" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAvatarSeed(e.target.value);
                }}
                placeholder="Tu nombre"
                required
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-11 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Credit Score Input */}
          <div>
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2 block">
              Credit Score
            </label>
            <div className="relative">
              <Star size={18} className="absolute left-4 top-3.5 text-textMuted" />
              <input
                type="number"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                placeholder="750"
                min="300"
                max="850"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-11 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-[10px] text-textMuted mt-1">
              Rango: 300 - 850. Actualiza esto cuando revises tu score.
            </p>
          </div>

          {/* Credit Score Visual */}
          {creditScore && (
            <div className="bg-surfaceHighlight rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-textMuted">Tu Score</span>
                <span className={`text-lg font-extrabold ${
                  parseInt(creditScore) >= 800 ? 'text-primary' :
                  parseInt(creditScore) >= 700 ? 'text-green-500' :
                  parseInt(creditScore) >= 600 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {creditScore}
                </span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    parseInt(creditScore) >= 800 ? 'bg-primary' :
                    parseInt(creditScore) >= 700 ? 'bg-green-500' :
                    parseInt(creditScore) >= 600 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${((parseInt(creditScore) || 300) - 300) / 550 * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-textMuted mt-1">
                <span>300</span>
                <span>
                  {parseInt(creditScore) >= 800 ? 'Excelente' :
                   parseInt(creditScore) >= 700 ? 'Bueno' :
                   parseInt(creditScore) >= 600 ? 'Regular' :
                   'Necesita Mejora'}
                </span>
                <span>850</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-4 bg-primary text-black rounded-xl font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
