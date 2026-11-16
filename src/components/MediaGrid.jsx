import React, { useState } from 'react';
import MediaCard from './MediaCard';
import { Film, SlidersHorizontal } from 'lucide-react';

const GENRES = [
  'All',
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Thriller',
  'Horror',
  'Adventure',
  'Animation'
];

export default function MediaGrid({ 
  title, 
  items = [], 
  loading = false,
  onPlay, 
  onOpenDetail, 
  onToggleWatchlist, 
  isWatchlisted,
  showFilters = true 
}) {
  const [selectedGenre, setSelectedGenre] = useState('All');

  const filteredItems = items.filter(item => {
    if (selectedGenre === 'All') return true;
    if (!item.genres || item.genres.length === 0) return true;
    return item.genres.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
  });

  return (
    <section className="space-y-4">
      {/* Header and Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-100 tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-eru-teal shadow-teal-glow"></span>
            {title}
          </h2>
          <span className="text-xs text-eru-muted font-medium">({filteredItems.length})</span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                    : 'bg-eru-card/70 text-slate-400 hover:text-slate-200 border border-eru-teal/15 hover:border-eru-teal/40'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid or Skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-[2/3] w-full rounded-xl bg-eru-card/80 border border-eru-teal/10" />
              <div className="h-3 w-3/4 rounded bg-eru-card" />
              <div className="h-2 w-1/2 rounded bg-eru-card" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={onPlay}
              onOpenDetail={onOpenDetail}
              onToggleWatchlist={onToggleWatchlist}
              isWatchlisted={isWatchlisted}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 glass-panel rounded-2xl">
          <Film className="w-10 h-10 text-eru-muted mx-auto stroke-1" />
          <p className="text-sm font-semibold text-slate-300">No media found in this section</p>
          <p className="text-xs text-slate-500">Try switching your active source or search query</p>
        </div>
      )}
    </section>
  );
}
