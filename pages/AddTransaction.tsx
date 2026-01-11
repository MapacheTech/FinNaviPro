import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Check, Loader2, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { parseReceipt } from '../services/geminiService';

export const AddTransaction: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('General');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result?.toString().replace(/^data:image\/(.*);base64,/, '');
        if (base64String) {
            const data = await parseReceipt(base64String);
            if (data) {
                if (data.amount) setAmount(data.amount.toString());
                if (data.merchant) setNote(data.merchant);
                if (data.date) setDate(data.date);
                if (data.category) setCategory(data.category);
                if (data.type) setType(data.type.toLowerCase() === 'income' ? 'income' : 'expense');
            }
        }
        setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
      // Logic to save would go here (update Mock Data or Context)
      setSuccess(true);
      setTimeout(() => {
          navigate('/');
      }, 1500);
  };

  return (
    <div className="min-h-full pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-2">
            <button onClick={() => navigate(-1)} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">{t('add.title')}</h1>
        </div>

        {/* Type Toggle */}
        <div className="bg-surfaceHighlight p-1.5 rounded-2xl flex mb-8">
           <button 
             onClick={() => setType('expense')}
             className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-red-500/90 text-white shadow-lg' : 'text-textMuted hover:text-white'}`}
           >
             {t('add.expense')}
           </button>
           <button 
             onClick={() => setType('income')}
             className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-primary text-black shadow-neon-green' : 'text-textMuted hover:text-white'}`}
           >
             {t('add.income')}
           </button>
       </div>

       {/* Scan Section */}
       <div className="mb-8">
           <div className="border-2 border-dashed border-white/10 rounded-3xl p-6 bg-surface/30 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-white/20 transition-colors">
               
               {isAnalyzing && (
                   <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                       <Loader2 size={32} className="text-primary animate-spin mb-2" />
                       <p className="text-sm font-bold text-white animate-pulse">{t('add.analyzing')}</p>
                   </div>
               )}

               <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Camera size={32} className="text-primary" />
               </div>
               <h3 className="font-bold text-white mb-1">{t('add.scan_title')}</h3>
               <p className="text-xs text-textMuted mb-4 max-w-[200px]">{t('add.scan_desc')}</p>
               
               <div className="flex gap-3 w-full">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Upload size={16} /> {t('add.upload')}
                    </button>
                    <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex-1 bg-white text-black text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <Camera size={16} /> {t('add.camera')}
                    </button>
               </div>

               <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   capture="environment"
                   onChange={handleFileSelect}
               />
           </div>
       </div>

       {/* Manual Form */}
       <div className="space-y-4 animate-in slide-in-from-bottom-5">
           <p className="text-xs font-bold text-textMuted uppercase tracking-wider ml-1">{t('add.manual')}</p>
           
           <div className="relative">
               <span className="absolute left-4 top-4 text-textMuted">
                   <DollarSign size={20} />
               </span>
               <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-primary placeholder-white/10"
               />
               <span className="absolute right-4 top-5 text-xs font-bold text-textMuted">{t('add.amount')}</span>
           </div>

           <div className="flex gap-4">
               <div className="flex-1 relative">
                   <span className="absolute left-4 top-3.5 text-textMuted">
                       <Tag size={18} />
                   </span>
                   <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                   >
                       <option>General</option>
                       <option>Food</option>
                       <option>Transport</option>
                       <option>Utilities</option>
                       <option>Entertainment</option>
                       <option>Salary</option>
                       <option>Freelance</option>
                   </select>
               </div>
               
               <div className="flex-1 relative">
                   <span className="absolute left-4 top-3.5 text-textMuted">
                       <Calendar size={18} />
                   </span>
                   <input 
                       type="date"
                       value={date}
                       onChange={(e) => setDate(e.target.value)}
                       className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                   />
               </div>
           </div>

           <div className="relative">
               <span className="absolute left-4 top-4 text-textMuted">
                   <FileText size={20} />
               </span>
               <input 
                   type="text" 
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   placeholder={t('add.note')}
                   className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
               />
           </div>

           <button 
                onClick={handleSave}
                disabled={!amount || success}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 ${
                    success ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                }`}
           >
                {success ? (
                    <><Check size={24} /> {t('add.success')}</>
                ) : (
                    t('add.save')
                )}
           </button>
       </div>
    </div>
  );
};