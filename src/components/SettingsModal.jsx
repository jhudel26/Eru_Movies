import React, { useState } from 'react';
import { X, Trash2, Zap, Keyboard, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { StorageService } from '../services/storage';

export default function SettingsModal({ onClose, onHistoryCleared }) {
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearHistory = () => {
    StorageService.clearHistory();
    onHistoryCleared();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  const toggleAutoplay = () => {
    const updated = StorageService.saveSettings({ autoplayNext: !settings.autoplayNext });
    setSettings(updated);
  };

  const toggleHideUnavailable = () => {
    const updated = StorageService.saveSettings({ hideUnavailable: !settings.hideUnavailable });
    setSettings(updated);
  };

  const SHORTCUTS = [
    { key: 'Esc',   desc: 'Back / Close panel' },
    { key: 'F',     desc: 'Toggle fullscreen' },
    { key: 'N',     desc: 'Next episode (TV)' },
    { key: 'P',     desc: 'Previous episode (TV)' },
    { key: 'R',     desc: 'Reload stream' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eru-bg-deep/85 backdrop-blur-xl select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-eru-bg border border-eru-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-eru-border-subtle bg-eru-bg-deep/50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-eru-teal shadow-teal-glow-sm" />
            <h2 className="text-base font-bold text-white tracking-tight">Settings & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-eru-text-muted hover:text-white hover:bg-eru-surface-1 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto custom-scrollbar">

          {/* Playback */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-eru-teal flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" /> Playback
            </h3>
            <div className="p-4 rounded-xl bg-eru-surface-1 border border-eru-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Autoplay Next Episode</p>
                  <p className="text-[11px] text-eru-text-muted mt-0.5">Automatically advance to the next TV episode when finished</p>
                </div>
                <button onClick={toggleAutoplay} className="shrink-0 hover:scale-105 active:scale-95 transition-transform">
                  {settings.autoplayNext
                    ? <ToggleRight className="w-8 h-8 text-eru-teal drop-shadow" />
                    : <ToggleLeft className="w-8 h-8 text-eru-text-muted" />
                  }
                </button>
              </div>
            </div>
          </section>

          {/* Catalog & Content */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-eru-teal flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Catalog & Availability
            </h3>
            <div className="p-4 rounded-xl bg-eru-surface-1 border border-eru-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Hide Unreleased & In-Theaters Only Titles</p>
                  <p className="text-[11px] text-eru-text-muted mt-0.5">Filter out future movies and titles without an active online stream</p>
                </div>
                <button onClick={toggleHideUnavailable} className="shrink-0 hover:scale-105 active:scale-95 transition-transform">
                  {settings.hideUnavailable
                    ? <ToggleRight className="w-8 h-8 text-eru-teal drop-shadow" />
                    : <ToggleLeft className="w-8 h-8 text-eru-text-muted" />
                  }
                </button>
              </div>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-eru-teal flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
            </h3>
            <div className="rounded-xl bg-eru-surface-1 border border-eru-border/80 overflow-hidden">
              {SHORTCUTS.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 ${i < SHORTCUTS.length - 1 ? 'border-b border-eru-border-subtle' : ''}`}
                >
                  <span className="text-[13px] text-eru-text-secondary">{s.desc}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-eru-bg-deep border border-eru-border text-[11px] font-mono font-bold text-eru-teal shadow-inner">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-eru-teal flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Data & Storage
            </h3>
            <div className="p-4 rounded-xl bg-eru-surface-1 border border-eru-border/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Watch History</p>
                  <p className="text-[11px] text-eru-text-muted mt-0.5">
                    {StorageService.getHistory().length} items stored in local cache (max 60)
                  </p>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-eru-error/10 hover:bg-eru-error/25 text-eru-error border border-eru-error/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
              {clearedNotice && (
                <p className="text-xs text-eru-teal font-medium mt-2.5 flex items-center gap-1">
                  ✓ Watch history cleared successfully
                </p>
              )}
            </div>
          </section>

          {/* About */}
          <section>
            <div className="p-4 rounded-xl bg-gradient-to-br from-eru-teal-deep/30 to-eru-surface-1 border border-eru-teal/20 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest teal-gradient-text">ERU CINEMA</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-eru-teal/15 text-eru-teal font-mono border border-eru-teal/20">v1.0.0</span>
              </div>
              <p className="text-[12px] text-eru-text-secondary leading-relaxed">
                Entertainment Retrieval Unlimited — High-performance desktop streaming platform.
              </p>
              <p className="text-[10.5px] text-eru-text-muted">Built with Electron · React 19 · Vite · Tailwind CSS</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
