import React, { useState } from 'react';
import { X, Trash2, Shield, Sparkles, Check, Globe } from 'lucide-react';
import { StorageService } from '../services/storage';

export default function SettingsModal({ onClose, onHistoryCleared, currentSource, onSourceChange }) {
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleSourceSelect = (src) => {
    const updated = StorageService.saveSettings({ defaultSource: src });
    setSettings(updated);
    onSourceChange(src);
  };

  const handleClearHistory = () => {
    StorageService.clearHistory();
    onHistoryCleared();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-eru-bg border border-eru-teal/30 rounded-2xl p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-eru-teal/15">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-eru-teal shadow-teal-glow"></span>
            <h2 className="text-base font-bold text-slate-100">Preferences & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-eru-muted flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-eru-teal" />
            Default Streaming Source
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSourceSelect('ridomovie')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentSource === 'ridomovie'
                  ? 'bg-eru-teal/15 border-eru-teal shadow-teal-glow text-white'
                  : 'bg-eru-card border-slate-800 text-slate-400 hover:border-eru-teal/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-100">RidoMovie</span>
                {currentSource === 'ridomovie' && <Check className="w-4 h-4 text-eru-teal" />}
              </div>
              <p className="text-[11px] text-slate-400">ridomovie.to (Fast Closeload streams)</p>
            </button>

            <button
              onClick={() => handleSourceSelect('moviesfree')}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentSource === 'moviesfree'
                  ? 'bg-eru-teal/15 border-eru-teal shadow-teal-glow text-white'
                  : 'bg-eru-card border-slate-800 text-slate-400 hover:border-eru-teal/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-100">MoviesFree</span>
                {currentSource === 'moviesfree' && <Check className="w-4 h-4 text-eru-teal" />}
              </div>
              <p className="text-[11px] text-slate-400">moviesfree.cv (Cinezo & Multi-server)</p>
            </button>
          </div>
        </div>

        {/* Clear History */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-bold uppercase tracking-wider text-eru-muted">
            Data & Privacy
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-eru-card/50 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-200">Watch History</p>
              <p className="text-[11px] text-slate-400">Remove all recently watched records</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
          {clearedNotice && (
            <p className="text-xs text-eru-teal font-medium text-right">Watch history cleared!</p>
          )}
        </div>

        {/* About App */}
        <div className="p-4 rounded-xl bg-eru-card/70 border border-eru-teal/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider teal-gradient-text">ERU DESKTOP</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-eru-teal/20 text-eru-teal font-mono">v1.0.0</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cinema-grade desktop streaming platform engineered for movie & TV show enthusiasts with modern Teal UI/UX.
          </p>
        </div>
      </div>
    </div>
  );
}
