import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Bookmark, Star, Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function HeroBanner({
  items = [],
  onPlay,
  onOpenDetail,
  onToggleWatchlist,
  isWatchlisted
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  const transitionTo = (nextIdx) => {
    setFading(true);
    clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(nextIdx);
      setFading(false);
    }, 350);
  };

  useEffect(() => {
    if (!items || items.length <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % items.length;
        setFading(true);
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
          setCurrentIndex(next);
          setFading(false);
        }, 350);
        return prev;
      });
    }, 8000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(fadeTimeoutRef.current);
    };
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const saved = isWatchlisted(current.id);

  const goTo = (direction) => {
    clearInterval(timerRef.current);
    const next = direction === 'next'
      ? (currentIndex + 1) % items.length
      : (currentIndex - 1 + items.length) % items.length;
    transitionTo(next);
  };

  const goToIndex = (idx) => {
    if (idx === currentIndex) return;
    clearInterval(timerRef.current);
    transitionTo(idx);
  };

  const bgImage = current.backdrop || current.poster;
  const hasOverview = current.overview && current.overview.length > 15;

  return (
    <div className="relative w-full min-h-[440px] h-[52vh] max-h-[620px] rounded-2xl overflow-hidden select-none mb-6 group/hero border border-eru-border/50 shadow-2xl">
      {/* Background image — crossfade with optimized upper-center focal point */}
      <div
        key={currentIndex}
        className={`absolute inset-0 bg-cover transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: bgImage ? `url("${bgImage}")` : undefined,
          backgroundPosition: 'center 25%',
          backgroundColor: bgImage ? undefined : '#0D2422'
        }}
      />

      {/* Cinematic gradient overlays — multi-stop fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-eru-bg via-eru-bg/65 to-transparent" />
      <div className="absolute inset-0 w-full sm:w-[75%] lg:w-[65%] bg-gradient-to-r from-eru-bg via-eru-bg/85 to-transparent" />

      {/* Slide counter — top right */}
      <div className="absolute top-4 right-4 z-20 text-[11px] font-mono text-eru-text-secondary bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
        {currentIndex + 1} / {items.length}
      </div>

      {/* Left arrow */}
      <button
        onClick={() => goTo('prev')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-eru-text-muted hover:text-eru-teal hover:border-eru-teal/50 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/hero:opacity-100 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => goTo('next')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-eru-text-muted hover:text-eru-teal hover:border-eru-teal/50 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/hero:opacity-100 shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Content */}
      <div
        className={`relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 max-w-xl transition-opacity duration-350 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-eru-teal text-slate-950 font-black tracking-widest uppercase text-[10px] shadow-teal-glow-sm">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            Featured
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-eru-teal/30 text-eru-teal font-bold text-[10px]">
            {current.quality || 'HD'}
          </span>
          {current.rating && current.rating !== 'N/A' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-amber-400/30 text-amber-300 font-bold text-[10px]">
              <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
              {current.rating}
            </span>
          )}
          {current.year && (
            <span className="flex items-center gap-1 text-eru-text-muted text-[10px] px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/5">
              <Calendar className="w-2.5 h-2.5" />
              {current.year}
            </span>
          )}
          <span className="uppercase text-[9px] font-bold tracking-widest px-2 py-0.5 rounded bg-eru-surface-2/80 text-eru-text-secondary border border-eru-border">
            {current.type === 'tv' ? 'TV Series' : 'Movie'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight text-white leading-[1.1] drop-shadow-md mb-2.5 line-clamp-2">
          {current.title}
        </h1>

        {/* Overview — only if real */}
        {hasOverview && (
          <p className="text-xs sm:text-[13px] text-eru-text-secondary leading-relaxed drop-shadow mb-4 line-clamp-2 max-w-lg">
            {current.overview}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlay(current)}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-eru-teal text-slate-950 font-bold text-xs uppercase tracking-widest hover:bg-eru-teal-bright transition-all shadow-teal-glow hover:shadow-teal-glow-lg hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </button>

          <button
            onClick={() => onOpenDetail(current)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-eru-surface-1/90 backdrop-blur-md border border-eru-border hover:border-eru-teal/50 text-eru-text-secondary hover:text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-eru-teal" />
            Details
          </button>

          <button
            onClick={() => onToggleWatchlist(current)}
            className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              saved
                ? 'bg-eru-teal/20 text-eru-teal border-eru-teal shadow-teal-glow-sm'
                : 'bg-eru-surface-1/90 text-eru-text-muted border-eru-border hover:text-white hover:border-eru-teal/40'
            }`}
            title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dot indicators — bottom center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goToIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 h-1.5 bg-eru-teal shadow-teal-glow-sm'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-eru-teal/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full min-h-[440px] h-[52vh] max-h-[620px] rounded-2xl overflow-hidden select-none mb-6 border border-eru-border/50 skeleton shadow-2xl">
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-eru-bg via-eru-bg/70 to-transparent" />
      <div className="absolute inset-0 w-full sm:w-[75%] lg:w-[65%] bg-gradient-to-r from-eru-bg via-eru-bg/85 to-transparent" />

      {/* Content Skeleton */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 max-w-xl">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-18 h-4.5 rounded-full skeleton border border-white/5" />
          <div className="w-10 h-4.5 rounded-md skeleton border border-white/5" />
          <div className="w-12 h-4.5 rounded-md skeleton border border-white/5" />
        </div>

        {/* Title */}
        <div className="h-8 sm:h-10 w-4/5 max-w-md rounded-xl skeleton mb-3" />

        {/* Overview lines */}
        <div className="space-y-2 mb-5 max-w-lg">
          <div className="h-3 w-full rounded-md skeleton" />
          <div className="h-3 w-3/4 rounded-md skeleton" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-10 rounded-xl skeleton" />
          <div className="w-24 h-10 rounded-xl skeleton" />
          <div className="w-10 h-10 rounded-xl skeleton" />
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <div className="w-6 h-1.5 rounded-full skeleton" />
        <div className="w-1.5 h-1.5 rounded-full skeleton" />
        <div className="w-1.5 h-1.5 rounded-full skeleton" />
        <div className="w-1.5 h-1.5 rounded-full skeleton" />
      </div>
    </div>
  );
}
