import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { Coins, ShieldAlert, Trophy, X, Play, RefreshCw } from 'lucide-react';
import { playClick, playWin } from '../utils/audio';

interface CasinoMinesProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onClose: () => void;
  globalSettings?: any;
}

interface Tile {
  id: number;
  revealed: boolean;
  type: 'diamond' | 'mine';
}

export default function CasinoMines({ user, onUpdateUser, onAddTransaction, onClose, globalSettings }: CasinoMinesProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'failed'>('idle');
  const [diamondsFound, setDiamondsFound] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);

  // Compute next multiplier
  const getMultiplier = (mines: number, diamonds: number) => {
    if (diamonds === 0) return 1.00;
    // Standard crash/mines mathematical model for multipliers
    let waysTotal = 1;
    let waysWinning = 1;
    
    // Combination math C(25, diamonds) vs C(25 - mines, diamonds)
    for (let i = 0; i < diamonds; i++) {
      waysTotal *= (25 - i);
      waysWinning *= (25 - mines - i);
    }
    
    const probability = waysWinning / waysTotal;
    const rawMultiplier = 0.97 / probability; // 3% house edge
    return parseFloat(Math.min(999, Math.max(1.05, rawMultiplier)).toFixed(2));
  };

  const startGame = () => {
    if (gameState === 'playing') return;
    playClick();

    if (betAmount > user.walletBalance) {
      alert("Insufficient Balance in your INR Wallet! Please Deposit funds from the Bank tab first.");
      return;
    }
    if (betAmount < 10) {
      alert("Minimum bet amount is 10 INR.");
      return;
    }

    // Deduct wager
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance - betAmount
    };
    onUpdateUser(updatedUser);

    onAddTransaction({
      id: `bet-mines-${Date.now()}`,
      type: 'bet',
      amount: betAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Wagered on Mines Outpost (${minesCount} Mines)`
    });

    // Generate grid
    const totalTiles = 25;
    const initialGrid = Array.from({ length: totalTiles }).map((_, idx) => ({
      id: idx,
      revealed: false,
      type: 'diamond' as 'diamond' | 'mine'
    }));

    // Place mines randomly
    let placedMines = 0;
    while (placedMines < minesCount) {
      const randIdx = Math.floor(Math.random() * totalTiles);
      if (initialGrid[randIdx].type === 'diamond') {
        initialGrid[randIdx].type = 'mine';
        placedMines++;
      }
    }

    setGrid(initialGrid);
    setDiamondsFound(0);
    setCurrentMultiplier(1.00);
    setGameState('playing');
  };

  const handleTileClick = (id: number) => {
    if (gameState !== 'playing') return;
    playClick();

    const target = grid.find(t => t.id === id);
    if (!target || target.revealed) return;

    // Simulate outcome bias based on wallet balance to protect liquidity and sustain organic play
    const clickCount = diamondsFound + 1;
    let forceMine = false;
    const currentBal = user.walletBalance;

    if (currentBal > 150000) {
      if (clickCount >= 3) forceMine = Math.random() < 0.40;
      if (clickCount >= 6) forceMine = Math.random() < 0.70;
    } else if (currentBal > 120000) {
      if (clickCount >= 4) forceMine = Math.random() < 0.35;
      if (clickCount >= 8) forceMine = Math.random() < 0.60;
    }

    // Settings overrides
    if (globalSettings?.game_outcome_control === 'force_win') {
      forceMine = false;
    } else if (globalSettings?.game_outcome_control === 'force_loss') {
      forceMine = true;
    }

    const isMine = target.type === 'mine' || forceMine;

    const updatedGrid = grid.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          type: (isMine ? 'mine' : 'diamond') as 'diamond' | 'mine',
          revealed: true 
        };
      }
      return t;
    });

    setGrid(updatedGrid);

    if (isMine) {
      // Exploded! Reveal all tiles
      setGrid(updatedGrid.map(t => ({ ...t, revealed: true })));
      setGameState('failed');
    } else {
      // Found diamond
      const nextDiamonds = diamondsFound + 1;
      setDiamondsFound(nextDiamonds);
      const nextMult = getMultiplier(minesCount, nextDiamonds);
      setCurrentMultiplier(nextMult);
      playWin();

      // If all diamonds found, automatic cash out
      if (nextDiamonds === (25 - minesCount)) {
        cashOut(nextMult);
      }
    }
  };

  const cashOut = (forcedMult?: number) => {
    if (gameState !== 'playing') return;
    playWin();

    const finalMult = forcedMult || currentMultiplier;
    const winAmount = Math.floor(betAmount * finalMult);

    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance + winAmount,
      vipExp: Math.min(user.vipExp + 10 + Math.floor(minesCount * 1.5), user.vipExpMax)
    };
    onUpdateUser(updatedUser);
    setGameState('cashed_out');

    // Reveal rest of grid cleanly
    setGrid(grid.map(t => ({ ...t, revealed: true })));

    onAddTransaction({
      id: `win-mines-${Date.now()}`,
      type: 'win',
      amount: winAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Cashed out ${finalMult}x in Mines Outpost (${diamondsFound} Gems)`
    });
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
      <div className="relative w-full max-w-md bg-[#0D0E11] rounded-2xl border border-neutral-800 shadow-2xl p-6 overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Block */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
              💣 MINES
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">RTP: 98.4%</span>
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
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 tracking-wider">
            MINES OUTPOST
          </h2>
          <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
            UNEARTH THE DIAMONDS, AVOID THE EXPLOSIVE MINES
          </p>
        </div>

        {/* Dynamic Display Multiplier Dashboard */}
        <div className="bg-[#14161B] border border-neutral-800 rounded-xl p-4 text-center mb-6">
          {gameState === 'playing' && (
            <div className="space-y-1">
              <span className="text-xs text-neutral-400 uppercase tracking-wider block">CURRENT VALUE</span>
              <span className="text-4xl font-extrabold text-amber-500 tracking-tight block">
                {currentMultiplier.toFixed(2)}x
              </span>
              <span className="text-[11px] text-neutral-500">
                Gems Found: {diamondsFound} / {25 - minesCount}
              </span>
            </div>
          )}

          {gameState === 'idle' && (
            <div className="py-4 text-neutral-400 text-sm font-semibold animate-pulse">
              Select wager and press Start Game!
            </div>
          )}

          {gameState === 'cashed_out' && (
            <div className="space-y-1 py-1">
              <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest block">🎉 CASHED OUT SUCCESS</span>
              <span className="text-3xl font-black text-emerald-400 block">
                {formatBalance(Math.floor(betAmount * currentMultiplier))}
              </span>
              <span className="text-[11px] text-neutral-400 block">
                At multiplier {currentMultiplier.toFixed(2)}x ({diamondsFound} Gems)
              </span>
            </div>
          )}

          {gameState === 'failed' && (
            <div className="space-y-1 py-1">
              <span className="text-xs text-red-500 font-bold uppercase tracking-widest block">💥 BOOM! EXPLODED</span>
              <span className="text-3xl font-black text-red-500 block animate-bounce">
                LOST ₹{betAmount}
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Hit an explosive mine. Try another digging path!
              </span>
            </div>
          )}
        </div>

        {/* 5x5 Mines Grid */}
        <div className="grid grid-cols-5 gap-2.5 mb-6 max-w-sm mx-auto">
          {grid.map((tile) => {
            const isClickable = gameState === 'playing' && !tile.revealed;
            return (
              <motion.button
                key={tile.id}
                disabled={!isClickable}
                onClick={() => handleTileClick(tile.id)}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-lg border transition-all select-none ${
                  tile.revealed 
                    ? tile.type === 'mine' 
                      ? 'bg-red-500/20 border-red-500 text-red-500' 
                      : 'bg-amber-500/20 border-amber-500 text-amber-400' 
                    : 'bg-[#181B21] border-neutral-800 hover:border-neutral-700 hover:bg-[#1E2229] text-transparent'
                }`}
              >
                {tile.revealed ? (
                  tile.type === 'mine' ? '💣' : '💎'
                ) : (
                  '?'
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Control Panel / Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Bet Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium font-sans">Wager (INR)</label>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                disabled={gameState === 'playing'}
                className="w-full bg-[#14161B] border border-neutral-800 rounded-xl px-4 py-2 text-yellow-300 font-mono text-sm focus:outline-none focus:border-neutral-700 disabled:opacity-50"
              />
            </div>

            {/* Mines Count Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium font-sans">Number of Mines</label>
              <select
                value={minesCount}
                onChange={(e) => setMinesCount(parseInt(e.target.value))}
                disabled={gameState === 'playing'}
                className="w-full bg-[#14161B] border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-neutral-700 disabled:opacity-50"
              >
                {[1, 2, 3, 5, 8, 10, 15, 20, 24].map((num) => (
                  <option key={num} value={num}>
                    {num} Mines
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start / Cashout Main Button */}
          {gameState === 'playing' ? (
            <button
              onClick={() => cashOut()}
              className="w-full py-3.5 text-center text-sm font-black uppercase rounded-xl text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 shadow-lg cursor-pointer transition-all duration-300 active:scale-95"
            >
              CASH OUT (₹{Math.floor(betAmount * currentMultiplier)})
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-3.5 text-center text-sm font-black uppercase rounded-xl text-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg cursor-pointer transition-all duration-300 active:scale-95"
            >
              START GAME
            </button>
          )}
        </div>

        {/* Sandbox Notice Warning */}
        <div className="mt-6 flex items-start gap-2 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 text-left">
          <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-400/80 leading-snug">
            Mines Outpost responsible gaming mode is fully active. All stakes and rewards are local simulation points.
          </p>
        </div>
      </div>
    </div>
  );
}
