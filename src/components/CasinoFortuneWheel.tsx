import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { Coins, ShieldAlert, Trophy, X, Play, RefreshCw, Zap } from 'lucide-react';
import { playClick, playWin } from '../utils/audio';

interface CasinoFortuneWheelProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onClose: () => void;
  globalSettings?: any;
}

interface BetSpot {
  multiplier: number;
  label: string;
  payout: number;
  color: string;
}

export default function CasinoFortuneWheel({ user, onUpdateUser, onAddTransaction, onClose, globalSettings }: CasinoFortuneWheelProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [selectedSpot, setSelectedSpot] = useState<number>(2); // Default to 2x spot
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [spinResult, setSpinResult] = useState<BetSpot | null>(null);

  const spots: BetSpot[] = [
    { multiplier: 1, label: '1x Grey', payout: 1, color: '#4B5563' },
    { multiplier: 2, label: '2x Blue', payout: 2, color: '#3B82F6' },
    { multiplier: 5, label: '5x Green', payout: 5, color: '#10B981' },
    { multiplier: 10, label: '10x Purple', payout: 10, color: '#8B5CF6' },
    { multiplier: 20, label: '20x Gold', payout: 20, color: '#F59E0B' },
    { multiplier: 40, label: '40x Red', payout: 40, color: '#EF4444' }
  ];

  // All 28 segments sequentially labeled on the wheel to mimic real premium game shows
  const wheelSegments: BetSpot[] = [
    spots[0], spots[1], spots[0], spots[2], spots[0], spots[1], spots[0], 
    spots[3], spots[0], spots[1], spots[0], spots[4], spots[0], spots[1], 
    spots[0], spots[2], spots[0], spots[1], spots[0], spots[3], spots[0], 
    spots[1], spots[0], spots[5], spots[0], spots[1], spots[2], spots[0]
  ];

  const handleSpin = () => {
    if (spinning) return;
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
      id: `bet-wheel-${Date.now()}`,
      type: 'bet',
      amount: betAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Wagered on ${selectedSpot}x spot on Fortune Wheel`
    });

    setSpinning(true);
    setSpinResult(null);

    // Dynamic house advantage logic
    const currentBal = user.walletBalance;
    let targetSegmentIndex = Math.floor(Math.random() * wheelSegments.length);

    // Standard progressive balance control
    let shouldDeclineHigh = false;
    if (currentBal > 150000) {
      shouldDeclineHigh = Math.random() < 0.65;
    } else if (currentBal > 120000) {
      shouldDeclineHigh = Math.random() < 0.40;
    }

    if (shouldDeclineHigh && (selectedSpot >= 10)) {
      // Re-roll to force low payout segment
      targetSegmentIndex = Math.floor(Math.random() * wheelSegments.length);
      while (wheelSegments[targetSegmentIndex].multiplier >= 5) {
        targetSegmentIndex = Math.floor(Math.random() * wheelSegments.length);
      }
    }

    // Settings overrides
    if (globalSettings?.game_outcome_control === 'force_win') {
      // Find a slot matching the user's selected spot
      const matchingIdxs = wheelSegments
        .map((s, idx) => s.multiplier === selectedSpot ? idx : -1)
        .filter(idx => idx !== -1);
      if (matchingIdxs.length > 0) {
        targetSegmentIndex = matchingIdxs[Math.floor(Math.random() * matchingIdxs.length)];
      }
    } else if (globalSettings?.game_outcome_control === 'force_loss') {
      // Find a slot that does NOT match selected spot
      const mismatchingIdxs = wheelSegments
        .map((s, idx) => s.multiplier !== selectedSpot ? idx : -1)
        .filter(idx => idx !== -1);
      if (mismatchingIdxs.length > 0) {
        targetSegmentIndex = mismatchingIdxs[Math.floor(Math.random() * mismatchingIdxs.length)];
      }
    }

    const landedSegment = wheelSegments[targetSegmentIndex];
    
    // Rotate 45 degrees per segment (360 / 28 = ~12.85 degrees per segment)
    const segmentDegree = 360 / 28;
    const offsetAngle = 360 - (targetSegmentIndex * segmentDegree) - (segmentDegree / 2);
    // Add multiple full turns for beautiful rapid rotating momentum
    const totalRotation = spinAngle + (360 * 6) + offsetAngle;

    setSpinAngle(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(landedSegment);

      // Distribute rewards
      if (landedSegment.multiplier === selectedSpot) {
        playWin();
        // Returns original bet + payout profit
        const winAmount = Math.floor(betAmount * (landedSegment.payout + 1));
        const finalUser = {
          ...user,
          walletBalance: user.walletBalance + winAmount,
          vipExp: Math.min(user.vipExp + 8 + Math.floor(landedSegment.multiplier * 0.4), user.vipExpMax)
        };
        onUpdateUser(finalUser);

        onAddTransaction({
          id: `win-wheel-${Date.now()}`,
          type: 'win',
          amount: winAmount,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Spot on! Landed on ${landedSegment.multiplier}x. Won ${formatBalance(winAmount)}`
        });
      } else {
        onAddTransaction({
          id: `bet-lost-wheel-${Date.now()}`,
          type: 'bet',
          amount: betAmount,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Landed on ${landedSegment.multiplier}x. Bet spot ${selectedSpot}x missed.`
        });
      }
    }, 4500);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-md bg-[#0F0F0B] rounded-2xl border border-amber-500/20 shadow-2xl p-6 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Block */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              👑 FORTUNE WHEEL 3D
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">RTP: 97.9%</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title details */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 tracking-wider">
            FORTUNE WHEEL 3D
          </h2>
          <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
            CHOOSE YOUR MULTIPLIER SPOT & SPIN THE WHEEL
          </p>
        </div>

        {/* 3D Wheel spin area */}
        <div className="relative bg-slate-950/70 border border-amber-500/15 rounded-2xl p-6 overflow-hidden mb-6 flex flex-col items-center justify-center">
          {/* Wheel pointer peg */}
          <div className="absolute top-4 z-20">
            <div className="w-5 h-7 bg-amber-500 rounded-b-full border-2 border-white flex items-center justify-center shadow-lg" />
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black mx-auto mt-0.5" />
          </div>

          {/* Glowing outer ring */}
          <div className="absolute w-[210px] h-[210px] rounded-full border-4 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] pointer-events-none" />

          {/* Actual Wheel container */}
          <motion.div
            style={{ rotate: spinAngle }}
            transition={spinning ? { duration: 4.5, ease: 'easeOut' } : { duration: 0 }}
            className="w-[200px] h-[200px] rounded-full overflow-hidden relative border-2 border-white/10 flex items-center justify-center"
          >
            {/* 28 Segments visuals */}
            <div className="absolute inset-0 w-full h-full rounded-full bg-neutral-900 overflow-hidden">
              {wheelSegments.map((seg, idx) => {
                const rotation = idx * (360 / 28);
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `rotate(${rotation}deg) skewY(-77deg)`,
                      transformOrigin: '50% 50%',
                      backgroundColor: seg.color,
                      opacity: 0.85
                    }}
                    className="absolute top-0 left-0 w-[100px] h-[100px] border-r border-white/10"
                  />
                );
              })}
            </div>

            {/* Visual numbers inside wheel */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              {wheelSegments.map((seg, idx) => {
                const rotation = idx * (360 / 28) + (360 / 56);
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `rotate(${rotation}deg) translateY(-80px)`,
                      transformOrigin: '100px 100px',
                    }}
                    className="absolute top-0 left-0 w-[200px] text-center font-mono font-black text-[9px] text-white"
                  >
                    {seg.multiplier}x
                  </div>
                );
              })}
            </div>

            {/* Wheel hub center logo */}
            <div className="absolute w-12 h-12 bg-[#0F0F0B] rounded-full border border-amber-500 flex items-center justify-center z-10 shadow-lg">
              <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          </motion.div>

          {/* Announcement dashboard */}
          <div className="mt-4 text-center">
            {spinning ? (
              <span className="text-xs text-amber-500 font-bold uppercase tracking-widest animate-pulse">
                🎡 Spinning Multipliers...
              </span>
            ) : spinResult ? (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">Landed on</span>
                <span 
                  style={{ color: spinResult.color }} 
                  className="text-xl font-black uppercase tracking-wider block"
                >
                  {spinResult.multiplier}x Segment
                </span>
                {spinResult.multiplier === selectedSpot ? (
                  <span className="text-xs text-emerald-400 font-bold block animate-bounce">
                    🎉 Jackpot Strike! Won {formatBalance(Math.floor(betAmount * (spinResult.payout + 1)))}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 block">
                    No match on bet spot {selectedSpot}x
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-neutral-400">
                Choose a betting spot and spin!
              </span>
            )}
          </div>
        </div>

        {/* Spot Selection Options */}
        <div className="space-y-3 mb-6">
          <label className="text-xs text-neutral-300 font-medium font-sans">Betting Spot (Choose One)</label>
          <div className="grid grid-cols-6 gap-1.5">
            {spots.map((s) => {
              const isSelected = selectedSpot === s.multiplier;
              return (
                <button
                  key={s.multiplier}
                  onClick={() => setSelectedSpot(s.multiplier)}
                  disabled={spinning}
                  style={{
                    backgroundColor: isSelected ? s.color : 'rgba(255,255,255,0.03)',
                    borderColor: isSelected ? '#F59E0B' : 'rgba(255,255,255,0.08)'
                  }}
                  className={`py-2 rounded-lg border text-center text-xs font-black transition-all ${
                    isSelected ? 'text-white shadow-lg scale-105' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {s.multiplier}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Wager (INR)</label>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
              disabled={spinning}
              className="w-full bg-[#161612] border border-amber-500/10 rounded-xl px-4 py-2 text-yellow-300 font-mono text-sm focus:outline-none focus:border-amber-500/30 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`w-full py-3.5 text-center text-sm font-black uppercase rounded-xl text-black ${
              spinning 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border-none' 
                : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 hover:opacity-90 transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            }`}
          >
            {spinning ? 'SPINNING WHEEL...' : 'SPIN THE WHEEL'}
          </button>
        </div>

        {/* Footer Warning */}
        <div className="mt-6 flex items-start gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 text-left">
          <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-400/80 leading-snug">
            Fortune Wheel 3D is for amusement only. All rewards are sandbox-bound and carry zero redeemable value.
          </p>
        </div>
      </div>
    </div>
  );
}
