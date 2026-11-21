import React from 'react';
import {
  Compass,
  Film,
  Tv,
  Bookmark,
  History,
  Settings,
  BookmarkCheck,
  Clock
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  onTabChange,
  watchlistCount = 0,
  onOpenSettings
}) {
  const navItems = [
    { id: 'discover',  label: 'Discover',   icon: Compass,   iconActive: Compass },
    { id: 'movies',    label: 'Movies',      icon: Film,      iconActive: Film },
    { id: 'tv',        label: 'TV Shows',    icon: Tv,        iconActive: Tv },
    { id: 'watchlist', label: 'Watchlist',   icon: Bookmark,  iconActive: BookmarkCheck, badge: watchlistCount },
    { id: 'history',   label: 'History',     icon: History,   iconActive: Clock },
  ];

  return (
    <aside className="w-56 bg-eru-bg-deep flex flex-col justify-between py-4 select-none shrink-0 border-r border-eru-border-subtle/50">
      <div>
        {/* Navigation Items — starts clean at top */}
        <nav className="space-y-1 px-3 pt-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = isActive ? item.iconActive : item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-eru-teal/15 text-eru-teal border border-eru-teal/30 shadow-teal-glow-sm font-bold'
                    : 'text-eru-text-muted hover:text-eru-text-primary hover:bg-eru-surface-1 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-eru-teal' : 'text-eru-text-muted group-hover:text-eru-teal'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-eru-teal text-slate-950 font-extrabold leading-none shadow-teal-glow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom — Settings & version */}
      <div className="px-2.5 space-y-2">
        <div className="border-t border-eru-border-subtle/80 mb-2" />
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 text-eru-text-muted hover:text-eru-text-primary hover:bg-eru-surface-1 group border border-transparent"
        >
          <Settings className="w-4.5 h-4.5 text-eru-text-muted group-hover:text-eru-teal transition-transform group-hover:rotate-45 duration-300" />
          <span>Settings</span>
        </button>
        <div className="px-3 pt-1 flex items-center justify-between text-[10px] text-eru-text-disabled font-mono">
          <span>ERU v1.0.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-eru-teal shadow-teal-glow-sm animate-pulse-teal" />
        </div>
      </div>
    </aside>
  );
}
