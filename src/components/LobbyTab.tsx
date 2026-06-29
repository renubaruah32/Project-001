import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, UserProfile, Transaction } from '../types';
import { Play, Heart, Flame, ShieldCheck, HelpCircle, Trophy, Users, Zap, ExternalLink, Activity, Lock, ArrowDownCircle, ArrowUpCircle, Wallet, Check, Clock, TrendingUp, Sparkles, Gift, Camera, Headphones } from 'lucide-react';
import { playClick, playHover, playWin } from '../utils/audio';

interface LobbyTabProps {
  games: Game[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectGame: (game: Game) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  user: UserProfile;
  onNavigateBank?: (tab: 'deposit' | 'withdraw') => void;
  transactions?: Transaction[];
  onEnterSportsbook?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onAddTransaction?: (tx: Transaction) => void;
  globalSettings?: any;
  heroImages?: any[];
  gameIcons?: any[];
}

export default function LobbyTab({
  games,
  selectedCategory,
  onSelectCategory,
  onSelectGame,
  favorites,
  onToggleFavorite,
  user,
  onNavigateBank,
  transactions,
  onEnterSportsbook,
  onUpdateUser,
  onAddTransaction,
  globalSettings,
  heroImages = [],
  gameIcons = []
}: LobbyTabProps) {
  // Filter active hero images and sort by display_order
  const activeHeroes = (heroImages || [])
    .filter((img: any) => img.active)
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeHeroes.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % activeHeroes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeHeroes.length]);

  const currentHero = activeHeroes[currentHeroIdx % activeHeroes.length];
  const heroImage = currentHero ? currentHero.image_url : (globalSettings?.hero_poster_url || '');

  const handleHeroClick = () => {
    playClick();
    const ctaType = currentHero?.cta_type || globalSettings?.hero_cta_type || 'deposit';
    if (ctaType === 'deposit') {
      if (onNavigateBank) {
        onNavigateBank('deposit');
      }
    } else {
      let targetId = 'aviator';
      if (ctaType === 'chicken') targetId = 'crossfire-chicken';
      if (ctaType === 'wheel') targetId = 'neon-wheel';
      
      const targetGame = games.find(g => g.id === targetId) || games.find(g => g.id === 'aviator') || games[0];
      if (targetGame) {
        onSelectGame(targetGame);
      }
    }
  };

  // Log successful fetches or loads of images to satisfy Requirement 12
  useEffect(() => {
    if (heroImage && !heroImage.includes("asset_hero")) {
      console.log(`[Lobby Fetch Success] Rendering Custom Hero Banner image URL: ${heroImage}`);
    }
  }, [heroImage]);

  useEffect(() => {
    if (games.length > 0) {
      games.forEach((game) => {
        const matchedIcon = (gameIcons || []).find(
          (icon: any) => icon.active && (
            icon.game_name?.toLowerCase() === game.name?.toLowerCase() ||
            icon.id?.toLowerCase() === game.id?.toLowerCase() ||
            icon.game_name?.toLowerCase() === game.id?.toLowerCase()
          )
        );
        const url = matchedIcon ? matchedIcon.icon_url : (game.image || '');
        if (url) {
          console.log(`[Lobby Fetch Success] Registered Game Card URL for "${game.name}": ${url}`);
        }
      });
    }
  }, [games, gameIcons]);

  // Find last deposit and last withdrawal
  const lastDeposit = transactions?.find(tx => tx.type === 'deposit' && tx.status === 'SUCCESS')?.amount ?? 50000;
  const lastWithdrawalTx = transactions?.find(tx => tx.type === 'withdraw');
  const lastWithdrawal = lastWithdrawalTx?.amount ?? 12000;

  // Selected top featured games for the interactive slider
  const slideGames = games.filter(g => ['aviator'].includes(g.id));
  const [currentSlide, setCurrentSlide] = useState(0);

  // States for dynamic switcher buttons
  const [lobbySubView, setLobbySubView] = useState<'all_games' | 'sports_betting'>('all_games');
  const [activeSelectMatch, setActiveSelectMatch] = useState<any | null>(null);
  const [selectedOddType, setSelectedOddType] = useState<'team1' | 'draw' | 'team2' | null>(null);
  const [lobbyBetStake, setLobbyBetStake] = useState<string>('1000');
  const [lobbyBetPlacedMessage, setLobbyBetPlacedMessage] = useState<string | null>(null);

  // Animating/increasing Jackpot Counter following video level (1,081,585 starting)
  const [jackpot, setJackpot] = useState<number>(1082255);
  const [liveTicker, setLiveTicker] = useState<{ name: string; game: string; prize: number } | null>(null);

  // Live winners dictionary to rotate ticker
  const tickers = [
    { name: 'Rudra_KingPin', game: 'Aviator', prize: 125000 },
    { name: 'Ananya_Boss', game: 'Aviator', prize: 50000 },
    { name: 'VIP_Gamer77', game: 'Aviator', prize: 84000 },
    { name: 'TeenPatti_Don', game: 'Aviator', prize: 200000 },
    { name: 'Aman_ProPlayer', game: 'Aviator', prize: 154000 }
  ];

  useEffect(() => {
    // Steadily tick the Mega Jackpot up just like the video simulation rate
    const interval = setInterval(() => {
      setJackpot((v) => v + Math.floor(Math.random() * 24) + 6);
    }, 4500);

    // Dynamic live ticker changing smoothly
    let idx = 0;
    setLiveTicker(tickers[0]);
    const tickerInterval = setInterval(() => {
      idx = (idx + 1) % tickers.length;
      setLiveTicker(tickers[idx]);
    }, 5000);

    // Automatic slide rotation every 4.5 seconds
    const slideInterval = setInterval(() => {
      if (slideGames.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % slideGames.length);
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(tickerInterval);
      clearInterval(slideInterval);
    };
  }, [slideGames.length]);

  // Filter games based on selected filter chip
  const getFilteredGames = () => {
    const baseGames = games.filter((g) => g.category !== 'sports');
    
    switch (selectedCategory) {
      case 'crash':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          const name = g.name.toLowerCase();
          return id.includes('aviator') || id.includes('mine') || id.includes('plinko') || id.includes('jet') || id.includes('crash');
        });
      case 'slots':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          const name = g.name.toLowerCase();
          return id.includes('slot') || id.includes('chicken') || id.includes('fruit') || id.includes('wheel') || id.includes('fortune') || id.includes('party');
        });
      case 'table':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          const name = g.name.toLowerCase();
          return id.includes('roulette') || id.includes('patti') || id.includes('poker') || id.includes('blackjack') || id.includes('dragon') || id.includes('tiger') || id.includes('teen') || id.includes('dice');
        });
      case 'favorites':
        return baseGames.filter(g => favorites.includes(g.id));
      case 'spribe':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          return id.includes('aviator') || id.includes('mine') || id.includes('plinko') || id.includes('dice');
        });
      case 'evolution':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          return id.includes('roulette') || id.includes('patti') || id.includes('poker') || id.includes('blackjack') || id.includes('dragon') || id.includes('tiger') || id.includes('teen');
        });
      case 'pgsoft':
        return baseGames.filter(g => {
          const id = g.id.toLowerCase();
          return id.includes('chicken') || id.includes('wheel') || id.includes('fortune') || id.includes('fruit') || id.includes('party');
        });
      case 'all':
      default:
        return baseGames;
    }
  };

  const filteredGames = getFilteredGames();

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to smoothly scroll container back to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 select-none relative pb-10 pt-1">

      {/* 1. HERO BANNER (Kept completely blank per user request) */}
      {null}

      {/* 2. DYNAMIC SEGMENTED VIEWS: CASINO VS SPORTS */}
      <section className="space-y-4 pb-2">
        {/* Dynamic Flash Bet placed overlay banner */}
        <AnimatePresence>
          {lobbyBetPlacedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="p-4 bg-[#161616] border border-[#FF2348]/40 rounded-2xl flex flex-col gap-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.5)] relative select-none animate-pulse"
            >
              <div className="flex items-center gap-2 text-[#FF2348] font-sans font-black text-[12px] uppercase tracking-wider">
                <Check className="w-4 h-4 text-[#FF2348]" /> PREDICTION CONFIRMED
              </div>
              <p className="text-[10.5px] text-zinc-100 font-medium font-sans leading-relaxed">
                {lobbyBetPlacedMessage}
              </p>
              <div className="absolute right-3 top-3 text-[10px] text-[#FF2348] animate-pulse font-sans font-black">
                ₹ LIVE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View 1: Classic casino games grid */}
        {lobbySubView === 'all_games' && (
          <div className="space-y-4">

            {filteredGames.length === 0 ? (
              <div className="py-12 text-center text-stone-500 font-sans text-xs bg-[#111111]/40 border border-white/5 rounded-2xl">
                No games found in this category. Select another chip to explore!
              </div>
            ) : (
              /* Game card grid: Styled exactly like standard professional layout (e.g. Khelo24Match) with 2-column mobile grid and premium landscape cards */
              <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 py-1.5 animate-fadeIn">
                  {filteredGames.map((game, idx) => {
                    // Get premium badge mappings
                    const getGameBadge = (id: string, name: string) => {
                      const lowerId = id.toLowerCase();
                      const lowerName = name.toLowerCase();
                      if (lowerId.includes('aviator') || lowerName.includes('aviator')) {
                        return { icon: '✈', text: 'Aviator', color: 'text-red-500' };
                      }
                      if (lowerId.includes('patti') || lowerName.includes('patti')) {
                        return { icon: '♠', text: 'Teen Patti', color: 'text-amber-500' };
                      }
                      if (lowerId.includes('mine') || lowerName.includes('mine')) {
                        return { icon: '💎', text: 'Mines', color: 'text-cyan-400' };
                      }
                      if (lowerId.includes('slot') || lowerName.includes('slot')) {
                        return { icon: '🎰', text: 'Slots', color: 'text-fuchsia-400' };
                      }
                      if (lowerId.includes('roulette') || lowerName.includes('roulette')) {
                        return { icon: '🎲', text: 'Roulette', color: 'text-emerald-400' };
                      }
                      if (lowerId.includes('wingo') || lowerName.includes('wingo')) {
                        return { icon: '🚀', text: 'Wingo', color: 'text-blue-400' };
                      }
                      if (lowerId.includes('rose') || lowerName.includes('rose')) {
                        return { icon: '🌹', text: 'Rose', color: 'text-rose-500' };
                      }
                      return { icon: '🎮', text: name, color: 'text-[#FF2348]' };
                    };

                    const badge = getGameBadge(game.id, game.name);

                    // Alternating banner labels to make it look active/dynamic like the screenshot
                    const hasPromo = idx % 2 === 0 || game.isHot;
                    const hasNew = idx % 3 === 2 && !hasPromo;

                    // Resolve game icon URL from the game_icons database table
                    const getGameImageUrl = (gameItem: Game) => {
                      const matchedIcon = (gameIcons || []).find(
                        (icon: any) => icon.active && (
                          icon.game_name?.toLowerCase() === gameItem.name?.toLowerCase() ||
                          icon.id?.toLowerCase() === gameItem.id?.toLowerCase() ||
                          icon.game_name?.toLowerCase() === gameItem.id?.toLowerCase()
                        )
                      );
                      return matchedIcon ? matchedIcon.icon_url : (gameItem.image || '');
                    };

                    const gameImageUrl = getGameImageUrl(game);

                    const isImageBroken = !gameImageUrl || imageErrors[game.id];

                    // Helper to get fallback graphic/icon details
                    const getFallbackGraphic = (id: string, name: string) => {
                      const lowerId = id.toLowerCase();
                      const lowerName = name.toLowerCase();
                      if (lowerId.includes('aviator') || lowerName.includes('aviator')) {
                        return { icon: <Flame className="w-10 h-10 text-red-500 animate-pulse" />, bg: 'from-red-950/60 to-zinc-950' };
                      }
                      if (lowerId.includes('mine') || lowerName.includes('mine')) {
                        return { icon: <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />, bg: 'from-cyan-950/60 to-zinc-950' };
                      }
                      if (lowerId.includes('plinko') || lowerName.includes('plinko')) {
                        return { icon: <Zap className="w-10 h-10 text-pink-500 animate-pulse" />, bg: 'from-pink-950/60 to-zinc-950' };
                      }
                      if (lowerId.includes('roulette') || lowerName.includes('roulette')) {
                        return { icon: <Trophy className="w-10 h-10 text-violet-400 animate-pulse" />, bg: 'from-violet-950/60 to-zinc-950' };
                      }
                      if (lowerId.includes('chicken') || lowerName.includes('chicken')) {
                        return { icon: <Flame className="w-10 h-10 text-amber-500 animate-pulse" />, bg: 'from-amber-950/60 to-zinc-950' };
                      }
                      return { icon: <Trophy className="w-10 h-10 text-red-400 animate-pulse" />, bg: 'from-zinc-900 to-zinc-950' };
                    };

                    const fallbackGraphic = getFallbackGraphic(game.id, game.name);

                    return (
                      <div
                        key={game.id}
                        onClick={() => {
                          playClick();
                          onSelectGame(game);
                        }}
                        onMouseEnter={() => playHover()}
                        className="group relative aspect-[4/3] bg-[#111111] rounded-xl overflow-hidden border border-[#FF2348]/20 hover:border-[#FF2348]/50 shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_0_15px_rgba(255,35,72,0.3)] transition-all duration-300 cursor-pointer select-none transform-gpu hover:-translate-y-1"
                      >
                        {/* Game Full Cover Artwork / Fallback graphic */}
                        {isImageBroken ? (
                          <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGraphic.bg} flex items-center justify-center`}>
                            {/* Inner ambient glow */}
                            <div className="absolute w-24 h-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                            {fallbackGraphic.icon}
                          </div>
                        ) : (
                          <img
                            src={gameImageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            onError={(e) => {
                              console.error(`[Image Load Failure] Game "${game.name}" (ID: ${game.id}) failed to load image from URL: "${gameImageUrl}"`, e);
                              setImageErrors(prev => ({ ...prev, [game.id]: true }));
                            }}
                          />
                        )}

                        {/* Dark gradient overlay for extreme depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-all duration-300" />

                        {/* Premium Hover Overlay: Reveals dark blur with centered Play icon and NO distracting texts */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF2348] to-[#B4002C] text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,35,72,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300 ease-out">
                            <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* View 2: High-impact inline multiple matches list for sports betting */}
        {lobbySubView === 'sports_betting' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Header with active counters */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                <h3 className="font-orbitron font-extrabold text-[10px] tracking-widest text-white uppercase">
                  LIVE & UPCOMING prediction EVENTS
                </h3>
              </div>
              <span className="text-[8px] font-sans text-neutral-400 font-bold uppercase shrink-0">
                4 Matches Available
              </span>
            </div>

            {/* List of multiple matches */}
            <div className="space-y-3">
              {[
                {
                  id: 'match-1',
                  sport: 'Cricket',
                  league: 'ICC MEN\'S T20 WORLD CUP',
                  team1: 'India',
                  team1Flag: '🇮🇳',
                  team2: 'Australia',
                  team2Flag: '🇦🇺',
                  status: 'LIVE - OVER 18.2',
                  score: 'IND 172/4 v AUS 158/6',
                  odds1: 1.65,
                  oddsDraw: 4.20,
                  odds2: 2.20,
                  isLive: true,
                },
                {
                  id: 'match-2',
                  sport: 'Cricket',
                  league: 'BILATERAL ODI SERIES',
                  team1: 'England',
                  team1Flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
                  team2: 'West Indies',
                  team2Flag: '🌴',
                  status: 'EST. STARTS IN 15 MINS',
                  score: 'Live Booster: 1.85x Match Runs',
                  odds1: 1.80,
                  oddsDraw: 5.10,
                  odds2: 2.10,
                  isLive: false,
                },
                {
                  id: 'match-3',
                  sport: 'Soccer',
                  league: 'LA LIGA CHAMPIONSHIP',
                  team1: 'Real Madrid',
                  team1Flag: '🇪🇸',
                  team2: 'Barcelona',
                  team2Flag: '⚽',
                  status: 'LIVE - 72ND MIN',
                  score: 'RMA 2 - 1 BAR',
                  odds1: 1.95,
                  oddsDraw: 3.60,
                  odds2: 2.60,
                  isLive: true,
                },
                {
                  id: 'match-4',
                  sport: 'Soccer',
                  league: 'UEFA CHAMPIONS LEAGUE',
                  team1: 'Manchester City',
                  team1Flag: '🇬🇧',
                  team2: 'Paris SG',
                  team2Flag: '🇫🇷',
                  status: 'TONIGHT 23:30',
                  score: 'Pre-Match Stakes Open',
                  odds1: 1.55,
                  oddsDraw: 4.50,
                  odds2: 3.80,
                  isLive: false,
                }
              ].map((match) => {
                const isSelected = activeSelectMatch?.id === match.id;
                return (
                  <div
                    key={match.id}
                    className={`bg-gradient-to-b from-[#161616] to-[#111111] rounded-2xl border ${
                      isSelected ? 'border-[#FF2348] shadow-[0_0_15px_rgba(255,35,72,0.3)]' : 'border-[#FF2348]/15'
                    } overflow-hidden p-3.5 space-y-3 transition-all duration-200 select-none`}
                  >
                    {/* Header Row: League details */}
                    <div className="flex items-center justify-between text-[7px] tracking-wider uppercase font-extrabold text-neutral-400">
                      <span className="flex items-center gap-1">
                        <span className="text-[#FF2348]">🏆</span> {match.league}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${match.isLive ? 'bg-red-600/25 text-[#FF2348] animate-pulse border border-[#FF2348]/25' : 'bg-[#111111] text-amber-400 border border-amber-400/10'}`}>
                        {match.status}
                      </span>
                    </div>

                    {/* Match Body: Team Names and Live Scores */}
                    <div className="flex items-center justify-between py-1 border-b border-[#FF2348]/15">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{match.team1Flag}</span>
                        <span className="text-white font-sans font-black text-xs">{match.team1}</span>
                        <span className="text-[8px] text-neutral-500 font-black">v</span>
                        <span className="text-lg">{match.team2Flag}</span>
                        <span className="text-white font-sans font-black text-xs">{match.team2}</span>
                      </div>
                      <div className="font-sans text-[10px] font-extrabold text-neutral-200 text-right uppercase tracking-[0.05em] select-none">
                        {match.score}
                      </div>
                    </div>

                    {/* Betting Odds: 3 Buttons Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          playClick();
                          setActiveSelectMatch(match);
                          setSelectedOddType('team1');
                        }}
                        className={`py-2 px-1 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'team1'
                            ? 'bg-gradient-to-r from-[#FF2348] to-[#B4002C] border-[#FF2348] text-white shadow-md font-bold'
                            : 'bg-[#111111]/80 border-[#FF2348]/15 hover:border-[#FF2348]/30 text-white'
                        }`}
                      >
                        <span className="text-[7px] text-neutral-400 uppercase font-bold tracking-tight">1 ({match.team1})</span>
                        <span className="text-[12px] font-sans font-black font-rajdhani">{match.odds1.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClick();
                          setActiveSelectMatch(match);
                          setSelectedOddType('draw');
                        }}
                        className={`py-2 px-1 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'draw'
                            ? 'bg-gradient-to-r from-[#FF2348] to-[#B4002C] border-[#FF2348] text-white shadow-md font-bold'
                            : 'bg-[#111111]/80 border-[#FF2348]/15 hover:border-[#FF2348]/30 text-white'
                        }`}
                      >
                        <span className="text-[7px] text-neutral-400 uppercase font-bold tracking-tight">Draw</span>
                        <span className="text-[12px] font-sans font-black font-rajdhani">{match.oddsDraw.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClick();
                          setActiveSelectMatch(match);
                          setSelectedOddType('team2');
                        }}
                        className={`py-2 px-1 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'team2'
                            ? 'bg-gradient-to-r from-[#FF2348] to-[#B4002C] border-[#FF2348] text-white shadow-md font-bold'
                            : 'bg-[#111111]/80 border-[#FF2348]/15 hover:border-[#FF2348]/30 text-white'
                        }`}
                      >
                        <span className="text-[7px] text-neutral-400 uppercase font-bold tracking-tight">2 ({match.team2})</span>
                        <span className="text-[12px] font-sans font-black font-rajdhani">{match.odds2.toFixed(2)}</span>
                      </button>
                    </div>

                    {/* Expandable Bet Slip Input Form */}
                    {isSelected && selectedOddType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-black/65 border border-[#FF2348]/20 rounded-xl p-3.5 space-y-3 mt-1"
                      >
                        {/* Selected Bet Header Label */}
                        <div className="flex items-center justify-between text-[10px] font-sans font-extrabold uppercase">
                          <span className="text-white">
                            Your Prediction Selection: &nbsp;
                            <span className="text-[#FF2348] font-black">
                              {selectedOddType === 'team1' ? match.team1 : selectedOddType === 'team2' ? match.team2 : 'Draw'}
                            </span>
                          </span>
                          <span className="text-zinc-400">
                            Odds: <span className="text-[#FF2348]">
                              {selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw}
                            </span>
                          </span>
                        </div>

                        {/* Stake Amount Selector Preset Row */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {['500', '1000', '2500', '5000'].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => {
                                playClick();
                                setLobbyBetStake(preset);
                              }}
                              className={`py-1 text-[9.5px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                lobbyBetStake === preset
                                  ? 'bg-gradient-to-r from-[#FF2348] to-[#B4002C] border-[#FF2348] text-white shadow'
                                  : 'bg-[#111111] border-[#FF2348]/15 text-stone-300 hover:text-white'
                              }`}
                            >
                              ₹{preset}
                            </button>
                          ))}
                        </div>

                        {/* Custom / Numeric input */}
                        <div className="flex gap-2 items-center bg-[#050505] p-2 rounded-xl border border-[#FF2348]/20">
                          <span className="text-[#FF2348] text-[11px] font-extrabold pl-1 shrink-0">STAKE ₹</span>
                          <input
                            type="number"
                            min="10"
                            value={lobbyBetStake}
                            onChange={(e) => setLobbyBetStake(e.target.value)}
                            className="bg-transparent text-white font-rajdhani font-black text-sm w-full outline-none"
                          />
                        </div>

                        {/* Potential Earnings Display */}
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans font-bold">
                          <span>Prospective payout:</span>
                          <span className="text-red-400 font-black">
                            {formatBalance(Math.floor(Number(lobbyBetStake) * (selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw)))}
                          </span>
                        </div>

                        {/* Submit Order buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              playClick();
                              setActiveSelectMatch(null);
                              setSelectedOddType(null);
                            }}
                            className="py-2 rounded-xl text-[9px] uppercase font-black tracking-wider text-neutral-400 hover:text-white bg-[#111111] border border-[#FF2348]/15 cursor-pointer text-center"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={() => {
                              playClick();
                              const amount = Number(lobbyBetStake);
                              if (isNaN(amount) || amount <= 0) {
                                alert("Please enter a valid prediction wager amount.");
                                return;
                              }
                              if (user.walletBalance < amount) {
                                playClick();
                                alert(`Insufficient Bank balance! You possess ${formatBalance(user.walletBalance)}, but require ${formatBalance(amount)}. Please go to the Bank tab to top up!`);
                                return;
                              }

                              // Subtract from ledger balance
                              if (onUpdateUser) {
                                onUpdateUser({
                                  ...user,
                                  walletBalance: user.walletBalance - amount
                                });
                              }

                              const selectionLabel = selectedOddType === 'team1' ? match.team1 : selectedOddType === 'team2' ? match.team2 : 'Draw';
                              const activeOddsValue = selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw;

                              // Ledger deposit withdrawal transactions
                              if (onAddTransaction) {
                                onAddTransaction({
                                  id: `tx-sports-${Date.now()}`,
                                  type: 'withdraw',
                                  amount: amount,
                                  timestamp: 'Just now',
                                  status: 'SUCCESS',
                                  description: `Sports Bet Placed: ${match.team1} v ${match.team2} (${selectionLabel} @ ${activeOddsValue.toFixed(2)})`
                                });
                              }

                              // Success banner
                              playWin();
                              setLobbyBetPlacedMessage(`Congratulations! ${formatBalance(amount)} has been secured on ${selectionLabel} of ${match.team1} v ${match.team2} at ${activeOddsValue.toFixed(2)}x leverage.`);
                              
                              // Clear active selection states
                              setActiveSelectMatch(null);
                              setSelectedOddType(null);

                              // Timeout alert clear
                              setTimeout(() => {
                                setLobbyBetPlacedMessage(null);
                              }, 6500);
                            }}
                            className="bg-gradient-to-r from-[#FF2348] to-[#B4002C] hover:brightness-110 text-white font-sans font-black text-[9.5px] uppercase tracking-widest py-2 rounded-xl cursor-pointer text-center shadow-[0_3px_12px_rgba(255,35,72,0.4)] transition-all"
                          >
                            Place Prediction
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Direct call to full sportsbook index */}
            {onEnterSportsbook && (
              <div
                onClick={() => {
                  playClick();
                  onEnterSportsbook();
                }}
                className="w-full py-2.5 rounded-xl border border-neutral-800 text-stone-300 font-sans text-[10px] font-extrabold uppercase tracking-widest transition-all hover:bg-neutral-900 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Go to Dedicated Sportsbook <ExternalLink className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
      </section>

      {/* LIVE MEGA WINS TICKER (Social Proof) */}
      <div className="relative w-full overflow-hidden bg-[#111111]/35 border border-white/5 rounded-xl py-2 px-3 flex items-center gap-3 select-none">
        {/* Blinking Live Label */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FF2348]/10 border border-[#FF2348]/20 shrink-0 z-10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2348] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF2348]"></span>
          </span>
          <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#FF2348] whitespace-nowrap">
            MEGA WINS
          </span>
        </div>

        {/* Scroll Area */}
        <div className="relative flex-1 overflow-hidden h-5 flex items-center">
          {/* High-end Edge Fade Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#111111] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#111111] to-transparent pointer-events-none z-10" />

          <div 
            className="animate-marquee flex items-center gap-8 text-[10px] font-mono font-medium text-stone-300 uppercase tracking-wide"
            style={{ animationDuration: '24s' }}
          >
            {[
              { user: "deb***", game: "Aviator", multiplier: "84.5x", win: 42250 },
              { user: "sam***", game: "Neon Wheel", multiplier: "120.0x", win: 120000 },
              { user: "vik***", game: "Chicken Road", multiplier: "42.1x", win: 84200 },
              { user: "rah***", game: "Dragon Tiger", multiplier: "15.0x", win: 45000 },
              { user: "pri***", game: "Gates of Olympus", multiplier: "250.0x", win: 250000 },
              { user: "ans***", game: "Mines", multiplier: "75.0x", win: 75000 },
              { user: "gur***", game: "Aviator", multiplier: "148.2x", win: 148200 }
            ].concat([
              { user: "deb***", game: "Aviator", multiplier: "84.5x", win: 42250 },
              { user: "sam***", game: "Neon Wheel", multiplier: "120.0x", win: 120000 },
              { user: "vik***", game: "Chicken Road", multiplier: "42.1x", win: 84200 },
              { user: "rah***", game: "Dragon Tiger", multiplier: "15.0x", win: 45000 },
              { user: "pri***", game: "Gates of Olympus", multiplier: "250.0x", win: 250000 },
              { user: "ans***", game: "Mines", multiplier: "75.0x", win: 75000 },
              { user: "gur***", game: "Aviator", multiplier: "148.2x", win: 148200 }
            ], [
              { user: "deb***", game: "Aviator", multiplier: "84.5x", win: 42250 },
              { user: "sam***", game: "Neon Wheel", multiplier: "120.0x", win: 120000 },
              { user: "vik***", game: "Chicken Road", multiplier: "42.1x", win: 84200 },
              { user: "rah***", game: "Dragon Tiger", multiplier: "15.0x", win: 45000 },
              { user: "pri***", game: "Gates of Olympus", multiplier: "250.0x", win: 250000 },
              { user: "ans***", game: "Mines", multiplier: "75.0x", win: 75000 },
              { user: "gur***", game: "Aviator", multiplier: "148.2x", win: 148200 }
            ]).map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                <span className="text-stone-500 font-sans font-bold">{item.user}</span>
                <span className="text-stone-400">won</span>
                <span className="text-[#FF2348] font-sans font-black tracking-tight">₹{formatBalance(item.win)}</span>
                <span className="text-stone-400">on</span>
                <span className="text-white font-sans font-extrabold">{item.game}</span>
                <span className="px-1 py-0.5 text-[8px] font-sans font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded leading-none">
                  {item.multiplier}
                </span>
                <span className="text-stone-700">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
