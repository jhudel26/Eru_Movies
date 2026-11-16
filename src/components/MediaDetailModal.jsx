import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Star, 
  Calendar, 
  Clock, 
  Bookmark, 
  Server, 
  Layers, 
  Film, 
  Tv, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ApiService } from '../services/api';

export default function MediaDetailModal({ 
  item, 
  source, 
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
  const [selectedServer, setSelectedServer] = useState(null);

  const saved = isWatchlisted(item.id);

  // Fetch full details
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const fullDetail = await ApiService.getDetail(source, item.type, item.slug);
        if (mounted && fullDetail) {
          setDetail(prev => ({ ...prev, ...fullDetail }));
          if (fullDetail.servers && fullDetail.servers.length > 0) {
            setSelectedServer(fullDetail.servers[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load detail:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [item, source]);

  // Load episodes when season changes for TV series
  useEffect(() => {
    if (detail.type !== 'tv') return;
    let mounted = true;
    async function loadEp() {
      setLoadingEpisodes(true);
      try {
        const eps = await ApiService.getEpisodes(source, detail.slug, selectedSeason);
        if (mounted) setEpisodes(eps);
      } catch (err) {
        console.error('Failed to load episodes:', err);
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    }
    loadEp();
    return () => { mounted = false; };
  }, [detail.slug, detail.type, selectedSeason, source]);

  const handlePlayMovie = () => {
    onPlay({
      ...detail,
      activeServer: selectedServer || detail.servers?.[0]
    });
  };

  const handlePlayEpisode = (ep) => {
    onPlay({
      ...detail,
      seasonNum: selectedSeason,
      episodeNum: ep.number,
      episodeTitle: ep.title,
      activeServer: selectedServer || detail.servers?.[0]
    });
  };

  const bgImage = detail.backdrop || detail.poster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-eru-bg border border-eru-teal/25 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 border border-slate-700/80 text-slate-300 hover:text-white hover:border-eru-teal transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Header Banner */}
          <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-eru-card">
            {bgImage && (
              <img
                src={bgImage}
                alt={detail.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-eru-bg via-eru-bg/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-eru-bg via-eru-bg/60 to-transparent w-2/3" />

            {/* Poster & Main Header Info */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end gap-6 z-10">
              {detail.poster && (
                <div className="hidden sm:block w-32 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border border-eru-teal/30 shadow-teal-glow bg-eru-card">
                  <img src={detail.poster} alt={detail.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded bg-eru-teal text-slate-950 font-extrabold uppercase text-[10px]">
                    {detail.type === 'tv' ? 'TV SERIES' : 'MOVIE'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-amber-400/30 text-amber-300 font-bold text-xs">
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    {detail.rating || '8.0'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300 text-xs px-2 py-0.5 rounded bg-black/40">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {detail.year || '2026'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-eru-card/80 border border-eru-teal/20 text-eru-teal font-semibold">
                    {source === 'ridomovie' ? 'RidoMovie' : 'MoviesFree'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {detail.title}
                </h1>

                {/* Genre chips */}
                {detail.genres && detail.genres.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {detail.genres.map((g, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center gap-3">
              {detail.type !== 'tv' && (
                <button
                  onClick={handlePlayMovie}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-eru-teal text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:bg-eru-teal-hover transition-all shadow-teal-glow hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Movie
                </button>
              )}

              <button
                onClick={() => onToggleWatchlist(detail)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  saved
                    ? 'bg-eru-teal/15 text-eru-teal border-eru-teal shadow-teal-glow'
                    : 'bg-eru-card border-slate-700 text-slate-300 hover:text-white hover:border-eru-teal/40'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-eru-muted">
                Synopsis
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {detail.overview || 'No synopsis provided for this title.'}
              </p>
            </div>

            {/* Server selection */}
            {detail.servers && detail.servers.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-eru-teal" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Streaming Server
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {detail.servers.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedServer(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedServer?.name === s.name
                          ? 'bg-eru-teal text-slate-950 font-bold border-eru-teal shadow-teal-glow'
                          : 'bg-eru-card/80 text-slate-300 border-slate-700/80 hover:border-eru-teal/40'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TV Series Seasons & Episodes Picker */}
            {detail.type === 'tv' && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-eru-teal" />
                    <span className="text-sm font-bold text-slate-200">
                      Episodes
                    </span>
                  </div>

                  {/* Season Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Season:</span>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))}
                      className="bg-eru-card text-xs font-semibold text-eru-teal border border-eru-teal/30 rounded-lg px-2.5 py-1 outline-none"
                    >
                      {(detail.seasons && detail.seasons.length > 0 ? detail.seasons : [1, 2, 3]).map(s => (
                        <option key={s} value={s}>Season {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Episodes Cards */}
                {loadingEpisodes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse h-16 rounded-xl bg-eru-card" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {episodes.map(ep => (
                      <button
                        key={ep.number}
                        onClick={() => handlePlayEpisode(ep)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-eru-card/70 hover:bg-eru-card border border-slate-800 hover:border-eru-teal/50 text-left transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-eru-teal/10 border border-eru-teal/20 text-eru-teal flex items-center justify-center shrink-0 font-bold text-xs group-hover:bg-eru-teal group-hover:text-slate-950 transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-eru-teal transition-colors">
                            {ep.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Episode {ep.number}
                          </p>
                        </div>
                      </button>
                    ))}
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
