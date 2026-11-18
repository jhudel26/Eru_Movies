import React, { useState } from 'react';
import { Play, Star, Bookmark, Film, Tv, X, Clock } from 'lucide-react';

function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MediaCard({
  item,
  onPlay,
  onOpenDetail,
  onToggleWatchlist,
  isWatchlisted,
  onRemoveHistory,
  isHistory = false
}) {
  const [imgError, setImgError] = useState(false);
  const saved = isWatchlisted ? isWatchlisted(item.id) : false;
  const hasRating = item.rating && item.rating !== 'N/A';
  const timeAgo = formatRelativeTime(item.watchedAt);
  const hasEpisode = item.type === 'tv' && (item.episodeNum !== undefined || item.seasonNum !== undefined);

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className="group relative flex flex-col rounded-xl overflow-hidden glass-card cursor-pointer border border-eru-border/60 hover:border-eru-teal/40 transition-all duration-300"
    >
      {/* Poster — 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-eru-surface-1">
        {item.poster && !imgError ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Internal fallback placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-eru-surface-2 to-eru-bg-deep text-eru-teal-muted absolute inset-0">
            {item.type === 'tv'
              ? <Tv className="w-9 h-9 mb-2 opacity-60 text-eru-teal" />
              : <Film className="w-9 h-9 mb-2 opacity-60 text-eru-teal" />
            }
            <span className="text-[11px] text-center px-3 leading-tight text-eru-text-muted line-clamp-2">
              {item.title}
            </span>
          </div>
        )}

        {/* Bottom gradient — text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-eru-bg-deep via-transparent to-black/30 opacity-70 group-hover:opacity-50 transition-opacity" />

        {/* Top badges row */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          {/* Rating */}
          {hasRating ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-amber-400/25 text-[10px] font-bold text-amber-300 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
              {item.rating}
            </span>
          ) : (
            <span />
          )}

          {/* Type / Quality badge */}
          <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-eru-teal/30 text-[10px] font-extrabold text-eru-teal shadow-sm">
            {item.type === 'tv' ? 'TV' : (item.quality || 'HD')}
          </span>
        </div>

        {/* Episode badge for TV in History / Continue Watching */}
        {hasEpisode && (
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-eru-teal/40 text-[10px] font-mono font-bold text-eru-teal shadow-teal-glow-sm">
              S{item.seasonNum || 1} · E{item.episodeNum || 1}
            </span>
          </div>
        )}

        {/* Center hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="w-11 h-11 rounded-full bg-eru-teal text-slate-950 flex items-center justify-center shadow-teal-glow-lg transform scale-75 group-hover:scale-100 transition-all duration-200 hover:bg-eru-teal-bright active:scale-95 pointer-events-auto"
            title="Watch Now"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>

        {/* Hover action buttons (Bookmark & Remove History) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {onRemoveHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHistory(item.id);
              }}
              className="p-1.5 rounded-lg backdrop-blur-sm bg-black/75 text-eru-text-muted hover:text-eru-error hover:bg-eru-error/15 border border-white/10 transition-all"
              title="Remove from History"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(item);
              }}
              className={`p-1.5 rounded-lg backdrop-blur-sm border transition-all ${
                saved
                  ? 'bg-eru-teal text-slate-950 border-eru-teal shadow-teal-glow-sm'
                  : 'bg-black/75 text-slate-300 border-white/10 hover:text-white hover:border-eru-teal/50'
              }`}
              title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Title & metadata */}
      <div className="p-2.5 sm:p-3 space-y-1">
        <h3
          className="text-[13px] font-semibold text-eru-text-primary truncate group-hover:text-eru-teal transition-colors leading-tight"
          title={item.title}
        >
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-eru-text-muted">{item.year || ''}</span>
          {timeAgo ? (
            <span className="flex items-center gap-1 text-[10px] text-eru-teal-muted font-medium">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          ) : (
            <span className="text-eru-teal-muted capitalize font-medium">
              {item.type === 'tv' ? 'Series' : 'Movie'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
