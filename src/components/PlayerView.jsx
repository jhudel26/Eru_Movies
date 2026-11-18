import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Maximize, Minimize, ListVideo,
  Film, Star, X, Zap, SkipForward, SkipBack, Play,
  RotateCcw, Minus, Square
} from 'lucide-react';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

const VIDY_BASE = 'https://www.vidy.st';
const VIDY_ACCENT = '2DD4BF'; // ERU teal, no # prefix — Vidy ?color= param

export default function PlayerView({ item, onBack }) {
  const isElectron = ApiService.isElectron;

  // Clean TMDB numeric ID
  const tmdbId = useMemo(() => {
    return String(item.tmdbId || item.slug || item.id || '').replace(/^tmdb-(?:movie|tv)-/, '');
  }, [item]);

  const [currentSeason, setCurrentSeason] = useState(item.seasonNum || 1);
  const [currentEpisode, setCurrentEpisode] = useState(item.episodeNum || 1);
  const [availableSeasons, setAvailableSeasons] = useState(() => item.seasons || [1]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const controlsTimeoutRef = useRef(null);
  const playerContainerRef = useRef(null);
  const webviewRef = useRef(null);

  // Directly construct Vidy streaming endpoint with ERU teal accent
  const streamUrl = useMemo(() => {
    if (!tmdbId) return null;
    const accent = `color=${VIDY_ACCENT}`;
    const reloadParam = reloadKey > 0 ? `&_r=${reloadKey}` : '';
    if (item.type === 'tv') {
      return `${VIDY_BASE}/tv/${tmdbId}/${currentSeason}/${currentEpisode}?${accent}${reloadParam}`;
    }
    return `${VIDY_BASE}/movie/${tmdbId}?${accent}${reloadParam}`;
  }, [item.type, tmdbId, currentSeason, currentEpisode, reloadKey]);

  // Save to history on mount or episode change
  useEffect(() => {
    StorageService.addToHistory(item, {
      seasonNum: item.type === 'tv' ? currentSeason : undefined,
      episodeNum: item.type === 'tv' ? currentEpisode : undefined,
    });
  }, [item, currentSeason, currentEpisode]);

  const handleExit = useCallback(() => {
    const updated = {
      ...item,
      seasonNum: item.type === 'tv' ? currentSeason : undefined,
      episodeNum: item.type === 'tv' ? currentEpisode : undefined,
    };
    StorageService.addToHistory(item, {
      seasonNum: item.type === 'tv' ? currentSeason : undefined,
      episodeNum: item.type === 'tv' ? currentEpisode : undefined,
    });
    onBack(updated);
  }, [item, currentSeason, currentEpisode, onBack]);

  // Load TV show details for seasons if missing
  useEffect(() => {
    if (item.type !== 'tv' || !tmdbId) return;
    if (item.seasons && item.seasons.length > 0) {
      setAvailableSeasons(item.seasons);
      return;
    }
    let mounted = true;
    async function fetchDetail() {
      try {
        const detail = await ApiService.getDetail('tv', tmdbId);
        if (mounted && detail?.seasons?.length) {
          setAvailableSeasons(detail.seasons);
        }
      } catch {
        // Fallback remains [1]
      }
    }
    fetchDetail();
    return () => { mounted = false; };
  }, [item.type, item.seasons, tmdbId]);

  // Load season episodes from TMDB for TV series
  useEffect(() => {
    if (item.type !== 'tv' || !tmdbId) return;
    let mounted = true;
    async function fetchEpisodes() {
      setLoadingEpisodes(true);
      setEpisodes([]);
      try {
        const eps = await ApiService.getEpisodes(tmdbId, currentSeason, item.source);
        if (mounted && eps && eps.length > 0) {
          setEpisodes(eps);
        }
      } catch (err) {
        console.error('Failed to load episodes:', err);
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    }
    fetchEpisodes();
    return () => { mounted = false; };
  }, [item.type, tmdbId, currentSeason, item.source]);

  // Auto-hide HUD on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showEpisodeDrawer) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showEpisodeDrawer]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Synchronize fullscreen state reliably via event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleNextEpisode = useCallback(() => {
    if (episodes.length > 0 && currentEpisode >= episodes.length) return;
    setCurrentEpisode(prev => prev + 1);
  }, [episodes.length, currentEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (currentEpisode > 1) {
      setCurrentEpisode(prev => prev - 1);
    }
  }, [currentEpisode]);

  const handleReload = useCallback(() => {
    setLoading(true);
    setReloadKey(k => k + 1);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events when focused on form controls
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else if (showEpisodeDrawer) {
            setShowEpisodeDrawer(false);
          } else {
            handleExit();
          }
          break;
        case 'f': case 'F':
          toggleFullscreen();
          break;
        case 'r': case 'R':
          handleReload();
          break;
        case 'n': case 'N':
          if (item.type === 'tv') handleNextEpisode();
          break;
        case 'p': case 'P':
          if (item.type === 'tv') handlePrevEpisode();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEpisodeDrawer, item.type, handleNextEpisode, handlePrevEpisode, handleExit, toggleFullscreen, handleReload]);

  // Handle webview loading state + inject ERU teal accent CSS into Vidy's player
  useEffect(() => {
    setLoading(true);
    const wv = webviewRef.current;
    if (!wv) {
      const timer = setTimeout(() => setLoading(false), 1800);
      return () => clearTimeout(timer);
    }

    const ERU_TEAL = '#2DD4BF';

    const VIDY_TEAL_CSS = `
      .plyr__progress--played,
      .plyr__volume--display,
      [class*="progress-fill"],
      [class*="progressFill"],
      .jw-progress,
      .video-js .vjs-play-progress {
        background: ${ERU_TEAL} !important;
      }
    `;

    const applyTheme = async () => {
      try {
        await wv.insertCSS(VIDY_TEAL_CSS);
      } catch {
        // Non-fatal if webview is navigating
      }
    };

    const onLoad = () => {
      setLoading(false);
      applyTheme();
      setTimeout(applyTheme, 1000);
      setTimeout(applyTheme, 2500);
    };
    const onStart = () => setLoading(true);

    wv.addEventListener('did-finish-load', onLoad);
    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('dom-ready', applyTheme);

    const timer = setTimeout(() => {
      setLoading(false);
      applyTheme();
    }, 2000);

    return () => {
      clearTimeout(timer);
      wv.removeEventListener('did-finish-load', onLoad);
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('dom-ready', applyTheme);
    };
  }, [streamUrl]);

  const handleSelectDrawerEpisode = (epNum) => {
    setCurrentEpisode(epNum);
    setShowEpisodeDrawer(false);
  };

  const currentEpData = episodes.find(e => e.number === currentEpisode);

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col h-full w-full bg-[#070D18] select-none overflow-hidden group/player"
    >
      {/* Top HUD — thin floating strip with drag region and window controls */}
      <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
      }`}>
        {/* Background gradient */}
        <div className="bg-gradient-to-b from-black/85 via-black/40 to-transparent pt-3 pb-8 pointer-events-none" />

        {/* Floating control bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-4 max-w-full px-4 pt-3 app-drag-region">

          {/* Left: Back Button & Title Info */}
          <div className="flex items-center gap-3 min-w-0 app-no-drag">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-eru-teal hover:text-slate-950 text-eru-teal border border-eru-teal/40 text-xs font-bold transition-all backdrop-blur-sm hover:scale-105 active:scale-95 shrink-0 shadow-sm"
              title="Back to Catalog [Esc]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-eru-teal animate-pulse-teal shadow-teal-glow-sm shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm font-bold text-white truncate max-w-xs drop-shadow">{item.title}</h1>
                  {item.rating && item.rating !== 'N/A' && (
                    <span className="hidden sm:flex items-center gap-0.5 text-amber-300 text-[11px] font-bold drop-shadow">
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                      {item.rating}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-eru-teal font-extrabold text-[10px] border border-eru-teal/30 backdrop-blur-sm shadow-teal-glow-sm">
                    <Film className="w-2.5 h-2.5" />
                    Cinema HD
                  </span>
                </div>
                {item.type === 'tv' && (
                  <p className="text-[11px] font-semibold text-eru-teal drop-shadow">
                    S{currentSeason} · E{currentEpisode}
                    {currentEpData?.title && ` · ${currentEpData.title}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Action & Window Controls */}
          <div className="flex items-center gap-2 shrink-0 app-no-drag">
            {/* Reload Stream button */}
            <button
              onClick={handleReload}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white/70 hover:text-eru-teal transition-all backdrop-blur-sm"
              title="Reload Stream [R]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* TV Episode Drawer Trigger */}
            {item.type === 'tv' && (
              <button
                onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all backdrop-blur-sm ${
                  showEpisodeDrawer
                    ? 'bg-eru-teal text-slate-950 border-eru-teal'
                    : 'bg-black/60 text-eru-text-secondary border-white/20 hover:border-eru-teal/50 hover:text-eru-teal'
                }`}
                title="Episode List"
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Episodes</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white/70 hover:text-white transition-all backdrop-blur-sm"
              title={isFullscreen ? 'Exit Fullscreen [F]' : 'Fullscreen [F]'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Frameless Window Controls (Minimize / Maximize / Close) */}
            {isElectron && !isFullscreen && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/15">
                <button
                  onClick={() => ApiService.minimize()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => ApiService.maximize()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Maximize / Restore"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  onClick={() => ApiService.close()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-red-500/80 transition-colors"
                  title="Close ERU"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Canvas */}
      <div className="relative flex-1 w-full h-full bg-[#070D18] flex items-center justify-center">

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-[#070D18] pointer-events-none transition-opacity duration-300">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 border-4 border-eru-teal/20 rounded-full" />
              <div className="w-14 h-14 border-4 border-transparent border-t-eru-teal rounded-full animate-spin absolute inset-0 shadow-teal-glow" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-eru-text-primary flex items-center gap-2 justify-center">
                <Zap className="w-4 h-4 text-eru-teal fill-current" />
                Connecting to Vidy.st...
              </p>
              <p className="text-xs text-eru-text-muted">Loading cinema stream · {item.title}</p>
            </div>
          </div>
        )}

        {streamUrl ? (
          isElectron ? (
            <webview
              ref={webviewRef}
              key={streamUrl}
              src={streamUrl}
              className="w-full h-full absolute inset-0 border-0"
              webpreferences="autoplay=true, images=true, javascript=true"
              style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}
            />
          ) : (
            <iframe
              key={streamUrl}
              src={streamUrl}
              className="w-full h-full absolute inset-0 border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}
            />
          )
        ) : (
          <div className="text-center space-y-3 p-8 glass-panel rounded-2xl max-w-sm">
            <Film className="w-12 h-12 text-eru-teal-muted mx-auto" />
            <h3 className="text-base font-bold text-eru-text-primary">Stream Unavailable</h3>
            <p className="text-xs text-eru-text-muted">Could not resolve a Vidy stream for this title.</p>
          </div>
        )}
      </div>

      {/* TV Bottom Navigation Bar */}
      {item.type === 'tv' && (
        <div className={`absolute bottom-5 right-5 z-40 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-eru-border shadow-2xl">
            <button
              onClick={handlePrevEpisode}
              disabled={currentEpisode <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eru-surface-1/80 text-eru-text-secondary hover:text-eru-text-primary hover:bg-eru-surface-2 border border-eru-border disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold transition-all"
              title="Previous Episode [P]"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2.5 text-xs font-mono font-bold text-eru-teal">
              S{currentSeason} · E{currentEpisode}
            </span>
            <button
              onClick={handleNextEpisode}
              disabled={episodes.length > 0 && currentEpisode >= episodes.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eru-teal text-slate-950 hover:bg-eru-teal-bright font-bold text-xs shadow-teal-glow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              title="Next Episode [N]"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Episode Drawer */}
      {showEpisodeDrawer && (
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-eru-bg-deep/98 border-l border-eru-border p-5 backdrop-blur-2xl shadow-2xl z-50 flex flex-col space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-eru-border-subtle">
            <div className="flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-eru-teal" />
              <h3 className="text-sm font-bold text-eru-text-primary">Season {currentSeason} Episodes</h3>
            </div>
            <button
              onClick={() => setShowEpisodeDrawer(false)}
              className="p-1.5 rounded-lg text-eru-text-muted hover:text-eru-text-primary hover:bg-eru-surface-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Season Selector inside Episode Drawer */}
          {availableSeasons.length > 1 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-eru-text-muted font-medium">Select Season:</span>
              <select
                value={currentSeason}
                onChange={(e) => {
                  setCurrentSeason(parseInt(e.target.value, 10));
                  setCurrentEpisode(1);
                }}
                className="bg-eru-surface-1 text-xs font-semibold text-eru-teal border border-eru-teal/30 rounded-xl px-2.5 py-1 outline-none hover:border-eru-teal/60 transition-colors"
              >
                {availableSeasons.map(s => (
                  <option key={s} value={s}>Season {s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loadingEpisodes ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-eru-surface-1 animate-pulse" />
                ))}
              </div>
            ) : episodes.length > 0 ? (
              episodes.map(ep => {
                const isActive = currentEpisode === ep.number;
                return (
                  <button
                    key={ep.number}
                    onClick={() => handleSelectDrawerEpisode(ep.number)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow-sm'
                        : 'bg-eru-surface-1 text-eru-text-secondary hover:bg-eru-surface-2 hover:text-eru-text-primary border border-eru-border hover:border-eru-teal/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ep.thumbnail ? (
                        <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-eru-surface-2 border border-black/20">
                          <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className={`text-xs font-black shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-slate-950/20' : 'bg-eru-surface-2 text-eru-teal'
                        }`}>
                          {ep.number}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{ep.title || `Episode ${ep.number}`}</p>
                        <p className={`text-[10px] ${isActive ? 'opacity-80' : 'text-eru-text-muted'}`}>
                          S{currentSeason} · E{ep.number} {ep.rating ? `· ★ ${ep.rating}` : ''}
                        </p>
                      </div>
                    </div>
                    {isActive && <Play className="w-3.5 h-3.5 fill-current shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-eru-text-muted text-center py-8">
                No episodes available for Season {currentSeason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
