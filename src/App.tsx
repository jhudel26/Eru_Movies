import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import HeroBanner, { HeroBannerSkeleton } from './components/HeroBanner';
import MediaGrid from './components/MediaGrid';
import MediaDetailModal from './components/MediaDetailModal';
import PlayerView from './components/PlayerView';
import SettingsModal from './components/SettingsModal';
import { MediaGridErrorBoundary, PlayerErrorBoundary } from './components/ErrorBoundary';
import { ApiService } from './services/api';
import { StorageService } from './services/storage';
import { Search, Clock, ChevronRight } from 'lucide-react';
import MediaCard from './components/MediaCard';

export default function App() {
  const [currentTab, setCurrentTab] = useState('discover');

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

  // Overlays
  const [activeMediaDetail, setActiveMediaDetail] = useState(null);
  const [playingMedia, setPlayingMedia] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load content by tab
  const loadTabContent = useCallback(async (tab) => {
    setLoading(true);
    try {
      if (tab === 'discover') {
        const data = await ApiService.getHome();
        setHeroes(data.heroes || []);
        setMediaList(data.items || []);
      } else if (tab === 'movies') {
        const movies = await ApiService.getMovies();
        setMediaList(movies || []);
        setHeroes([]);
      } else if (tab === 'tv') {
        const tvShows = await ApiService.getTvShows();
        setMediaList(tvShows || []);
        setHeroes([]);
      } else if (tab === 'watchlist') {
        setMediaList(StorageService.getWatchlist());
        setHeroes([]);
      } else if (tab === 'history') {
        setMediaList(StorageService.getHistory());
        setHeroes([]);
      }
    } catch (err) {
      console.error(`Failed to load ${tab} content:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabContent(currentTab);
  }, [currentTab, loadTabContent]);

  // Search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await ApiService.search(query);
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Watchlist
  const isWatchlisted = useCallback((id) => {
    return watchlist.some(item => item.id === id);
  }, [watchlist]);

  const toggleWatchlist = (item) => {
    const updated = StorageService.toggleWatchlist(item);
    setWatchlist(updated);
    if (currentTab === 'watchlist') setMediaList(updated);
  };

  // Play
  const handlePlay = (item) => {
    setActiveMediaDetail(null);
    setPlayingMedia(item);
    StorageService.addToHistory(item);
    setHistory(StorageService.getHistory());
  };

  // Close Player & synchronize history
  const handlePlayerClose = (updatedItem) => {
    setPlayingMedia(null);
    const freshHistory = StorageService.getHistory();
    setHistory(freshHistory);
    if (currentTab === 'history') {
      setMediaList(freshHistory);
    }
  };

  // History removal handlers
  const handleRemoveFromHistory = (id) => {
    const freshHistory = StorageService.removeFromHistory(id);
    setHistory(freshHistory);
    if (currentTab === 'history') {
      setMediaList(freshHistory);
    }
  };

  const handleClearHistory = () => {
    const freshHistory = StorageService.clearHistory();
    setHistory(freshHistory);
    if (currentTab === 'history') {
      setMediaList([]);
    }
  };

  // Continue Watching — recent history items (not currently playing)
  const continueWatching = history.slice(0, 6);

  const getDisplayItems = () => searchResults !== null ? searchResults : mediaList;

  const sectionTitle = () => {
    if (searchResults !== null) return `Results (${searchResults.length})`;
    if (currentTab === 'discover') return 'Trending & Popular';
    if (currentTab === 'movies') return 'Movies';
    if (currentTab === 'tv') return 'TV Series & Shows';
    if (currentTab === 'watchlist') return 'My Watchlist';
    return 'Watch History';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-eru-bg text-eru-text-primary overflow-hidden">
      {!playingMedia && (
        <TitleBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearch}
          isLoading={loading || isSearching}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {!playingMedia && (
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              setSearchResults(null);
              setSearchQuery('');
            }}
            watchlistCount={watchlist.length}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-eru-bg">
          {playingMedia ? (
            <PlayerErrorBoundary onError={handlePlayerClose}>
              <PlayerView
                item={playingMedia}
                onBack={handlePlayerClose}
              />
            </PlayerErrorBoundary>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 custom-scrollbar">

              {/* Search results view */}
              {searchResults !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-eru-text-primary">
                      <Search className="w-5 h-5 text-eru-teal" />
                      Results for "{searchQuery}"
                    </h2>
                    <button
                      onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                      className="text-xs text-eru-teal hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <MediaGrid
                    title={`${searchResults.length} results`}
                    items={searchResults}
                    loading={isSearching}
                    onPlay={handlePlay}
                    onOpenDetail={setActiveMediaDetail}
                    onToggleWatchlist={toggleWatchlist}
                    isWatchlisted={isWatchlisted}
                    showFilters={false}
                    tabType="search"
                  />
                </div>
              ) : (
                <>
                  {/* Hero banner — Discover only (with Skeleton on loading) */}
                  {currentTab === 'discover' && (
                    loading ? (
                      <HeroBannerSkeleton />
                    ) : heroes.length > 0 ? (
                      <HeroBanner
                        items={heroes}
                        onPlay={handlePlay}
                        onOpenDetail={setActiveMediaDetail}
                        onToggleWatchlist={toggleWatchlist}
                        isWatchlisted={isWatchlisted}
                      />
                    ) : null
                  )}

                  {/* Continue Watching — Discover only, when history exists */}
                  {currentTab === 'discover' && !loading && continueWatching.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-[3px] h-5 rounded-full bg-eru-teal shadow-teal-glow-sm" />
                          <h2 className="text-[17px] font-bold text-eru-text-primary tracking-tight">
                            Continue Watching
                          </h2>
                          <Clock className="w-4 h-4 text-eru-teal-muted" />
                        </div>
                        <button
                          onClick={() => setCurrentTab('history')}
                          className="flex items-center gap-1 text-xs text-eru-teal hover:underline font-semibold"
                        >
                          View all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
                        {continueWatching.map(item => (
                          <MediaCard
                            key={item.id}
                            item={item}
                            onPlay={handlePlay}
                            onOpenDetail={setActiveMediaDetail}
                            onToggleWatchlist={toggleWatchlist}
                            isWatchlisted={isWatchlisted}
                            onRemoveHistory={handleRemoveFromHistory}
                            isHistory={true}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Main media grid */}
                  <MediaGridErrorBoundary>
                    <MediaGrid
                      title={sectionTitle()}
                      items={getDisplayItems()}
                      loading={loading}
                      onPlay={handlePlay}
                      onOpenDetail={setActiveMediaDetail}
                      onToggleWatchlist={toggleWatchlist}
                      isWatchlisted={isWatchlisted}
                      showFilters={['discover', 'movies', 'tv'].includes(currentTab)}
                      tabType={currentTab}
                      onRemoveHistory={handleRemoveFromHistory}
                      onClearHistory={handleClearHistory}
                      onNavigateDiscover={() => {
                        setCurrentTab('discover');
                        setSearchResults(null);
                        setSearchQuery('');
                      }}
                    />
                  </MediaGridErrorBoundary>
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
          onHistoryCleared={() => {
            setHistory([]);
            if (currentTab === 'history') setMediaList([]);
          }}
        />
      )}
    </div>
  );
}
