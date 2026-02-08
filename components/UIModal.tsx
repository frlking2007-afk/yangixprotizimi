
import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

interface UIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  title: string;
  description?: string;
  type: 'input' | 'confirm' | 'password';
  initialValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const UIModal: React.FC<UIModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type,
  initialValue = '',
  placeholder = '',
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  isDanger = false,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(inputValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-3 rounded-2xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {isDanger ? <AlertCircle size={24} /> : <Info size={24} />}
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter leading-tight">
            {title}
          </h3>
          
          {description && (
            <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm mb-6">
              {description}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {(type === 'input' || type === 'password') && (
              <input
                autoFocus
                type={type === 'password' ? 'password' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-300 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className={`flex-1 px-6 py-4 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg ${
                  isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                } active:scale-95`}
              >
                {confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UIModal;
