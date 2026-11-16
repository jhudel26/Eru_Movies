import React, { useState, useEffect } from 'react';
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
  Film
} from 'lucide-react';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

export default function PlayerView({ 
  item, 
  source, 
  onBack, 
  onSwitchEpisode 
}) {
  const [currentSeason, setCurrentSeason] = useState(item.seasonNum || 1);
  const [currentEpisode, setCurrentEpisode] = useState(item.episodeNum || 1);
  const [activeServer, setActiveServer] = useState(item.activeServer || null);
  const [streamUrl, setStreamUrl] = useState(item.embedUrl || null);
  const [serverList, setServerList] = useState(item.servers || []);
  const [loading, setLoading] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [theaterMode, setTheaterMode] = useState(false);

  // Save to History on watch
  useEffect(() => {
    StorageService.addToHistory(item, {
      seasonNum: item.type === 'tv' ? currentSeason : undefined,
      episodeNum: item.type === 'tv' ? currentEpisode : undefined
    });
  }, [item, currentSeason, currentEpisode]);

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
              setActiveServer(res.servers[0]);
              setStreamUrl(res.servers[0].url);
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
          } else if (item.embedUrl) {
            setStreamUrl(item.embedUrl);
          } else {
            // Fetch fresh details if needed
            const detail = await ApiService.getDetail(source, 'movie', item.slug);
            if (mounted && detail) {
              setServerList(detail.servers || []);
              setActiveServer(detail.servers?.[0] || null);
              setStreamUrl(detail.servers?.[0]?.url || detail.embedUrl);
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

  // Load episodes for drawer if TV
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

  return (
    <div className={`relative flex flex-col h-full w-full bg-eru-darkest select-none overflow-hidden ${theaterMode ? 'p-0' : 'p-2 sm:p-4'}`}>
      {/* Player Header Control Bar */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-eru-card/90 border border-eru-teal/20 backdrop-blur-md mb-2 z-20">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-eru-teal/10 hover:bg-eru-teal/20 text-eru-teal border border-eru-teal/30 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Return to Browser"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {item.type === 'tv' ? <Tv className="w-4 h-4 text-eru-teal shrink-0" /> : <Film className="w-4 h-4 text-eru-teal shrink-0" />}
            <span className="text-xs font-bold text-slate-100 truncate">
              {item.title}
            </span>
            {item.type === 'tv' && (
              <span className="px-2 py-0.5 rounded bg-eru-teal/15 text-eru-teal font-mono text-[11px] font-bold border border-eru-teal/30 shrink-0">
                S{currentSeason} : E{currentEpisode}
              </span>
            )}
          </div>
        </div>

        {/* Center: Server Switcher */}
        {serverList.length > 0 && (
          <div className="hidden md:flex items-center gap-1 bg-eru-bg/80 p-0.5 rounded-lg border border-eru-teal/15 text-xs">
            <span className="px-2 text-[10px] uppercase font-bold text-eru-muted flex items-center gap-1">
              <Server className="w-3 h-3 text-eru-teal" />
              Server:
            </span>
            {serverList.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => handleServerChange(srv)}
                className={`px-2 py-1 rounded font-medium transition-all text-xs ${
                  activeServer?.name === srv.name
                    ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {srv.name.replace(/\s*\(.*\)/, '')}
              </button>
            ))}
          </div>
        )}

        {/* Right: TV Navigation & Theater Mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.type === 'tv' && (
            <>
              <button
                onClick={handlePrevEpisode}
                disabled={currentEpisode <= 1}
                className="p-1.5 rounded-lg bg-eru-bg/80 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Previous Episode"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNextEpisode}
                className="p-1.5 rounded-lg bg-eru-bg/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
                title="Next Episode"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  showEpisodeDrawer
                    ? 'bg-eru-teal text-slate-950 border-eru-teal'
                    : 'bg-eru-bg/80 text-slate-300 border-slate-700/80 hover:border-eru-teal/40'
                }`}
                title="Episodes List"
              >
                <ListVideo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Episodes</span>
              </button>
            </>
          )}

          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className="p-1.5 rounded-lg bg-eru-bg/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
            title={theaterMode ? 'Exit Theater' : 'Theater Mode'}
          >
            {theaterMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Video Cinema Area */}
      <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-black border border-eru-teal/20 shadow-2xl flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-eru-teal border-t-transparent rounded-full animate-spin shadow-teal-glow" />
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-eru-teal" />
              Connecting to secure cinema stream...
            </p>
          </div>
        ) : streamUrl ? (
          <iframe
            key={streamUrl}
            src={streamUrl}
            title={item.title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-center space-y-3 p-6">
            <Film className="w-12 h-12 text-eru-muted mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Stream link currently unavailable on this server
            </p>
            <p className="text-xs text-slate-500">
              Try choosing another server from the top bar
            </p>
          </div>
        )}

        {/* Floating Episode Drawer */}
        {showEpisodeDrawer && (
          <div className="absolute right-3 top-3 bottom-3 w-72 bg-eru-darkest/95 border border-eru-teal/30 rounded-2xl p-4 backdrop-blur-xl shadow-2xl z-30 flex flex-col space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-eru-teal flex items-center gap-1.5">
                <ListVideo className="w-3.5 h-3.5" />
                Season {currentSeason} Episodes
              </span>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {episodes.map(ep => (
                <button
                  key={ep.number}
                  onClick={() => handleSelectDrawerEpisode(ep.number)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                    currentEpisode === ep.number
                      ? 'bg-eru-teal text-slate-950 font-bold shadow-teal-glow'
                      : 'bg-eru-card/60 text-slate-300 hover:bg-eru-card hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{ep.title || `Episode ${ep.number}`}</span>
                  <span className="text-[10px] opacity-75 font-mono">E{ep.number}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
