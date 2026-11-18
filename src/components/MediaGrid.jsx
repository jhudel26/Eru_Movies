import React, { useState, useMemo, useEffect } from 'react';
import MediaCard from './MediaCard';
import { Film, Search, Clock, Bookmark, Trash2, ArrowRight } from 'lucide-react';

// Derive genre list from actual items, with defaults as fallback
function deriveGenres(items) {
  const fromData = new Set();
  items.forEach(item => {
    if (item.genres && item.genres.length > 0) {
      item.genres.forEach(g => { if (g && g.length > 1) fromData.add(g); });
    }
  });
  if (fromData.size > 3) return ['All', ...Array.from(fromData).slice(0, 10)];
  return ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Horror', 'Adventure', 'Animation'];
}

export default function MediaGrid({
  title,
  items = [],
  loading = false,
  onPlay,
  onOpenDetail,
  onToggleWatchlist,
  isWatchlisted,
  showFilters = true,
  tabType = 'discover',
  onRemoveHistory,
  onClearHistory,
  onNavigateDiscover
}) {
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Reset genre selection when navigating to a different tab or search
  useEffect(() => {
    setSelectedGenre('All');
  }, [tabType]);

  const genres = useMemo(() => deriveGenres(items), [items]);

  const filteredItems = useMemo(() => {
    if (selectedGenre === 'All') return items;
    return items.filter(item => {
      if (!item.genres || item.genres.length === 0) return false;
      return item.genres.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
    });
  }, [items, selectedGenre]);

  const isHistoryTab = tabType === 'history';
  const isWatchlistTab = tabType === 'watchlist';

  return (
    <section className="space-y-4">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-[3px] h-5 rounded-full bg-eru-teal shadow-teal-glow-sm" />
          <h2 className="text-[17px] font-bold text-eru-text-primary tracking-tight">
            {title}
          </h2>
          {!loading && items.length > 0 && (
            <span className="text-xs text-eru-text-muted font-medium">
              ({filteredItems.length})
            </span>
          )}
        </div>

        {/* Right side: Clear History button OR Genre filters */}
        <div className="flex items-center gap-2">
          {isHistoryTab && !loading && items.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-eru-surface-1 hover:bg-eru-error/15 text-eru-text-muted hover:text-eru-error border border-eru-border hover:border-eru-error/40 text-xs font-semibold transition-all"
              title="Clear all watch history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          {showFilters && !loading && items.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow-sm scale-105'
                      : 'bg-eru-surface-1 text-eru-text-muted hover:text-eru-text-secondary border border-eru-border/60 hover:border-eru-teal/40'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid / Skeletons / Empty */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="relative flex flex-col rounded-xl overflow-hidden glass-card border border-eru-border/60"
            >
              {/* Poster Skeleton with top badges mirror */}
              <div className="relative aspect-[2/3] w-full bg-eru-surface-1 overflow-hidden">
                <div className="absolute inset-0 skeleton" />
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                  <div className="w-9 h-4 rounded-md skeleton border border-white/5" />
                  <div className="w-7 h-4 rounded-md skeleton border border-white/5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-eru-bg-deep via-transparent to-black/20 opacity-70" />
              </div>

              {/* Title & Metadata Skeletons */}
              <div className="p-2.5 sm:p-3 space-y-2 bg-eru-surface-1/30">
                <div className="h-3.5 w-4/5 rounded-md skeleton" />
                <div className="flex items-center justify-between pt-0.5">
                  <div className="h-2.5 w-8 rounded skeleton" />
                  <div className="h-2.5 w-12 rounded skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
          {filteredItems.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={onPlay}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              isWatchlisted={isWatchlisted}
              onRemoveHistory={isHistoryTab ? onRemoveHistory : undefined}
              isHistory={isHistoryTab}
            />
          ))}
        </div>
      ) : (
        /* Empty States */
        <div className="py-20 text-center space-y-4 glass-panel rounded-2xl border border-eru-border/60">
          {isHistoryTab ? (
            <div className="space-y-3 max-w-sm mx-auto px-4">
              <div className="w-12 h-12 rounded-2xl bg-eru-surface-1 border border-eru-border flex items-center justify-center mx-auto text-eru-teal">
                <Clock className="w-6 h-6 stroke-1.5" />
              </div>
              <h3 className="text-base font-bold text-eru-text-primary">No Watch History Yet</h3>
              <p className="text-xs text-eru-text-muted leading-relaxed">
                Movies and TV episodes you watch will appear here so you can easily pick up where you left off.
              </p>
              {onNavigateDiscover && (
                <button
                  onClick={onNavigateDiscover}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-eru-teal text-slate-950 font-bold text-xs shadow-teal-glow-sm hover:bg-eru-teal-bright transition-all"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : isWatchlistTab ? (
            <div className="space-y-3 max-w-sm mx-auto px-4">
              <div className="w-12 h-12 rounded-2xl bg-eru-surface-1 border border-eru-border flex items-center justify-center mx-auto text-eru-teal">
                <Bookmark className="w-6 h-6 stroke-1.5" />
              </div>
              <h3 className="text-base font-bold text-eru-text-primary">Your Watchlist is Empty</h3>
              <p className="text-xs text-eru-text-muted leading-relaxed">
                Save movies and TV shows to your watchlist by clicking the bookmark icon on any card.
              </p>
              {onNavigateDiscover && (
                <button
                  onClick={onNavigateDiscover}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-eru-teal text-slate-950 font-bold text-xs shadow-teal-glow-sm hover:bg-eru-teal-bright transition-all"
                >
                  <span>Find Movies to Watch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : selectedGenre !== 'All' ? (
            <div className="space-y-3">
              <Film className="w-10 h-10 text-eru-teal-muted mx-auto stroke-1" />
              <div>
                <p className="text-sm font-semibold text-eru-text-secondary">No "{selectedGenre}" titles found</p>
                <button
                  onClick={() => setSelectedGenre('All')}
                  className="mt-2 text-xs text-eru-teal hover:underline font-semibold"
                >
                  Show all titles
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Search className="w-10 h-10 text-eru-teal-muted mx-auto stroke-1" />
              <div>
                <p className="text-sm font-semibold text-eru-text-secondary">No titles available</p>
                <p className="text-xs text-eru-text-muted mt-1">Try searching for a specific movie or series</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
