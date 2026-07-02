import { useState, useEffect, useRef, FormEvent } from 'react';
import { apiFetch } from './utils/api';
import { motion, AnimatePresence } from 'motion/react';
import { Game, UserProfile, Transaction } from './types';
import { INITIAL_GAMES, INITIAL_LEADERBOARD } from './data/mockData';
import dbJson from './data/db.json';

// Component Tabs
import LobbyTab from './components/LobbyTab';
import SportsBettingSection from './components/SportsBettingSection';
import LuckyWheelTab from './components/LuckyWheelTab';
import BankTab from './components/BankTab';
import ReferralTab from './components/ReferralTab';
import AccountTab from './components/AccountTab';
import GameSimulation from './components/GameSimulation';
import LoginGate from './components/LoginGate';
import { 
  playClick, 
  playHover, 
  playWin, 
  setAmbientMuted, 
  unlockAudio, 
  getMutedStatus,
  setVolume,
  getVolume
} from './utils/audio';

// Lucide Icons
import {
  Wallet,
  PiggyBank,
  Gamepad2,
  HelpCircle,
  Settings,
  Bell,
  MessageCircle,
  Share2,
  CheckCircle,
  User,
  Info,
  LogOut,
  LogIn,
  Loader2,
  Trophy,
  Compass,
  Coins,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Plus,
  Shield,
  Globe,
  Zap,
  ArrowLeft,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const getGameCoverData = (gameId: string, gameName: string, customImage?: string): {
  title: string;
  subtitle: string;
  image: string;
  glowColor: string;
  glowShadow: string;
  accentClass: string;
  glowBorderClass: string;
} => {
  const normalizedId = (gameId || '').toLowerCase();
  const normalizedName = (gameName || '').toLowerCase();
  const fallbackImg = customImage || '';

  // Aviator
  if (normalizedId.includes('aviator') || normalizedName.includes('aviator')) {
    return {
      title: 'AVIATOR',
      subtitle: 'RED FIGHTER JET',
      image: fallbackImg,
      glowColor: '#FF3333',
      glowShadow: 'rgba(255, 51, 51, 0.6)',
      accentClass: 'text-[#FF3333]',
      glowBorderClass: 'border-[#FF3333]/30 hover:border-[#FF3333]/60 group-hover:shadow-[0_0_25px_rgba(255,51,51,0.45)]'
    };
  }
  // Mines
  if (normalizedId.includes('mine') || normalizedName.includes('mine')) {
    return {
      title: 'MINES OUTPOST',
      subtitle: 'RED DIAMOND MINE',
      image: fallbackImg,
      glowColor: '#FF3333',
      glowShadow: 'rgba(255, 51, 51, 0.6)',
      accentClass: 'text-[#FF3333]',
      glowBorderClass: 'border-[#FF3333]/30 hover:border-[#FF3333]/60 group-hover:shadow-[0_0_25px_rgba(255,51,51,0.45)]'
    };
  }
  // Plinko
  if (normalizedId.includes('plinko') || normalizedName.includes('plinko')) {
    return {
      title: 'PLINKO STRIKE',
      subtitle: 'NEON PLINKO BOARD',
      image: fallbackImg,
      glowColor: '#FF007F',
      glowShadow: 'rgba(255, 0, 127, 0.6)',
      accentClass: 'text-[#FF007F]',
      glowBorderClass: 'border-[#FF007F]/30 hover:border-[#FF007F]/60 group-hover:shadow-[0_0_25px_rgba(255,0,127,0.45)]'
    };
  }
  // Crash
  if (normalizedId.includes('crash') || normalizedName.includes('crash')) {
    return {
      title: 'CRASH ENGINE',
      subtitle: 'SPACE ROCKET LAUNCH',
      image: fallbackImg,
      glowColor: '#FF6200',
      glowShadow: 'rgba(255, 98, 0, 0.6)',
      accentClass: 'text-[#FF6200]',
      glowBorderClass: 'border-[#FF6200]/30 hover:border-[#FF6200]/60 group-hover:shadow-[0_0_25px_rgba(255,98,0,0.45)]'
    };
  }
  // Dragon Tiger
  if (normalizedId.includes('dragon') || normalizedName.includes('dragon') || normalizedName.includes('tiger')) {
    return {
      title: 'DRAGON TIGER',
      subtitle: 'NEON COMBAT DUEL',
      image: fallbackImg,
      glowColor: '#FFB300',
      glowShadow: 'rgba(255, 179, 0, 0.6)',
      accentClass: 'text-[#FFB300]',
      glowBorderClass: 'border-[#FFB300]/30 hover:border-[#FFB300]/60 group-hover:shadow-[0_0_25px_rgba(255,179,0,0.45)]'
    };
  }
  // Lucky Jet
  if (normalizedId.includes('jet') || normalizedName.includes('jet')) {
    return {
      title: 'LUCKY JET',
      subtitle: 'JET SPEED TRAILS',
      image: fallbackImg,
      glowColor: '#00E5FF',
      glowShadow: 'rgba(0, 229, 255, 0.6)',
      accentClass: 'text-[#00E5FF]',
      glowBorderClass: 'border-[#00E5FF]/30 hover:border-[#00E5FF]/60 group-hover:shadow-[0_0_25px_rgba(0,229,255,0.45)]'
    };
  }
  // Dice
  if (normalizedId.includes('dice') || normalizedName.includes('dice')) {
    return {
      title: 'LUCKY DICE',
      subtitle: 'LUXURY GLOWING DICE',
      image: fallbackImg,
      glowColor: '#FF3F3F',
      glowShadow: 'rgba(255, 63, 63, 0.6)',
      accentClass: 'text-[#FF3F3F]',
      glowBorderClass: 'border-[#FF3F3F]/30 hover:border-[#FF3F3F]/60 group-hover:shadow-[0_0_25px_rgba(255,63,63,0.45)]'
    };
  }
  // Roulette
  if (normalizedId.includes('roulette') || normalizedName.includes('roulette')) {
    return {
      title: 'NEON ROULETTE',
      subtitle: 'PREMIUM CASINO WHEEL',
      image: fallbackImg,
      glowColor: '#E040FB',
      glowShadow: 'rgba(224, 64, 251, 0.6)',
      accentClass: 'text-[#E040FB]',
      glowBorderClass: 'border-[#E040FB]/30 hover:border-[#E040FB]/60 group-hover:shadow-[0_0_25px_rgba(224,64,251,0.45)]'
    };
  }
  // Poker
  if (normalizedId.includes('poker') || normalizedName.includes('poker')) {
    return {
      title: 'ROYAL POKER',
      subtitle: 'PREMIUM CHIPS & CARDS',
      image: fallbackImg,
      glowColor: '#9C27B0',
      glowShadow: 'rgba(156, 39, 176, 0.6)',
      accentClass: 'text-[#9C27B0]',
      glowBorderClass: 'border-[#9C27B0]/30 hover:border-[#9C27B0]/60 group-hover:shadow-[0_0_25px_rgba(156,39,176,0.45)]'
    };
  }
  // Teen Patti
  if (normalizedId.includes('patti') || normalizedName.includes('patti') || normalizedName.includes('teen')) {
    return {
      title: 'TEEN PATTI',
      subtitle: 'ROYAL INDIAN CARDS',
      image: fallbackImg,
      glowColor: '#FFD700',
      glowShadow: 'rgba(255, 215, 0, 0.6)',
      accentClass: 'text-[#FFD700]',
      glowBorderClass: 'border-[#FFD700]/30 hover:border-[#FFD700]/60 group-hover:shadow-[0_0_25px_rgba(255,215,0,0.45)]'
    };
  }
  // Blackjack
  if (normalizedId.includes('blackjack') || normalizedName.includes('blackjack')) {
    return {
      title: 'BLACKJACK VIP',
      subtitle: 'GOLD & BLACK SUITE',
      image: fallbackImg,
      glowColor: '#3F51B5',
      glowShadow: 'rgba(63, 81, 181, 0.6)',
      accentClass: 'text-[#3F51B5]',
      glowBorderClass: 'border-[#3F51B5]/30 hover:border-[#3F51B5]/60 group-hover:shadow-[0_0_25px_rgba(63,81,181,0.45)]'
    };
  }
  // Baccarat
  if (normalizedId.includes('baccarat') || normalizedName.includes('baccarat')) {
    return {
      title: 'BACCARAT PLATINUM',
      subtitle: 'LUXURY CASINO TABLE',
      image: fallbackImg,
      glowColor: '#FF5722',
      glowShadow: 'rgba(255, 87, 34, 0.6)',
      accentClass: 'text-[#FF5722]',
      glowBorderClass: 'border-[#FF5722]/30 hover:border-[#FF5722]/60 group-hover:shadow-[0_0_25px_rgba(255,87,34,0.45)]'
    };
  }
  // Slots / Chicken Road
  if (normalizedId.includes('slot') || normalizedName.includes('slot') || normalizedId.includes('chicken') || normalizedName.includes('chicken')) {
    return {
      title: (gameName || 'SLOTS').toUpperCase(),
      subtitle: 'PREMIUM SLOT MACHINE',
      image: fallbackImg,
      glowColor: '#FF3333',
      glowShadow: 'rgba(255, 51, 51, 0.6)',
      accentClass: 'text-[#FF3333]',
      glowBorderClass: 'border-[#FF3333]/30 hover:border-[#FF3333]/60 group-hover:shadow-[0_0_25px_rgba(255,51,51,0.45)]'
    };
  }
  // Andar Bahar
  if (normalizedId.includes('andar') || normalizedName.includes('andar') || normalizedName.includes('bahar')) {
    return {
      title: 'ANDAR BAHAR',
      subtitle: 'ELEGANT INDIAN CARDS',
      image: fallbackImg,
      glowColor: '#E91E63',
      glowShadow: 'rgba(233, 30, 99, 0.6)',
      accentClass: 'text-[#E91E63]',
      glowBorderClass: 'border-[#E91E63]/30 hover:border-[#E91E63]/60 group-hover:shadow-[0_0_25px_rgba(233,30,99,0.45)]'
    };
  }
  // Fishing Game
  if (normalizedId.includes('fish') || normalizedName.includes('fish')) {
    return {
      title: 'NEON FISHING',
      subtitle: 'NEON UNDERWATER WORLD',
      image: fallbackImg,
      glowColor: '#00E5FF',
      glowShadow: 'rgba(0, 229, 255, 0.6)',
      accentClass: 'text-[#00E5FF]',
      glowBorderClass: 'border-[#00E5FF]/30 hover:border-[#00E5FF]/60 group-hover:shadow-[0_0_25px_rgba(0,229,255,0.45)]'
    };
  }
  // Fruit Party
  if (normalizedId.includes('fruit') || normalizedName.includes('fruit')) {
    return {
      title: 'FRUIT PARTY',
      subtitle: 'LUXURY GLOWING FRUITS',
      image: fallbackImg,
      glowColor: '#8BC34A',
      glowShadow: 'rgba(139, 195, 74, 0.6)',
      accentClass: 'text-[#8BC34A]',
      glowBorderClass: 'border-[#8BC34A]/30 hover:border-[#8BC34A]/60 group-hover:shadow-[0_0_25px_rgba(139,195,74,0.45)]'
    };
  }
  // Fortune Wheel
  if (normalizedId.includes('wheel') || normalizedName.includes('wheel')) {
    return {
      title: 'FORTUNE WHEEL 3D',
      subtitle: 'SPIN OF CYBERPUNK',
      image: fallbackImg,
      glowColor: '#FF3333',
      glowShadow: 'rgba(255, 51, 51, 0.6)',
      accentClass: 'text-[#FF3333]',
      glowBorderClass: 'border-[#FF3333]/30 hover:border-[#FF3333]/60 group-hover:shadow-[0_0_25px_rgba(255,51,51,0.45)]'
    };
  }

  // Default Fallback
  return {
    title: (gameName || 'PREMIUM GAME').toUpperCase(),
    subtitle: 'AAA CYBER LAUNCHER',
    image: fallbackImg,
    glowColor: '#FF3333',
    glowShadow: 'rgba(255, 51, 51, 0.6)',
    accentClass: 'text-[#FF3333]',
    glowBorderClass: 'border-[#FF3333]/30 hover:border-[#FF3333]/60 group-hover:shadow-[0_0_25px_rgba(255,51,51,0.45)]'
  };
};

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'bank' | 'games' | 'wheel' | 'refer' | 'account'>('games');
  const [gamesSubView, setGamesSubView] = useState<'lobby' | 'sports'>('lobby');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bankPresetTab, setBankPresetTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volumeValue, setVolumeValue] = useState<number>(0.7);
  const [headerShowBalance, setHeaderShowBalance] = useState<boolean>(true);
  const [scrolledPastHero, setScrolledPastHero] = useState<boolean>(true);
  
  // Header and Footer visibility on scroll
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const [isFooterVisible, setIsFooterVisible] = useState<boolean>(true);
  const lastScrollTopRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Independent page scrolls and refresh system
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({
    lobby: 0,
    sports: 0,
    bank: 0,
    wheel: 0,
    refer: 0,
    account: 0
  });

  const triggerRefresh = (key: string) => {
    setRefreshKeys(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  const handleMainScroll = (e: any) => {
    // Keep header and footer always sticky and visible on scroll
    setIsHeaderVisible(true);
    setIsFooterVisible(true);
  };

  useEffect(() => {
    // Capture referral links (using ref or code query parameters) and store securely in localStorage
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('code');
    if (refCode) {
      console.log("[Referral System] Extracted referral code from link:", refCode);
      localStorage.setItem('referred_by_code', refCode);
    }

    // Dynamic Supabase configuration fetching from custom config manager
    apiFetch("/api/db/credentials")
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok" && data.supabaseUrl && data.supabaseAnonKey) {
          (window as any).SUPABASE_DYNAMIC_URL = data.supabaseUrl;
          (window as any).SUPABASE_DYNAMIC_ANON_KEY = data.supabaseAnonKey;
          (window as any).SUPABASE_FORCE_RECREATE = true;
          console.log("[Dynamic DB] Successfully loaded client-side database credentials from server config.");
        }
      })
      .catch(e => console.warn("[Dynamic DB] Dynamic credentials fetch failed or skipped:", e));

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Login Gate State Check
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const item = localStorage.getItem('tenzo_bet_logged_in');
    return item === 'true';
  });
  
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  
  // High fidelity user state
  const [user, setUser] = useState<UserProfile>(() => {
    const loggedIn = localStorage.getItem('tenzo_bet_logged_in') === 'true';
    // Attempt local storage cache
    const cached = localStorage.getItem('tenzo_bet_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.username) {
          return {
            ...parsed,
            isBalanceLoading: loggedIn
          };
        }
      } catch (e) {
        // Fallback
      }
    }
    return {
      username: 'Player',
      avatar: '',
      vipLevel: 1,
      vipExp: 0,
      vipExpMax: 1000,
      walletBalance: 0,
      bonusBalance: 0,
      totalReferralEarning: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode: 'TENZO_ROYAL_77',
      dailyStreak: 0,
      checkedInToday: false,
      balanceVersion: 0,
      isBalanceLoading: loggedIn
    };
  });

  // Favorite games tracking
  const [favorites, setFavorites] = useState<string[]>(['aviator', 'roulette']);

  // Dynamic ledger actions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return [
      {
        id: 'tx-1',
        type: 'deposit',
        amount: 50000,
        timestamp: '11:45 AM',
        status: 'SUCCESS',
        description: 'Instant UPI Deposit received'
      },
      {
        id: 'tx-2',
        type: 'win',
        amount: 14200,
        timestamp: '11:02 AM',
        status: 'SUCCESS',
        description: 'Fortune hand won on Aviator'
      },
      {
        id: 'tx-3',
        type: 'withdraw',
        amount: 12000,
        timestamp: 'Yesterday',
        status: 'SUCCESS',
        description: 'IMPS Vault payout completed'
      }
    ];
  });

  // Unique Unified Data & Settlement accounts synchronized for all pages
  const [sharedBanks, setSharedBanks] = useState<any[]>(() => {
    const saved = localStorage.getItem('tenzo_saved_bank_accounts') || localStorage.getItem('tenzo_linked_banks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [parsed[0]].map((item: any) => ({
            id: item.id || 'bank-1',
            bankName: item.bankName || 'HDFC BANK',
            accountNumber: item.accountNumber || item.number || '5010048192811',
            number: item.number || item.accountNumber || '5010048192811',
            holderName: item.holderName || item.holder || 'Debupam Gogoi',
            holder: item.holder || item.holderName || 'Debupam Gogoi',
            ifscCode: item.ifscCode || item.ifsc || 'HDFC0001234',
            ifsc: item.ifsc || item.ifscCode || 'HDFC0001234',
            isDefault: true,
            isPrimary: true
          }));
        }
      } catch (e) {}
    }
    return [
      {
        id: 'bank-1',
        bankName: 'HDFC BANK',
        accountNumber: '5010048192811',
        number: '5010048192811',
        holderName: 'Debupam Gogoi',
        holder: 'Debupam Gogoi',
        ifscCode: 'HDFC0001234',
        ifsc: 'HDFC0001234',
        isDefault: true,
        isPrimary: true
      }
    ];
  });

  const [sharedUpis, setSharedUpis] = useState<any[]>(() => {
    const saved = localStorage.getItem('tenzo_saved_upi_accounts') || localStorage.getItem('tenzo_linked_upis');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [parsed[0]].map((item: any) => ({
            id: item.id || 'upi-1',
            nickname: item.nickname || 'Primary UPI',
            upiId: item.upiId || item.vpa || 'debupam7@okaxis',
            vpa: item.vpa || item.upiId || 'debupam7@okaxis',
            isDefault: true,
            isPrimary: true
          }));
        }
      } catch (e) {}
    }
    return [
      { id: 'upi-1', nickname: 'Primary UPI', upiId: 'debupam7@okaxis', vpa: 'debupam7@okaxis', isDefault: true, isPrimary: true }
    ];
  });

  // Cross-Tab/Screen Persistent settlement configurations
  useEffect(() => {
    const serialized = JSON.stringify(sharedBanks);
    localStorage.setItem('tenzo_saved_bank_accounts', serialized);
    localStorage.setItem('tenzo_linked_banks', serialized);
  }, [sharedBanks]);

  useEffect(() => {
    const serialized = JSON.stringify(sharedUpis);
    localStorage.setItem('tenzo_saved_upi_accounts', serialized);
    localStorage.setItem('tenzo_linked_upis', serialized);
  }, [sharedUpis]);

  // Active game overlay state
  const [activePlayGame, setActivePlayGame] = useState<Game | null>(null);

  // High fidelity 3D Loading Game states (4-second smooth progress animation)
  const [loadingGame, setLoadingGame] = useState<Game | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [livePing, setLivePing] = useState<number>(12);

  useEffect(() => {
    if (!loadingGame) return;
    const interval = setInterval(() => {
      setLivePing(Math.floor(Math.random() * 5) + 11); // Fluctuate between 11ms and 15ms
    }, 1200);
    return () => clearInterval(interval);
  }, [loadingGame]);

  // Settings structure synchronized from server db
  const [globalSettings, setGlobalSettings] = useState<any>(() => {
    const s = (dbJson as any)?.global_settings || {};
    return {
      referral_commission_percentage: s.referral_commission_percentage ?? 10,
      automatic_deposit_approval: s.automatic_deposit_approval ?? false,
      hero_poster_url: s.hero_poster_url ?? '',
      hero_heading: s.hero_heading ?? '🔥 Tenzo VIP Mega Booster',
      hero_subheading: s.hero_subheading ?? 'Earn 200% match bonus on your next UPI deposit today!',
      hero_cta_type: s.hero_cta_type ?? 'deposit'
    };
  });

  // State arrays for dynamic hero banners and game card icons
  const [heroImages, setHeroImages] = useState<any[]>(() => (dbJson as any)?.hero_images || []);
  const [gameIcons, setGameIcons] = useState<any[]>(() => (dbJson as any)?.game_icons || []);

  // Games state synchronized from server db
  const [games, setGames] = useState<Game[]>(() => {
    const fileGames = (dbJson as any)?.games;
    if (Array.isArray(fileGames) && fileGames.length > 0) {
      return fileGames.map((g: any) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        image: g.image || '',
        isHot: g.isHot ?? g.enabled ?? false,
        livePlayers: g.live_players ?? g.livePlayers ?? 100,
        rtp: g.rtp ?? 97,
        jackpotAmount: g.jackpotAmount ?? 10000000,
        featured: g.featured ?? false
      }));
    }
    return INITIAL_GAMES;
  });

  // Miscellaneous modal states
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent'; text: string }[]>([
    { sender: 'agent', text: 'Welcome to Tenzo VIP Concierge! How can we assist your cashouts or deposits today?' }
  ]);

  const [showNotification, setShowNotification] = useState<boolean>(false);

  const [balanceChange, setBalanceChange] = useState<{ type: 'increase' | 'decrease'; diff: number } | null>(null);
  const prevBalanceRef = useRef<number>(user.walletBalance);

  useEffect(() => {
    if (prevBalanceRef.current !== user.walletBalance) {
      const diff = user.walletBalance - prevBalanceRef.current;
      if (diff > 0) {
        setBalanceChange({ type: 'increase', diff });
      } else if (diff < 0) {
        setBalanceChange({ type: 'decrease', diff: Math.abs(diff) });
      }
      prevBalanceRef.current = user.walletBalance;

      const timer = setTimeout(() => {
        setBalanceChange(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user.walletBalance]);

  const lastLocalUpdateRef = useRef<number>(0);

  // Prevent background scroll when login modal is open
  useEffect(() => {
    if (showLoginModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showLoginModal]);

  // Cache user data
  useEffect(() => {
    localStorage.setItem('tenzo_bet_user', JSON.stringify(user));
  }, [user]);

  // Listen to Supabase Auth State Changes to keep the token updated
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log("[Supabase Client] Skipping direct client-side auth state listeners because Supabase is not configured yet.");
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('tenzo_bet_token', session.access_token);
        localStorage.setItem('tenzo_bet_logged_in', 'true');
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('tenzo_bet_token');
        localStorage.setItem('tenzo_bet_logged_in', 'false');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time synchronization loop with db.json
  useEffect(() => {
    let active = true;
    const syncWithBackend = async () => {
      try {
        const token = localStorage.getItem('tenzo_bet_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const referredByCode = localStorage.getItem('referred_by_code');
        if (referredByCode) {
          headers['x-referred-by'] = referredByCode;
        }
        const res = await apiFetch('/api/db', { headers });
        if (res.status === 401) {
          console.warn("Token expired. Logging out user...");
          handleLogout();
          return;
        }
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const data = await res.json();
        if (typeof data !== 'object' || data === null || data.status !== 'ok') {
          throw new Error("Invalid response JSON structure from API");
        }
        if (data.status === 'ok' && active) {
          if (data.db.global_settings) {
            setGlobalSettings(data.db.global_settings);
          }
          if (data.db.games) {
            const mappedDbGames = data.db.games.map((g: any) => ({
              ...g,
              id: g.slug || g.id,
              name: g.game_name || g.name || '',
              category: g.category || 'slots',
              image: g.icon_url || g.banner_url || g.thumbnail_url || g.image || '',
              rtp: parseFloat(g.rtp_percentage || g.rtp || '97'),
              livePlayers: g.live_players || g.livePlayers || 2500,
              featured: g.is_featured ?? g.featured ?? false,
            }));

            const dbGamesMap = new Map<string, any>(mappedDbGames.map((g: any) => [g.id, g]));

            const mergedGames = INITIAL_GAMES.map((initGame) => {
              const dbGame = dbGamesMap.get(initGame.id);
              if (dbGame) {
                return {
                  ...initGame,
                  ...dbGame,
                  id: initGame.id,
                  name: dbGame.name || initGame.name,
                  rtp: dbGame.rtp || initGame.rtp,
                };
              }
              return initGame;
            });

            const initGameIds = new Set(INITIAL_GAMES.map(g => g.id));
            for (const dbGame of mappedDbGames) {
              if (!initGameIds.has(dbGame.id)) {
                mergedGames.push(dbGame);
              }
            }

            setGames(mergedGames);
          }
          if (data.db.hero_images) {
            setHeroImages(data.db.hero_images);
          }
          if (data.db.game_icons) {
            setGameIcons(data.db.game_icons);
          }
          const dbUsers = data.db.users || [];
          const matchedDBUser = dbUsers[0];
          if (matchedDBUser) {
            setUser((prev) => {
              const currentVer = prev.balanceVersion || 0;
              const incomingVer = matchedDBUser.balance_version || 0;

              // Only accept wallet/bonus balance from server if the server has processed
              // the latest state or has external edits (e.g. approved depositor / admin overrides)
              const isDatabaseNewerOrEqual = incomingVer >= currentVer;

              return {
                ...prev,
                username: matchedDBUser.username,
                avatar: matchedDBUser.avatar || prev.avatar,
                walletBalance: isDatabaseNewerOrEqual ? matchedDBUser.balance : prev.walletBalance,
                bonusBalance: isDatabaseNewerOrEqual ? matchedDBUser.bonus_balance : prev.bonusBalance,
                balanceVersion: Math.max(currentVer, incomingVer),
                vipLevel: Number(matchedDBUser.vip_level || prev.vipLevel),
                referralCode: matchedDBUser.referral_code || prev.referralCode,
                isBalanceLoading: false
              };
            });
          } else {
            setUser((prev) => {
              if (prev.isBalanceLoading) {
                return { ...prev, isBalanceLoading: false };
              }
              return prev;
            });
          }

          // Pull live transaction log entries for the connected user
          const dbDeposits = (data.db.deposits || [])
            .map((d: any, idx: number) => ({
              id: `db-dep-${idx}-${d.created_at}`,
              type: 'deposit' as const,
              amount: d.amount,
              timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: d.status,
              description: d.utr_number ? `UPI Reference: ${d.utr_number}` : `Instant Deposit: ${d.payment_method || 'UPI_AUTO'}`
            }));

          const dbWithdrawals = (data.db.withdrawals || [])
            .map((w: any, idx: number) => ({
              id: `db-wth-${idx}-${w.created_at}`,
              type: 'withdraw' as const,
              amount: w.amount,
              timestamp: new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: w.status,
              description: `A/C release: ${w.account_number || w.upi_id || 'Transfer'}`
            }));

          // Merge them with initial ledger so experience is rich
          const mergedLogs = [...dbDeposits, ...dbWithdrawals];
          if (mergedLogs.length > 0) {
            setTransactions((prev) => {
              const nonDb = prev.filter(t => !t.id.startsWith('db-'));
              return [...mergedLogs, ...nonDb].slice(0, 30);
            });
          }
        }
      } catch (err) {
        console.warn("Lobby sync failed with database endpoint, attempting client-side Supabase direct fallback:", err);
        if (active) {
          try {
            if (isSupabaseConfigured()) {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
                const { data: wallet } = await supabase.from('wallets').select('*').eq('id', authUser.id).maybeSingle();
                
                if (profile && wallet) {
                  setUser((prev) => ({
                    ...prev,
                    username: profile.username || prev.username,
                    avatar: profile.avatar || prev.avatar,
                    walletBalance: Number(wallet.balance ?? prev.walletBalance),
                    bonusBalance: Number(wallet.bonus_balance ?? prev.bonusBalance),
                    vipLevel: Number(profile.vip_level ?? prev.vipLevel),
                    isBalanceLoading: false
                  }));
                  return;
                }
              }
            }
          } catch (sbErr) {
            console.warn("Direct Supabase query fallback failed:", sbErr);
          }
          setUser((prev) => {
            if (prev.isBalanceLoading) {
              return { ...prev, isBalanceLoading: false };
            }
            return prev;
          });
        }
      }
    };

    syncWithBackend();
    const poller = setInterval(syncWithBackend, 4000);
    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [user.username]);

  // Handle auto-visibility of header control components depending on current view context
  useEffect(() => {
    if (activeTab !== 'games' || gamesSubView === 'sports') {
      setScrolledPastHero(true);
    } else {
      setScrolledPastHero(false);
    }
  }, [activeTab, gamesSubView]);

  // Synchronize audio state and listen for browser interaction gestures to unlock AudioContext
  useEffect(() => {
    setAmbientMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    setVolume(volumeValue);
  }, [volumeValue]);

  useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, []);

  const handleUpdateUser = async (updated: UserProfile) => {
    lastLocalUpdateRef.current = Date.now();

    // Calculate deltas relative to the user prop at the moment the child component called us
    const walletDelta = updated.walletBalance - user.walletBalance;
    const bonusDelta = updated.bonusBalance - user.bonusBalance;
    const vipExpDelta = (updated.vipExp || 0) - (user.vipExp || 0);
    const totalDepositedDelta = (updated.totalDeposited || 0) - (user.totalDeposited || 0);
    const totalWithdrawnDelta = (updated.totalWithdrawn || 0) - (user.totalWithdrawn || 0);

    setUser((prev) => {
      const nextVer = (prev.balanceVersion || 0) + 1;
      const newWalletBalance = Math.max(0, prev.walletBalance + walletDelta);
      const newBonusBalance = Math.max(0, prev.bonusBalance + bonusDelta);
      const newVipExp = Math.max(0, (prev.vipExp || 0) + vipExpDelta);
      const newTotalDeposited = Math.max(0, (prev.totalDeposited || 0) + totalDepositedDelta);
      const newTotalWithdrawn = Math.max(0, (prev.totalWithdrawn || 0) + totalWithdrawnDelta);

      // Simple level-up check if VIP Exp overflows max
      let newVipLevel = updated.vipLevel !== user.vipLevel ? updated.vipLevel : prev.vipLevel;
      let newVipExpMax = prev.vipExpMax || 1000;
      if (newVipExp >= newVipExpMax) {
        newVipLevel += 1;
        newVipExpMax = Math.floor(newVipExpMax * 1.5);
      }

      // Asynchronously trigger server side sync using exact generated version tag
      const token = localStorage.getItem('tenzo_bet_token');
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;

      apiFetch('/api/client/update-balance', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          username: prev.username,
          balance: newWalletBalance,
          bonusBalance: newBonusBalance,
          balanceVersion: nextVer
        })
      }).then((res) => {
        if (res.status === 401) {
          handleLogout();
        }
      }).catch((err) => {
        console.warn("Failed to update database balance via API:", err);
      });

      if (isSupabaseConfigured()) {
        supabase.auth.getUser().then(({ data: { user: authUser } }) => {
          if (authUser) {
            supabase.from('wallets').update({
              balance: newWalletBalance,
              bonus_balance: newBonusBalance,
              balance_version: nextVer
            }).eq('id', authUser.id).then().catch((e: any) => console.warn("Supabase wallet update skipped/failed:", e));
          }
        }).catch(() => {});
      }

      return {
        ...prev,
        ...updated,
        walletBalance: newWalletBalance,
        bonusBalance: newBonusBalance,
        vipExp: newVipExp,
        vipExpMax: newVipExpMax,
        vipLevel: newVipLevel,
        totalDeposited: newTotalDeposited,
        totalWithdrawn: newTotalWithdrawn,
        balanceVersion: nextVer
      };
    });
  };

  const handleLogin = (userObj: any, token: string) => {
    localStorage.setItem('tenzo_bet_token', token);
    setUser({
      username: userObj.username,
      avatar: userObj.avatar || '',
      vipLevel: Number(userObj.vip_level || 1),
      vipExp: 220,
      vipExpMax: 1000,
      walletBalance: Number(userObj.balance || 0),
      bonusBalance: Number(userObj.bonus_balance || 0),
      totalReferralEarning: 24500,
      totalDeposited: Number(userObj.balance || 0),
      totalWithdrawn: 0,
      referralCode: 'TENZO_ROYAL_77',
      dailyStreak: 3,
      checkedInToday: false,
      balanceVersion: Number(userObj.balance_version || 0),
      isBalanceLoading: true
    });
    setIsLoggedIn(true);
    localStorage.setItem('tenzo_bet_logged_in', 'true');
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    playClick();
    setIsLoggedIn(false);
    setUser({
      username: 'Guest777',
      avatar: 'casual',
      vipLevel: 1,
      vipExp: 100,
      vipExpMax: 500,
      walletBalance: 0,
      bonusBalance: 0,
      totalReferralEarning: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralCode: 'TENZO_ROYAL_77',
      dailyStreak: 0,
      checkedInToday: false,
      balanceVersion: 0,
      isBalanceLoading: false
    });
    localStorage.removeItem('tenzo_bet_token');
    localStorage.removeItem('tenzo_bet_user');
    localStorage.setItem('tenzo_bet_logged_in', 'false');
    if (activeTab === 'account' || activeTab === 'bank') {
      setActiveTab('games');
    }
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open the game immediately
  const handleSelectGame = (game: Game) => {
    if (!isLoggedIn) {
      playClick();
      setShowLoginModal(true);
      return;
    }

    playClick();
    setActivePlayGame(game);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Support Chat simulator responses
  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const newMsgs = [...chatMessages, { sender: 'user' as const, text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput('');

    setTimeout(() => {
      let automatedRes = "Our VIP desk represents 24/7 dedicated support. For manual sandboxed UPI validations, your payout typically settles on the ledger in under 5 minutes.";
      if (userMsg.toLowerCase().includes('withdraw') || userMsg.toLowerCase().includes('cash')) {
        automatedRes = "To withdraw, visit the Bank tab, choose your preferred IMPS/USDT method, input the amount and submit. Payouts complete swiftly.";
      } else if (userMsg.toLowerCase().includes('fail') || userMsg.toLowerCase().includes('error')) {
        automatedRes = "If a slot hand hits a networking bottleneck, the certified Provably Fair SHA-256 algorithm rolls back or auto-saves game states. Rest assured, your funds are safe!";
      }

      setChatMessages((prev) => [...prev, { sender: 'agent' as const, text: automatedRes }]);
    }, 1000);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isSportsViewActive = activeTab === 'games' && gamesSubView === 'sports';
  const hasFloatingHeader = !isSportsViewActive && !activePlayGame && !loadingGame && activeTab !== 'wheel';

  return (
    <div className={`h-screen w-full max-w-full overflow-hidden ${isSportsViewActive ? 'bg-[#FAFAFA] text-[#111111]' : 'bg-[#05070D] text-white'} flex flex-col items-center select-none transition-colors duration-300`}>
      {/* Container sizing redesigned to be full-screen, removing the old max-w-md mobile frame limit! */}
      <div className={`w-full max-w-full h-full overflow-hidden ${isSportsViewActive ? 'bg-[#FAFAFA]' : 'bg-[#05070D]'} flex flex-col relative transition-colors duration-300`}>
        
        {/* Absolute Background Layered Premium System */}
        {!isSportsViewActive && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Style injections for GPU-accelerated premium animations */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes floatParticle-1 {
                0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.15; }
                50% { transform: translateY(-40px) translateX(20px) scale(1.3); opacity: 0.45; }
              }
              @keyframes floatParticle-2 {
                0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.1; }
                50% { transform: translateY(-60px) translateX(-30px) scale(0.8); opacity: 0.35; }
              }
              @keyframes floatParticle-3 {
                0%, 100% { transform: translateY(0) translateX(0) scale(1.2); opacity: 0.2; }
                50% { transform: translateY(-30px) translateX(15px) scale(0.9); opacity: 0.5; }
              }
              @keyframes pulseWave {
                0%, 100% { opacity: 0.04; transform: scale(1); }
                50% { opacity: 0.08; transform: scale(1.02); }
              }
              @keyframes slowGlow {
                0%, 100% { opacity: 0.8; transform: scale(1) rotate(0deg); }
                50% { opacity: 1; transform: scale(1.05) rotate(10deg); }
              }
            `}} />

            {/* 1. Base Dark Slate Layer */}
            <div className="absolute inset-0 bg-[#05070D]" />

            {/* 2. Deep Realistic Lighting Gradient Layers (Navy & Indigo) */}
            <div 
              className="absolute inset-0" 
              style={{
                background: `
                  radial-gradient(circle at 10% 20%, #0A1025 0%, transparent 50%),
                  radial-gradient(circle at 90% 80%, #120A2F 0%, transparent 60%),
                  radial-gradient(circle at 50% 40%, #080C1E 0%, #05070D 100%)
                `
              }}
            />

            {/* 3. Abstract Geometric Mesh Grid (3-5% opacity) */}
            <div 
              className="absolute inset-0 mix-blend-overlay"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: '45px 45px',
                opacity: 0.7
              }}
            />

            {/* Diagonal abstract fine light beams */}
            <div 
              className="absolute inset-0 mix-blend-color-dodge opacity-[0.04]"
              style={{
                backgroundImage: 'repeating-linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0px, rgba(0, 229, 255, 0.15) 1px, transparent 1px, transparent 120px)'
              }}
            />

            {/* 4. Overlapping Luxurious Large Glowing Orbs (250-500px blur) */}
            {/* Center-Top Ambient Dark Purple-Violet Bloom */}
            <div 
              className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(138, 46, 255, 0.09) 0%, rgba(18, 10, 47, 0) 75%)',
                filter: 'blur(160px)',
              }}
            />

            {/* Left Neon Cyan Orb with Pulse Animation */}
            <div 
              className="absolute top-[30%] -left-[15%] w-[550px] h-[550px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(0, 229, 255, 0.06) 0%, rgba(10, 16, 37, 0) 70%)',
                filter: 'blur(200px)',
                animation: 'slowGlow 15s infinite ease-in-out'
              }}
            />

            {/* Right Emerald Green High-contrast Spotlight */}
            <div 
              className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(57, 255, 136, 0.04) 0%, rgba(10, 16, 37, 0) 70%)',
                filter: 'blur(220px)',
                animation: 'slowGlow 20s infinite ease-in-out'
              }}
            />

            {/* Center-Bottom Electric Violet Spotlight */}
            <div 
              className="absolute bottom-[10%] left-[15%] w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(138, 46, 255, 0.07) 0%, rgba(5, 7, 13, 0) 70%)',
                filter: 'blur(180px)',
              }}
            />

            {/* Very Subtle Gold Highlight Accent */}
            <div 
              className="absolute top-[15%] right-[20%] w-[350px] h-[350px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255, 213, 74, 0.02) 0%, rgba(5, 7, 13, 0) 65%)',
                filter: 'blur(130px)',
              }}
            />

            {/* 5. Flowing Neon Waves and Abstract Energy Curves (Lightweight SVGs) */}
            <svg className="absolute top-0 left-0 w-full h-full opacity-[0.06] mix-blend-screen pointer-events-none" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'pulseWave 12s infinite ease-in-out' }}>
              <path d="M-100 150 C300 50, 450 400, 900 120 C1200 10, 1400 250, 1600 180" stroke="url(#cyan-violet-grad)" strokeWidth="2" strokeLinecap="round" />
              <path d="M-50 450 C250 550, 600 200, 1000 480 C1250 600, 1350 350, 1550 410" stroke="url(#violet-green-grad)" strokeWidth="1.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="cyan-violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="50%" stopColor="#8A2EFF" />
                  <stop offset="100%" stopColor="#39FF88" />
                </linearGradient>
                <linearGradient id="violet-green-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8A2EFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#39FF88" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* 6. Subtle Floating Sparks & Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Particle 1 */}
              <div 
                className="absolute top-[25%] left-[15%] w-2 h-2 rounded-full bg-[#00E5FF]"
                style={{
                  boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF',
                  filter: 'blur(0.5px)',
                  animation: 'floatParticle-1 8s infinite ease-in-out'
                }}
              />
              {/* Particle 2 */}
              <div 
                className="absolute top-[65%] left-[45%] w-1.5 h-1.5 rounded-full bg-[#39FF88]"
                style={{
                  boxShadow: '0 0 8px #39FF88',
                  filter: 'blur(0.5px)',
                  animation: 'floatParticle-2 11s infinite ease-in-out'
                }}
              />
              {/* Particle 3 */}
              <div 
                className="absolute top-[40%] right-[25%] w-2 h-2 rounded-full bg-[#8A2EFF]"
                style={{
                  boxShadow: '0 0 12px #8A2EFF',
                  filter: 'blur(0.5px)',
                  animation: 'floatParticle-3 9s infinite ease-in-out'
                }}
              />
              {/* Particle 4 */}
              <div 
                className="absolute bottom-[25%] right-[10%] w-1.5 h-1.5 rounded-full bg-[#FFD54A]"
                style={{
                  boxShadow: '0 0 6px #FFD54A',
                  animation: 'floatParticle-1 14s infinite ease-in-out'
                }}
              />
            </div>

            {/* 7. Soft Edge Vignette Shading */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(5, 7, 13, 0.95) 100%)'
              }}
            />

            {/* 8. Premium Noise/Grain Texture (2.5% opacity) */}
            <div 
              className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          </div>
        )}

        {/* 1. STICKY / FIXED VIP HEADER WITH NEW PREMIUM THEME */}
        {hasFloatingHeader && (
          <motion.header
            initial={{ y: 0, opacity: 1 }}
            animate={{
              y: isHeaderVisible ? 0 : (activeTab === 'games' ? -130 : -110),
              opacity: isHeaderVisible ? 1 : 0
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`fixed top-0 left-0 right-0 z-[9999] ${activeTab === 'games' ? 'h-[105px]' : 'h-[84px]'} bg-[#111111]/90 backdrop-blur-md px-4 flex items-center justify-between select-none border-b border-zinc-800 rounded-none shadow-[0_4px_30px_rgba(0,0,0,0.95)] transition-all duration-300`}
          >
            {/* Slanted premium geometric design overlay to match the reference image */}
            <div className="absolute bottom-0 left-0 w-[140px] h-[3px] bg-[#FF2348] transform skew-x-12 origin-bottom-left" />

            {/* Left logo and branding */}
            <div className="flex items-center gap-3">
              {(activeTab === 'account' || activeTab === 'refer') && (
                <button
                  onClick={() => {
                    playClick();
                    setActiveTab('games');
                    setGamesSubView('lobby');
                  }}
                  className="w-9 h-9 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-95 transition-all outline-none cursor-pointer shadow-md shadow-black/40"
                  aria-label="Back to Lobby"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
              )}

              <div className="relative flex items-center gap-2 select-none cursor-pointer" onClick={() => { if (isLoggedIn) { setActiveTab('games'); setGamesSubView('lobby'); } }}>
                {/* No ambient glow behind the logo */}
                
                {/* Styled Slanted Modern TF Logo in Neon Crimson Red */}
                {globalSettings?.logo_url ? (
                  <img
                    src={globalSettings.logo_url}
                    alt="Logo"
                    className="w-[44px] h-[44px] object-contain shrink-0 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg className="w-[44px] h-[44px] shrink-0 filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Slanted Stylized T Part in Red Gradient */}
                    <path 
                      d="M 22 20 H 95 L 91.5 34 H 54 L 42.5 80 H 26.5 L 38 34 H 18.5 L 20 28 H 58 L 59.5 24 H 21 L 22 20 Z" 
                      fill="url(#header-logo-grad-red)" 
                    />
                    {/* Slanted Stylized F Part in Clean White/Silver */}
                    <path 
                      d="M 60 38 H 87.5 L 85 48 H 68.5 L 60.5 80 H 49.5 Z" 
                      fill="url(#header-logo-grad-white)" 
                    />
                    <defs>
                      <linearGradient id="header-logo-grad-red" x1="20" y1="20" x2="95" y2="80" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF2348" />
                        <stop offset="1" stopColor="#B4002C" />
                      </linearGradient>
                      <linearGradient id="header-logo-grad-white" x1="49.5" y1="38" x2="87.5" y2="80" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFFFFF" />
                        <stop offset="1" stopColor="#E2E8F0" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                {/* White + Neon Crimson branding */}
                <div className="flex flex-col justify-center">
                  <span className="font-sans font-black italic text-[14px] tracking-wider text-white leading-none">TENZO</span>
                  <span className="font-sans font-black italic text-[10px] tracking-widest text-[#FF2348] uppercase leading-none mt-0.5">247</span>
                </div>
              </div>
            </div>

            {/* Right: Wallet/Login/Logout Section */}
            <div className={`flex shrink-0 select-none ${activeTab === 'games' ? 'flex-col gap-3.5 items-end justify-center py-1' : 'items-center gap-2'}`}>
              {isLoggedIn ? (
                (activeTab === 'account' || activeTab === 'refer') ? (
                  null
                ) : activeTab === 'bank' ? (
                  <>
                    {/* Premium Wallet Balance Card (Shifted to the rightmost slot) */}
                    <motion.div
                      layoutId="wallet-balance-card"
                      className="relative flex items-center justify-between bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 border-t-[#FF2348] rounded-lg px-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)] h-[32px] w-[115px] select-none shrink-0 gap-1 overflow-hidden"
                    >
                      {/* Subtle red linear accent lighting from the side */}
                      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#FF2348]/10 to-transparent pointer-events-none" />
                      <Wallet className="w-3.5 h-3.5 text-[#FF2348] shrink-0 filter drop-shadow-[0_0_4px_rgba(255,35,72,0.6)]" />
                      <div className="relative flex flex-col items-center justify-center min-w-0 flex-1 leading-none">
                        <span className="text-[7px] font-mono uppercase tracking-widest text-zinc-500 font-black block leading-none mb-0.5 text-center">BALANCE</span>
                        <div className="relative flex items-center justify-center min-w-0 leading-none">
                          {user.isBalanceLoading ? (
                            <div className="flex items-center gap-1">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                              </span>
                              <span className="font-sans font-bold text-[7px] uppercase tracking-wider text-zinc-400 leading-none">...</span>
                            </div>
                          ) : (
                            <span className="font-sans font-black text-[11px] tracking-wide inline-block text-white leading-none whitespace-nowrap text-center">
                              {formatBalance(user.walletBalance)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Premium Wallet Balance Card */}
                    <motion.div
                      layoutId="wallet-balance-card"
                      className="relative flex items-center justify-between bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 border-t-[#FF2348] rounded-lg px-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)] h-[32px] w-[115px] select-none shrink-0 gap-1 overflow-hidden"
                    >
                      {/* Subtle red linear accent lighting from the side */}
                      <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#FF2348]/10 to-transparent pointer-events-none" />
                      <Wallet className="w-3.5 h-3.5 text-[#FF2348] shrink-0 filter drop-shadow-[0_0_4px_rgba(255,35,72,0.6)]" />
                      <div className="relative flex flex-col items-center justify-center min-w-0 flex-1 leading-none">
                        <span className="text-[7px] font-mono uppercase tracking-widest text-zinc-500 font-black block leading-none mb-0.5 text-center">BALANCE</span>
                        <div className="relative flex items-center justify-center min-w-0 leading-none">
                          {user.isBalanceLoading ? (
                            <div className="flex items-center gap-1">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                              </span>
                              <span className="font-sans font-bold text-[7px] uppercase tracking-wider text-zinc-400 leading-none">...</span>
                            </div>
                          ) : (
                            <span className="font-sans font-black text-[11px] tracking-wide inline-block text-white leading-none whitespace-nowrap text-center">
                              {formatBalance(user.walletBalance)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Theme Red Deposit Button with slightly curved rectangular edges */}
                    <motion.button
                      layoutId="deposit-btn"
                      onClick={() => {
                        playClick();
                        setBankPresetTab('deposit');
                        setActiveTab('bank');
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="relative overflow-hidden bg-gradient-to-r from-[#FF2348] to-[#B4002C] hover:from-[#ff3d5e] hover:to-[#cb0032] text-white text-[10px] font-sans font-black rounded-lg border border-[#FF2348]/20 shadow-[0_2px_8px_rgba(255,35,72,0.3)] hover:shadow-[0_4px_12px_rgba(255,35,72,0.5)] transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 h-[32px] w-[115px]"
                    >
                      <span className="tracking-widest uppercase text-[9px] font-black">DEPOSIT</span>
                    </motion.button>
                  </>
                )
              ) : !showLoginModal && (
                /* Glowing premium Login button when logged out */
                <motion.button
                  onClick={() => {
                    playClick();
                    setShowLoginModal(true);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden bg-gradient-to-r from-[#FF2348] to-[#B4002C] text-white text-[10px] font-sans font-black px-5 rounded-lg border border-[#FF2348]/20 shadow-[0_2px_8px_rgba(255,35,72,0.3)] hover:shadow-[0_4px_12px_rgba(255,35,72,0.5)] transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 h-[32px] w-[115px]"
                >
                  <span className="tracking-widest uppercase text-[9px] font-black">LOGIN</span>
                </motion.button>
              )}
            </div>
          </motion.header>
        )}



          <>

        {/* 2. TAB VIEWS WRAPPER WITH MOTION TRANSITIONS */}
        <main 
          className="flex-1 select-none relative z-10 w-full overflow-hidden flex flex-col min-h-0"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab === 'games' ? `games-${gamesSubView}` : activeTab}-${refreshKeys[activeTab === 'games' ? gamesSubView : activeTab] || 0}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onScroll={handleMainScroll}
              className={`w-full flex-1 overflow-y-auto scroll-smooth ${isSportsViewActive ? 'px-0 pt-0 pb-0' : `max-w-6xl mx-auto px-4 ${hasFloatingHeader ? (activeTab === 'games' ? 'pt-[115px]' : 'pt-[90px]') : 'pt-3'} ${activeTab === 'bank' ? 'pb-6' : 'pb-[110px]'}`}`}
            >
              {activeTab === 'games' && (
                gamesSubView === 'sports' ? (
                  <SportsBettingSection
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onAddTransaction={handleAddTransaction}
                    onOpenAviator={() => handleSelectGame(games[0] || INITIAL_GAMES[0])}
                    onBackToLobby={() => setGamesSubView('lobby')}
                    onNavigateBank={(tab) => {
                      if (!isLoggedIn) {
                        setShowLoginModal(true);
                        return;
                      }
                      setBankPresetTab(tab);
                      setActiveTab('bank');
                    }}
                    bankAccounts={sharedBanks}
                    onUpdateBankAccounts={setSharedBanks}
                    upiAccounts={sharedUpis}
                    onUpdateUpiAccounts={setSharedUpis}
                  />
                ) : (
                  <LobbyTab
                    games={games}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    onSelectGame={handleSelectGame}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onAddTransaction={handleAddTransaction}
                    onNavigateBank={(tab) => {
                      if (!isLoggedIn) {
                        setShowLoginModal(true);
                        return;
                      }
                      setBankPresetTab(tab);
                      setActiveTab('bank');
                    }}
                    transactions={transactions}
                    onEnterSportsbook={() => setGamesSubView('sports')}
                    globalSettings={globalSettings}
                    heroImages={heroImages}
                    gameIcons={gameIcons}
                  />
                )
              )}

              {activeTab === 'bank' && (
                <BankTab
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  defaultTab={bankPresetTab}
                  onBack={() => setActiveTab('games')}
                  bankAccounts={sharedBanks}
                  onUpdateBankAccounts={setSharedBanks}
                  upiAccounts={sharedUpis}
                  onUpdateUpiAccounts={setSharedUpis}
                />
              )}

              {activeTab === 'wheel' && (
                <LuckyWheelTab
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onAddTransaction={handleAddTransaction}
                />
              )}

              {activeTab === 'refer' && (
                <ReferralTab
                  user={user}
                  leaderboard={INITIAL_LEADERBOARD}
                  onUpdateUser={handleUpdateUser}
                  onAddTransaction={handleAddTransaction}
                />
              )}

              {activeTab === 'account' && (
                <AccountTab
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onAddTransaction={handleAddTransaction}
                  onLogout={handleLogout}
                  transactions={transactions}
                  onNavigate={(tab, subTab) => {
                    playClick();
                    setActiveTab(tab);
                    if (subTab) {
                      setBankPresetTab(subTab);
                    }
                  }}
                  bankAccounts={sharedBanks}
                  onUpdateBankAccounts={setSharedBanks}
                  upiAccounts={sharedUpis}
                  onUpdateUpiAccounts={setSharedUpis}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>



        {/* 3. PREMIUM MINIMALIST STICKY NAVIGATION FOOTER */}
        {!isSportsViewActive && activeTab !== 'bank' && activeTab !== 'account' && !activePlayGame && (
          <motion.div 
            initial={{ y: 0, opacity: 1 }}
            animate={{ 
              y: isFooterVisible ? 0 : 100, 
              opacity: isFooterVisible ? 1 : 0 
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[480px] z-40 select-none pb-safe bg-[#111111]/95 backdrop-blur-[24px] border-t border-x border-zinc-800/80 rounded-t-[20px] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
          >
            {/* Minimal solid shadow underneath the bar */}
            <div className="absolute -inset-1 bg-black/45 rounded-t-[20px] blur-md pointer-events-none -z-30" />

            {/* Sticky Live Wins Ticker integrated seamlessly */}
            <div className="w-full bg-black/40 border-b border-zinc-900/40 py-1 px-4 flex items-center gap-2 select-none h-6.5 overflow-hidden mb-1.5">
              <div className="flex items-center gap-1 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2348] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF2348]"></span>
                </span>
                <span className="text-[7.5px] font-sans font-black uppercase tracking-widest text-[#FF2348] whitespace-nowrap">
                  LIVE WINS
                </span>
              </div>
              <div className="relative flex-1 overflow-hidden h-full flex items-center">
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#111111] to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#111111] to-transparent pointer-events-none z-10" />
                <div 
                  className="animate-marquee flex items-center gap-6 text-[8px] font-mono font-medium text-stone-300 uppercase tracking-wide h-full"
                  style={{ animationDuration: '32s' }}
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
                  ]).map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span className="text-stone-500 font-sans font-bold text-[8px]">{item.user}</span>
                      <span className="text-[#FF2348] font-sans font-black tracking-tight">₹{formatBalance(item.win)}</span>
                      <span className="text-stone-400 text-[8px]">on</span>
                      <span className="text-white font-sans font-extrabold text-[8px]">{item.game}</span>
                      <span className="px-1 py-0.5 text-[7px] font-sans font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 rounded leading-none">
                        {item.multiplier}
                      </span>
                      <span className="text-stone-700 font-bold">•</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <nav className="relative w-full h-[64px] flex items-center justify-between px-2 overflow-visible">
              {/* Dark luxury background overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/95 to-[#050505]/98 rounded-t-[20px] -z-10" />
              
              {/* Subtle top light reflection highlight */}
              <div className="absolute top-0 inset-x-5 h-[1px] bg-gradient-to-r from-transparent via-[#FF2348]/30 to-transparent pointer-events-none" />
              
              {/* Subtle diagonal reflection shine */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FF2348]/3 to-transparent pointer-events-none rounded-t-[20px]" />

              {[
                { id: 'games', label: 'Games', icon: <Gamepad2 className="w-[19px] h-[19px]" /> },
                { id: 'sports', label: 'Sports', icon: <Trophy className="w-[17px] h-[17px]" /> },
                { id: 'wheel', label: 'Wheel', icon: null },
                { id: 'refer', label: 'Refer', icon: <Share2 className="w-[17px] h-[17px]" /> },
                { id: 'account', label: 'Account', icon: <User className="w-[17px] h-[17px]" /> }
              ].map((navItem) => {
                const isTabActive = navItem.id === 'sports'
                  ? (activeTab === 'games' && gamesSubView === 'sports')
                  : (navItem.id === 'games'
                    ? (activeTab === 'games' && gamesSubView === 'lobby')
                    : activeTab === navItem.id);

                if (navItem.id === 'wheel') {
                  const isWheelActive = activeTab === 'wheel';
                  return (
                    <div key="wheel-center" className="relative flex flex-col items-center justify-center w-[60px] select-none shrink-0 h-full">
                      {/* Pulse ring animation container */}
                      <motion.div
                        className="absolute -inset-1 rounded-full pointer-events-none -z-10"
                        animate={isWheelActive ? {
                          scale: [1, 1.05, 1]
                        } : {
                          scale: 1
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3.5,
                          ease: 'easeInOut'
                        }}
                      />
                      
                      {/* Interactive circular Wheel button */}
                      <motion.button
                        onClick={() => {
                          playClick();
                          if (!isLoggedIn) {
                            setShowLoginModal(true);
                            return;
                          }
                          setActiveTab('wheel');
                          triggerRefresh('wheel');
                        }}
                        onMouseEnter={() => playHover()}
                        whileTap={{ scale: 0.90, translateY: 0.5 }}
                        className={`w-[36px] h-[36px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.15)] border ${
                          isWheelActive 
                            ? 'bg-gradient-to-tr from-[#FF2348] to-[#B4002C] border-[#FF2348]'
                            : 'bg-gradient-to-b from-[#1c1c1c] to-[#0d0d0d] border-[#FF2348]/25 hover:border-[#FF2348]/50'
                        }`}
                      >
                        {/* Premium Lucky Wheel decorative spokes inside background */}
                        <svg className={`absolute inset-0 w-full h-full opacity-35 pointer-events-none animate-spin-slow`} viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" stroke={isWheelActive ? '#ffffff' : '#FF2348'} strokeWidth="1" fill="none" />
                          <line x1="50" y1="5" x2="50" y2="95" stroke={isWheelActive ? '#ffffff' : '#FF2348'} strokeWidth="1" />
                          <line x1="5" y1="50" x2="95" y2="50" stroke={isWheelActive ? '#ffffff' : '#FF2348'} strokeWidth="1" />
                          <line x1="18" y1="18" x2="82" y2="82" stroke={isWheelActive ? '#ffffff' : '#FF2348'} strokeWidth="1" />
                          <line x1="18" y1="82" x2="82" y2="18" stroke={isWheelActive ? '#ffffff' : '#FF2348'} strokeWidth="1" />
                        </svg>
                        
                        {/* Inner polished surface */}
                        <div className={`absolute inset-0.5 rounded-full flex items-center justify-center transition-all duration-300 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.1)] ${
                          isWheelActive 
                            ? 'bg-gradient-to-b from-[#3a0a14] to-[#140206] border border-black/30' 
                            : 'bg-gradient-to-b from-[#1c1c1c] to-[#080808] border border-white/5'
                        }`}>
                          {/* Embossed Compass icon */}
                          <Compass className={`w-4 h-4 transition-all duration-300 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)] ${
                            isWheelActive ? 'text-[#FF2348] scale-110' : 'text-white/60 hover:text-white'
                          }`} />
                        </div>
                        
                        {/* Curved gloss overlay on the glass button */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none rounded-full" />
                      </motion.button>
                      
                      {/* Balanced, highly readable label text */}
                      <span className={`font-sans text-[9.5px] font-semibold tracking-wide transition-colors mt-0.5 ${
                        isWheelActive ? 'text-white font-bold' : 'text-white/65'
                      }`}>
                        Wheel
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={navItem.id}
                    onClick={() => {
                      playClick();
                      if (!isLoggedIn && navItem.id !== 'games' && navItem.id !== 'sports') {
                        setShowLoginModal(true);
                        return;
                      }
                      if (navItem.id === 'sports') {
                        setActiveTab('games');
                        setGamesSubView('sports');
                        triggerRefresh('sports');
                      } else if (navItem.id === 'games') {
                        setActiveTab('games');
                        setGamesSubView('lobby');
                        setSelectedCategory('all');
                        triggerRefresh('lobby');
                      } else {
                        setActiveTab(navItem.id as any);
                        triggerRefresh(navItem.id);
                      }
                    }}
                    whileTap={{ scale: 0.94 }}
                    onMouseEnter={() => playHover()}
                    className="relative flex-1 flex flex-col items-center justify-center gap-1 py-0.5 transition-all duration-300 cursor-pointer h-full"
                  >
                    {/* Premium icon with high contrast active/inactive states */}
                    <div className={`transition-all duration-300 flex items-center justify-center ${
                      isTabActive 
                        ? 'text-[#FF2348] scale-105' 
                        : 'text-white/60 hover:text-white'
                    }`}>
                      {navItem.icon}
                    </div>

                    {/* High readability label text */}
                    <span className={`font-sans text-[9.5px] font-semibold tracking-wide transition-all duration-300 ${
                      isTabActive ? 'text-white font-bold' : 'text-white/65'
                    }`}>
                      {navItem.label}
                    </span>

                    {/* Soft active underline */}
                    <AnimatePresence>
                      {isTabActive && (
                        <motion.span 
                          layoutId="activeTabUnderline"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 18 }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="absolute bottom-0.5 h-[2px] rounded-full bg-[#FF2348]"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </nav>
          </motion.div>
        )}

        {/* --- DYNAMIC MODALS --- */}

        {/* AA. Premium High Stakes 3D Loading Overlay */}
        <AnimatePresence>
          {loadingGame && (() => {
            const matchedGame = games.find(g => g.id === loadingGame.id);
            const coverData = getGameCoverData(loadingGame.id, loadingGame.name, matchedGame?.image);
            
            // Dynamic message based on progress
            const getLoadingStatusMessage = (progress: number) => {
              if (progress < 15) return "Initializing...";
              if (progress < 30) return "Loading Assets...";
              if (progress < 45) return "Connecting Secure Server...";
              if (progress < 60) return "Synchronizing Data...";
              if (progress < 75) return "Verifying Account...";
              if (progress < 90) return "Preparing Game...";
              return "Launching...";
            };

            return (
              <div className="fixed inset-0 z-50 bg-[#050A18] flex flex-col items-center justify-center overflow-y-auto select-none font-sans text-white p-4">
                
                {/* 1. Cyberpunk grid background pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none z-0" />

                {/* 2. Floating neon particles background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-[#FF3333]/25"
                      style={{
                        left: `${15 + i * 7.5}%`,
                        top: `${20 + (i % 3) * 25}%`
                      }}
                      animate={{
                        y: [0, -40, 0],
                        opacity: [0.1, 0.6, 0.1],
                        scale: [1, 1.6, 1]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 5 + (i % 3) * 2.5,
                        ease: 'easeInOut',
                        delay: i * 0.25
                      }}
                    />
                  ))}
                </div>

                {/* Ambient backdrop glowing spots */}
                <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#FF3333]/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[10%] right-[5%] w-72 h-72 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                {/* Outer container */}
                <div className="relative flex flex-col items-center max-w-sm w-full space-y-5 text-center font-sans z-10">
                  
                  {/* GAME COVER ARTWORK (16:9.5 aspect ratio with glow, scanline, brackets) */}
                  <motion.div 
                    className="relative w-full aspect-[16/9.5] rounded-3xl overflow-hidden border border-[#FF3333]/20 shadow-[0_0_40px_rgba(255,51,51,0.15)] bg-[#0B1021] group transform-gpu"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    <img 
                      src={coverData.image || undefined} 
                      alt={loadingGame.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter brightness-95"
                    />

                    {/* Ambient Target HUD Overlay over image */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-40 h-40 rounded-full border border-[#FF3333]/5 flex items-center justify-center animate-pulse">
                        <div className="w-24 h-24 rounded-full border border-dashed border-[#FF3333]/10 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border border-[#FF3333]/15" />
                        </div>
                      </div>
                    </div>

                    {/* Scanline Animation */}
                    <motion.div
                      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF3333]/30 to-transparent shadow-[0_0_6px_#FF3333]"
                      animate={{ y: ['0%', '650%'] }}
                      transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
                    />

                    {/* Soft dark vignette gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050A18] via-transparent to-black/35 pointer-events-none" />

                    {/* Cyberpunk corner bracket neon accents */}
                    <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#FF3333]/70" />
                    <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#FF3333]/70" />
                    <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#FF3333]/70" />
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#FF3333]/70" />
                  </motion.div>

                  {/* GAME TITLE & SUBTITLE */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <h2 className="font-sans font-black text-[28px] tracking-[0.12em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] leading-none">
                      {coverData.title}
                    </h2>
                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#FF3333]/50 to-transparent" />
                    <p className="text-[10px] text-[#FF3333] font-mono tracking-[0.25em] uppercase font-black">
                      {coverData.subtitle}
                    </p>
                  </div>

                  {/* STATUS CARD (Divided into 3 columns, glowing glass backdrop) */}
                  <div className="w-full rounded-[20px] bg-[#0A122C]/40 backdrop-blur-md border border-white/5 py-3 px-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)] divide-x divide-white/10 text-center">
                    {/* Column 1: Secure */}
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-[#0E203E]/80 border border-[#FF3333]/20 flex items-center justify-center text-[#FF3333] shadow-[0_0_10px_rgba(255,51,51,0.15)]">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FF3333]">SECURE</span>
                      <span className="text-[8px] text-white/50 font-mono uppercase tracking-tight">ENCRYPTION</span>
                    </div>

                    {/* Column 2: Server */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 pl-1">
                      <div className="w-7 h-7 rounded-full bg-[#0E203E]/80 border border-[#FF3333]/20 flex items-center justify-center text-[#FF3333] shadow-[0_0_10px_rgba(255,51,51,0.15)]">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FF3333]">SERVER</span>
                      <span className="text-[8px] text-white/50 font-mono uppercase tracking-tight">GLOBAL</span>
                    </div>

                    {/* Column 3: Ping */}
                    <div className="flex-1 flex flex-col items-center gap-1.5 pl-1">
                      <div className="w-7 h-7 rounded-full bg-[#0E203E]/80 border border-[#FF3333]/20 flex items-center justify-center text-[#FF3333] shadow-[0_0_10px_rgba(255,51,51,0.15)]">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FF3333]">PING</span>
                      <span className="text-[8px] text-white/50 font-mono uppercase tracking-tight">{livePing}MS</span>
                    </div>
                  </div>

                  {/* LOADING INDICATOR (Circular ring flanked by HUD arrows) */}
                  <div className="flex items-center justify-between w-full gap-3 px-1">
                    {/* Left HUD side */}
                    <div className="flex-1 flex flex-col items-center text-center space-y-1">
                      <div className="flex items-center gap-0.5 text-[#FF3333] opacity-75 text-[8px] tracking-widest font-black">
                        <span>≫</span><span>≫</span><span>≫</span><span>≫</span><span>≫</span>
                      </div>
                      <span className="text-[8px] text-[#FF3333] font-black uppercase tracking-wider">PREPARING</span>
                      <span className="text-[7px] text-white/40 font-mono uppercase tracking-widest">GAME ENGINE</span>
                    </div>

                    {/* Circular ring with rotating rings */}
                    <div className="relative flex items-center justify-center w-[100px] h-[100px] shrink-0">
                      {/* Rotating Dashed HUD Ring */}
                      <motion.div 
                        className="absolute inset-0 rounded-full border border-dashed border-[#FF3333]/20"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                      />
                      
                      {/* Rotating Dotted Inner Accent Ring */}
                      <motion.div 
                        className="absolute inset-2 rounded-full border border-dotted border-white/5"
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                      />

                      {/* SVG Circular Ring */}
                      <svg className="absolute w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="31"
                          stroke="#0E1E45"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="31"
                          stroke="#FF3333"
                          strokeWidth="3.5"
                          strokeDasharray={195}
                          strokeDashoffset={195 - (195 * loadingProgress) / 100}
                          fill="transparent"
                          strokeLinecap="round"
                          className="transition-all duration-100 ease-out filter drop-shadow-[0_0_8px_#FF3333]"
                        />
                      </svg>

                      {/* Percent in center */}
                      <div className="flex flex-col items-center justify-center z-10">
                        <span className="font-sans font-black text-lg text-white tracking-tighter leading-none">
                          {loadingProgress}%
                        </span>
                        <span className="text-[7px] text-[#FF3333] font-mono tracking-wider uppercase font-black mt-0.5">
                          LOADING
                        </span>
                      </div>
                    </div>

                    {/* Right HUD side */}
                    <div className="flex-1 flex flex-col items-center text-center space-y-1">
                      <div className="flex items-center gap-0.5 text-[#FF3333] opacity-75 text-[8px] tracking-widest font-black">
                        <span>≪</span><span>≪</span><span>≪</span><span>≪</span><span>≪</span>
                      </div>
                      <span className="text-[8px] text-[#FF3333] font-black uppercase tracking-wider">ESTIMATED TIME</span>
                      <span className="text-[7px] text-white/40 font-mono uppercase tracking-widest">3 - 5 SEC</span>
                    </div>
                  </div>

                  {/* DYNAMIC PROGRESS BLOCK STATUS MESSAGE */}
                  <div className="w-full space-y-3.5">
                    <div className="h-4 flex items-center justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p 
                          key={getLoadingStatusMessage(loadingProgress)}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] text-neutral-300 tracking-widest uppercase font-black font-mono text-center text-[#FF3333]/90"
                        >
                          {getLoadingStatusMessage(loadingProgress)}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Segmented green micro indicator progress block array */}
                    <div className="w-full flex items-center justify-between gap-1 px-1">
                      {[...Array(16)].map((_, index) => {
                        const isFilled = loadingProgress >= ((index + 1) / 16) * 100;
                        return (
                          <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
                              isFilled 
                                ? 'bg-gradient-to-r from-[#FF3333] to-[#990000] shadow-[0_0_6px_#FF3333]' 
                                : 'bg-[#0E1E45]/60 border border-white/5'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM STATUS PANEL */}
                  <div className="w-full rounded-xl bg-[#0A122C]/30 border border-white/5 p-3 flex items-center justify-between gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#0E203E] border border-white/10 text-[#FF3333]">
                        <Shield className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3333] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3333]"></span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white font-sans font-black tracking-wider uppercase leading-none">
                          CONNECTING SECURE SERVER
                        </span>
                        <span className="text-[7.5px] text-white/50 font-mono uppercase mt-1">
                          Please wait while we set things up...
                        </span>
                      </div>
                    </div>

                    {/* Animated Waveform widget */}
                    <div className="flex items-center gap-[2px] h-5 px-1 shrink-0">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-[1.5px] bg-[#FF3333] rounded-full"
                          animate={{
                            height: [5, Math.random() * 12 + 4, 5]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.5 + i * 0.08,
                            ease: 'easeInOut'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}
        </AnimatePresence>

        {/* A. Playable Game-Simulation Overlay */}
        <AnimatePresence>
          {activePlayGame && (
            <GameSimulation
              game={activePlayGame}
              user={user}
              onUpdateUser={handleUpdateUser}
              onAddTransaction={handleAddTransaction}
              onClose={() => setActivePlayGame(null)}
              globalSettings={globalSettings}
            />
          )}
        </AnimatePresence>

        {/* B. Secure VIP Support Modal */}
        <AnimatePresence>
          {showSupport && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full max-w-sm bg-[#0B0F17] rounded-2xl border border-[#FF3333]/25 shadow-2xl overflow-hidden flex flex-col h-[400px]"
              >
                <div className="bg-[#040B1D] p-4 flex items-center justify-between border-b border-[#FF3333]/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF3333] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF3333] font-orbitron">
                      Tenzo Concierge (24/7)
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowSupport(false)}
                    className="text-white/60 hover:text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs flex flex-col justify-end no-scrollbar">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`max-w-[80%] p-2.5 rounded-xl text-left leading-normal ${
                        msg.sender === 'user' 
                          ? 'ml-auto bg-[#FF3333]/10 text-white border border-[#FF3333]/25' 
                          : 'mr-auto bg-black/45 text-white/80'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your support ticket..."
                    className="flex-grow bg-[#040B1D] text-sm text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-[#FF3333]"
                  />
                  <button type="submit" className="p-2 px-4 bg-gradient-to-r from-[#FF3333] to-[#990000] text-white font-bold rounded-lg text-xs hover:brightness-110">
                    Send
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* C. Quick Notification Toast */}

        {/* E. Login Modal Overlay */}
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/90 backdrop-blur-sm">
              <div className="relative min-h-screen w-full flex items-center justify-center">
                <LoginGate onLogin={handleLogin} />
                <button
                  onClick={() => {
                    playClick();
                    setShowLoginModal(false);
                  }}
                  className="group fixed top-4 right-4 z-[10001] flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-[10.5px] font-black tracking-[0.15em] uppercase text-zinc-300 hover:text-white bg-black/85 hover:bg-neutral-950/90 border border-neutral-800/80 hover:border-[#FF2348]/60 shadow-[0_4px_24px_rgba(0,0,0,0.85)] hover:shadow-[0_0_20px_rgba(255,35,72,0.25)] transition-all duration-300 cursor-pointer select-none transform hover:scale-[1.04] active:scale-[0.96]"
                >
                  <X className="w-3.5 h-3.5 text-[#FF2348]" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

          </>

      </div>
    </div>
  );
}
