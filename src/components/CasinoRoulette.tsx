import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { 
  X, HelpCircle, Trophy, Coins, RotateCcw, Play, Sparkles, MessageCircle, 
  Volume2, VolumeX, ShieldCheck, Zap, Undo, Trash2, Camera, Video, 
  TrendingUp, Users, Activity, Eye, Award, CheckCircle, Info, ChevronRight
} from 'lucide-react';
import { playClick, playHover, playWin } from '../utils/audio';
// @ts-ignore
import rouletteWheelImg from '../assets/images/roulette_wheel_3d_1782631951387.jpg';

interface CasinoRouletteProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onClose: () => void;
  globalSettings?: any;
}

// European Roulette Wheel Sequence
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const CHIP_VALUES = [100, 500, 1000, 5000, 10000, 25000];
const CHIP_COLORS: Record<number, { bg: string; text: string; border: string; accent: string }> = {
  100: { bg: 'bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-700', text: 'text-white', border: 'border-cyan-200', accent: 'shadow-cyan-500/35' },
  500: { bg: 'bg-gradient-to-br from-rose-500 via-rose-400 to-red-700', text: 'text-white', border: 'border-rose-200', accent: 'shadow-rose-500/35' },
  1000: { bg: 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600', text: 'text-stone-950', border: 'border-yellow-100', accent: 'shadow-amber-400/35 animate-pulse' },
  5000: { bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-700', text: 'text-white', border: 'border-purple-200', accent: 'shadow-purple-500/35' },
  10000: { bg: 'bg-gradient-to-br from-emerald-400 via-teal-300 to-emerald-600', text: 'text-stone-950', border: 'border-emerald-100', accent: 'shadow-emerald-400/35' },
  25000: { bg: 'bg-gradient-to-br from-zinc-200 via-white to-zinc-500', text: 'text-stone-950', border: 'border-zinc-100', accent: 'shadow-zinc-300/35' },
};

const getVipTierName = (level: number): string => {
  if (level >= 5) return "VIP Obsidian";
  if (level >= 4) return "VIP Platinum";
  if (level >= 3) return "VIP Gold";
  if (level >= 2) return "VIP Silver";
  return "VIP Bronze";
};

interface LiveWinner {
  username: string;
  amount: number;
  betType: string;
  timestamp: string;
}

export default function CasinoRoulette({ user, onUpdateUser, onAddTransaction, onClose, globalSettings }: CasinoRouletteProps) {
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [betHistory, setBetHistory] = useState<{ [key: string]: number }[]>([]);
  const [activeChip, setActiveChip] = useState<number>(500);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<{ number: number; color: 'red' | 'black' | 'green' } | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [ballRotation, setBallRotation] = useState<number>(0);
  const [ballRadius, setBallRadius] = useState<number>(typeof window !== 'undefined' && window.innerWidth < 768 ? 95 : 125); // outer rim limit
  const [activeCam, setActiveCam] = useState<'cam-1' | 'cam-2'>('cam-1'); // cam-1: Wheel Close-Up, cam-2: Dealer Wide
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [lobbyMuted, setLobbyMuted] = useState<boolean>(false);

  // Stats
  const [hotNumbers, setHotNumbers] = useState<number[]>([17, 32, 23, 0]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([4, 11, 10, 5]);
  const [redPercentage, setRedPercentage] = useState<number>(49);
  const [blackPercentage, setBlackPercentage] = useState<number>(48);

  const [historyLogs, setHistoryLogs] = useState<{ number: number; color: 'red' | 'black' | 'green' }[]>([
    { number: 17, color: 'black' },
    { number: 32, color: 'red' },
    { number: 0, color: 'green' },
    { number: 11, color: 'black' },
    { number: 25, color: 'red' },
    { number: 2, color: 'black' },
    { number: 36, color: 'red' }
  ]);

  // Real-time Scrolling Winnings Ticker
  const [liveWinners, setLiveWinners] = useState<LiveWinner[]>([
    { username: 'Rudra_KingPin', amount: 540000, betType: '17 Black', timestamp: 'Just now' },
    { username: 'Kabir_BettingPros', amount: 30000, betType: 'Red Color', timestamp: '1m ago' },
    { username: 'Ananya_Boss', amount: 150000, betType: '3rd Dozen', timestamp: '2m ago' },
    { username: 'Lucky_Vihaan', amount: 360000, betType: '0 Green', timestamp: '3m ago' },
    { username: 'TeenPatti_Don', amount: 80000, betType: 'Even', timestamp: '4m ago' }
  ]);

  // Simulated live high rollers chat feed
  const [chatMessages, setChatMessages] = useState<{ id: string; user: string; text: string; vipLevel: string }[]>([
    { id: '1', user: 'Kabir_BettingPros', text: 'Heavy bet on 17 Black! Isabella give us a lucky spin! 🎰', vipLevel: 'VIP Platinum' },
    { id: '2', user: 'Rudra_KingPin', text: 'Red has hit 3 times in a row. Placing ₹25,000 on Black now.', vipLevel: 'VIP Obsidian' },
    { id: '3', user: 'Lucky_Vihaan', text: 'Splitting chips between 0 Green and Col 3. High stakes time! 🚀', vipLevel: 'VIP Gold' }
  ]);

  const [chatInput, setChatInput] = useState<string>('');

  // Robust calculation of total bet
  let totalBetAmount = 0;
  Object.keys(bets).forEach(key => {
    const val = bets[key];
    if (typeof val === 'number') {
      totalBetAmount += val;
    }
  });

  // Periodic random live high-roller chats & winners simulation
  useEffect(() => {
    const chatTemplates = [
      "Sticking ₹10,000 on Red 32 and Red 19! Let's hit it!",
      "Hoping for zero to complete my column stack! 💸",
      "Anyone tracking the hot numbers? 17 is looking super active.",
      "Just cashed out ₹4.5 Lakhs from UPI payout! Rolling it here.",
      "Beautiful interface, feels exactly like Grand Lisboa Macau VIP tables.",
      "Tenzo live streams have the absolute best HD quality.",
      "Provably Fair RNG makes this the safest roulette table online.",
      "Placing ₹50,000 on Column 3. Let's go Team!"
    ];

    const winnerUsernames = ['Vikram_Pro', 'Guru_Bet', 'Sonal_Gamer', 'Aarav_Stakes', 'Riya_VIP', 'HighStake_Avi'];
    const winnerBets = ['Red (2x)', 'Column 1', '17 Black', '0 Green', '2nd Dozen', 'Even', 'Low 1-18'];
    const winnerAmounts = [20000, 50000, 180000, 360000, 15000, 80000, 120000];

    const users = ["Ananya_Boss", "TeenPatti_Don", "Aman_Pro", "Pri_Gamer", "Gur_Gamer", "VIP_Obsidian_99"];
    const levels = ["VIP Obsidian", "VIP Platinum", "VIP Gold", "VIP Elite"];

    const interval = setInterval(() => {
      // 40% chance of chat
      if (Math.random() > 0.6) {
        const text = chatTemplates[Math.floor(Math.random() * chatTemplates.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const vipLevel = levels[Math.floor(Math.random() * levels.length)];
        
        setChatMessages(prev => [
          ...prev.slice(-12),
          { id: Date.now().toString(), user, text, vipLevel }
        ]);
      }

      // 40% chance of new simulated live winner in ticker
      if (Math.random() > 0.6) {
        const randUser = winnerUsernames[Math.floor(Math.random() * winnerUsernames.length)];
        const randBet = winnerBets[Math.floor(Math.random() * winnerBets.length)];
        const randAmt = winnerAmounts[Math.floor(Math.random() * winnerAmounts.length)];
        
        setLiveWinners(prev => [
          { username: randUser, amount: randAmt, betType: randBet, timestamp: 'Just now' },
          ...prev.slice(0, 5)
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const playCustomClick = () => {
    if (!lobbyMuted) playClick();
  };

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const placeBet = (spotId: string) => {
    playCustomClick();
    if (spinning) return;

    if (user.walletBalance < totalBetAmount + activeChip) {
      alert("Insufficient wallet balance for this bet amount!");
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);

    setBets(prev => ({
      ...prev,
      [spotId]: (prev[spotId] || 0) + activeChip
    }));
  };

  const handleClearBets = () => {
    playCustomClick();
    if (spinning) return;
    if (Object.keys(bets).length === 0) return;
    setBetHistory(prev => [...prev, { ...bets }]);
    setBets({});
  };

  const handleUndoBet = () => {
    playCustomClick();
    if (spinning) return;
    if (betHistory.length === 0) return;
    const previous = betHistory[betHistory.length - 1];
    setBets(previous);
    setBetHistory(prev => prev.slice(0, -1));
  };

  const handleDoubleBets = () => {
    playCustomClick();
    if (spinning) return;
    if (Object.keys(bets).length === 0) return;

    if (user.walletBalance < totalBetAmount * 2) {
      alert("Insufficient wallet balance to double your bets!");
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);
    
    const doubled: Record<string, number> = {};
    Object.entries(bets).forEach(([key, val]) => {
      doubled[key] = Number(val) * 2;
    });
    setBets(doubled);
  };

  // Luxury Call Bets Presets
  const placeVoisinsDuZero = () => {
    playCustomClick();
    if (spinning) return;
    
    // Neighbours of zero covers 17 numbers near zero with 9 chips total
    // To make it easy, we place a proportional wager on zero and nearby numbers
    const voisins = ['0', '2', '3', '4', '7', '12', '15', '18', '19', '21', '22', '25', '26', '28', '29', '32', '35'];
    const cost = voisins.length * activeChip;
    
    if (user.walletBalance < totalBetAmount + cost) {
      alert("Insufficient balance to place Voisins du Zéro call bet!");
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);
    const nextBets = { ...bets };
    voisins.forEach(num => {
      nextBets[num] = (nextBets[num] || 0) + activeChip;
    });
    setBets(nextBets);
  };

  const placeTiersDuCylindre = () => {
    playCustomClick();
    if (spinning) return;
    
    // Series 5/8 covers 12 numbers on opposite side of wheel
    const tiers = ['5', '8', '10', '11', '13', '16', '23', '24', '27', '30', '33', '36'];
    const cost = tiers.length * activeChip;
    
    if (user.walletBalance < totalBetAmount + cost) {
      alert("Insufficient balance to place Tiers du Cylindre call bet!");
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);
    const nextBets = { ...bets };
    tiers.forEach(num => {
      nextBets[num] = (nextBets[num] || 0) + activeChip;
    });
    setBets(nextBets);
  };

  const placeOrphelins = () => {
    playCustomClick();
    if (spinning) return;
    
    // Orphans cover remaining 8 numbers
    const orphelins = ['1', '6', '9', '14', '17', '20', '31', '34'];
    const cost = orphelins.length * activeChip;
    
    if (user.walletBalance < totalBetAmount + cost) {
      alert("Insufficient balance to place Orphelins call bet!");
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);
    const nextBets = { ...bets };
    orphelins.forEach(num => {
      nextBets[num] = (nextBets[num] || 0) + activeChip;
    });
    setBets(nextBets);
  };

  const executeSpin = () => {
    if (spinning) return;
    if (totalBetAmount === 0) {
      alert("Please place at least one bet on the table first!");
      return;
    }

    playCustomClick();
    setSpinning(true);
    setSpinResult(null);

    // Initial deduction of bet amount from wallet
    const finalBalanceAfterBet = user.walletBalance - totalBetAmount;
    onUpdateUser({
      ...user,
      walletBalance: finalBalanceAfterBet
    });

    // Determine winning number
    let winningNum = 0;
    const forceControl = globalSettings?.game_outcome_control;

    if (forceControl === 'force_win') {
      const betKeys = Object.keys(bets);
      const possibleWinningSpots = betKeys.filter(k => bets[k] > 0);
      if (possibleWinningSpots.length > 0) {
        const randomSpot = possibleWinningSpots[Math.floor(Math.random() * possibleWinningSpots.length)];
        
        if (!isNaN(Number(randomSpot))) {
          winningNum = Number(randomSpot);
        } else if (randomSpot === 'red') {
          winningNum = RED_NUMBERS[Math.floor(Math.random() * RED_NUMBERS.length)];
        } else if (randomSpot === 'black') {
          winningNum = BLACK_NUMBERS[Math.floor(Math.random() * BLACK_NUMBERS.length)];
        } else if (randomSpot === 'even') {
          const evens = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0);
          winningNum = evens[Math.floor(Math.random() * evens.length)];
        } else if (randomSpot === 'odd') {
          const odds = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 !== 0);
          winningNum = odds[Math.floor(Math.random() * odds.length)];
        } else {
          winningNum = Math.floor(Math.random() * 37);
        }
      } else {
        winningNum = Math.floor(Math.random() * 37);
      }
    } else if (forceControl === 'force_loss') {
      const redBet = bets['red'] || 0;
      const blackBet = bets['black'] || 0;
      
      const unplaced: number[] = [];
      for (let n = 0; n <= 36; n++) {
        const color = getNumberColor(n);
        let match = false;
        if (bets[String(n)] > 0) match = true;
        if (color === 'red' && redBet > 0) match = true;
        if (color === 'black' && blackBet > 0) match = true;
        
        if (!match) unplaced.push(n);
      }
      
      if (unplaced.length > 0) {
        winningNum = unplaced[Math.floor(Math.random() * unplaced.length)];
      } else {
        winningNum = Math.floor(Math.random() * 37);
      }
    } else {
      winningNum = Math.floor(Math.random() * 37);
    }

    const winningColor = getNumberColor(winningNum);

    // Physics Animation Calculations
    // Spin core 4-5 times
    const startWheelAngle = wheelRotation % 360;
    const targetWheelAngle = startWheelAngle + 360 * 4 + (Math.random() * 360);
    
    const resultIndex = WHEEL_NUMBERS.indexOf(winningNum);
    const sliceAngle = 360 / WHEEL_NUMBERS.length;
    
    // BALL_OFFSET_ANGLE matches the visual pocket sequence orientation of our high-quality 3D wheel image
    const BALL_OFFSET_ANGLE = -122;
    
    // Spin ball opposite direction, dropping cleanly in the correct pocket slot
    const targetBallRotation = targetWheelAngle + (resultIndex * sliceAngle) + BALL_OFFSET_ANGLE - (360 * 6);

    setWheelRotation(targetWheelAngle);
    setBallRotation(targetBallRotation);

    const isMobile = window.innerWidth < 768;
    const maxRadius = isMobile ? 105 : 135;
    const minRadius = isMobile ? 65 : 85;

    setBallRadius(maxRadius); // outer track

    // Ball spiraling inwards path
    let currentRadius = maxRadius;
    const radiusInterval = setInterval(() => {
      currentRadius = Math.max(currentRadius - 2, minRadius); // Drops into inner slots
      setBallRadius(currentRadius);
    }, 70);

    // Spin completes in 3.6 seconds
    setTimeout(() => {
      clearInterval(radiusInterval);
      setBallRadius(minRadius); // Drop inside slot pocket

      const result = { number: winningNum, color: winningColor };
      setSpinResult(result);
      setSpinning(false);

      // Save to marquee history logs
      setHistoryLogs(prev => [result, ...prev.slice(0, 9)]);

      // Calculate ratios and hot/cold list updates dynamically
      const lastSpins = [result, ...historyLogs];
      const counts: Record<number, number> = {};
      lastSpins.forEach(s => {
        counts[s.number] = (counts[s.number] || 0) + 1;
      });
      
      const sortedByHits = Object.keys(counts)
        .map(Number)
        .sort((a, b) => counts[b] - counts[a]);
      
      if (sortedByHits.length > 0) {
        setHotNumbers(prev => [...sortedByHits.slice(0, 4), ...prev].slice(0, 4));
        const allNums = Array.from({ length: 37 }, (_, i) => i);
        const rem = allNums.filter(n => !sortedByHits.includes(n));
        setColdNumbers(rem.slice(0, 4));
      }

      // Color distribution simulation
      const totalCount = lastSpins.length;
      const reds = lastSpins.filter(s => s.color === 'red').length;
      const blacks = lastSpins.filter(s => s.color === 'black').length;
      setRedPercentage(Math.max(15, Math.min(80, Math.round((reds / totalCount) * 100))));
      setBlackPercentage(Math.max(15, Math.min(80, Math.round((blacks / totalCount) * 100))));

      // Calculate payouts
      let totalPayout = 0;

      Object.entries(bets).forEach(([spot, wagerVal]) => {
        const wager = Number(wagerVal) || 0;
        if (wager <= 0) return;

        let won = false;
        let mult = 0;

        if (!isNaN(Number(spot))) {
          if (Number(spot) === winningNum) {
            won = true;
            mult = 36;
          }
        } else if (spot === 'red' && winningColor === 'red') {
          won = true;
          mult = 2;
        } else if (spot === 'black' && winningColor === 'black') {
          won = true;
          mult = 2;
        } else if (spot === 'green' && winningColor === 'green') {
          won = true;
          mult = 36;
        } else if (spot === 'even' && winningNum !== 0 && winningNum % 2 === 0) {
          won = true;
          mult = 2;
        } else if (spot === 'odd' && winningNum !== 0 && winningNum % 2 !== 0) {
          won = true;
          mult = 2;
        } else if (spot === '1-18' && winningNum >= 1 && winningNum <= 18) {
          won = true;
          mult = 2;
        } else if (spot === '19-36' && winningNum >= 19 && winningNum <= 36) {
          won = true;
          mult = 2;
        } else if (spot === '1st12' && winningNum >= 1 && winningNum <= 12) {
          won = true;
          mult = 3;
        } else if (spot === '2nd12' && winningNum >= 13 && winningNum <= 24) {
          won = true;
          mult = 3;
        } else if (spot === '3rd12' && winningNum >= 25 && winningNum <= 36) {
          won = true;
          mult = 3;
        } else if (spot === 'col1' && winningNum !== 0 && (winningNum - 1) % 3 === 0) {
          won = true;
          mult = 3;
        } else if (spot === 'col2' && winningNum !== 0 && (winningNum - 2) % 3 === 0) {
          won = true;
          mult = 3;
        } else if (spot === 'col3' && winningNum !== 0 && winningNum % 3 === 0) {
          won = true;
          mult = 3;
        }

        if (won) {
          totalPayout += wager * mult;
        }
      });

      // Update real balance & databases
      if (totalPayout > 0) {
        if (!lobbyMuted) playWin();
        
        onUpdateUser({
          ...user,
          walletBalance: finalBalanceAfterBet + totalPayout,
          vipExp: Math.min(user.vipExp + Math.floor(totalBetAmount * 0.05) + 15, user.vipExpMax)
        });

        onAddTransaction({
          id: `wroul-${Date.now()}`,
          type: 'win',
          amount: totalPayout,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Royal Roulette hit on ${winningNum} ${winningColor.toUpperCase()}! Won ₹${totalPayout.toLocaleString()}`
        });

        // Add to live scrolling ticker dynamically
        setLiveWinners(prev => [
          { username: user.username || 'HighRoller777', amount: totalPayout, betType: `Hit ${winningNum} ${winningColor.toUpperCase()}`, timestamp: 'Just now' },
          ...prev.slice(0, 4)
        ]);
      } else {
        onUpdateUser({
          ...user,
          vipExp: Math.min(user.vipExp + Math.floor(totalBetAmount * 0.02) + 5, user.vipExpMax)
        });

        onAddTransaction({
          id: `lroul-${Date.now()}`,
          type: 'bet',
          amount: -totalBetAmount,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Roulette wager of ₹${totalBetAmount.toLocaleString()} completed. Result: ${winningNum} ${winningColor.toUpperCase()}`
        });
      }
    }, 3600);
  };

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playCustomClick();

    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        user: user.username || "Me",
        text: chatInput,
        vipLevel: getVipTierName(user.vipLevel)
      }
    ]);
    setChatInput('');
  };

  const handleSelectPresetChip = (val: number) => {
    playCustomClick();
    setActiveChip(val);
  };

  return (
    <div id="roulette-fullscreen" className="fixed inset-0 z-50 bg-[#02050b] text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. ULTRA PREMIUM GOLDEN & GLOSSY HEADER */}
      <header className="bg-gradient-to-r from-[#030815] via-[#0b142c] to-[#030815] border-b border-[#ffd700]/20 px-4 py-2.5 flex items-center justify-between shrink-0 relative z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all border border-white/5 cursor-pointer bg-black/40 text-neutral-400 hover:text-white"
            id="back-lobby-btn"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-left leading-tight">
            <h1 className="font-display font-black text-sm md:text-base tracking-widest bg-gradient-to-r from-[#ffd700] via-[#fff3b0] to-[#ffd700] bg-clip-text text-transparent uppercase drop-shadow-md flex items-center gap-1.5">
              <span>TENZO ROYAL ROULETTE</span>
              <span className="text-[7.5px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded tracking-normal shadow-lg shadow-red-600/20 font-bold border border-red-500/20 animate-pulse">
                🔴 LIVE
              </span>
            </h1>
            <p className="text-[8px] text-zinc-400 font-mono tracking-widest uppercase">
              HIGH STAKES SALON PRIVÉ • PROVIDER MULTI-PLAY
            </p>
          </div>
        </div>

        {/* Live streaming status marquee */}
        <div className="hidden lg:flex items-center gap-4 bg-black/65 border border-[#ffd700]/15 rounded-full py-1.5 px-4 text-[9.5px] font-mono shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="font-bold">STUDIO FEED ONLINE (1080p 60FPS)</span>
          </div>
          <div className="text-zinc-600 font-black">|</div>
          <div className="text-zinc-400">HOST: <span className="text-amber-400 font-extrabold">ISABELLA</span></div>
          <div className="text-zinc-600 font-black">|</div>
          <div className="text-sky-400 font-bold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>1,482 VIEWING</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLobbyMuted(!lobbyMuted)}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white cursor-pointer bg-black/40 border border-white/5 shadow-md"
            title={lobbyMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {lobbyMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
          </button>
          
          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-neutral-400 hover:text-white cursor-pointer bg-black/40 border border-white/5 shadow-md"
            title="How to play"
          >
            <HelpCircle className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Golden Stakes Wallet Balance */}
          <div className="bg-gradient-to-r from-amber-600/20 via-[#ffd700]/10 to-amber-600/20 border border-[#ffd700]/40 rounded-xl px-4 py-1 text-right flex items-center gap-3 shadow-[0_4px_12px_rgba(255,215,0,0.1)]">
            <div>
              <span className="block text-[8px] text-zinc-400 uppercase font-black tracking-wider leading-none">STAKES WALLET</span>
              <span className="text-xs md:text-sm font-black text-[#ffd700] font-mono tracking-tight block mt-0.5">
                ₹{user.walletBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg border border-yellow-300/30">
              <Coins className="w-4 h-4 text-stone-950" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN SPLIT CANVAS SCREEN */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT COLUMN: LIVE BROADCAST STUDIOS WITH PHYSICAL 3D WHEEL */}
        <div className="flex-1 lg:max-w-md flex flex-col bg-[#050912] border-r border-[#ffd700]/10 relative">
          
          {/* CAMERA FEED CONTROL TAB */}
          <div className="bg-black/80 border-b border-white/5 p-2 flex items-center justify-between shrink-0 font-mono text-[9.5px]">
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-red-500" />
              <span className="font-extrabold text-zinc-400 uppercase tracking-wider">CHOOSE CAMERA STAGE:</span>
            </div>
            <div className="flex bg-zinc-900 border border-white/5 p-0.5 rounded-lg">
              <button
                onClick={() => { playCustomClick(); setActiveCam('cam-1'); }}
                className={`px-3 py-1 rounded-md font-black uppercase text-[8px] tracking-wider transition-all cursor-pointer ${
                  activeCam === 'cam-1' ? 'bg-amber-500 text-stone-950 font-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                CAM 1 (WHEEL CLOSE-UP)
              </button>
              <button
                onClick={() => { playCustomClick(); setActiveCam('cam-2'); }}
                className={`px-3 py-1 rounded-md font-black uppercase text-[8px] tracking-wider transition-all cursor-pointer ${
                  activeCam === 'cam-2' ? 'bg-amber-500 text-stone-950 font-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                CAM 2 (DEALER WIDE)
              </button>
            </div>
          </div>

          {/* REALTIME WINNINGS ROLLING TICKER */}
          <div className="bg-[#11050a]/90 border-b border-rose-500/10 py-1.5 px-3 flex items-center gap-2 overflow-hidden shrink-0 font-mono text-[8.5px]">
            <div className="flex items-center gap-1 shrink-0 text-red-400 font-black uppercase tracking-wider animate-pulse">
              <Award className="w-3.5 h-3.5" />
              <span>LIVE WINNERS:</span>
            </div>
            <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-4 text-zinc-300">
              <div className="flex gap-4 animate-[marquee_20s_linear_infinite]">
                {liveWinners.map((winner, index) => (
                  <div key={index} className="inline-flex items-center gap-1 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full leading-none">
                    <span className="text-[#ffd700] font-black">{winner.username}</span>
                    <span className="text-zinc-500">won</span>
                    <span className="text-emerald-400 font-extrabold">₹{winner.amount.toLocaleString()}</span>
                    <span className="text-zinc-500">on</span>
                    <span className="text-rose-400 font-bold uppercase">{winner.betType}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REALISTIC 3D PHYSICAL ROULETTE WHEEL CONTAINER */}
          <div className="flex-1 min-h-[220px] md:min-h-[280px] flex flex-col items-center justify-center relative p-6 bg-gradient-to-b from-[#0b101c] via-[#040710] to-[#02050b] overflow-hidden">
            
            {/* Visual studio ambient spot lighting */}
            <div className="absolute inset-0 bg-radial-gradient from-[#1a335a]/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#ffd700]/5 to-transparent pointer-events-none" />

            {/* SCANLINE / SCREEN GRAIN OVERLAY */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.12)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.02),_rgba(0,255,0,0.005),_rgba(0,0,255,0.02))] bg-[length:100%_4px,_6px_100%] pointer-events-none opacity-20" />

            {/* 3D PERSPECTIVE BOX */}
            <div 
              className="relative flex items-center justify-center rounded-full transition-transform duration-700" 
              style={{ 
                perspective: '1200px',
                transform: activeCam === 'cam-1' ? 'scale(1.1) rotateX(15deg)' : 'scale(0.85) rotateX(32deg) translateY(-20px)'
              }}
            >
              
              {/* Outer Luxury Polished Mahogany Wood Cabinet Rim (Multiple bevels for photorealism) */}
              <div 
                className="relative w-[280px] h-[280px] md:w-[350px] md:h-[350px] rounded-full p-1.5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95),_inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center bg-gradient-to-b from-[#111] to-[#000]"
                style={{ boxShadow: '0 25px 60px -10px rgba(0,0,0,0.95)' }}
              >
                
                {/* Mahogany Wood Outer Inlay Ring */}
                <div className="w-full h-full rounded-full p-0.5 flex items-center justify-center relative overflow-hidden">
                  
                  {/* Rotating Wheel Cylinder - Premium Photorealistic 3D Render */}
                  <motion.div
                    className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center select-none pointer-events-none"
                    animate={{ rotate: wheelRotation }}
                    transition={spinning ? { duration: 3.6, ease: [0.22, 0.61, 0.36, 1] } : { duration: 0 }}
                  >
                    <img 
                      src={rouletteWheelImg} 
                      alt="Premium 3D European Roulette Wheel" 
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>

                  {/* NON-ROTATING CHROME SHINE / GLASS REFLECTION OVERLAY */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/15 pointer-events-none z-20 mix-blend-overlay" />

                  {/* THE SPINNING IVORY BALL (Realistic physics dropping shadow) */}
                  <motion.div
                    className="absolute rounded-full bg-gradient-to-tr from-neutral-100 via-white to-zinc-200 shadow-[0_5px_12px_rgba(0,0,0,0.9),_inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] z-30 flex items-center justify-center border border-white/90"
                    style={{ 
                      width: '12px',
                      height: '12px'
                    }}
                    animate={{ 
                      rotate: ballRotation,
                      x: Math.cos(ballRotation * Math.PI / 180) * ballRadius,
                      y: Math.sin(ballRotation * Math.PI / 180) * ballRadius
                    }}
                    transition={spinning ? { duration: 3.6, ease: "easeOut" } : { duration: 0 }}
                  />

                </div>
              </div>
            </div>

            {/* LIVE STREAM OUTCOME OVERLAYS */}
            <div className="mt-5 text-center z-10 w-full max-w-xs bg-black/60 border border-white/5 rounded-2xl p-3 shadow-lg">
              <AnimatePresence mode="wait">
                {spinning ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#ffd700] rounded-full animate-ping" />
                      <span className="text-[10px] text-[#ffd700] font-mono tracking-widest font-black uppercase">
                        BALL IN ORBIT...
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">High-Precision Physical RNG Seed</span>
                  </motion.div>
                ) : spinResult ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="flex items-center gap-1.5 bg-black/45 border border-[#ffd700]/20 rounded-full px-4 py-1 shadow-lg">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">RESULT:</span>
                      <span className={`px-3 py-0.5 rounded text-xs font-black uppercase tracking-wider font-mono ${
                        spinResult.color === 'green' ? 'bg-[#00c853] text-stone-950 shadow-[0_0_10px_rgba(0,200,83,0.3)]' :
                        spinResult.color === 'red' ? 'bg-[#d50000] text-white shadow-[0_0_10px_rgba(213,0,0,0.3)] animate-bounce' :
                        'bg-zinc-800 text-white border border-zinc-600 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                      }`}>
                        {spinResult.number} {spinResult.color.toUpperCase()}
                      </span>
                    </div>

                    {/* Results Checker */}
                    {Object.keys(bets).length > 0 && (
                      <div className="mt-1.5">
                        {(() => {
                          let totalWon = 0;
                          Object.entries(bets).forEach(([spot, wagerVal]) => {
                            const wager = Number(wagerVal) || 0;
                            if (wager <= 0) return;
                            let won = false;
                            let mult = 0;
                            if (!isNaN(Number(spot)) && Number(spot) === spinResult.number) {
                              won = true;
                              mult = 36;
                            } else if (spot === 'red' && spinResult.color === 'red') {
                              won = true;
                              mult = 2;
                            } else if (spot === 'black' && spinResult.color === 'black') {
                              won = true;
                              mult = 2;
                            } else if (spot === 'green' && spinResult.color === 'green') {
                              won = true;
                              mult = 36;
                            } else if (spot === 'even' && spinResult.number !== 0 && spinResult.number % 2 === 0) {
                              won = true;
                              mult = 2;
                            } else if (spot === 'odd' && spinResult.number !== 0 && spinResult.number % 2 !== 0) {
                              won = true;
                              mult = 2;
                            } else if (spot === '1-18' && spinResult.number >= 1 && spinResult.number <= 18) {
                              won = true;
                              mult = 2;
                            } else if (spot === '19-36' && spinResult.number >= 19 && spinResult.number <= 36) {
                              won = true;
                              mult = 2;
                            } else if (spot === '1st12' && spinResult.number >= 1 && spinResult.number <= 12) {
                              won = true;
                              mult = 3;
                            } else if (spot === '2nd12' && spinResult.number >= 13 && spinResult.number <= 24) {
                              won = true;
                              mult = 3;
                            } else if (spot === '3rd12' && spinResult.number >= 25 && spinResult.number <= 36) {
                              won = true;
                              mult = 3;
                            } else if (spot === 'col1' && spinResult.number !== 0 && (spinResult.number - 1) % 3 === 0) {
                              won = true;
                              mult = 3;
                            } else if (spot === 'col2' && spinResult.number !== 0 && (spinResult.number - 2) % 3 === 0) {
                              won = true;
                              mult = 3;
                            } else if (spot === 'col3' && spinResult.number !== 0 && spinResult.number % 3 === 0) {
                              won = true;
                              mult = 3;
                            }
                            if (won) {
                              totalWon += wager * mult;
                            }
                          });

                          return totalWon > 0 ? (
                            <p className="text-yellow-400 font-extrabold text-xs uppercase animate-bounce mt-1 tracking-widest bg-yellow-500/10 border border-yellow-500/20 py-1 px-3 rounded-lg shadow-lg">
                              🎉 WINNER PAYOUT: ₹{totalWon.toLocaleString('en-IN')}!
                            </p>
                          ) : (
                            <p className="text-zinc-500 text-[9px] uppercase mt-1">
                              Dealer Wins this hand. Better luck next spin!
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-[9.5px] font-mono text-[#ffd700] tracking-wider animate-pulse font-extrabold">
                    AWAITING PLAYER CHIPS... PLACE YOUR BETS
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* REALTIME WINNING RATIOS & SCOREBOARD STATS PANEL */}
          <div className="bg-black/85 border-t border-white/5 p-3 grid grid-cols-2 gap-3 shrink-0">
            <div className="space-y-1.5">
              <span className="text-[8.5px] text-zinc-500 font-bold uppercase block tracking-wider">HOT NUMBERS (100 Spins):</span>
              <div className="flex gap-1">
                {hotNumbers.map((num, idx) => (
                  <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border font-mono ${
                    num === 0 ? 'bg-emerald-600 border-emerald-400' :
                    RED_NUMBERS.includes(num) ? 'bg-red-700 border-red-500' : 'bg-neutral-950 border-neutral-700'
                  }`}>
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[8.5px] text-zinc-500 font-bold uppercase block tracking-wider">COLD NUMBERS:</span>
              <div className="flex gap-1">
                {coldNumbers.map((num, idx) => (
                  <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border font-mono ${
                    num === 0 ? 'bg-emerald-600 border-emerald-400' :
                    RED_NUMBERS.includes(num) ? 'bg-red-700 border-red-500' : 'bg-neutral-950 border-neutral-700'
                  }`}>
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold uppercase">
                <TrendingUp className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Ratio:
              </span>
              <div className="flex gap-2">
                <span className="text-red-400 font-black">RED {redPercentage}%</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-300 font-black">BLACK {blackPercentage}%</span>
                <span className="text-zinc-500">|</span>
                <span className="text-emerald-400 font-black">ZERO {100 - redPercentage - blackPercentage}%</span>
              </div>
            </div>
          </div>

          {/* MULTIPLAYER CONSOLE INTERCOM FEED */}
          <div className="h-28 shrink-0 bg-[#02050b] border-t border-white/5 flex flex-col p-2.5">
            <div className="flex items-center gap-1 mb-1 font-mono shrink-0">
              <MessageCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">MACAU CASINO CHAT</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-sans text-[9.5px] leading-tight select-text scrollbar-thin">
              {chatMessages.map((msg) => {
                const isMe = msg.user === (user.username || "Me");
                return (
                  <div key={msg.id} className="text-left">
                    <span className={`text-[7.5px] font-black uppercase px-1 py-0.2 rounded mr-1 leading-none inline-block ${
                      msg.vipLevel.includes('Obsidian') ? 'bg-zinc-800 text-purple-400 border border-purple-500/25' :
                      msg.vipLevel.includes('Platinum') ? 'bg-zinc-900 text-blue-400 border border-blue-500/25' :
                      msg.vipLevel.includes('Gold') ? 'bg-amber-950/40 text-yellow-400 border border-yellow-500/25' :
                      'bg-neutral-800 text-stone-300'
                    }`}>
                      {msg.vipLevel}
                    </span>
                    <span className={`${isMe ? 'text-yellow-400 font-black' : 'text-zinc-300 font-bold'} mr-1`}>
                      {msg.user}:
                    </span>
                    <span className="text-stone-300">{msg.text}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendChat} className="mt-1.5 flex gap-1 shrink-0">
              <input
                type="text"
                placeholder="Talk to high rollers..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-black/80 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] text-white focus:outline-none focus:border-yellow-500/40"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LUXURY EMERALD FELT TABLE */}
        <div className="flex-1 flex flex-col bg-[#011c0f] relative overflow-y-auto no-scrollbar" style={{ backgroundImage: 'radial-gradient(circle at center, #022b17 0%, #000c06 100%)' }}>
          
          {/* Felt Texture Velvet Shine Layer */}
          <div className="absolute inset-0 bg-white/[0.015] mix-blend-overlay pointer-events-none" />

          {/* MAIN GRID WORKSPACE AREA */}
          <div className="flex-1 p-4 md:p-6 flex flex-col justify-center items-center relative z-10 w-full max-w-2xl mx-auto space-y-4">
            
            {/* Real-time Wheel Trend history tracker log badges */}
            <div className="w-full flex items-center justify-between bg-black/45 border border-[#ffd700]/10 rounded-xl px-4 py-2 font-mono text-[9px]">
              <span className="text-zinc-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> WHEEL SPIN HISTORY:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {historyLogs.map((log, idx) => (
                  <div 
                    key={idx}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border font-mono ${
                      log.color === 'green' ? 'bg-[#00c853] border-[#00e676] text-stone-950' :
                      log.color === 'red' ? 'bg-[#d50000] border-[#ff1744] text-white' :
                      'bg-neutral-900 border-neutral-700 text-white shadow'
                    }`}
                  >
                    {log.number}
                  </div>
                ))}
              </div>
            </div>

            {/* HIGH-LIMIT FRENCH LAYOUT PRESET CALL-BETS BUTTONS */}
            <div className="w-full grid grid-cols-3 gap-2 font-mono text-[8px] md:text-[9px] font-black">
              <button
                onClick={placeVoisinsDuZero}
                disabled={spinning}
                className="py-1.5 rounded-lg border border-[#ffd700]/10 bg-[#02140a] hover:bg-[#042412] text-amber-400 hover:text-white transition-all uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-30"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Voisins du Zéro</span>
              </button>
              <button
                onClick={placeTiersDuCylindre}
                disabled={spinning}
                className="py-1.5 rounded-lg border border-[#ffd700]/10 bg-[#02140a] hover:bg-[#042412] text-amber-400 hover:text-white transition-all uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-30"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tiers du Cylindre</span>
              </button>
              <button
                onClick={placeOrphelins}
                disabled={spinning}
                className="py-1.5 rounded-lg border border-[#ffd700]/10 bg-[#02140a] hover:bg-[#042412] text-amber-400 hover:text-white transition-all uppercase cursor-pointer flex items-center justify-center gap-1 disabled:opacity-30"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Orphelins (Orphans)</span>
              </button>
            </div>

            {/* THE LUXURY INTERACTIVE BETTINGfelt BOARD (Standard High Limit Salon Board Layout) */}
            <div className="w-full flex flex-col relative bg-gradient-to-b from-[#0d3d25] via-[#041f11] to-[#010e08] p-5 rounded-3xl border-4 border-[#c5a85c] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),_inset_0_4px_15px_rgba(0,0,0,0.7)] relative overflow-hidden select-none">
              
              {/* Glossy Felt Velvet Shimmer Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-45" />
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
              
              {/* Monaco Casino Crown corner highlights */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-300/40 rounded-tl-md pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300/40 rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-300/40 rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300/40 rounded-br-md pointer-events-none" />

              {/* Table header label */}
              <div className="w-full text-center pb-3 flex items-center justify-center gap-2">
                <span className="h-[1px] w-14 bg-gradient-to-r from-transparent to-[#ffd700]/30" />
                <span className="text-[8.5px] md:text-[9.5px] font-mono font-black text-[#ffd700] tracking-[0.25em] uppercase drop-shadow">MONACO SALON PRIVÉ felt</span>
                <span className="h-[1px] w-14 bg-gradient-to-l from-transparent to-[#ffd700]/30" />
              </div>
              
              {/* Gold Grid Line Layout (European 37-number felt setup) */}
              <div className="grid grid-cols-13 gap-1 relative overflow-hidden bg-black/45 p-1.5 rounded-2xl border border-emerald-500/20 shadow-inner">
                
                {/* COLUMN 1: Zero 0 spanning 3 Rows */}
                <div 
                  onClick={() => placeBet('0')}
                  className={`col-span-1 row-span-3 min-h-[110px] md:min-h-[150px] rounded-xl flex flex-col items-center justify-center text-xs md:text-sm font-black transition-all cursor-pointer select-none relative border border-emerald-500/30 ${
                    bets['0'] 
                      ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 text-stone-950 font-extrabold ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
                      : 'bg-gradient-to-br from-emerald-900/60 to-emerald-950/90 text-emerald-300 hover:from-emerald-800/80 hover:to-emerald-900/90'
                  }`}
                  id="felt-bet-0"
                >
                  <span className="font-mono text-xs md:text-sm font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)]">0</span>
                  
                  {/* Premium 3D Physical stacked chip pile visualization */}
                  {bets['0'] > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="relative w-6 h-6 md:w-7.5 md:h-7.5 flex items-center justify-center">
                        <div className="absolute w-full h-full rounded-full bg-black/60 blur-[1px] translate-y-[2.5px]" />
                        <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-600 to-yellow-900 border border-yellow-400/50 translate-y-[1.5px]" />
                        <div className="absolute w-[92%] h-[92%] rounded-full bg-stone-900 translate-y-[0.7px] border border-white/15" />
                        <div className="absolute w-[84%] h-[84%] rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-stone-950 text-[7px] md:text-[8px] font-black flex flex-col items-center justify-center border-2 border-dashed border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                          <span className="text-[5.5px] font-sans font-extrabold leading-none opacity-80">₹</span>
                          <span className="leading-none font-bold">
                            {bets['0'] >= 1000 ? `${(bets['0']/1000).toFixed(0)}k` : bets['0']}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 36 Number Felt Grid (3 Rows x 12 Cols) */}
                {(() => {
                  return (
                    <div className="col-span-12 grid grid-cols-12 gap-1 row-span-3">
                      {[0, 1, 2].map((rowIndex) => {
                        return (
                          <div key={rowIndex} className="col-span-12 grid grid-cols-12 gap-1">
                            {Array.from({ length: 12 }).map((_, colIndex) => {
                              const numbers = [
                                [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // Row 1 (top of table)
                                [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], // Row 2 (middle of table)
                                [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]  // Row 3 (bottom of table)
                              ];
                              const num = numbers[rowIndex][colIndex];
                              const color = getNumberColor(num);
                              const hasBet = bets[String(num)] > 0;

                              return (
                                <div
                                  key={num}
                                  onClick={() => placeBet(String(num))}
                                  className={`aspect-square md:aspect-[4/3] rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black font-mono transition-all cursor-pointer relative select-none border border-white/5 shadow-md ${
                                    hasBet 
                                      ? 'ring-2 ring-amber-400 scale-[1.04] z-10 shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
                                      : 'hover:scale-[1.03] hover:z-10'
                                  } ${
                                    color === 'red' 
                                      ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-800 text-white border-red-400/20 shadow-[0_2px_4px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.15)] hover:from-red-500 hover:to-red-700' 
                                      : 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black text-zinc-100 border-neutral-700/20 shadow-[0_2px_4px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.15)] hover:from-neutral-700 hover:to-neutral-950'
                                  }`}
                                  id={`felt-bet-${num}`}
                                >
                                  <span className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.7)]">{num}</span>
                                  
                                  {/* Premium 3D Physical stacked chip pile visualization */}
                                  {hasBet && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                      <div className="relative w-5.5 h-5.5 md:w-6.5 md:h-6.5 flex items-center justify-center">
                                        <div className="absolute w-full h-full rounded-full bg-black/60 blur-[1px] translate-y-[2.5px]" />
                                        <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-600 to-yellow-900 border border-yellow-400/50 translate-y-[1.5px]" />
                                        <div className="absolute w-[92%] h-[92%] rounded-full bg-stone-900 translate-y-[0.7px] border border-white/15" />
                                        <div className="absolute w-[84%] h-[84%] rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-stone-950 text-[6.5px] md:text-[7.5px] font-black flex flex-col items-center justify-center border-2 border-dashed border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                          <span className="text-[5.5px] font-sans font-extrabold leading-none opacity-85">₹</span>
                                          <span className="leading-none font-bold">
                                            {bets[String(num)] >= 1000 ? `${(bets[String(num)]/1000).toFixed(0)}k` : bets[String(num)]}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* COLUMN BETS ROW (2:1 Column selections) */}
              <div className="grid grid-cols-13 gap-1 mt-1.5 font-mono">
                <div className="col-span-1 text-[7px] text-zinc-500 font-extrabold flex items-center justify-center uppercase">COLS</div>
                <div className="col-span-12 grid grid-cols-3 gap-1.5 text-[9px] font-black text-center">
                  {[
                    { id: 'col3', label: '2:1 COLUMN 3' },
                    { id: 'col2', label: '2:1 COLUMN 2' },
                    { id: 'col1', label: '2:1 COLUMN 1' }
                  ].map((col) => {
                    const hasBet = bets[col.id] > 0;
                    return (
                      <div
                        key={col.id}
                        onClick={() => placeBet(col.id)}
                        className={`py-2 px-1 rounded-xl bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-amber-300 border border-emerald-500/30 text-center uppercase tracking-wider cursor-pointer transition-all hover:from-[#113f2b] hover:to-[#092619] relative font-black select-none ${
                          hasBet ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-[1.02]' : 'hover:border-amber-500/30'
                        }`}
                        id={`felt-bet-${col.id}`}
                      >
                        <span className="text-[8.5px] md:text-[10px] tracking-widest font-black text-amber-200">{col.label}</span>
                        
                        {/* Premium 3D Physical stacked chip pile visualization */}
                        {hasBet && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="relative w-5.5 h-5.5 md:w-6.5 md:h-6.5 flex items-center justify-center">
                              <div className="absolute w-full h-full rounded-full bg-black/60 blur-[1px] translate-y-[2.5px]" />
                              <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-600 to-yellow-900 border border-yellow-400/50 translate-y-[1.5px]" />
                              <div className="absolute w-[92%] h-[92%] rounded-full bg-stone-900 translate-y-[0.7px] border border-white/15" />
                              <div className="absolute w-[84%] h-[84%] rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-stone-950 text-[6.5px] md:text-[7.5px] font-black flex flex-col items-center justify-center border-2 border-dashed border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                <span className="text-[5.5px] font-sans font-extrabold leading-none opacity-85">₹</span>
                                <span className="leading-none font-bold">
                                  {bets[col.id] >= 1000 ? `${(bets[col.id]/1000).toFixed(0)}k` : bets[col.id]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DOZEN BETS ROW (1st 12, 2nd 12, 3rd 12) */}
              <div className="grid grid-cols-13 gap-1 mt-1.5 font-mono">
                <div className="col-span-1 text-[7px] text-zinc-500 font-extrabold flex items-center justify-center uppercase">DOZ</div>
                <div className="col-span-12 grid grid-cols-3 gap-1.5 text-[9.5px] font-black text-center">
                  {[
                    { id: '1st12', label: '1st 12' },
                    { id: '2nd12', label: '2nd 12' },
                    { id: '3rd12', label: '3rd 12' }
                  ].map((doz) => {
                    const hasBet = bets[doz.id] > 0;
                    return (
                      <div
                        key={doz.id}
                        onClick={() => placeBet(doz.id)}
                        className={`py-2 px-1 rounded-xl bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-amber-300 border border-emerald-500/30 text-center uppercase tracking-wider cursor-pointer transition-all hover:from-[#113f2b] hover:to-[#092619] relative font-black select-none ${
                          hasBet ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-[1.02]' : 'hover:border-amber-500/30'
                        }`}
                        id={`felt-bet-${doz.id}`}
                      >
                        <span className="text-[8.5px] md:text-[10px] tracking-widest font-black text-amber-200">{doz.label}</span>
                        
                        {/* Premium 3D Physical stacked chip pile visualization */}
                        {hasBet && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="relative w-5.5 h-5.5 md:w-6.5 md:h-6.5 flex items-center justify-center">
                              <div className="absolute w-full h-full rounded-full bg-black/60 blur-[1px] translate-y-[2.5px]" />
                              <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-600 to-yellow-900 border border-yellow-400/50 translate-y-[1.5px]" />
                              <div className="absolute w-[92%] h-[92%] rounded-full bg-stone-900 translate-y-[0.7px] border border-white/15" />
                              <div className="absolute w-[84%] h-[84%] rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-stone-950 text-[6.5px] md:text-[7.5px] font-black flex flex-col items-center justify-center border-2 border-dashed border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                <span className="text-[5.5px] font-sans font-extrabold leading-none opacity-85">₹</span>
                                <span className="leading-none font-bold">
                                  {bets[doz.id] >= 1000 ? `${(bets[doz.id]/1000).toFixed(0)}k` : bets[doz.id]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OUTSIDE BETS ROW (Even/Odd, Red/Black, Low/High) */}
              <div className="grid grid-cols-13 gap-1 mt-1.5 font-mono">
                <div className="col-span-1 text-[7px] text-zinc-500 font-extrabold flex items-center justify-center uppercase">OUT</div>
                <div className="col-span-12 grid grid-cols-6 gap-1.5 text-[8.5px] md:text-[10px] font-black text-center">
                  {[
                    { id: '1-18', label: '1 - 18', class: 'bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-zinc-300 border border-emerald-500/20 hover:from-[#113f2b]' },
                    { id: 'even', label: 'EVEN', class: 'bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-zinc-300 border border-emerald-500/20 hover:from-[#113f2b]' },
                    { id: 'red', label: 'RED', class: 'bg-gradient-to-b from-red-600 to-red-800 text-white border border-red-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-red-500' },
                    { id: 'black', label: 'BLACK', class: 'bg-gradient-to-b from-neutral-800 to-neutral-950 text-zinc-100 border border-neutral-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:from-neutral-700' },
                    { id: 'odd', label: 'ODD', class: 'bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-zinc-300 border border-emerald-500/20 hover:from-[#113f2b]' },
                    { id: '19-36', label: '19 - 36', class: 'bg-gradient-to-b from-[#0c2e1f] to-[#051c12] text-zinc-300 border border-emerald-500/20 hover:from-[#113f2b]' }
                  ].map((item) => {
                    const hasBet = bets[item.id] > 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => placeBet(item.id)}
                        className={`py-2 px-1 rounded-xl text-center uppercase cursor-pointer transition-all relative font-black select-none ${item.class} ${
                          hasBet ? 'ring-2 ring-amber-400 scale-[1.02] shadow-[0_0_15px_rgba(255,215,0,0.4)]' : ''
                        }`}
                        id={`felt-bet-${item.id}`}
                      >
                        <span className="tracking-wide">{item.label}</span>
                        
                        {/* Premium 3D Physical stacked chip pile visualization */}
                        {hasBet && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="relative w-5.5 h-5.5 md:w-6.5 md:h-6.5 flex items-center justify-center">
                              <div className="absolute w-full h-full rounded-full bg-black/60 blur-[1px] translate-y-[2.5px]" />
                              <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-yellow-600 to-yellow-900 border border-yellow-400/50 translate-y-[1.5px]" />
                              <div className="absolute w-[92%] h-[92%] rounded-full bg-stone-900 translate-y-[0.7px] border border-white/15" />
                              <div className="absolute w-[84%] h-[84%] rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 text-stone-950 text-[6.5px] md:text-[7.5px] font-black flex flex-col items-center justify-center border-2 border-dashed border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                <span className="text-[5.5px] font-sans font-extrabold leading-none opacity-85">₹</span>
                                <span className="leading-none font-bold">
                                  {bets[item.id] >= 1000 ? `${(bets[item.id]/1000).toFixed(0)}k` : bets[item.id]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* TOTAL BETS ACTIVE DISPLAY PANEL */}
            <div className="w-full flex items-center justify-between text-xs px-2 font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-extrabold uppercase text-[8.5px] tracking-wider">
                  Active Bets: {Object.keys(bets).filter(k => bets[k] > 0).length} spots
                </span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 uppercase tracking-widest text-[8.5px] font-black mr-2">TOTAL CHIPS LOCKED:</span>
                <span className="text-sm font-black text-[#ffd700] bg-black/60 px-3 py-1.5 rounded-xl border border-yellow-500/20 shadow-lg font-mono">
                  ₹{totalBetAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* CHIP SELECTOR & ACTIONS CONTROL TRAY */}
            <div className="w-full bg-gradient-to-b from-[#09152b] via-[#040c1a] to-[#02050b] border-2 border-[#ffd700]/15 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
              {/* Luxury Brass Divider highlights */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffd700]/30 to-transparent pointer-events-none" />

              {/* CHIP SELECTION CAROUSEL (Realistic poker notches) */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[8.5px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                  <span>VIP STAKE DENOMINATION RACK</span>
                  <span className="text-amber-400">ACTIVE: ₹{activeChip.toLocaleString('en-IN')}</span>
                </div>
                
                {/* Physical luxury wooden mahogany tray wrapper */}
                <div className="bg-gradient-to-r from-[#211208] via-[#3a1d0b] to-[#211208] p-3 rounded-2.5xl border border-[#ffd700]/20 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),_0_2px_4px_rgba(255,255,255,0.05)] flex items-center justify-center gap-3 md:gap-4 overflow-x-auto no-scrollbar">
                  {CHIP_VALUES.map((val) => {
                    const isSelected = activeChip === val;
                    const style = CHIP_COLORS[val];
                    return (
                      <button
                        key={val}
                        onClick={() => handleSelectPresetChip(val)}
                        className={`group flex flex-col items-center select-none cursor-pointer transition-all duration-300 relative ${
                          isSelected ? 'translate-y-[-6px] scale-110 z-10' : 'opacity-70 hover:opacity-100 hover:translate-y-[-2px]'
                        }`}
                        id={`chip-selector-${val}`}
                      >
                        {/* 3D stacked chips visual layer */}
                        <div className="relative w-11 h-11 md:w-12.5 md:h-12.5 flex items-center justify-center">
                          {/* Underneath shadows & stack illusion */}
                          <div className="absolute w-[95%] h-[95%] rounded-full bg-black/75 blur-[2.5px] translate-y-[4px] opacity-80" />
                          
                          {/* Stack Layer 1 (Bottom chip of rack) */}
                          <div className="absolute w-[98%] h-[98%] rounded-full bg-stone-900/60 border border-white/5 translate-y-[3px]" />
                          
                          {/* Stack Layer 2 (Middle chip of rack) */}
                          <div className="absolute w-[99%] h-[99%] rounded-full bg-stone-900/80 border border-white/10 translate-y-[1.5px]" />
                          
                          {/* Realistic Notched Casino Poker Chip Front Face */}
                          <div className={`w-full h-full rounded-full ${style.bg} ${style.accent} flex flex-col items-center justify-center border-2 border-dashed border-white shadow-xl hover:shadow-2xl relative transition-all`}>
                            {/* Inner gold circular ring detail */}
                            <div className="absolute inset-1.5 border border-black/15 rounded-full flex items-center justify-center bg-black/10">
                              <div className="w-full h-full rounded-full border border-white/15 flex flex-col items-center justify-center font-mono">
                                <span className="text-[6.5px] font-black leading-none uppercase tracking-tighter text-white/50">VIP</span>
                                <span className={`text-[9.5px] md:text-[11.5px] font-black leading-none font-mono ${style.text} drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]`}>
                                  {val >= 1000 ? `${(val/1000).toFixed(0)}K` : val}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Selected Glowing Golden Aura */}
                          {isSelected && (
                            <div className="absolute inset-[-4px] rounded-full ring-2 ring-amber-400 animate-pulse opacity-90 shadow-[0_0_12px_rgba(245,158,11,0.6)] pointer-events-none" />
                          )}
                        </div>
                        
                        {/* Denomination badge below physical rack */}
                        <span className={`text-[7.5px] font-mono font-black mt-1.5 px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-amber-400 text-stone-950 shadow' : 'bg-black/40 text-zinc-400'
                        }`}>
                          ₹{val >= 1000 ? `${val/1000}k` : val}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TACTILE TABLE CONTROL ACTION ROW */}
              <div className="grid grid-cols-4 gap-2 font-mono text-[9px] md:text-[10px]">
                
                {/* 1. UNDO LAST CHIP */}
                <button
                  onClick={handleUndoBet}
                  disabled={spinning || betHistory.length === 0}
                  className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-black/55 text-neutral-300 font-extrabold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 hover:bg-neutral-900 cursor-pointer transition-all"
                  id="action-undo-btn"
                >
                  <Undo className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">UNDO</span>
                </button>

                {/* 2. DOUBLE (2X) ALL ACTIVE BETS */}
                <button
                  onClick={handleDoubleBets}
                  disabled={spinning || totalBetAmount === 0}
                  className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-black/55 text-neutral-300 font-extrabold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 hover:bg-neutral-900 cursor-pointer transition-all"
                  id="action-double-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                  <span>2X BETS</span>
                </button>

                {/* 3. CLEAR ALL CHIPS */}
                <button
                  onClick={handleClearBets}
                  disabled={spinning || totalBetAmount === 0}
                  className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-black/55 text-neutral-300 font-extrabold hover:text-[#ff3b4d] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 hover:bg-red-950/20 cursor-pointer transition-all"
                  id="action-clear-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">CLEAR</span>
                </button>

                {/* 4. REALTIME HYPER-SPIN TRIGGER */}
                <button
                  onClick={executeSpin}
                  disabled={spinning || totalBetAmount === 0}
                  className={`py-2.5 px-3 rounded-xl font-extrabold tracking-widest transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 ${
                    spinning 
                      ? 'bg-neutral-800 text-neutral-500 border-none cursor-not-allowed animate-pulse' 
                      : totalBetAmount === 0 
                        ? 'bg-neutral-800/55 text-neutral-600 border border-white/5 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300 text-stone-950 hover:brightness-110 active:scale-[0.98]'
                  }`}
                  id="action-spin-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-stone-950" />
                  <span>{spinning ? 'SPINNING' : 'SPIN WHEEL'}</span>
                </button>

              </div>

            </div>

          </div>
        </div>

      </div>

      {/* 3. FOOTER PROVABLY FAIR SYSTEM DETAILS */}
      <footer className="bg-[#02050b] border-t border-white/10 px-4 py-2 text-center text-[8px] md:text-[9px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between shrink-0 font-mono">
        <span>TENZO SECURE TRUST ENGINE • GAME INSTANCE ID: #RWP_{Date.now().toString().slice(-6)}</span>
        <span className="flex items-center gap-1.5 text-emerald-500/80 mt-1 sm:mt-0 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PROVABLY FAIR SHA-256 ENCRYPTED TRANSACTION LEDGER
        </span>
      </footer>

      {/* 4. ROULETTE USER MANUAL MODAL */}
      <AnimatePresence>
        {showHowToPlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0b1224] rounded-2xl border border-yellow-500/35 shadow-2xl p-5 relative font-sans"
              id="how-to-play-modal"
            >
              <button 
                onClick={() => { playCustomClick(); setShowHowToPlay(false); }}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer border border-white/5 bg-black/45"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>

              <h3 className="font-display font-black text-base text-[#ffd700] uppercase tracking-wide mb-3 flex items-center gap-1.5 border-b border-[#ffd700]/15 pb-2">
                <Trophy className="w-5 h-5 text-amber-400" /> ROULETTE STAKE BOARD GUIDE
              </h3>

              <div className="space-y-4 text-xs text-neutral-300 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                <div className="space-y-1">
                  <p className="font-black text-[#ffd700] uppercase text-[10.5px]">🎮 HOW TO BET</p>
                  <p className="text-zinc-400 leading-relaxed">
                    European Roulette features 37 pockets (0 to 36). Place your chips on specific numbers, columns, color ranges (Red or Black), parity ranges (Even or Odd), or call bets, then trigger the 3D high-speed wheel!
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-black text-[#ffd700] uppercase text-[10.5px]">💰 MULTIPLIER PAYOUTS</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[10.5px]">
                    <li><strong className="text-white">Single Numbers (0-36):</strong> pays <strong className="text-[#ffd700]">35 to 1</strong> (36x return)</li>
                    <li><strong className="text-white">Red / Black:</strong> pays <strong className="text-[#ffd700]">1 to 1</strong> (2x return)</li>
                    <li><strong className="text-white">Even / Odd:</strong> pays <strong className="text-[#ffd700]">1 to 1</strong> (2x return)</li>
                    <li><strong className="text-white">Dozens (1st/2nd/3rd 12):</strong> pays <strong className="text-[#ffd700]">2 to 1</strong> (3x return)</li>
                    <li><strong className="text-white">Columns (1st/2nd/3rd):</strong> pays <strong className="text-[#ffd700]">2 to 1</strong> (3x return)</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="font-black text-[#ffd700] uppercase text-[10.5px]">⚡ LUXURY HIGHLIGHTS</p>
                  <p className="text-zinc-400 leading-relaxed">
                    Leverage luxury high-limit shortcuts like <strong className="text-white">Voisins du Zéro</strong> (Neighbours of Zero), <strong className="text-white">Tiers du Cylindre</strong>, or <strong className="text-white">Orphelins</strong>. Double wagers easily via the <strong className="text-white">2X button</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => { playCustomClick(); setShowHowToPlay(false); }}
                className="w-full mt-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-stone-950 font-sans text-xs font-black uppercase py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                ENTER HIGH-LIMIT SALON
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
