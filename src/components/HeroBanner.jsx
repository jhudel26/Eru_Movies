import React, { useState, useEffect } from 'react';
import { Play, Info, Bookmark, Star, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner({ 
  items = [], 
  onPlay, 
  onOpenDetail, 
  onToggleWatchlist, 
  isWatchlisted 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const saved = isWatchlisted(current.id);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const bgImage = current.backdrop || current.poster;

  return (
    <div className="relative w-full h-[410px] rounded-2xl overflow-hidden glass-panel group mb-8 select-none">
      {/* Background Backdrop Image */}
      {bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105 group-hover:scale-100"
          style={{ backgroundImage: `url("${bgImage}")` }}
        />
      )}

      {/* Cinematic Teal & Noir Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-eru-darkest via-eru-darkest/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-eru-darkest via-eru-darkest/80 to-transparent w-3/4" />
      <div className="absolute inset-0 bg-eru-teal/5 pointer-events-none mix-blend-color-dodge" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 max-w-2xl space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-eru-teal text-slate-950 font-black tracking-wider uppercase text-[11px] shadow-teal-glow">
            <Sparkles className="w-3 h-3 fill-current" />
            FEATURED
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/60 border border-eru-teal/30 text-eru-teal font-bold text-[11px]">
            {current.quality || 'HD'}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-amber-400/30 text-amber-300 font-bold text-[11px]">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            {current.rating || '8.0'}
          </span>
          <span className="flex items-center gap-1 text-slate-300 font-medium text-[11px] px-2 py-0.5 rounded-md bg-black/50">
            <Calendar className="w-3 h-3 text-slate-400" />
            {current.year || '2026'}
          </span>
          <span className="uppercase text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
            {current.type === 'tv' ? 'TV SERIES' : 'MOVIE'}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          {current.title}
        </h1>

        {/* Synopsis */}
        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed drop-shadow">
          {current.overview || 'Experience the cinema thrill in pure high-definition streaming.'}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onPlay(current)}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-eru-teal text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-eru-teal-hover transition-all shadow-teal-glow hover:shadow-teal-glow-lg hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </button>

          <button
            onClick={() => onOpenDetail(current)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-eru-card/90 border border-eru-teal/30 text-slate-200 font-semibold text-xs hover:bg-eru-cardHover hover:border-eru-teal transition-all"
          >
            <Info className="w-4 h-4 text-eru-teal" />
            Details
          </button>

          <button
            onClick={() => onToggleWatchlist(current)}
            className={`p-2.5 rounded-xl border transition-all ${
              saved
                ? 'bg-eru-teal/20 text-eru-teal border-eru-teal shadow-teal-glow'
                : 'bg-eru-card/80 text-slate-300 border-slate-700/80 hover:text-white hover:border-eru-teal/40'
            }`}
            title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-black/60 border border-slate-700/80 text-slate-300 hover:text-eru-teal hover:border-eru-teal/50 transition-all backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5 px-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-5 bg-eru-teal shadow-teal-glow' : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-black/60 border border-slate-700/80 text-slate-300 hover:text-eru-teal hover:border-eru-teal/50 transition-all backdrop-blur-md"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
