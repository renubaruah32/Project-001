import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { Coins, ShieldAlert, Trophy, X, Play, RefreshCw, Sparkles } from 'lucide-react';
import { playClick, playWin } from '../utils/audio';

interface CasinoPlinkoProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onClose: () => void;
  globalSettings?: any;
}

interface ActiveBall {
  id: number;
  progress: number; // 0 to rows
  col: number;      // Current column position
  x: number;        // Current visual X px
  y: number;        // Current visual Y px
  path: { x: number; y: number }[]; // Coordinates along its bounce journey
  risk: 'low' | 'medium' | 'high';
  bet: number;
}

export default function CasinoPlinko({ user, onUpdateUser, onAddTransaction, onClose, globalSettings }: CasinoPlinkoProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [balls, setBalls] = useState<ActiveBall[]>([]);
  const [dropping, setDropping] = useState<boolean>(false);
  const [history, setHistory] = useState<number[]>([]);
  const ballCounter = useRef<number>(0);

  const ROWS = 8; // Number of peg rows

  // Multiplier Buckets based on Risk Level
  const getBuckets = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return [3.0, 1.6, 1.1, 0.7, 0.5, 0.7, 1.1, 1.6, 3.0];
      case 'high':
        return [25.0, 4.0, 1.5, 0.3, 0.1, 0.3, 1.5, 4.0, 25.0];
      case 'medium':
      default:
        return [10.0, 2.5, 1.2, 0.6, 0.3, 0.6, 1.2, 2.5, 10.0];
    }
  };

  // Generate Plinko ball fall path coordinates
  const simulatePath = (risk: 'low' | 'medium' | 'high') => {
    const path: { x: number; y: number }[] = [];
    let col = 0; // Starts centered

    // Top starting coordinate
    const width = 320;
    const height = 300;
    const rowHeight = height / (ROWS + 1.5);
    const startX = width / 2;
    const startY = 15;

    path.push({ x: startX, y: startY });

    // Step through rows
    for (let r = 1; r <= ROWS; r++) {
      // Random decision: move left or right (-0.5 or +0.5 relative column)
      const moveRight = Math.random() > 0.5;
      col = col + (moveRight ? 0.5 : -0.5);

      // Map column & row to actual SVG pixel offsets
      const rowWidth = (r + 2) * 24;
      const xOffset = startX + (col * 24);
      const yOffset = startY + (r * rowHeight);

      path.push({ x: xOffset, y: yOffset });
    }

    // Map to final bucket landing column index
    // col spans from -ROWS/2 (leftmost) to +ROWS/2 (rightmost) in 1.0 increments
    // Map this to bucket indexes 0 to 8
    const finalBucketIndex = Math.min(8, Math.max(0, Math.floor(col + ROWS / 2)));

    return { path, finalBucketIndex };
  };

  const dropBall = () => {
    playClick();

    if (betAmount > user.walletBalance) {
      alert("Insufficient Balance in your INR Wallet! Please Deposit funds from the Bank tab first.");
      return;
    }
    if (betAmount < 10) {
      alert("Minimum bet amount is 10 INR.");
      return;
    }

    // Deduct wager instantly
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance - betAmount
    };
    onUpdateUser(updatedUser);

    onAddTransaction({
      id: `bet-plinko-${Date.now()}`,
      type: 'bet',
      amount: betAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Dropped Plinko Ball (${riskLevel.toUpperCase()} Risk)`
    });

    // Simulate complete trajectory
    const { path, finalBucketIndex } = simulatePath(riskLevel);
    const buckets = getBuckets(riskLevel);
    const multiplier = buckets[finalBucketIndex];

    const newBallId = ballCounter.current++;
    const newBall: ActiveBall = {
      id: newBallId,
      progress: 0,
      col: 0,
      x: path[0].x,
      y: path[0].y,
      path,
      risk: riskLevel,
      bet: betAmount
    };

    setBalls(prev => [...prev, newBall]);
    setDropping(true);

    // Animate the ball step-by-step
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < path.length) {
        setBalls(prev => 
          prev.map(b => b.id === newBallId ? { ...b, progress: currentStep, x: path[currentStep].x, y: path[currentStep].y } : b)
        );
      } else {
        clearInterval(interval);
        // Landed! Remove ball and process payout
        setBalls(prev => prev.filter(b => b.id !== newBallId));
        if (balls.length <= 1) setDropping(false);

        // Sound celebration
        if (multiplier >= 1) playWin();

        const winAmount = Math.floor(betAmount * multiplier);
        const winUser = {
          ...user,
          walletBalance: user.walletBalance + winAmount,
          vipExp: Math.min(user.vipExp + 5 + Math.floor(multiplier * 0.5), user.vipExpMax)
        };
        onUpdateUser(winUser);

        setHistory(prev => [multiplier, ...prev.slice(0, 7)]);

        onAddTransaction({
          id: `win-plinko-${Date.now()}`,
          type: 'win',
          amount: winAmount,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Plinko landed in ${multiplier}x bucket (${riskLevel.toUpperCase()})`
        });
      }
    }, 280);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const buckets = getBuckets(riskLevel);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-md bg-[#0F0A15] rounded-2xl border border-purple-500/20 shadow-2xl p-6 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Block */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              🎯 PLINKO STRIKE
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">RTP: 99.1%</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Block */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 tracking-wider">
            PLINKO STRIKE
          </h2>
          <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
            BOUNCE THE SPHERES DOWN THE NEON PEGBOARD
          </p>
        </div>

        {/* Interactive Physics Board Canvas/SVG Area */}
        <div className="relative bg-slate-950/70 border border-purple-500/15 rounded-2xl p-4 overflow-hidden mb-6 flex flex-col items-center">
          
          {/* History Ticker Overlay */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {history.map((h, i) => (
              <span 
                key={i} 
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  h >= 2 ? 'bg-emerald-500 text-black' : h >= 1 ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {h}x
              </span>
            ))}
          </div>

          <svg className="w-[320px] h-[300px]" viewBox="0 0 320 300">
            {/* Draw Rows of Pegs */}
            {Array.from({ length: ROWS }).map((_, r) => {
              const rowNum = r + 1;
              const pegCount = rowNum + 2; // Rows starts with 3 pegs, then 4, etc
              const startX = 320 / 2;
              const yOffset = 15 + rowNum * (300 / (ROWS + 1.5));
              
              return (
                <g key={r}>
                  {Array.from({ length: pegCount }).map((_, p) => {
                    const offsetCol = p - (pegCount - 1) / 2;
                    const xOffset = startX + offsetCol * 24;
                    return (
                      <circle 
                        key={p} 
                        cx={xOffset} 
                        cy={yOffset} 
                        r="3.5" 
                        fill="#A855F7" 
                        className="opacity-70 fill-purple-400 shadow-[0_0_8px_#A855F7]"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Render Dropping Balls */}
            <AnimatePresence>
              {balls.map((ball) => (
                <motion.circle
                  key={ball.id}
                  cx={ball.x}
                  cy={ball.y}
                  r="7"
                  fill="#EC4899"
                  className="fill-pink-500 filter drop-shadow-[0_0_6px_#EC4899]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </AnimatePresence>
          </svg>

          {/* Multiplier buckets visually aligned at the bottom */}
          <div className="w-full grid grid-cols-9 gap-1 px-1">
            {buckets.map((mult, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={idx} 
                  className={`py-1.5 rounded text-center border font-mono select-none ${
                    mult >= 10 
                      ? 'bg-red-500/20 border-red-500 text-red-400 font-extrabold text-[10px]' 
                      : mult >= 2 
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold text-[9px]' 
                        : mult >= 1 
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 text-[8px]' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 text-[8px]'
                  }`}
                >
                  {mult}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls block */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Wager Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Wager (INR)</label>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-[#161220] border border-purple-500/10 rounded-xl px-4 py-2 text-yellow-300 font-mono text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>

            {/* Risk Selection */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Risk Intensity</label>
              <div className="grid grid-cols-3 gap-1 bg-[#161220] border border-purple-500/10 rounded-xl p-1">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRiskLevel(level)}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      riskLevel === level 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Sphere button */}
          <button
            onClick={dropBall}
            className="w-full py-3.5 text-center text-sm font-black uppercase rounded-xl text-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-90 transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
          >
            LAUNCH NEON SPHERE
          </button>
        </div>

        {/* Footer Warning notice */}
        <div className="mt-6 flex items-start gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 text-left">
          <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-400/80 leading-snug">
            Plinko Strike operates in local compliance mode. All cash values displayed are digital simulation score counters only.
          </p>
        </div>
      </div>
    </div>
  );
}
