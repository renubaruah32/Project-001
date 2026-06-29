import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, UserProfile, Transaction } from '../types';
import { Play, Heart, Flame, ShieldCheck, HelpCircle, Trophy, Users, Zap, ExternalLink, Activity, Lock, ArrowDownCircle, ArrowUpCircle, Wallet, Check, Clock, TrendingUp, Sparkles, Gift, Camera, Headphones, Star } from 'lucide-react';
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Segment selector for All Games (Casino) vs Sports Betting
  const [lobbySubView, setLobbySubView] = useState<'all_games' | 'sports_betting'>('all_games');
  const [activeSelectMatch, setActiveSelectMatch] = useState<any | null>(null);
  const [selectedOddType, setSelectedOddType] = useState<'team1' | 'draw' | 'team2' | null>(null);
  const [lobbyBetStake, setLobbyBetStake] = useState<string>('1000');
  const [lobbyBetPlacedMessage, setLobbyBetPlacedMessage] = useState<string | null>(null);

  // Jackpots and tickers
  const [jackpot, setJackpot] = useState<number>(1082255);
  const [liveTicker, setLiveTicker] = useState<{ name: string; game: string; prize: number } | null>(null);

  const tickers = [
    { name: 'Rudra_KingPin', game: 'Aviator', prize: 125000 },
    { name: 'Ananya_Boss', game: 'Aviator', prize: 50000 },
    { name: 'VIP_Gamer77', game: 'Aviator', prize: 84000 },
    { name: 'TeenPatti_Don', game: 'Aviator', prize: 200000 },
    { name: 'Aman_ProPlayer', game: 'Aviator', prize: 154000 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot((v) => v + Math.floor(Math.random() * 24) + 6);
    }, 4500);

    let idx = 0;
    setLiveTicker(tickers[0]);
    const tickerInterval = setInterval(() => {
      idx = (idx + 1) % tickers.length;
      setLiveTicker(tickers[idx]);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(tickerInterval);
    };
  }, []);

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
          return id.includes('roulette') || id.includes('patti') || id.includes('poker') || id.includes('blackjack') || id.includes('dragon') || id.includes('tiger') || id.includes('teen') || id.includes('dice') || id.includes('monopoly');
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

  // Predefined Categories
  const customCategories = [
    { id: 'all', label: 'All Games', icon: '🎮', color: '#FF174F' },
    { id: 'crash', label: 'Crash', icon: '✈', color: '#00E5FF' },
    { id: 'slots', label: 'Slots', icon: '🎰', color: '#FFD54F' },
    { id: 'table', label: 'Table Games', icon: '🎡', color: '#7B2EFF' },
    { id: 'favorites', label: 'Favorites', icon: '💖', color: '#FF4D8D' },
    { id: 'spribe', label: 'Spribe', icon: '⚡', color: '#00E676' },
    { id: 'evolution', label: 'Evolution', icon: '🔮', color: '#00E5FF' },
    { id: 'pgsoft', label: 'PG Soft', icon: '💎', color: '#7B2EFF' },
  ];

  return (
    <div className="space-y-6 select-none relative pb-10 pt-2 font-sans">
      
      {/* 1. HERO BANNER - Cyberpunk Redesign */}
      <div className="relative w-full rounded-3xl overflow-hidden glass-premium-card border border-[#FF174F]/25 shadow-[0_12px_40px_rgba(255,23,79,0.15)] flex flex-col md:flex-row items-center p-6 md:p-10 gap-6 select-none">
        {/* Animated grid lines overlay inside banner */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />
        {/* Soft atmospheric background gradient spheres */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-[#FF174F]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-80 h-80 bg-[#7B2EFF]/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-60 h-60 bg-[#00E5FF]/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Left Side: Typography content */}
        <div className="relative z-10 flex-1 flex flex-col items-start space-y-4 md:space-y-6 text-left">
          {/* Neon mini-label */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF174F]/20 to-[#FF4D8D]/10 border border-[#FF174F]/30 shadow-[0_0_12px_rgba(255,23,79,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
            <span className="font-sora font-extrabold text-[10px] uppercase tracking-wider text-white">
              TENZO PREMIUM CLUB • ₹100CR+ PRIZES
            </span>
          </div>

          {/* Massively bold slanted typography */}
          <div className="font-sora font-black tracking-tight leading-none text-left flex flex-col select-none">
            <span className="text-[42px] sm:text-[54px] md:text-[60px] text-white italic tracking-wider filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              PLAY.
            </span>
            <span className="text-[42px] sm:text-[54px] md:text-[60px] bg-gradient-to-r from-[#FF174F] via-[#FF4D8D] to-[#7B2EFF] bg-clip-text text-transparent italic tracking-wider filter drop-shadow-[0_0_15px_rgba(255,23,79,0.25)]">
              WIN.
            </span>
            <span className="text-[42px] sm:text-[54px] md:text-[60px] text-white italic tracking-wider filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center gap-2">
              EARN. <Sparkles className="w-8 h-8 text-[#FFD54F] animate-pulse shrink-0" />
            </span>
          </div>

          <p className="text-stone-300 font-sans text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
            Experience the next generation of online gaming. Zero lag, high payout leverages, and instant ledger credit.
          </p>

          {/* Glowing CTA Button */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(255,23,79,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playClick();
              if (onNavigateBank) {
                onNavigateBank('deposit');
              }
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] text-white font-sora font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-[0_6px_20px_rgba(255,23,79,0.4)] hover:shadow-[0_0_30px_rgba(255,23,79,0.65)] transition-all cursor-pointer flex items-center gap-2 border-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Add Funds & Play Now
          </motion.button>
        </div>

        {/* Right Side: High-Quality Interactive 3D Cyberpunk Art Representation with Floating Coins */}
        <div className="relative w-full md:w-[320px] aspect-[4/3] md:aspect-auto md:h-[220px] rounded-2xl bg-gradient-to-tr from-[#10131C] to-[#181D28]/60 border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
          {/* Floating Coin Icons */}
          <div className="absolute top-4 left-6 w-5 h-5 rounded-full bg-gradient-to-tr from-[#FFD54F] to-[#FF8F00] flex items-center justify-center text-[10px] font-black text-black shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>₹</div>
          <div className="absolute bottom-6 right-12 w-7 h-7 rounded-full bg-gradient-to-tr from-[#FFD54F] to-[#FF8F00] flex items-center justify-center text-[12px] font-black text-black shadow-lg animate-bounce" style={{ animationDelay: '0.6s' }}>₹</div>
          <div className="absolute top-12 right-6 w-4 h-4 rounded-full bg-gradient-to-tr from-[#FFD54F] to-[#FF8F00] flex items-center justify-center text-[8px] font-black text-black shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>₹</div>

          {/* Core Cyberpunk Hologram Circle */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-[#FF174F]/20 to-[#7B2EFF]/30 flex items-center justify-center border border-[#FF174F]/30 animate-pulse">
            {/* Spinning decorative orbit ring */}
            <svg className="absolute inset-[-8px] w-[152px] h-[152px] pointer-events-none animate-spin-slow opacity-40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" stroke="#00E5FF" strokeWidth="1" strokeDasharray="6,6" fill="none" />
            </svg>
            <div className="absolute w-24 h-24 rounded-full bg-[#10131C] border border-white/5 flex flex-col items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-[#FFD54F] drop-shadow-[0_0_8px_rgba(255,213,79,0.5)] animate-pulse" />
              <span className="font-orbitron font-extrabold text-[10px] text-[#00E5FF] tracking-wider mt-1">₹1,00,00,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM SEGMENT CONTROL - CASINO VS SPORTS */}
      <div className="w-full max-w-sm mx-auto flex p-1 bg-[#10131C] rounded-2xl border border-white/5 shadow-lg select-none">
        <button
          onClick={() => {
            playClick();
            setLobbySubView('all_games');
          }}
          className={`flex-1 py-2.5 rounded-xl font-sora font-extrabold text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer text-center ${
            lobbySubView === 'all_games'
              ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] text-white shadow-[0_4px_15px_rgba(255,23,79,0.3)]'
              : 'text-[#B8BEC9] hover:text-white'
          }`}
        >
          🎰 Casino Lobby
        </button>
        <button
          onClick={() => {
            playClick();
            setLobbySubView('sports_betting');
          }}
          className={`flex-1 py-2.5 rounded-xl font-sora font-extrabold text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer text-center ${
            lobbySubView === 'sports_betting'
              ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] text-white shadow-[0_4px_15px_rgba(255,23,79,0.3)]'
              : 'text-[#B8BEC9] hover:text-white'
          }`}
        >
          🏏 Live Sportsbook
        </button>
      </div>

      {/* 3. HORIZONTAL SCROLLING CATEGORY BENTO CHIPS */}
      {lobbySubView === 'all_games' && (
        <div className="w-full overflow-x-auto no-scrollbar py-2 select-none">
          <div className="flex gap-2.5 px-1 min-w-max">
            {customCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClick();
                    onSelectCategory(cat.id);
                  }}
                  onMouseEnter={() => playHover()}
                  className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 font-sora font-extrabold text-[11px] uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] text-white border-transparent shadow-[0_4px_15px_rgba(255,23,79,0.35)] scale-102'
                      : 'bg-[#10131C]/90 border-white/5 text-[#B8BEC9] hover:text-white hover:border-[#FF174F]/30 hover:bg-[#181D28]/80'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DYNAMIC VIEWS */}
      <section className="space-y-4 pb-2">
        {/* Wager/Prediction confirmation dialog banner */}
        <AnimatePresence>
          {lobbyBetPlacedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="p-4 bg-[#10131C] border border-[#00E676]/40 rounded-2xl flex flex-col gap-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.5)] relative select-none animate-pulse"
            >
              <div className="flex items-center gap-2 text-[#00E676] font-sora font-extrabold text-[12px] uppercase tracking-wider">
                <Check className="w-4 h-4 text-[#00E676]" /> PREDICTION CONFIRMED
              </div>
              <p className="text-[11px] text-white font-medium font-sans leading-relaxed">
                {lobbyBetPlacedMessage}
              </p>
              <div className="absolute right-3 top-3 text-[10px] text-[#00E676] animate-pulse font-sans font-black">
                ₹ LIVE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View 1: Casino games bento grid */}
        {lobbySubView === 'all_games' && (
          <div className="space-y-4">
            {filteredGames.length === 0 ? (
              <div className="py-12 text-center text-[#B8BEC9] font-sora text-xs bg-[#10131C] border border-white/5 rounded-2xl">
                No games found in this category. Select another chip to explore!
              </div>
            ) : (
              <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-1.5 animate-fadeIn">
                {filteredGames.map((game, idx) => {
                  const isHot = game.isHot;
                  const isNew = game.isNew;

                  // High-quality Custom Artworks styled inside vectors per game
                  const renderArtwork = (gameId: string) => {
                    const normId = gameId.toLowerCase();
                    if (normId.includes('aviator')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF174F]/30 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,23,79,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,23,79,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ y: [0, -6, 0], rotate: [0, -1, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="relative"
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(255,23,79,0.5)]" viewBox="0 0 100 100" fill="none">
                              {/* Glowing Fighter Jet */}
                              <path d="M50 15 L56 35 L85 45 L56 50 L54 85 L50 78 L46 85 L44 50 L15 45 L44 35 Z" fill="url(#jetGrad)" />
                              <circle cx="50" cy="15" r="3" fill="#00E5FF" />
                              <defs>
                                <linearGradient id="jetGrad" x1="50" y1="15" x2="50" y2="85" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#FF174F" />
                                  <stop offset="1" stopColor="#FF4D8D" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#FF174F]">MULTIPLIER</span>
                          </div>
                        </div>
                      );
                    }
                    if (normId.includes('chicken')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD54F]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,213,79,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,213,79,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(255,213,79,0.4)]" viewBox="0 0 100 100" fill="none">
                              <circle cx="50" cy="50" r="35" stroke="#FFD54F" strokeWidth="2" strokeDasharray="4 4" />
                              {/* Crosshair grids */}
                              <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,213,79,0.2)" strokeWidth="1" />
                              <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,213,79,0.2)" strokeWidth="1" />
                              {/* Chicken Shield */}
                              <rect x="38" y="38" width="24" height="24" rx="6" fill="url(#chGrad)" />
                              <path d="M42 50 C42 45, 58 45, 58 50 C58 55, 42 55, 42 50" fill="#FF174F" />
                              <polygon points="50,42 53,48 47,48" fill="#FFD54F" />
                              <defs>
                                <linearGradient id="chGrad" x1="38" y1="38" x2="62" y2="62" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#FF8F00" />
                                  <stop offset="1" stopColor="#FFD54F" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#FFD54F]">MINESWEEPER</span>
                          </div>
                        </div>
                      );
                    }
                    if (normId.includes('roulette')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(123,46,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(123,46,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(123,46,255,0.5)]" viewBox="0 0 100 100" fill="none">
                              <circle cx="50" cy="50" r="40" stroke="#7B2EFF" strokeWidth="3" />
                              <circle cx="50" cy="50" r="32" stroke="#00E5FF" strokeWidth="1" strokeDasharray="2 4" />
                              {/* Slots spokes */}
                              {[...Array(8)].map((_, i) => (
                                <line
                                  key={i}
                                  x1="50"
                                  y1="50"
                                  x2={50 + 40 * Math.cos((i * Math.PI) / 4)}
                                  y2={50 + 40 * Math.sin((i * Math.PI) / 4)}
                                  stroke="rgba(123,46,255,0.3)"
                                  strokeWidth="1.5"
                                />
                              ))}
                              <circle cx="50" cy="50" r="10" fill="#10131C" stroke="#7B2EFF" strokeWidth="2" />
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#7B2EFF]">NEON SPIN</span>
                          </div>
                        </div>
                      );
                    }
                    if (normId.includes('mine')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" viewBox="0 0 100 100" fill="none">
                              <polygon points="50,15 80,35 80,68 50,85 20,68 20,35" stroke="#00E5FF" strokeWidth="2" fill="none" />
                              {/* Diamond */}
                              <polygon points="50,30 68,48 50,70 32,48" fill="url(#mineGrad)" />
                              <circle cx="50" cy="48" r="4" fill="#FFFFFF" />
                              <defs>
                                <linearGradient id="mineGrad" x1="50" y1="30" x2="50" y2="70" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#00E5FF" />
                                  <stop offset="1" stopColor="#7B2EFF" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#00E5FF]">GEMS VAULT</span>
                          </div>
                        </div>
                      );
                    }
                    if (normId.includes('plinko')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D8D]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,77,141,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,77,141,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(255,77,141,0.5)]" viewBox="0 0 100 100" fill="none">
                              {/* Pins Grid */}
                              <circle cx="50" cy="20" r="3" fill="#FFFFFF" />
                              <circle cx="38" cy="38" r="3" fill="#FFFFFF" />
                              <circle cx="62" cy="38" r="3" fill="#FFFFFF" />
                              <circle cx="26" cy="56" r="3" fill="#FFFFFF" />
                              <circle cx="50" cy="56" r="3" fill="#FFFFFF" />
                              <circle cx="74" cy="56" r="3" fill="#FFFFFF" />
                              {/* Falling Ball */}
                              <circle cx="50" cy="38" r="6" fill="#FF174F" />
                              <line x1="50" y1="20" x2="50" y2="38" stroke="#FF174F" strokeWidth="2" strokeDasharray="2 2" />
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#FF4D8D]">PEG DROP</span>
                          </div>
                        </div>
                      );
                    }
                    if (normId.includes('wheel') || normId.includes('fortune')) {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD54F]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,213,79,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,213,79,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                          >
                            <svg className="w-20 h-20 filter drop-shadow-[0_0_15px_rgba(255,213,79,0.5)]" viewBox="0 0 100 100" fill="none">
                              <circle cx="50" cy="50" r="42" stroke="#FFD54F" strokeWidth="2" />
                              <path d="M50 50 L50 8 A 42 42 0 0 1 92 50 Z" fill="rgba(255,213,79,0.2)" stroke="#FFD54F" strokeWidth="1" />
                              <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
                            </svg>
                          </motion.div>
                          <div className="absolute bottom-16 text-center">
                            <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-[#FFD54F]">MEGA REEL</span>
                          </div>
                        </div>
                      );
                    }
                    // Monopoly / Slot / Fallback fallback
                    return (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF174F]/20 via-[#10131C] to-black flex flex-col items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,23,79,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,23,79,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                          <svg className="w-20 h-20 filter drop-shadow-[0_0_12px_rgba(255,23,79,0.4)]" viewBox="0 0 100 100" fill="none">
                            <rect x="25" y="25" width="50" height="50" rx="12" stroke="#FF174F" strokeWidth="2" fill="none" />
                            <circle cx="50" cy="50" r="12" fill="url(#ballGrad)" />
                            <defs>
                              <linearGradient id="ballGrad" x1="38" y1="38" x2="62" y2="62" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#FF174F" />
                                  <stop offset="1" stopColor="#7B2EFF" />
                                </linearGradient>
                            </defs>
                          </svg>
                        </motion.div>
                        <div className="absolute bottom-16 text-center">
                          <span className="font-orbitron font-extrabold text-[12px] tracking-widest text-white">{gameId.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <motion.div
                      key={game.id}
                      onClick={() => {
                        playClick();
                        onSelectGame(game);
                      }}
                      onMouseEnter={() => playHover()}
                      whileHover={{ scale: 1.04, translateY: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative aspect-[4/5] bg-[#10131C] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF174F]/40 shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_0_25px_rgba(255,23,79,0.25)] transition-all duration-300 cursor-pointer select-none"
                    >
                      {/* Top Visual Artwork */}
                      <div className="absolute top-0 inset-x-0 bottom-24 overflow-hidden rounded-t-2xl">
                        {renderArtwork(game.id)}
                        {/* Shimmer lighting flare */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>

                      {/* Bottom Details Section */}
                      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black via-[#10131C] to-transparent p-4 flex flex-col justify-end space-y-1 select-none">
                        <div className="flex items-center justify-between">
                          <span className="font-sora font-extrabold text-[13px] text-white tracking-wide group-hover:text-[#FF174F] transition-colors duration-200">
                            {game.name}
                          </span>
                          <Star
                            onClick={(e) => {
                              e.stopPropagation();
                              playClick();
                              onToggleFavorite(game.id);
                            }}
                            className={`w-4 h-4 cursor-pointer transition-all duration-300 ${
                              favorites.includes(game.id)
                                ? 'text-[#FFD54F] fill-current drop-shadow-[0_0_5px_rgba(255,213,79,0.5)]'
                                : 'text-stone-500 hover:text-white'
                            }`}
                          />
                        </div>

                        {/* Interactive counters/data: RTP & active players */}
                        <div className="flex items-center justify-between text-[10px] text-[#B8BEC9]">
                          <span className="font-sans font-medium">RTP {game.rtp || 98}%</span>
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                            {formatBalance(game.livePlayers || 2500)}
                          </span>
                        </div>
                      </div>

                      {/* Hot/Live Badges */}
                      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 select-none">
                        {isHot && (
                          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] text-white text-[8.5px] font-sora font-extrabold uppercase tracking-widest shadow-[0_2px_10px_rgba(255,23,79,0.35)] flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 animate-pulse" /> HOT
                          </span>
                        )}
                        {isNew && (
                          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00E5FF] to-[#7B2EFF] text-white text-[8.5px] font-sora font-extrabold uppercase tracking-widest shadow-[0_2px_10px_rgba(0,229,255,0.35)] flex items-center gap-1">
                            ⚡ NEW
                          </span>
                        )}
                        {!isHot && !isNew && (
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[#B8BEC9] text-[8.5px] font-sora font-extrabold uppercase tracking-widest border border-white/5 flex items-center gap-1">
                            🎮 LIVE
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: High-impact inline multiple matches list for sports betting */}
        {lobbySubView === 'sports_betting' && (
          <div className="space-y-4 animate-fadeIn select-none">
            {/* Header with active counters */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                <h3 className="font-orbitron font-extrabold text-[10px] tracking-widest text-white uppercase">
                  LIVE & UPCOMING prediction EVENTS
                </h3>
              </div>
              <span className="text-[9px] font-sora text-[#B8BEC9] font-bold uppercase shrink-0">
                4 Matches Available
              </span>
            </div>

            {/* List of multiple matches */}
            <div className="space-y-4">
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
                    className={`bg-gradient-to-b from-[#10131C] to-[#05060A] rounded-2xl border ${
                      isSelected ? 'border-[#FF174F] shadow-[0_0_20px_rgba(255,23,79,0.3)]' : 'border-white/5'
                    } overflow-hidden p-4 space-y-3.5 transition-all duration-200 select-none`}
                  >
                    {/* Header Row: League details */}
                    <div className="flex items-center justify-between text-[8px] tracking-wider uppercase font-extrabold text-[#B8BEC9]">
                      <span className="flex items-center gap-1">
                        <span className="text-[#FF174F]">🏆</span> {match.league}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md ${match.isLive ? 'bg-[#FF174F]/20 text-[#FF174F] animate-pulse border border-[#FF174F]/30' : 'bg-black/40 text-[#FFD54F] border border-white/5'}`}>
                        {match.status}
                      </span>
                    </div>

                    {/* Match Body: Team Names and Live Scores */}
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{match.team1Flag}</span>
                        <span className="text-white font-sora font-extrabold text-sm">{match.team1}</span>
                        <span className="text-[10px] text-[#B8BEC9] font-black">v</span>
                        <span className="text-xl">{match.team2Flag}</span>
                        <span className="text-white font-sora font-extrabold text-sm">{match.team2}</span>
                      </div>
                      <div className="font-mono text-[11px] font-extrabold text-[#00E5FF] tracking-[0.05em] select-none">
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
                        className={`py-2.5 px-1.5 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'team1'
                            ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] border-transparent text-white shadow-md font-bold'
                            : 'bg-black/40 border-white/5 hover:border-[#FF174F]/30 text-[#B8BEC9] hover:text-white'
                        }`}
                      >
                        <span className="text-[8px] text-[#B8BEC9] uppercase font-bold tracking-tight">1 ({match.team1})</span>
                        <span className="text-[13px] font-rajdhani font-black">{match.odds1.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClick();
                          setActiveSelectMatch(match);
                          setSelectedOddType('draw');
                        }}
                        className={`py-2.5 px-1.5 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'draw'
                            ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] border-transparent text-white shadow-md font-bold'
                            : 'bg-black/40 border-white/5 hover:border-[#FF174F]/30 text-[#B8BEC9] hover:text-white'
                        }`}
                      >
                        <span className="text-[8px] text-[#B8BEC9] uppercase font-bold tracking-tight">Draw</span>
                        <span className="text-[13px] font-rajdhani font-black">{match.oddsDraw.toFixed(2)}</span>
                      </button>

                      <button
                        onClick={() => {
                          playClick();
                          setActiveSelectMatch(match);
                          setSelectedOddType('team2');
                        }}
                        className={`py-2.5 px-1.5 rounded-xl text-center flex flex-col justify-center items-center gap-0.5 transition-all border cursor-pointer ${
                          isSelected && selectedOddType === 'team2'
                            ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] border-transparent text-white shadow-md font-bold'
                            : 'bg-black/40 border-white/5 hover:border-[#FF174F]/30 text-[#B8BEC9] hover:text-white'
                        }`}
                      >
                        <span className="text-[8px] text-[#B8BEC9] uppercase font-bold tracking-tight">2 ({match.team2})</span>
                        <span className="text-[13px] font-rajdhani font-black">{match.odds2.toFixed(2)}</span>
                      </button>
                    </div>

                    {/* Expandable Bet Slip Input Form */}
                    {isSelected && selectedOddType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-black/45 border border-[#FF174F]/20 rounded-2xl p-4 space-y-4 mt-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-sora font-extrabold uppercase">
                          <span className="text-white">
                            Selection: &nbsp;
                            <span className="text-[#FF174F] font-black">
                              {selectedOddType === 'team1' ? match.team1 : selectedOddType === 'team2' ? match.team2 : 'Draw'}
                            </span>
                          </span>
                          <span className="text-[#B8BEC9]">
                            Odds: <span className="text-[#FF174F]">
                              {selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw}
                            </span>
                          </span>
                        </div>

                        {/* Presets */}
                        <div className="grid grid-cols-4 gap-2">
                          {['500', '1000', '2500', '5000'].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => {
                                playClick();
                                setLobbyBetStake(preset);
                              }}
                              className={`py-1.5 text-[10px] font-sora font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                                lobbyBetStake === preset
                                  ? 'bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] border-transparent text-white shadow'
                                  : 'bg-black/40 border-white/5 text-[#B8BEC9] hover:text-white'
                              }`}
                            >
                              ₹{preset}
                            </button>
                          ))}
                        </div>

                        {/* Numeric input */}
                        <div className="flex gap-2 items-center bg-black/50 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[#FF174F] text-[11px] font-sora font-extrabold pl-1 shrink-0">STAKE ₹</span>
                          <input
                            type="number"
                            min="10"
                            value={lobbyBetStake}
                            onChange={(e) => setLobbyBetStake(e.target.value)}
                            className="bg-transparent text-white font-rajdhani font-black text-sm w-full outline-none"
                          />
                        </div>

                        {/* Potential Earnings */}
                        <div className="flex items-center justify-between text-[11px] text-[#B8BEC9] font-sora font-bold">
                          <span>Prospective payout:</span>
                          <span className="text-[#00E676] font-black">
                            {formatBalance(Math.floor(Number(lobbyBetStake) * (selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw)))}
                          </span>
                        </div>

                        {/* Submit Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              playClick();
                              setActiveSelectMatch(null);
                              setSelectedOddType(null);
                            }}
                            className="py-2.5 rounded-xl text-[10px] uppercase font-sora font-extrabold tracking-wider text-[#B8BEC9] hover:text-white bg-black/40 border border-white/5 cursor-pointer text-center"
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

                              if (onUpdateUser) {
                                onUpdateUser({
                                  ...user,
                                  walletBalance: user.walletBalance - amount
                                });
                              }

                              const selectionLabel = selectedOddType === 'team1' ? match.team1 : selectedOddType === 'team2' ? match.team2 : 'Draw';
                              const activeOddsValue = selectedOddType === 'team1' ? match.odds1 : selectedOddType === 'team2' ? match.odds2 : match.oddsDraw;

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

                              playWin();
                              setLobbyBetPlacedMessage(`Congratulations! ${formatBalance(amount)} has been secured on ${selectionLabel} of ${match.team1} v ${match.team2} at ${activeOddsValue.toFixed(2)}x leverage.`);
                              
                              setActiveSelectMatch(null);
                              setSelectedOddType(null);

                              setTimeout(() => {
                                setLobbyBetPlacedMessage(null);
                              }, 6500);
                            }}
                            className="bg-gradient-to-r from-[#FF174F] to-[#FF4D8D] hover:brightness-110 text-white font-sora font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl cursor-pointer text-center shadow-[0_4px_15px_rgba(255,23,79,0.35)] transition-all"
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

            {onEnterSportsbook && (
              <div
                onClick={() => {
                  playClick();
                  onEnterSportsbook();
                }}
                className="w-full py-3.5 rounded-2xl border border-white/5 bg-[#10131C] text-[#B8BEC9] font-sora text-[10px] font-extrabold uppercase tracking-widest transition-all hover:bg-[#181D28] hover:text-white active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                Go to Dedicated Sportsbook <ExternalLink className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. LIVE MEGA WINS TICKER (Social Proof) */}
      <div className="relative w-full overflow-hidden bg-[#10131C] border border-white/5 rounded-2xl py-3 px-4 flex items-center gap-3 select-none shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        {/* Blinking Live Label */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FF174F]/10 border border-[#FF174F]/20 shrink-0 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF174F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF174F]"></span>
          </span>
          <span className="text-[9.5px] font-sora font-extrabold uppercase tracking-widest text-[#FF174F] whitespace-nowrap">
            MEGA WINS
          </span>
        </div>

        {/* Scroll Area */}
        <div className="relative flex-1 overflow-hidden h-6 flex items-center">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#10131C] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#10131C] to-transparent pointer-events-none z-10" />

          <div 
            className="animate-marquee flex items-center gap-10 text-[11px] font-mono font-medium text-stone-300 uppercase tracking-wide"
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
                <span className="text-[#FF174F] font-sans font-black tracking-tight">₹{formatBalance(item.win)}</span>
                <span className="text-stone-400">on</span>
                <span className="text-white font-sans font-extrabold">{item.game}</span>
                <span className="px-1.5 py-0.5 text-[8.5px] font-sans font-black bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/20 rounded leading-none">
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
