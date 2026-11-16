import React from 'react';
import { Play, Star, Bookmark, Film, Tv } from 'lucide-react';

export default function MediaCard({ 
  item, 
  onPlay, 
  onOpenDetail, 
  onToggleWatchlist, 
  isWatchlisted 
}) {
  const saved = isWatchlisted(item.id);

  return (
    <div 
      onClick={() => onOpenDetail(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden glass-card cursor-pointer transition-all duration-300"
    >
      {/* Poster Image Container with 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-eru-card">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-eru-card text-slate-500">
            {item.type === 'tv' ? <Tv className="w-8 h-8 mb-2" /> : <Film className="w-8 h-8 mb-2" />}
            <span className="text-xs line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Gradient dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-eru-darkest via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          {/* Rating */}
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-amber-400/30 text-[10px] font-bold text-amber-300">
            <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
            {item.rating || '8.0'}
          </span>

          {/* Quality / Type */}
          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-eru-teal/30 text-[10px] font-extrabold text-eru-teal">
            {item.type === 'tv' ? 'TV' : (item.quality || 'HD')}
          </span>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="w-12 h-12 rounded-full bg-eru-teal text-slate-950 flex items-center justify-center shadow-teal-glow-lg transform scale-75 group-hover:scale-100 transition-all hover:bg-eru-teal-hover active:scale-90"
            title="Watch Now"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Hover Quick Bookmark Button (Bottom Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(item);
          }}
          className={`absolute bottom-2 right-2 p-1.5 rounded-lg backdrop-blur-md border z-10 transition-all opacity-0 group-hover:opacity-100 ${
            saved
              ? 'bg-eru-teal text-slate-950 border-eru-teal'
              : 'bg-black/70 text-slate-300 border-slate-700 hover:text-white hover:border-eru-teal'
          }`}
          title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Title & Metadata */}
      <div className="p-2.5 space-y-1">
        <h3 className="text-xs font-semibold text-slate-100 truncate group-hover:text-eru-teal transition-colors" title={item.title}>
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{item.year || '2026'}</span>
          <span className="capitalize text-[10px] text-eru-muted">{item.type === 'tv' ? 'Series' : 'Movie'}</span>
        </div>
      </div>
    </div>
  );
}
