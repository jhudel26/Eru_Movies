import React from 'react';
import { 
  Compass, 
  Film, 
  Tv, 
  Bookmark, 
  History, 
  Settings, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  onTabChange, 
  watchlistCount = 0,
  onOpenSettings,
  source
}) {
  const navItems = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark, badge: watchlistCount },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <aside className="w-56 bg-eru-darkest/90 border-r border-eru-teal/15 flex flex-col justify-between p-3 select-none">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-eru-muted mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-eru-teal/15 text-eru-teal border border-eru-teal/30 shadow-teal-glow'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-eru-card/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-eru-teal' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-eru-teal/20 text-eru-teal font-bold border border-eru-teal/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Source Status Card */}
        <div className="p-3 rounded-xl bg-eru-card/50 border border-eru-teal/15 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eru-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-eru-teal"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Active Source
            </span>
          </div>
          <p className="text-xs font-semibold text-eru-teal capitalize">
            {source === 'ridomovie' ? 'RidoMovie (Fast HD)' : 'MoviesFree (Cinezo)'}
          </p>
          <p className="text-[10px] text-slate-400">
            {source === 'ridomovie' ? 'ridomovie.to/rd1' : 'moviesfree.cv/home'}
          </p>
        </div>
      </div>

      {/* Bottom Settings Button */}
      <div className="pt-3 border-t border-slate-800/80 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-eru-card/60 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>

        <div className="px-3 py-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>ERU Desktop v1.0</span>
          <span className="text-eru-teal/80 font-mono">Teal Edition</span>
        </div>
      </div>
    </aside>
  );
}
