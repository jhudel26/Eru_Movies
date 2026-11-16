import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Search, Clapperboard, Globe } from 'lucide-react';
import { ApiService } from '../services/api';

export default function TitleBar({ 
  source, 
  onSourceChange, 
  searchQuery, 
  setSearchQuery, 
  onSearchSubmit,
  onOpenSettings
}) {
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    const unsub = ApiService.onMaximizeChange((maximized) => {
      setIsMax(maximized);
    });
    return () => unsub?.();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <div className="h-11 bg-eru-darkest/95 border-b border-eru-teal/15 flex items-center justify-between px-3 z-50 select-none app-drag-region">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5 app-no-drag">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-eru-card border border-eru-teal/30 shadow-teal-glow">
          <img src="./icon.png" alt="ERU" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          <Clapperboard className="w-3.5 h-3.5 text-eru-teal absolute" style={{ display: 'none' }} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-wider teal-gradient-text">ERU</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-eru-teal/10 text-eru-teal border border-eru-teal/20">
            CINEMA
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-4 app-no-drag">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, TV shows, actors..."
            className="w-full h-7 pl-8 pr-3 text-xs bg-eru-card/90 border border-eru-teal/20 focus:border-eru-teal/60 rounded-full text-slate-200 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-eru-teal/40"
          />
        </div>
      </div>

      {/* Right Controls: Source selector & Window buttons */}
      <div className="flex items-center gap-2 app-no-drag">
        {/* Source Switcher Pill */}
        <div className="flex items-center gap-1 bg-eru-card/80 p-0.5 rounded-full border border-eru-teal/20 text-[11px]">
          <button
            onClick={() => onSourceChange('ridomovie')}
            className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
              source === 'ridomovie'
                ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RidoMovie
          </button>
          <button
            onClick={() => onSourceChange('moviesfree')}
            className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
              source === 'moviesfree'
                ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MoviesFree
          </button>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
          <button
            onClick={() => ApiService.minimize()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => ApiService.maximize()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded transition-colors"
            title={isMax ? "Restore" : "Maximize"}
          >
            {isMax ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={() => ApiService.close()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 rounded transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
