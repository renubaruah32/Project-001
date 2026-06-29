import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { Coins, HelpCircle, Gift, Sparkles, Trophy, Flame, ChevronRight, Share2, Timer } from 'lucide-react';

interface LuckyWheelTabProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
}

interface WheelSegment {
  label: string;
  value: number;
  type: 'cash' | 'bonus' | 'jackpot' | 'exp' | 'try_again';
  color: string;
}

export default function LuckyWheelTab({ user, onUpdateUser, onAddTransaction }: LuckyWheelTabProps) {
  const [spinning, setSpinning] = useState<boolean>(false);
  const [prizeResult, setPrizeResult] = useState<WheelSegment | null>(null);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [lastSpinTime, setLastSpinTime] = useState<number>(0);

  const segments: WheelSegment[] = [
    { label: '₹150 CASH', value: 150, type: 'cash', color: '#111111' },
    { label: '+25 VIP EXP', value: 25, type: 'exp', color: '#161616' },
    { label: '₹500 BONUS', value: 500, type: 'bonus', color: '#B4002C' },
    { label: 'TRY AGAIN', value: 0, type: 'try_again', color: '#050505' },
    { label: '₹1,000 CASH', value: 1000, type: 'cash', color: '#111111' },
    { label: '+50 VIP EXP', value: 50, type: 'exp', color: '#161616' },
    { label: 'MEGA ₹5,000', value: 5000, type: 'cash', color: '#FF2348' },
    { label: '₹200 BONUS', value: 200, type: 'bonus', color: '#B4002C' }
  ];

  const handleSpin = () => {
    if (spinning) return;

    // Daily limit check - can override for rich engagement! Or make it cost 500 INR to spin if they want to pay!
    const cooldownMs = 120000; // 2 minute cooldown in sandbox mode so they don't have to wait 24 hrs
    const now = Date.now();
    if (now - lastSpinTime < cooldownMs) {
      alert("Hold on high roller! Your Fortune Wheel is super-charging. Wait a short bit or invite 1 friend to bypass cooldown!");
      return;
    }

    setSpinning(true);
    setPrizeResult(null);

    // Pick a random segment (0 to 7)
    const luckyIndex = Math.floor(Math.random() * segments.length);
    const targetSegment = segments[luckyIndex];

    // Compute rotation angles
    // 360 degrees / 8 segments = 45 degrees per segment
    const segmentAngle = 45;
    // Align index correctly to top pointer (subtracting offset)
    const additionalAngle = 360 - (luckyIndex * segmentAngle) - (segmentAngle / 2);
    // Add multiple full turns
    const totalRotation = spinAngle + (360 * 7) + additionalAngle;

    setSpinAngle(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setPrizeResult(targetSegment);
      setLastSpinTime(now);

      // Distribute rewards state
      let updated = { ...user };
      let logsDesc = '';

      if (targetSegment.type === 'cash') {
        updated.walletBalance += targetSegment.value;
        logsDesc = `Won ₹${targetSegment.value} Cash on Fortune Wheel!`;
      } else if (targetSegment.type === 'bonus') {
        updated.bonusBalance += targetSegment.value;
        logsDesc = `Won ₹${targetSegment.value} Roll Bonus!`;
      } else if (targetSegment.type === 'exp') {
        updated.vipExp = Math.min(updated.vipExp + targetSegment.value, updated.vipExpMax);
        logsDesc = `Earned +${targetSegment.value} VIP Exp!`;
      } else {
        logsDesc = 'Tried the Fortune Wheel segmented spin.';
      }

      // Check level up conditions
      if (updated.vipExp >= updated.vipExpMax) {
        updated.vipLevel += 1;
        updated.vipExp = 0;
        updated.vipExpMax = Math.floor(updated.vipExpMax * 1.5);
      }

      onUpdateUser(updated);

      if (targetSegment.type !== 'try_again') {
        onAddTransaction({
          id: `wheel-${Date.now()}`,
          type: 'wheel_bonus',
          amount: targetSegment.value,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: logsDesc
        });
      }
    }, 4000);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      
      {/* Title block */}
      <div className="text-center space-y-1.5">
        <h2 className="font-sans font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF2348] to-[#B4002C] uppercase tracking-wider">
          Fortune Lucky Wheel
        </h2>
        <p className="text-xs text-[#FF2348] uppercase tracking-widest font-bold font-sans">
          VIP Reward multipliers
        </p>
      </div>

      {/* Main interactive spinner card */}
      <div className="glass-panel p-6 rounded-2xl border border-[#FF2348]/25 bg-[#161616] text-center space-y-6 relative overflow-hidden shadow-[0_0_20px_rgba(255,35,72,0.15)]">
        {/* Decorative ambient glimmers */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-[#FF2348]/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#FF2348]/10 rounded-full blur-2xl" />

        {/* Pin marker and outer border wheel container */}
        <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
          {/* Outer glowing red ring */}
          <div className="absolute inset-0 rounded-full border-4 border-[#FF2348] shadow-[0_0_20px_rgba(255,35,72,0.35)] animate-pulse" />

          {/* Pointer pin */}
          <div className="absolute top-0 z-20 -mt-2">
            <div className="w-5 h-7 bg-[#FF2348] rounded-b-full border-2 border-white flex items-center justify-center shadow-lg" />
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black mx-auto mt-0.5" />
          </div>

          {/* Canvas or segment simulation */}
          <motion.div
            style={{ rotate: spinAngle }}
            transition={spinning ? { duration: 4, ease: 'easeOut' } : { duration: 0 }}
            className="w-64 h-64 rounded-full overflow-hidden relative border-2 border-white/10"
          >
            {/* Simple Segment representations */}
            {segments.map((seg, idx) => {
              const rotation = idx * 45;
              return (
                <div
                  key={idx}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    backgroundColor: seg.color,
                    clipPath: 'polygon(50% 50%, 0% 0%, 42% 0%)',
                    transformOrigin: '50% 50%',
                  }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center select-none"
                >
                  <p 
                    style={{ transform: 'rotate(22deg) translateY(-85px)' }}
                    className={`text-[9px] font-extrabold tracking-widest leading-none font-sans uppercase max-w-[50px] ${seg.color === '#FF2348' ? 'text-black' : 'text-white'}`}
                  >
                    {seg.label}
                  </p>
                </div>
              );
            })}

            {/* Central glowing cap */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2348] to-[#B4002C] glow-red shadow-[0_0_20px_#FF2348] border-2 border-black flex items-center justify-center relative">
              <span className="w-4 h-4 rounded-full bg-white animate-ping" />
            </div>
          </motion.div>
        </div>

        {/* Action button */}
        <div className="space-y-3">
          <button
            disabled={spinning}
            onClick={handleSpin}
            className={`w-full py-4 text-center text-sm font-extrabold uppercase rounded-xl text-white select-none cursor-pointer transition-all duration-300 ${
              spinning ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed border-none' : 'bg-gradient-to-r from-[#FF2348] to-[#ff3b5c] hover:brightness-110 active:scale-[0.98] border-t border-white/25 border-b-2 border-[#B4002C] shadow-[0_0_25px_rgba(255,35,72,0.7),_0_0_8px_#FF2348] font-black hover:shadow-[0_0_35px_rgba(255,35,72,0.9),_0_0_12px_#FF2348]'
            }`}
          >
            {spinning ? 'Super-charging Wheel...' : 'CLAIM FREE DAILY SPIN NOW'}
          </button>

          <div className="text-[10px] text-white/50 flex items-center justify-center gap-1 font-sans">
            <Timer className="w-3.5 h-3.5 text-[#FF2348]" />
            <span>Resets every hour during development sandbox run!</span>
          </div>
        </div>
      </div>

      {/* Congratulations Pop Up inside page */}
      <AnimatePresence>
        {prizeResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#161616]/90 border border-[#FF2348]/35 p-5 rounded-2xl text-center space-y-2 shadow-[0_0_20px_rgba(255,35,72,0.3)]"
          >
            <div className="flex justify-center text-[#FF2348]">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-sans font-black text-white text-base uppercase">
              Payout Received!
            </h3>
            <p className="text-[#FF2348] font-bold text-md font-sans">
              {prizeResult.type === 'try_again' 
                ? 'Zero loss outcome. Gain 1 VIP ticket on next roll!' 
                : `+${prizeResult.label} credited`
              }
            </p>
            <p className="text-[10px] text-white/60 font-sans">
              Increase your VIP rank to unlock gold booster multiplier payouts up to x10!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
