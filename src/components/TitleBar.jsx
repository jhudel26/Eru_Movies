import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, Copy, X, Search, Clapperboard } from 'lucide-react';
import { ApiService } from '../services/api';

export default function TitleBar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isLoading = false
}) {
  const [isMax, setIsMax] = useState(false);
  const [iconError, setIconError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Sync initial maximize state
    if (ApiService.isElectron) {
      ApiService.isMaximized().then(maximized => setIsMax(Boolean(maximized)));
    }
    const unsub = ApiService.onMaximizeChange((maximized) => setIsMax(maximized));
    return () => unsub?.();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearchSubmit(searchQuery);
    if (e.key === 'Escape') {
      setSearchQuery('');
      onSearchSubmit('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearchSubmit('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative h-[68px] bg-eru-bg-deep flex items-center justify-between px-6 z-50 select-none app-drag-region">
      {/* Brand — Left */}
      <div className="flex items-center gap-3.5 app-no-drag shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-eru-surface-2 to-eru-surface-1 border border-eru-teal/35 shadow-teal-glow-sm shrink-0">
          {!iconError ? (
            <img
              src="./icon.png"
              alt="ERU"
              className="w-7 h-7 object-contain rounded-lg"
              onError={() => setIconError(true)}
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-eru-teal" />
            </div>
          )}
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="font-black text-[19px] tracking-[0.22em] teal-gradient-text leading-none">ERU</span>
            <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-eru-teal/15 text-eru-teal font-extrabold uppercase tracking-wider border border-eru-teal/30 leading-none shadow-teal-glow-sm">
              Cinema
            </span>
          </div>
          <span className="text-[8.5px] text-eru-text-muted tracking-[0.18em] uppercase leading-none mt-1 font-semibold">
            Entertainment Retrieval Unlimited
          </span>
        </div>
      </div>

      {/* Search — center */}
      <div className="flex-1 max-w-xl mx-8 app-no-drag">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-eru-teal-muted absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, TV shows, genres..."
            className="w-full h-10 pl-11 pr-10 text-[13px] bg-eru-surface-1/90 border border-eru-border hover:border-eru-teal/40 focus:border-eru-teal/70 rounded-xl text-eru-text-primary placeholder-eru-text-muted outline-none transition-all focus:ring-2 focus:ring-eru-teal/20 focus:bg-eru-surface-2 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-md text-eru-text-muted hover:text-white hover:bg-eru-surface-3 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1 app-no-drag">
        <button
          onClick={() => ApiService.minimize()}
          className="w-8 h-8 flex items-center justify-center text-eru-text-muted hover:text-white hover:bg-eru-surface-2 rounded-lg transition-all"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => ApiService.maximize()}
          className="w-8 h-8 flex items-center justify-center text-eru-text-muted hover:text-white hover:bg-eru-surface-2 rounded-lg transition-all"
          title={isMax ? 'Restore' : 'Maximize'}
        >
          {isMax ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={() => ApiService.close()}
          className="w-8 h-8 flex items-center justify-center text-eru-text-muted hover:text-white hover:bg-eru-error rounded-lg transition-all"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="loading-bar w-full h-full" />
        </div>
      )}
    </div>
  );
}
