import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import HeroBanner from './components/HeroBanner';
import MediaGrid from './components/MediaGrid';
import MediaDetailModal from './components/MediaDetailModal';
import PlayerView from './components/PlayerView';
import SettingsModal from './components/SettingsModal';
import { ApiService } from './services/api';
import { StorageService } from './services/storage';
import { Film, Tv, Sparkles, RefreshCw, BookmarkCheck, Search } from 'lucide-react';

export default function App() {
  const [source, setSource] = useState(() => StorageService.getSettings().defaultSource || 'ridomovie');
  const [currentTab, setCurrentTab] = useState('discover'); // 'discover' | 'movies' | 'tv' | 'watchlist' | 'history'
  
  // Data states
  const [heroes, setHeroes] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Watchlist & History
  const [watchlist, setWatchlist] = useState(() => StorageService.getWatchlist());
  const [history, setHistory] = useState(() => StorageService.getHistory());

  // Overlays / Active Modes
  const [activeMediaDetail, setActiveMediaDetail] = useState(null);
  const [playingMedia, setPlayingMedia] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch home / discovery data
  const loadHomeData = useCallback(async (src) => {
    setLoading(true);
    try {
      const data = await ApiService.getHome(src);
      if (data) {
        setHeroes(data.heroes || []);
        setMediaList(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData(source);
  }, [source, loadHomeData]);

  // Handle Search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await ApiService.search(source, query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Watchlist actions
  const isWatchlisted = useCallback((id) => {
    return watchlist.some(item => item.id === id);
  }, [watchlist]);

  const toggleWatchlist = (item) => {
    const updated = StorageService.toggleWatchlist(item);
    setWatchlist(updated);
  };

  // Play handler
  const handlePlay = (item) => {
    setActiveMediaDetail(null);
    setPlayingMedia(item);
  };

  // Source change handler
  const handleSourceChange = (newSource) => {
    setSource(newSource);
    setSearchResults(null);
    setSearchQuery('');
  };

  // Filter items by current tab
  const getDisplayItems = () => {
    if (searchResults !== null) {
      return searchResults;
    }
    if (currentTab === 'movies') {
      return mediaList.filter(item => item.type === 'movie');
    }
    if (currentTab === 'tv') {
      return mediaList.filter(item => item.type === 'tv');
    }
    if (currentTab === 'watchlist') {
      return watchlist;
    }
    if (currentTab === 'history') {
      return history;
    }
    return mediaList;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-eru-bg text-slate-100 overflow-hidden">
      {/* Frameless Custom Window Titlebar */}
      <TitleBar
        source={source}
        onSourceChange={handleSourceChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearch}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Hidden if full theater player is active) */}
        {!playingMedia && (
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              setSearchResults(null);
            }}
            watchlistCount={watchlist.length}
            onOpenSettings={() => setIsSettingsOpen(true)}
            source={source}
          />
        )}

        {/* Center Canvas */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-eru-bg">
          {playingMedia ? (
            /* Dedicated Cinema Player View */
            <PlayerView
              item={playingMedia}
              source={source}
              onBack={() => setPlayingMedia(null)}
            />
          ) : (
            /* Browse View */
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar space-y-8">
              {/* If Searching */}
              {searchResults !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Search className="w-5 h-5 text-eru-teal" />
                      Search results for "{searchQuery}"
                    </h2>
                    <button
                      onClick={() => {
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                      className="text-xs text-eru-teal hover:underline font-semibold"
                    >
                      Clear Search
                    </button>
                  </div>
                  <MediaGrid
                    title={`Results (${searchResults.length})`}
                    items={searchResults}
                    loading={isSearching}
                    onPlay={handlePlay}
                    onOpenDetail={setActiveMediaDetail}
                    onToggleWatchlist={toggleWatchlist}
                    isWatchlisted={isWatchlisted}
                    showFilters={false}
                  />
                </div>
              ) : (
                <>
                  {/* Hero Banner (Only on Discover tab) */}
                  {currentTab === 'discover' && heroes.length > 0 && (
                    <HeroBanner
                      items={heroes}
                      onPlay={handlePlay}
                      onOpenDetail={setActiveMediaDetail}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                    />
                  )}

                  {/* Section Title & Media Grid */}
                  <MediaGrid
                    title={
                      currentTab === 'discover'
                        ? 'Trending & Popular'
                        : currentTab === 'movies'
                        ? 'Movies'
                        : currentTab === 'tv'
                        ? 'TV Shows'
                        : currentTab === 'watchlist'
                        ? 'My Watchlist'
                        : 'Watch History'
                    }
                    items={getDisplayItems()}
                    loading={loading}
                    onPlay={handlePlay}
                    onOpenDetail={setActiveMediaDetail}
                    onToggleWatchlist={toggleWatchlist}
                    isWatchlisted={isWatchlisted}
                    showFilters={currentTab === 'discover' || currentTab === 'movies' || currentTab === 'tv'}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Media Detail Modal */}
      {activeMediaDetail && (
        <MediaDetailModal
          item={activeMediaDetail}
          source={source}
          onClose={() => setActiveMediaDetail(null)}
          onPlay={handlePlay}
          onToggleWatchlist={toggleWatchlist}
          isWatchlisted={isWatchlisted}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onHistoryCleared={() => setHistory([])}
          currentSource={source}
          onSourceChange={handleSourceChange}
        />
      )}
    </div>
  );
}
