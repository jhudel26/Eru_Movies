import React, { useState, useEffect } from 'react';
import {
  X, Play, Star, Calendar, Bookmark,
  Film, Tv, ChevronDown, ListVideo, Clock
} from 'lucide-react';
import { ApiService } from '../services/api';

export default function MediaDetailModal({
  item,
  onClose,
  onPlay,
  onToggleWatchlist,
  isWatchlisted
}) {
  const [detail, setDetail] = useState(item);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const saved = isWatchlisted(item.id);

  // Fetch full details
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const fullDetail = await ApiService.getDetail(item.type, item.slug, item.source, item.title);
        if (mounted && fullDetail) {
          setDetail(prev => ({ ...prev, ...fullDetail }));
        } else if (mounted) {
          // If getDetail returns null (wrong slug), keep using the card data
          console.warn('Detail fetch returned null, using card data');
          setDetail(prev => ({ ...prev, ...item }));
        }
      } catch (err) {
        console.error('Failed to load detail:', err);
        if (mounted) {
          // On error, fall back to card data
          setDetail(prev => ({ ...prev, ...item }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [item]);

  // Load episodes when season changes
  useEffect(() => {
    if (detail.type !== 'tv') return;
    let mounted = true;
    async function loadEpisodes() {
      setLoadingEpisodes(true);
      setEpisodes([]); // Clear previous episodes to avoid stale display
      try {
        const eps = await ApiService.getEpisodes(detail.slug, selectedSeason, detail.source);
        if (mounted && eps && eps.length > 0) setEpisodes(eps);
      } catch (err) {
        console.error('Failed to load episodes:', err);
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    }
    loadEpisodes();
    return () => { mounted = false; };
  }, [detail.slug, detail.type, selectedSeason, detail.source]);

  const handlePlayMovie = () => {
    onPlay({ ...detail });
  };

  const handlePlayEpisode = (ep) => {
    onPlay({
      ...detail,
      seasonNum: selectedSeason,
      episodeNum: ep.number,
      episodeTitle: ep.title,
    });
  };

  const bgImage = detail.backdrop || detail.poster;
  const hasOverview = detail.overview && detail.overview.length > 20;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-eru-bg-deep/85 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] bg-eru-bg border border-eru-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-eru-bg-deep/80 backdrop-blur-sm border border-eru-border text-eru-text-muted hover:text-eru-text-primary hover:border-eru-teal/40 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Backdrop */}
          <div className="relative h-72 sm:h-88 w-full overflow-hidden bg-eru-surface-1" style={{ height: '22rem' }}>
            {bgImage && (
              <img
                src={bgImage}
                alt={detail.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-eru-bg via-eru-bg/65 to-transparent" />
            <div className="absolute inset-0 w-[58%] bg-gradient-to-r from-eru-bg via-eru-bg/60 to-transparent" />

            {/* Header info over backdrop */}
            <div className="absolute bottom-6 left-6 right-16 flex items-end gap-5 z-10">
              {/* Poster */}
              {detail.poster && (
                <div className="w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-eru-teal/30 shadow-teal-glow bg-eru-surface-1 hidden sm:block">
                  <img src={detail.poster} alt={detail.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded bg-eru-teal text-slate-950 font-extrabold uppercase text-[10px] tracking-wider">
                    {detail.type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  {detail.rating && detail.rating !== 'N/A' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-amber-400/30 text-amber-300 font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                      {detail.rating}
                    </span>
                  )}
                  {detail.year && (
                    <span className="flex items-center gap-1 text-eru-text-muted text-[11px] px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                      <Calendar className="w-3 h-3" />
                      {detail.year}
                    </span>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded bg-eru-surface-2/80 border border-eru-border text-eru-teal font-semibold">
                    {detail.quality || '4K Ultra HD'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-eru-text-primary leading-tight">
                  {detail.title}
                </h1>

                {/* Genre chips */}
                {detail.genres && detail.genres.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {detail.genres.map((g, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-eru-surface-2 text-eru-text-muted border border-eru-border">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Action bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {detail.type !== 'tv' && (
                <button
                  onClick={handlePlayMovie}
                  disabled={loading}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-eru-teal text-slate-950 font-extrabold text-xs uppercase tracking-widest hover:bg-eru-teal-bright transition-all shadow-teal-glow hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {loading ? 'Loading...' : 'Watch Movie'}
                </button>
              )}

              <button
                onClick={() => onToggleWatchlist(detail)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  saved
                    ? 'bg-eru-teal/15 text-eru-teal border-eru-teal shadow-teal-glow-sm'
                    : 'bg-eru-surface-1 border-eru-border text-eru-text-muted hover:text-eru-text-primary hover:border-eru-teal/40'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            {/* Overview */}
            {hasOverview && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-eru-text-muted">
                  Synopsis
                </h3>
                <p className="text-[13px] text-eru-text-secondary leading-relaxed">
                  {detail.overview}
                </p>
              </div>
            )}

            {/* TV — Season & Episodes */}
            {detail.type === 'tv' && (
              <div className="space-y-4 pt-2 border-t border-eru-border-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-eru-teal" />
                    <span className="text-sm font-bold text-eru-text-primary">Season Episodes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-eru-text-muted">Season:</span>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))}
                      className="bg-eru-surface-1 text-xs font-semibold text-eru-teal border border-eru-teal/30 rounded-xl px-3 py-1.5 outline-none hover:border-eru-teal/60 transition-colors shadow-sm"
                    >
                      {(detail.seasons && detail.seasons.length > 0
                        ? detail.seasons
                        : detail.numberOfSeasons
                          ? Array.from({ length: detail.numberOfSeasons }, (_, i) => i + 1)
                          : [1]
                      ).map(s => (
                        <option key={s} value={s}>Season {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Episode grid */}
                {loadingEpisodes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl skeleton" />
                    ))}
                  </div>
                ) : episodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {episodes.map(ep => (
                      <button
                        key={ep.number}
                        onClick={() => handlePlayEpisode(ep)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-eru-surface-1 hover:bg-eru-surface-2 border border-eru-border hover:border-eru-teal/40 text-left transition-all group hover:scale-[1.01]"
                      >
                        {ep.thumbnail ? (
                          <div className="w-14 h-9.5 rounded-lg overflow-hidden shrink-0 bg-eru-surface-2 border border-black/30">
                            <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-eru-teal/10 border border-eru-teal/20 text-eru-teal flex items-center justify-center shrink-0 font-black text-xs group-hover:bg-eru-teal group-hover:text-slate-950 transition-colors">
                            {ep.number}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-eru-text-primary truncate group-hover:text-eru-teal transition-colors">
                            {ep.title || `Episode ${ep.number}`}
                          </p>
                          <p className="text-[10px] text-eru-text-muted">S{selectedSeason} · E{ep.number} {ep.rating ? `· ★ ${ep.rating}` : ''}</p>
                        </div>
                        <Play className="w-3.5 h-3.5 text-eru-teal opacity-0 group-hover:opacity-100 transition-opacity fill-current shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-eru-text-muted bg-eru-surface-1/50 rounded-xl border border-eru-border/50">
                    No episodes found for Season {selectedSeason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
