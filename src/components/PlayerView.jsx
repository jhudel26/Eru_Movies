import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Server, 
  SkipForward, 
  SkipBack, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  ListVideo, 
  Sparkles, 
  Tv, 
  Film, 
  Star, 
  Calendar, 
  Volume2, 
  Check, 
  Minus, 
  Square, 
  Copy, 
  X 
} from 'lucide-react';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

export default function PlayerView({ 
  item, 
  source, 
  onBack 
}) {
  const [currentSeason, setCurrentSeason] = useState(item.seasonNum || 1);
  const [currentEpisode, setCurrentEpisode] = useState(item.episodeNum || 1);
  const [activeServer, setActiveServer] = useState(item.activeServer || null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [serverList, setServerList] = useState(item.servers || []);
  const [loading, setLoading] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

  const controlsTimeoutRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Save to Watch History
  useEffect(() => {
    StorageService.addToHistory(item, {
      seasonNum: item.type === 'tv' ? currentSeason : undefined,
      episodeNum: item.type === 'tv' ? currentEpisode : undefined
    });
  }, [item, currentSeason, currentEpisode]);

  // Autohide controls on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showEpisodeDrawer && !serverDropdownOpen) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showEpisodeDrawer) {
          setShowEpisodeDrawer(false);
        } else if (serverDropdownOpen) {
          setServerDropdownOpen(false);
        } else {
          onBack();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        if (item.type === 'tv') handleNextEpisode();
      } else if (e.key === 'p' || e.key === 'P') {
        if (item.type === 'tv') handlePrevEpisode();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEpisodeDrawer, serverDropdownOpen, item.type, currentEpisode]);

  // Resolve stream URL for current title or episode
  useEffect(() => {
    let mounted = true;
    async function resolveStream() {
      setLoading(true);
      try {
        if (item.type === 'tv') {
          const res = await ApiService.getEpisodeEmbed(
            source,
            item.slug,
            currentSeason,
            currentEpisode,
            item.tmdbId,
            item.imdbId
          );
          if (mounted && res) {
            if (res.servers && res.servers.length > 0) {
              setServerList(res.servers);
              const matchedServer = res.servers.find(s => s.name === activeServer?.name) || res.servers[0];
              setActiveServer(matchedServer);
              setStreamUrl(matchedServer.url);
            } else if (res.embedUrl) {
              setStreamUrl(res.embedUrl);
            }
          }
        } else {
          // Movie
          if (item.servers && item.servers.length > 0) {
            setServerList(item.servers);
            const server = activeServer || item.servers[0];
            setActiveServer(server);
            setStreamUrl(server.url);
          } else {
            const detail = await ApiService.getDetail(source, 'movie', item.slug);
            if (mounted && detail) {
              setServerList(detail.servers || []);
              const server = detail.servers?.[0] || null;
              setActiveServer(server);
              setStreamUrl(server?.url || detail.embedUrl);
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve stream:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolveStream();
    return () => { mounted = false; };
  }, [item, source, currentSeason, currentEpisode]);

  // Load episodes list for TV
  useEffect(() => {
    if (item.type !== 'tv') return;
    let mounted = true;
    async function loadEpisodes() {
      try {
        const eps = await ApiService.getEpisodes(source, item.slug, currentSeason);
        if (mounted) setEpisodes(eps);
      } catch (e) {
        console.error(e);
      }
    }
    loadEpisodes();
    return () => { mounted = false; };
  }, [item, source, currentSeason]);

  const handleServerChange = (srv) => {
    setActiveServer(srv);
    setStreamUrl(srv.url);
    setServerDropdownOpen(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  const handleNextEpisode = () => {
    setCurrentEpisode(prev => prev + 1);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode(prev => prev - 1);
    }
  };

  const handleSelectDrawerEpisode = (epNum) => {
    setCurrentEpisode(epNum);
    setShowEpisodeDrawer(false);
  };

  const handleReload = () => {
    const current = streamUrl;
    setStreamUrl(null);
    setLoading(true);
    setTimeout(() => {
      setStreamUrl(current);
      setLoading(false);
    }, 300);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col h-full w-full bg-black select-none overflow-hidden group/player"
    >
      {/* Top HUD Cinematic Header (Auto-hiding overlay) */}
      <div 
        className={`absolute top-0 left-0 right-0 z-40 p-4 transition-all duration-300 pointer-events-auto bg-gradient-to-b from-black/95 via-black/70 to-transparent ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Back button & Media Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-eru-card/90 hover:bg-eru-teal hover:text-slate-950 text-eru-teal border border-eru-teal/30 text-xs font-bold transition-all shadow-teal-glow hover:scale-105 active:scale-95"
              title="Return to Browser [Esc]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-400 font-mono">
                ESC
              </kbd>
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-eru-teal animate-pulse shadow-teal-glow shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold text-white truncate drop-shadow-md">
                    {item.title}
                  </h1>
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-black/60 border border-eru-teal/30 text-[10px] font-extrabold text-eru-teal">
                    {item.quality || 'HD'}
                  </span>
                  {item.rating && (
                    <span className="hidden sm:flex items-center gap-0.5 text-amber-300 text-[11px] font-bold">
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                      {item.rating}
                    </span>
                  )}
                </div>
                {item.type === 'tv' && (
                  <p className="text-[11px] font-semibold text-eru-teal">
                    Season {currentSeason} · Episode {currentEpisode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Server Switcher Dropdown & Controls */}
          <div className="flex items-center gap-2">
            {/* Server Switcher */}
            {serverList.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-eru-card/90 border border-eru-teal/30 text-xs font-semibold text-slate-200 hover:border-eru-teal transition-all shadow-teal-glow"
                >
                  <Server className="w-3.5 h-3.5 text-eru-teal" />
                  <span className="hidden sm:inline text-eru-muted font-normal">Server:</span>
                  <span className="text-eru-teal font-bold">{activeServer?.name || 'Default'}</span>
                </button>

                {serverDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-eru-darkest/95 border border-eru-teal/30 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-1">
                    <p className="px-2 py-1 text-[10px] uppercase font-bold text-eru-muted tracking-wider">
                      Select Server
                    </p>
                    {serverList.map((srv, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleServerChange(srv)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeServer?.name === srv.name
                            ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                            : 'text-slate-300 hover:bg-eru-card hover:text-white'
                        }`}
                      >
                        <span>{srv.name}</span>
                        {activeServer?.name === srv.name && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reload stream */}
            <button
              onClick={handleReload}
              className="p-2 rounded-xl bg-eru-card/80 hover:bg-eru-card border border-slate-700/80 text-slate-300 hover:text-eru-teal transition-all"
              title="Reload Stream [R]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Episode Drawer toggle for TV */}
            {item.type === 'tv' && (
              <button
                onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  showEpisodeDrawer
                    ? 'bg-eru-teal text-slate-950 border-eru-teal shadow-teal-glow'
                    : 'bg-eru-card/80 text-slate-200 border-slate-700 hover:border-eru-teal/40'
                }`}
                title="View All Episodes"
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Episodes</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-eru-card/80 hover:bg-eru-card border border-slate-700/80 text-slate-300 hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen [F]' : 'Fullscreen [F]'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Native Window Controls */}
            <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
              <button
                onClick={() => ApiService.minimize()}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => ApiService.maximize()}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors"
                title="Maximize / Restore"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                onClick={() => ApiService.close()}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 rounded transition-colors"
                title="Close Window"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Cinema Canvas */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-3 border-eru-teal border-t-transparent rounded-full animate-spin shadow-teal-glow-lg" />
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white flex items-center gap-2 justify-center">
                <Sparkles className="w-4 h-4 text-eru-teal" />
                Connecting to {activeServer?.name || 'Cinema Stream'}...
              </p>
              <p className="text-xs text-slate-400">
                Optimizing high-definition buffer & bypassing ads
              </p>
            </div>
          </div>
        ) : streamUrl ? (
          <iframe
            key={`${streamUrl}-${currentSeason}-${currentEpisode}`}
            src={streamUrl}
            title={item.title}
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-center space-y-3 p-8 glass-panel rounded-2xl max-w-md">
            <Film className="w-12 h-12 text-eru-muted mx-auto" />
            <h3 className="text-base font-bold text-white">Stream link unavailable on this server</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please switch to another streaming server from the top bar dropdown.
            </p>
            {serverList.length > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {serverList.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleServerChange(s)}
                    className="px-3 py-1.5 rounded-lg bg-eru-teal text-slate-950 font-bold text-xs shadow-teal-glow"
                  >
                    Switch to {s.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating TV Series Navigation (Auto-hiding overlay) */}
      {item.type === 'tv' && (
        <div 
          className={`absolute bottom-4 right-4 z-40 transition-all duration-300 pointer-events-auto ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-eru-teal/30 shadow-2xl">
            <button
              onClick={handlePrevEpisode}
              disabled={currentEpisode <= 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eru-card/80 text-slate-300 hover:text-white hover:bg-eru-card border border-slate-700/80 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold transition-all"
              title="Previous Episode [P]"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Prev Ep</span>
            </button>

            <span className="px-2.5 text-xs font-mono font-bold text-eru-teal">
              E{currentEpisode}
            </span>

            <button
              onClick={handleNextEpisode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-eru-teal text-slate-950 hover:bg-eru-teal-hover font-bold text-xs shadow-teal-glow transition-all hover:scale-105 active:scale-95"
              title="Next Episode [N]"
            >
              <span>Next Ep</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-out TV Episodes Drawer */}
      {showEpisodeDrawer && (
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-eru-darkest/98 border-l border-eru-teal/30 p-5 backdrop-blur-2xl shadow-2xl z-50 flex flex-col space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-eru-teal" />
              <h3 className="text-sm font-bold text-white">Season {currentSeason} Episodes</h3>
            </div>
            <button
              onClick={() => setShowEpisodeDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Episode List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {episodes.map(ep => {
              const isActive = currentEpisode === ep.number;
              return (
                <button
                  key={ep.number}
                  onClick={() => handleSelectDrawerEpisode(ep.number)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                      : 'bg-eru-card/60 text-slate-300 hover:bg-eru-card hover:text-white border border-slate-800/80 hover:border-eru-teal/30'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold truncate">
                      {ep.title || `Episode ${ep.number}`}
                    </p>
                    <p className={`text-[10px] ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                      Episode {ep.number}
                    </p>
                  </div>
                  <span className={`text-[11px] font-mono shrink-0 px-2 py-0.5 rounded ${
                    isActive ? 'bg-slate-950 text-eru-teal font-extrabold' : 'bg-black/40 text-slate-400'
                  }`}>
                    EP {ep.number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
