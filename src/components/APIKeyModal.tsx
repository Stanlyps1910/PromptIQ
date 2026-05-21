'use client';

import { useState, useEffect } from 'react';
import { Key, X, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function APIKeyModal({ isOpen, onClose }: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('promptiq-api-key') || '';
      setApiKey(stored);
      setSaved(!!stored);
      setError('');
      setShowKey(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API key cannot be empty');
      return;
    }
    if (trimmed.length < 10) {
      setError('API key appears to be too short');
      return;
    }
    localStorage.setItem('promptiq-api-key', trimmed);
    setSaved(true);
    setError('');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('promptiq-api-key');
    setApiKey('');
    setSaved(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">API Key Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Mistral API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="Enter your Mistral API key..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}

          {saved && !error && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              API key saved successfully
            </div>
          )}

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your API key is stored locally in your browser and is only sent to the Mistral API during evaluation. It is never stored on any server.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Save Key
            </button>
            {apiKey && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
