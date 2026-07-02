import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { 
  Coins, Flame, Trophy, Play, Check, X, ShieldAlert, Sparkles, Zap, HelpCircle,
  Volume2, VolumeX, History, TrendingUp, Clock, Info
} from 'lucide-react';

// --- GAME CONFIG & CONSTANTS ---
const VIRTUAL_WIDTH = 500;
const VIRTUAL_HEIGHT = 500;

const MULTIPLIERS = {
  easy: [1.10, 1.22, 1.35, 1.50, 1.66, 1.84, 2.04, 2.26, 2.50, 2.80],
  medium: [1.20, 1.44, 1.72, 2.07, 2.48, 2.98, 3.58, 4.30, 5.16, 6.20],
  hard: [1.35, 1.82, 2.46, 3.32, 4.48, 6.05, 8.17, 11.03, 14.89, 20.10],
  hardcore: [1.50, 2.25, 3.38, 5.06, 7.59, 11.39, 17.09, 25.63, 38.44, 57.66]
};

const getMultiplier = (lane: number, diff: 'easy' | 'medium' | 'hard' | 'hardcore'): number => {
  if (lane <= 0) return 0;
  const idx = Math.min(lane - 1, 9);
  return MULTIPLIERS[diff][idx];
};

const MIN_BET = 3;
const MAX_BET = 50000;

interface CrossfireChickenProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onClose: () => void;
  globalSettings?: any;
}

// Sound preferences and high-fidelity Web Audio Synthesizer
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private bgmOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmInterval: any = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    this.isMuted = localStorage.getItem('crossfire_chicken_muted') === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('crossfire_chicken_muted', muted ? 'true' : 'false');
    if (muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public getMute() {
    return this.isMuted;
  }

  public playHop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Clean pop slide: 200Hz up to 550Hz
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.12);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  public playCrash() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Noise generator for explosion
      const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Add a low bass thumposcillator as well
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);

      oscGain.gain.setValueAtTime(0.25 * this.volume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      noise.start(now);
      osc.start(now);
      noise.stop(now + 0.4);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  public playCollect() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio

      notes.forEach((freq, idx) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        const delay = idx * 0.05;

        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + delay);

        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(0.08 * this.volume, now + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);

        o.connect(g);
        g.connect(this.ctx!.destination);

        o.start(now + delay);
        o.stop(now + delay + 0.3);
      });
    } catch (e) {}
  }

  public playWin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Golden victory chord
      const chords = [523.25, 659.25, 783.99, 987.77, 1318.51]; // Cmaj9

      chords.forEach((freq, idx) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now);
        o.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.5);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.06 * this.volume, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        o.connect(g);
        g.connect(this.ctx!.destination);

        o.start(now);
        o.stop(now + 0.75);
      });
    } catch (e) {}
  }

  public startBGM() {
    if (this.isMuted) return;
    this.stopBGM();
    try {
      this.initCtx();
      if (!this.ctx) return;

      let beat = 0;
      const bassline = [110, 110, 130, 110, 146, 146, 165, 146]; // Bass notes loop (Hz)
      const melody = [220, 261, 293, 329, 392, 329, 293, 220];

      const playStep = () => {
        try {
          if (this.isMuted || !this.ctx) return;
          const now = this.ctx.currentTime;

          // Bass thump
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassline[beat % bassline.length] / 2, now);
          bassGain.gain.setValueAtTime(0.06 * this.volume, now);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.4);

          // Rhythmic lead synth on steps
          if (beat % 2 === 0) {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = 'sine';
            leadOsc.frequency.setValueAtTime(melody[Math.floor(beat / 2) % melody.length], now);
            leadGain.gain.setValueAtTime(0.02 * this.volume, now);
            leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

            leadOsc.connect(leadGain);
            leadGain.connect(this.ctx.destination);
            leadOsc.start(now);
            leadOsc.stop(now + 0.25);
          }

          beat++;
        } catch (innerErr) {}
      };

      playStep();
      this.bgmInterval = setInterval(playStep, 350); // Chill steady pace
    } catch (e) {}
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// Instantiated globally or initialized lazily
const sound = new SoundSynthesizer();

interface Vehicle {
  x: number;
  y: number;
  lane: number;
  type: 'scooter' | 'car' | 'police' | 'bus' | 'truck';
  speed: number;
  width: number;
  height: number;
  color: string;
  bounceOffset: number;
  direction: 1 | -1; // 1 = down, -1 = up
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  type: 'star' | 'dust' | 'explosion';
}

export default function CrossfireChicken({ user, onUpdateUser, onAddTransaction, onClose, globalSettings }: CrossfireChickenProps) {
  // --- STATE SYSTEM ---
  const [loadingProgress, setLoadingProgress] = useState<number>(100);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  
  const [betAmount, setBetAmount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'hardcore'>('medium');
  const [gameSeed, setGameSeed] = useState<string>('0c3156b7-f363-46d4-ac7a-e081d654b34d');
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'collected'>('idle');
  const [chickenLane, setChickenLane] = useState<number>(0); // 0 = start grass, 1..10 = roads, 11 = win grass
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMute());
  const [preDecidedCrashLane, setPreDecidedCrashLane] = useState<number | null>(null);
  const cameraXRef = useRef<number>(0);
  
  const [insufficientBalance, setInsufficientBalance] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<number>(0);

  // Animation / Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Interpolation state for smooth movement
  const chickenPosRef = useRef<{ x: number; y: number; hopProgress: number; targetX: number }>({
    x: 40,
    y: 250,
    hopProgress: 1.0,
    targetX: 40
  });

  // Load game seed & sound loop on mount
  useEffect(() => {
    // Game is preloaded instantly
    sound.startBGM();

    // 2. Load History
    const storedHistory = localStorage.getItem('crossfire_chicken_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        setHistory([]);
      }
    } else {
      // Seed some pretty history so it looks active
      const seedHistory = [
        { id: '1', time: '16:03:13', play: '54.25', coef: '-', win: '-', difficulty: 'medium', result: 'loss' },
        { id: '2', time: '16:03:11', play: '70', coef: '-', win: '-', difficulty: 'medium', result: 'loss' },
        { id: '3', time: '16:02:58', play: '70', coef: '1.72', win: '120.40', difficulty: 'medium', result: 'win' },
        { id: '4', time: '16:02:50', play: '50', coef: '-', win: '-', difficulty: 'hard', result: 'loss' },
        { id: '5', time: '16:02:20', play: '68.20', coef: '1.72', win: '117.30', difficulty: 'easy', result: 'win' }
      ];
      localStorage.setItem('crossfire_chicken_history', JSON.stringify(seedHistory));
      setHistory(seedHistory);
    }

    // Generate random seed
    generateNewSeed();

    return () => {
      sound.stopBGM();
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  // Update sound bgm on mute change
  useEffect(() => {
    sound.setMute(isMuted);
  }, [isMuted]);

  // Handle key listeners for space/enter as GO buttons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleGo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, chickenLane]);

  // --- CORE GAME LOGIC CONTROLLERS ---

  const generateNewSeed = () => {
    const hex = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        s += '-';
      } else {
        s += hex[Math.floor(Math.random() * 16)];
      }
    }
    setGameSeed(s);
  };

  const placeBet = () => {
    // Bet validation
    if (betAmount > user.walletBalance) {
      setInsufficientBalance(true);
      return false;
    }
    if (betAmount <= 0 || isNaN(betAmount)) {
      alert("Please enter a valid bet amount.");
      return false;
    }
    if (betAmount < MIN_BET) {
      alert(`Minimum bet amount is ${MIN_BET} INR.`);
      return false;
    }
    if (betAmount > MAX_BET) {
      alert(`Maximum bet amount is ${MAX_BET} INR.`);
      return false;
    }

    // Deduct balance securely
    const updated = {
      ...user,
      walletBalance: Math.max(0, user.walletBalance - betAmount)
    };
    onUpdateUser(updated);

    // Track transaction
    onAddTransaction({
      id: `bet-cc-${Date.now()}`,
      type: 'bet',
      amount: betAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Bet placed on Crossfire Chicken [${difficulty.toUpperCase()}]`
    });

    return true;
  };

  const startGame = () => {
    if (gameState === 'playing') return;
    if (!placeBet()) return;

    sound.playHop();
    generateNewSeed();
    setChickenLane(0);
    setGameState('playing');
    
    // Reset camera scroll
    cameraXRef.current = 0;

    // Pre-decide if user will win or lose!
    // Win rate based on difficulty
    const winRate = difficulty === 'easy' ? 0.65 : difficulty === 'medium' ? 0.45 : difficulty === 'hard' ? 0.25 : 0.10;
    const isWin = Math.random() < winRate;
    // If lose, crash on random lane 1 to 10
    const crashLane = isWin ? null : Math.floor(Math.random() * 10) + 1;
    setPreDecidedCrashLane(crashLane);
    
    // Reset positions
    chickenPosRef.current = {
      x: 40,
      y: 250,
      hopProgress: 1.0,
      targetX: 40
    };

    // Re-seed vehicles cleanly
    seedVehicles();

    // Clean up particles
    particlesRef.current = [];
  };

  const handleGo = () => {
    if (gameState !== 'playing') return;
    if (chickenPosRef.current.hopProgress < 1.0) return; // Prevent double hops during animation

    sound.playHop();
    const nextLane = chickenLane + 1;
    const targetX = getLaneCenterX(nextLane);

    // Start hop interpolation
    chickenPosRef.current.targetX = targetX;
    chickenPosRef.current.hopProgress = 0.0;
    setChickenLane(nextLane);

    // Filter out vehicles in nextLane if it's not the crash lane to ensure no vehicle enters the chicken's lane
    if (nextLane !== preDecidedCrashLane) {
      vehiclesRef.current = vehiclesRef.current.filter(v => v.lane !== nextLane);
    } else {
      // Force a vehicle in the crash lane to be close and collide with the chicken!
      const crashV = vehiclesRef.current.find(v => v.lane === nextLane);
      if (crashV) {
        crashV.y = crashV.direction === 1 ? 250 - 50 : 250 + 50;
        crashV.speed = 10;
      } else {
        const types: ('scooter' | 'car' | 'police' | 'bus' | 'truck')[] = ['scooter', 'car', 'police', 'bus', 'truck'];
        const type = types[Math.floor(Math.random() * types.length)];
        const dir = (nextLane % 2 === 0) ? 1 : -1;
        const dims = getVehicleDimensions(type);
        vehiclesRef.current.push({
          x: getLaneCenterX(nextLane),
          y: dir === 1 ? 250 - 50 : 250 + 50,
          lane: nextLane,
          type,
          speed: 10,
          width: dims.w,
          height: dims.h,
          color: getVehicleColor(type),
          bounceOffset: Math.random() * 100,
          direction: dir
        });
      }
    }

    // Spawn gold trail dust particles
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: chickenPosRef.current.x + (Math.random() * 16 - 8),
        y: chickenPosRef.current.y + (Math.random() * 16 - 8),
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        color: '#FF3333',
        size: Math.random() * 3 + 2,
        alpha: 1.0,
        decay: 0.04,
        type: 'dust'
      });
    }
  };

  const handleCollect = () => {
    if (gameState !== 'playing') return;
    if (chickenLane === 0) return; // Cannot collect on starting lane

    const mult = getMultiplier(chickenLane, difficulty);
    const winnings = Math.floor(betAmount * mult);

    sound.playCollect();

    // Trigger shiny coin particles
    for (let i = 0; i < 25; i++) {
      particlesRef.current.push({
        x: chickenPosRef.current.x,
        y: chickenPosRef.current.y,
        vx: Math.random() * 6 - 3,
        vy: Math.random() * -6 - 2,
        color: '#D4AF37',
        size: Math.random() * 5 + 4,
        alpha: 1.0,
        decay: 0.015,
        type: 'star'
      });
    }

    // Ledger updates
    const updated = {
      ...user,
      walletBalance: user.walletBalance + winnings,
      vipExp: Math.min(user.vipExp + Math.floor(betAmount / 10), user.vipExpMax)
    };
    onUpdateUser(updated);

    onAddTransaction({
      id: `win-cc-${Date.now()}`,
      type: 'win',
      amount: winnings,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Cashed out ${mult}x on Crossfire Chicken [${difficulty.toUpperCase()}]`
    });

    setGameState('collected');
    saveHistory(mult, winnings, 'win');
  };

  const handleLose = () => {
    sound.playCrash();
    setScreenFlash(true);
    setScreenShake(12);
    setGameState('crashed');

    // Create massive fiery explosions
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: chickenPosRef.current.x,
        y: chickenPosRef.current.y,
        vx: Math.random() * 10 - 5,
        vy: Math.random() * 10 - 5,
        color: ['#ff3b30', '#ff9500', '#ffcc00', '#7a7a7a'][Math.floor(Math.random() * 4)],
        size: Math.random() * 8 + 4,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        type: 'explosion'
      });
    }

    setTimeout(() => {
      setScreenFlash(false);
    }, 150);

    saveHistory(0, 0, 'loss');
  };

  const saveHistory = (coef: number, winAmt: number, result: 'win' | 'loss') => {
    const time = new Date().toLocaleTimeString('en-GB');
    const newEntry = {
      id: `${Date.now()}`,
      time,
      play: betAmount.toFixed(0),
      coef: result === 'win' ? coef.toFixed(2) : '-',
      win: result === 'win' ? winAmt.toFixed(2) : '-',
      difficulty,
      result
    };

    const updatedHistory = [newEntry, ...history.slice(0, 49)];
    setHistory(updatedHistory);
    localStorage.setItem('crossfire_chicken_history', JSON.stringify(updatedHistory));
  };

  const changeDifficulty = (diff: 'easy' | 'medium' | 'hard' | 'hardcore') => {
    if (gameState === 'playing') return;
    sound.playHop();
    setDifficulty(diff);
  };

  // --- POSITION MAPPINGS ---
  const getLaneCenterX = (lane: number): number => {
    if (lane === 0) return 40; // Grass start
    const laneWidth = 105;
    if (lane === 11) return 80 + 10 * laneWidth + 60; // Grass safe finish
    return 80 + (lane - 1) * laneWidth + laneWidth / 2;
  };

  // --- RENDERING LOOP ---
  useEffect(() => {
    if (!isLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIRTUAL_WIDTH * dpr;
    canvas.height = VIRTUAL_HEIGHT * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.scale(dpr, dpr);

    // Core Animation Frame Callback
    const loop = () => {
      timeRef.current += 1;
      updateGamePhysics();
      renderScene(ctx);
      frameIdRef.current = requestAnimationFrame(loop);
    };

    // Initialize vehicles first time
    if (vehiclesRef.current.length === 0) {
      seedVehicles();
    }

    loop();

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isLoaded, gameState, difficulty, chickenLane]);

  // Seed vehicles to occupy lanes properly on start
  const seedVehicles = () => {
    const list: Vehicle[] = [];
    const types: ('scooter' | 'car' | 'police' | 'bus' | 'truck')[] = ['scooter', 'car', 'police', 'bus', 'truck'];

    for (let l = 1; l <= 10; l++) {
      const type = types[(l - 1) % types.length];
      const dir = (l % 2 === 0) ? 1 : -1; // alternating direction
      const speed = getVehicleSpeed(type);
      const dimensions = getVehicleDimensions(type);

      // Random initial position distributed vertically
      const vY = Math.random() * VIRTUAL_HEIGHT;

      list.push({
        x: getLaneCenterX(l),
        y: vY,
        lane: l,
        type,
        speed,
        width: dimensions.w,
        height: dimensions.h,
        color: getVehicleColor(type),
        bounceOffset: Math.random() * 100,
        direction: dir
      });
    }
    vehiclesRef.current = list;
  };

  // Safe speed scalar based on difficulty
  const getVehicleSpeed = (type: 'scooter' | 'car' | 'police' | 'bus' | 'truck'): number => {
    let base = 1.6;
    if (type === 'scooter') base = 3.6;
    if (type === 'police') base = 2.8;
    if (type === 'car') base = 2.2;
    if (type === 'bus') base = 1.4;
    if (type === 'truck') base = 1.1;

    // Difficulty scalar
    let scalar = 1.0;
    if (difficulty === 'easy') scalar = 0.8;
    if (difficulty === 'hard') scalar = 1.35;
    if (difficulty === 'hardcore') scalar = 1.85;

    return base * scalar;
  };

  const getVehicleDimensions = (type: string): { w: number; h: number } => {
    if (type === 'scooter') return { w: 22, h: 36 };
    if (type === 'car') return { w: 34, h: 52 };
    if (type === 'police') return { w: 34, h: 52 };
    if (type === 'bus') return { w: 42, h: 84 };
    return { w: 42, h: 74 }; // truck
  };

  const getVehicleColor = (type: string): string => {
    if (type === 'scooter') return '#C084FC'; // Purple
    if (type === 'car') return '#3B82F6'; // Blue
    if (type === 'police') return '#000000'; // Black and white
    if (type === 'bus') return '#FBBF24'; // Yellow
    return '#9CA3AF'; // Silver/Grey
  };

  // PHYSICS UPDATE LOOP
  const updateGamePhysics = () => {
    const vehicles = vehiclesRef.current;
    const particles = particlesRef.current;
    const chickenPos = chickenPosRef.current;

    // 1. Screen Shake Decay
    if (screenShake > 0) {
      setScreenShake(prev => Math.max(0, prev - 0.5));
    }

    // Camera scroll interpolation (clamped between 0 and 780 for 10-lane broader world)
    const targetCameraX = Math.min(780, Math.max(0, chickenPos.x - 180));
    cameraXRef.current += (targetCameraX - cameraXRef.current) * 0.08;

    // 2. Interpolate Chicken Hop Movement
    if (chickenPos.hopProgress < 1.0) {
      chickenPos.hopProgress += 0.08; // smooth hop speed (takes ~12 frames)
      if (chickenPos.hopProgress >= 1.0) {
        chickenPos.hopProgress = 1.0;
        chickenPos.x = chickenPos.targetX;

        // Reached Lane 11 safely: Automatic absolute victory celebration!
        if (chickenLane === 11 && gameState === 'playing') {
          sound.playWin();
          const maxMult = MULTIPLIERS[difficulty][9];
          const finalWin = Math.floor(betAmount * maxMult);

          // Give rewards
          const updated = {
            ...user,
            walletBalance: user.walletBalance + finalWin,
            vipExp: Math.min(user.vipExp + Math.floor(betAmount / 5), user.vipExpMax)
          };
          onUpdateUser(updated);

          onAddTransaction({
            id: `win-cc-victory-${Date.now()}`,
            type: 'win',
            amount: finalWin,
            timestamp: new Date().toLocaleTimeString(),
            status: 'SUCCESS',
            description: `Ultimate Crossfire Victory: Reached Grass Zone safely on [${difficulty.toUpperCase()}]`
          });

          // Victory sparkles!
          for (let i = 0; i < 40; i++) {
            particles.push({
              x: chickenPos.x,
              y: chickenPos.y,
              vx: Math.random() * 8 - 4,
              vy: Math.random() * -8 - 4,
              color: '#FF3333',
              size: Math.random() * 6 + 3,
              alpha: 1.0,
              decay: 0.015,
              type: 'star'
            });
          }

          setGameState('collected');
          saveHistory(maxMult, finalWin, 'win');
        }
      } else {
        // Linearly interpolate X
        const startX = getLaneCenterX(chickenLane - 1);
        const t = chickenPos.hopProgress;
        chickenPos.x = startX + (chickenPos.targetX - startX) * t;
      }
    }

    // 3. Update Vehicles
    vehicles.forEach(v => {
      const isChickenInThisLane = chickenLane === v.lane;
      const isThisCrashLane = v.lane === preDecidedCrashLane;

      if (isChickenInThisLane && !isThisCrashLane) {
        // Hide the vehicle off-screen so the lane is safe
        v.y = -999;
      } else {
        // Move vertically
        v.y += v.speed * v.direction;

        // Wrap-around screen bounds
        if (v.direction === 1 && v.y > VIRTUAL_HEIGHT + 60) {
          v.y = -v.height - 20;
          v.speed = getVehicleSpeed(v.type) * (0.85 + Math.random() * 0.3);
        } else if (v.direction === -1 && v.y < -v.height - 60) {
          v.y = VIRTUAL_HEIGHT + 20;
          v.speed = getVehicleSpeed(v.type) * (0.85 + Math.random() * 0.3);
        }
      }
    });

    // 4. Handle collision when playing
    if (gameState === 'playing') {
      const chickenW = 22;
      const chickenH = 22;
      // Parabolic jump arc Y displacement (reduces collision box slightly when high in air)
      const hopArc = Math.sin(chickenPos.hopProgress * Math.PI) * 16;
      const chickY = chickenPos.y - hopArc;

      // Bounding box for chicken
      const chickLeft = chickenPos.x - chickenW / 2;
      const chickRight = chickenPos.x + chickenW / 2;
      const chickTop = chickY - chickenH / 2;
      const chickBottom = chickY + chickenH / 2;

      vehicles.forEach(v => {
        // Ignore off-screen vehicles
        if (v.y === -999) return;

        // Tight 80% boundary check for maximum fairness
        const shrinkW = v.width * 0.85;
        const shrinkH = v.height * 0.85;

        const vLeft = v.x - shrinkW / 2;
        const vRight = v.x + shrinkW / 2;
        const vTop = v.y - shrinkH / 2;
        const vBottom = v.y + shrinkH / 2;

        // Overlap query
        if (
          chickRight > vLeft &&
          chickLeft < vRight &&
          chickBottom > vTop &&
          chickTop < vBottom
        ) {
          // BAM! COLLISION DETECTED
          handleLose();
        }
      });
    }

    // 5. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  };

  // --- CANVAS SCENE RENDERER ---
  const renderScene = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Apply Screen Shake transform
    ctx.save();
    if (screenShake > 0) {
      const dx = (Math.random() * 2 - 1) * screenShake;
      const dy = (Math.random() * 2 - 1) * screenShake;
      ctx.translate(dx, dy);
    }

    // Get current camera scroll
    const cameraX = cameraXRef.current;
    ctx.translate(-cameraX, 0);

    const laneWidth = 105;
    const maxVisibleLanes = Math.min(10, Math.max(4, chickenLane + 3));

    // 1. Draw Asphalt Roadbed Background up to max visible lanes (extends when chicken crosses!)
    ctx.fillStyle = '#7C746C'; // Warm grey-brown asphalt exactly like the 2nd image
    ctx.fillRect(80, 0, maxVisibleLanes * laneWidth, VIRTUAL_HEIGHT);

    // Draw lane dividing dash stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; // High-contrast white lane stripes
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 18]);

    for (let l = 1; l < maxVisibleLanes; l++) {
      const x = 80 + l * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIRTUAL_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // 1.5 Draw Multipliers painted on the asphalt (chicken's path)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 11px "Inter", "Space Grotesk", sans-serif';
    for (let laneNum = 1; laneNum <= maxVisibleLanes; laneNum++) {
      const x = getLaneCenterX(laneNum);
      const isPassed = chickenLane >= laneNum;
      const mult = getMultiplier(laneNum, difficulty);
      
      if (isPassed) {
        // Active/Passed lanes: luminous neon green with a clean neon glow effect
        ctx.fillStyle = '#FF3333';
        ctx.shadowColor = '#FF3333';
        ctx.shadowBlur = 6;
      } else {
        // Upcoming lanes: semi-transparent bright white-grey road stencil paint with no background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.shadowBlur = 0;
      }
      ctx.fillText(`${mult.toFixed(2)}x`, x, 250);
    }
    ctx.restore();

    // 2. Draw Start/Finish Grass zones
    // Left Start Zone (Green lawn base)
    ctx.fillStyle = '#839E59'; 
    ctx.fillRect(0, 0, 48, VIRTUAL_HEIGHT);

    // Pebbled / Cobblestone sidewalk
    ctx.fillStyle = '#A19C8F';
    ctx.fillRect(48, 0, 29, VIRTUAL_HEIGHT);

    // Pavement seam grid
    ctx.fillStyle = '#8B8679';
    for (let y = 10; y < VIRTUAL_HEIGHT; y += 24) {
      ctx.fillRect(48, y, 29, 2);
      ctx.fillRect(y % 16 === 0 ? 56 : 66, y, 2, 24);
    }

    // Yellow solid line separating pathway from roadbed at x = 77
    ctx.fillStyle = '#D4AF37'; 
    ctx.fillRect(77, 0, 3, VIRTUAL_HEIGHT);

    // Right Finish Zone (drawn at the end of the 10th lane)
    const finishX = 80 + 10 * laneWidth;
    ctx.fillStyle = '#557A46'; // Forest green finish lane
    ctx.fillRect(finishX, 0, 150, VIRTUAL_HEIGHT);
    // Right decorative pathway border
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(finishX, 0, 3, VIRTUAL_HEIGHT);

    // Render little houses/fences in start zone
    drawDecorativeAssets(ctx);

    // 3. Multiplier plates on the road are hidden to match the clean road of the 2nd image
    // But active multipliers will still be drawn beneath the chicken for excellent feedback.

    // 4. Draw Vehicles with smooth shadows and headlights
    vehiclesRef.current.forEach(v => {
      drawVehicleShadow(ctx, v);
      drawVehicleHeadlights(ctx, v);
      drawVehicle(ctx, v);
    });

    // 5. Draw Star/Coin/Explosion Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'star') {
        // Draw spark gold star
        ctx.beginPath();
        drawStarPath(ctx, p.x, p.y, 5, p.size, p.size / 2);
        ctx.fill();
      } else if (p.type === 'explosion') {
        // Fiery cloud circles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Circular dust points
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 6. Draw Chicken
    const chick = chickenPosRef.current;
    // Parabolic hopping elevation offsets
    const hopArc = Math.sin(chick.hopProgress * Math.PI) * 20;
    const isIdle = chick.hopProgress >= 1.0;

    // Draw real-time ambient drop shadow under chicken
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    // Shadow shrinks and lightens slightly when the chicken rises higher
    const shadowScale = 1 - (hopArc / 50);
    ctx.ellipse(chick.x, 254, 16 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Procedural chicken drawer
    drawChicken(ctx, chick.x, 250 - hopArc, 20, isIdle, timeRef.current);

    // Green text multiplier underneath chicken (e.g., `x 1.13` drawn in Screenshot 2)
    if (chickenLane > 0 && chickenLane < 11) {
      const activeMult = getMultiplier(chickenLane, difficulty);
      ctx.save();
      ctx.fillStyle = '#FF3333';
      ctx.font = 'black 13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(`x ${activeMult.toFixed(2)}`, chick.x, 280);
      ctx.restore();
    }

    ctx.restore(); // Restore shake transformations
  };

  // --- PROCEDURAL CANVAS DRAWING UTILITIES ---

  const drawDecorativeAssets = (ctx: CanvasRenderingContext2D) => {
    // Draws multiple cute cartoon houses vertically distributed on the left grass bank
    const drawCuteHouse = (x: number, y: number, color: string, roofColor: string, isBlueWindow: boolean) => {
      // Main wall body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y + 10, 26, 26, 3);
      ctx.fill();

      // Roof (triangle)
      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 10);
      ctx.lineTo(x + 13, y - 2);
      ctx.lineTo(x + 29, y + 10);
      ctx.closePath();
      ctx.fill();

      // Chimney
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(x + 18, y + 1, 4, 6);

      // Window (glowing yellow or blue)
      ctx.fillStyle = isBlueWindow ? '#7DD3FC' : '#FDE047';
      ctx.fillRect(x + 5, y + 15, 7, 7);

      // Door (brown)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(x + 16, y + 20, 6, 16);
    };

    // Draw houses at different vertical coordinates
    drawCuteHouse(10, 30, '#EF4444', '#1E293B', false); // Red wall, dark roof
    drawCuteHouse(10, 140, '#3B82F6', '#9A3412', true); // Blue wall, brown roof
    drawCuteHouse(10, 250, '#10B981', '#1E293B', false); // Green wall, dark roof
    drawCuteHouse(10, 360, '#F59E0B', '#9A3412', true); // Yellow wall, brown roof
    drawCuteHouse(10, 460, '#8B5CF6', '#1E293B', false); // Purple wall, dark roof

    // Fences between houses
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1.5;
    for (let fY of [80, 195, 305, 415]) {
      ctx.beginPath();
      // Horizontal rail
      ctx.moveTo(15, fY);
      ctx.lineTo(35, fY);
      // Vertical posts
      ctx.moveTo(20, fY - 6); ctx.lineTo(20, fY + 6);
      ctx.moveTo(30, fY - 6); ctx.lineTo(30, fY + 6);
      ctx.stroke();
    }
  };

  const drawVehicleShadow = (ctx: CanvasRenderingContext2D, v: Vehicle) => {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.beginPath();
    ctx.roundRect(v.x - v.width / 2 - 2, v.y - v.height / 2 + 4, v.width + 4, v.height, 8);
    ctx.fill();
    ctx.restore();
  };

  const drawVehicleHeadlights = (ctx: CanvasRenderingContext2D, v: Vehicle) => {
    ctx.save();
    const lightLen = 80;
    const beamY = v.direction === 1 ? v.y + v.height / 2 : v.y - v.height / 2;
    const angle = v.direction === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Golden headlight gradient
    const grad = ctx.createRadialGradient(
      v.x, beamY, 2,
      v.x, beamY + v.direction * lightLen, lightLen
    );
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0.0)');

    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'screen';

    ctx.beginPath();
    ctx.moveTo(v.x - 8, beamY);
    ctx.lineTo(v.x - 25, beamY + v.direction * lightLen);
    ctx.lineTo(v.x + 25, beamY + v.direction * lightLen);
    ctx.lineTo(v.x + 8, beamY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawVehicle = (ctx: CanvasRenderingContext2D, v: Vehicle) => {
    ctx.save();
    ctx.translate(v.x, v.y);

    // Subtle vibration on suspension
    const bounce = Math.sin((timeRef.current + v.bounceOffset) * 0.22) * 1.0;
    ctx.translate(0, bounce);

    const w = v.width;
    const h = v.height;

    if (v.type === 'scooter') {
      // Purple Scooter Body (gorgeous vector detail)
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front wheel / fork
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, v.direction * (h * 0.4), 6, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, v.direction * (h * 0.48), 8, 4);

      // Seat (black leather)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-5, -h * 0.15, 10, h * 0.3, 3);
      ctx.fill();

      // Rider helmet
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, -h * 0.05, 7, 0, Math.PI * 2);
      ctx.fill();
      // Orange shirt body
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.roundRect(-6, -h * 0.32, 12, h * 0.22, 2);
      ctx.fill();

      // Rider Visor
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -h * 0.05 + v.direction * 3, 5, 0, Math.PI, v.direction === -1);
      ctx.fill();

    } else if (v.type === 'car') {
      // Blue hatchback sedan body
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glass Windshield
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      if (v.direction === 1) {
        ctx.roundRect(-w / 2 + 4, h * 0.05, w - 8, h * 0.18, 3);
      } else {
        ctx.roundRect(-w / 2 + 4, -h * 0.23, w - 8, h * 0.18, 3);
      }
      ctx.fill();

      // Rear glass window
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (v.direction === 1) {
        ctx.roundRect(-w / 2 + 6, -h * 0.35, w - 12, h * 0.1, 2);
      } else {
        ctx.roundRect(-w / 2 + 6, h * 0.25, w - 12, h * 0.1, 2);
      }
      ctx.fill();

      // Yellow Headlights
      ctx.fillStyle = '#fef08a';
      const frontY = v.direction === 1 ? h / 2 - 4 : -h / 2 + 1;
      ctx.fillRect(-w / 2 + 4, frontY, 6, 3);
      ctx.fillRect(w / 2 - 10, frontY, 6, 3);

    } else if (v.type === 'police') {
      // Black and white police body
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();

      // White doors and hood panels
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w / 2 + 1.5, -h * 0.15, w - 3, h * 0.35);

      // Glass windshield
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      if (v.direction === 1) {
        ctx.roundRect(-w / 2 + 4, h * 0.05, w - 8, h * 0.18, 3);
      } else {
        ctx.roundRect(-w / 2 + 4, -h * 0.23, w - 8, h * 0.18, 3);
      }
      ctx.fill();

      // Sirens: Flashing Red and Blue lights
      const sirenColor = (timeRef.current % 12 < 6) ? '#ef4444' : '#3b82f6';
      ctx.fillStyle = sirenColor;
      ctx.fillRect(-6, -3, 12, 6);

      // Headlights
      ctx.fillStyle = '#fef08a';
      const frontY = v.direction === 1 ? h / 2 - 4 : -h / 2 + 1;
      ctx.fillRect(-w / 2 + 4, frontY, 6, 3);
      ctx.fillRect(w / 2 - 10, frontY, 6, 3);

      // POLICE label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.rotate(v.direction === 1 ? 0 : Math.PI);
      ctx.fillText('POLICE', 0, 16);
      ctx.restore();

    } else if (v.type === 'bus') {
      // Large Yellow School Bus
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Black side rails
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w / 2 + 2, -h / 2 + 8, 2, h - 16);
      ctx.fillRect(w / 2 - 4, -h / 2 + 8, 2, h - 16);

      // Glass side windows (multiple tiny rectangles)
      ctx.fillStyle = '#0f172a';
      for (let offset = -h / 2 + 10; offset < h / 2 - 10; offset += 14) {
        ctx.fillRect(-w / 2 + 5, offset, 4, 8);
        ctx.fillRect(w / 2 - 9, offset, 4, 8);
      }

      // Windshield
      ctx.fillStyle = '#e2e8f0';
      const windY = v.direction === 1 ? h / 2 - 16 : -h / 2 + 8;
      ctx.fillRect(-w / 2 + 4, windY, w - 8, 8);

      // Black front grill details
      ctx.fillStyle = '#000000';
      const grillY = v.direction === 1 ? h / 2 - 4 : -h / 2 + 1;
      ctx.fillRect(-w / 2 + 8, grillY, w - 16, 3);

      // Flashing amber caution lights on top
      const amberFlash = (timeRef.current % 24 < 12) ? '#f97316' : '#fef08a';
      ctx.fillStyle = amberFlash;
      const lightY = v.direction === 1 ? h / 2 - 2 : -h / 2 + 1;
      ctx.beginPath();
      ctx.arc(-w / 2 + 4, lightY, 2.5, 0, Math.PI * 2);
      ctx.arc(w / 2 - 4, lightY, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (v.type === 'truck') {
      // Heavy Grey Cargo Truck
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4);
      ctx.fill();

      // Split Cabin vs Bed Trailer
      ctx.fillStyle = '#334155';
      const cabY = v.direction === 1 ? h / 2 - 18 : -h / 2;
      ctx.fillRect(-w / 2 + 2, cabY, w - 4, 18);

      // Cargo stripes/texture on container bed
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      const bedStart = v.direction === 1 ? -h / 2 + 4 : -h / 2 + 22;
      for (let offset = 0; offset < h - 24; offset += 12) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, bedStart + offset);
        ctx.lineTo(w / 2 - 4, bedStart + offset);
        ctx.stroke();
      }

      // Windshield
      ctx.fillStyle = '#e2e8f0';
      const windY = v.direction === 1 ? h / 2 - 12 : -h / 2 + 4;
      ctx.fillRect(-w / 2 + 4, windY, w - 8, 6);
    }

    ctx.restore();
  };

  const drawStarPath = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // CHICKEN PROCEDURAL RENDERING ENGINE
  const drawChicken = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isIdleState: boolean, frame: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Idle squish and stretch
    let squishX = 1;
    let squishY = 1;
    if (isIdleState) {
      squishY = 1 + 0.04 * Math.sin(frame * 0.15);
      squishX = 2 - squishY;
    } else {
      // Hopping lift/squish
      squishY = 0.9 + 0.1 * Math.sin(frame * 0.3);
      squishX = 2 - squishY;
    }
    ctx.scale(squishX, squishY);
    
    // Create a beautiful premium holographic gradient for the body
    const bodyGrad = ctx.createLinearGradient(-size, -size, size, size);
    bodyGrad.addColorStop(0, '#FFFFFF');     // High light pearl white
    bodyGrad.addColorStop(0.4, '#F5F3FF');   // Soft lavender tint
    bodyGrad.addColorStop(0.8, '#E0E7FF');   // Soft cyan-blue tint
    bodyGrad.addColorStop(1, '#EEF2F6');     // Matte cool gray shadow

    // Body (premium pearl-metallic ellipse)
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(255, 35, 72, 0.25)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.72, size * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D8B4FE'; // soft purple-neon outline
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Reset shadow for inner elements
    ctx.shadowBlur = 0;

    // Head (matching holographic pearl circle)
    const headGrad = ctx.createLinearGradient(0, -size * 0.7, size * 0.8, 0);
    headGrad.addColorStop(0, '#FFFFFF');
    headGrad.addColorStop(0.5, '#F5F3FF');
    headGrad.addColorStop(1, '#CBD5E1');
    
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.3, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D8B4FE';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Aesthetic futuristic glowing visor (cyber glasses/shades) instead of eye
    // Visor back plate (dark obsidian glass)
    ctx.fillStyle = '#0B0F19';
    ctx.strokeStyle = '#00F5FF'; // neon cyan border
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00F5FF';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    // Rounded futuristic polygon for visor
    ctx.moveTo(size * 0.22, -size * 0.44);
    ctx.lineTo(size * 0.76, -size * 0.4);
    ctx.lineTo(size * 0.72, -size * 0.22);
    ctx.lineTo(size * 0.3, -size * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Laser neon glow reflection streak inside visor
    ctx.fillStyle = '#00F5FF';
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.38);
    ctx.lineTo(size * 0.68, -size * 0.35);
    ctx.lineTo(size * 0.66, -size * 0.31);
    ctx.lineTo(size * 0.32, -size * 0.33);
    ctx.closePath();
    ctx.fill();

    // Extra mini glowing magenta dot on visor for high-tech aesthetic
    ctx.fillStyle = '#FF2348';
    ctx.shadowColor = '#FF2348';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(size * 0.68, -size * 0.28, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Beak (cyber gold/amber sleek triangle)
    const beakGrad = ctx.createLinearGradient(size * 0.7, -size * 0.38, size * 0.9, -size * 0.26);
    beakGrad.addColorStop(0, '#FFD700'); // premium gold
    beakGrad.addColorStop(1, '#FF8C00'); // orange glow
    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(size * 0.72, -size * 0.36);
    ctx.lineTo(size * 0.92, -size * 0.3);
    ctx.lineTo(size * 0.72, -size * 0.24);
    ctx.closePath();
    ctx.fill();

    // Comb (neon cyber crest)
    // Dynamic glowing pink gradient for the comb
    const combGrad = ctx.createLinearGradient(size * 0.2, -size * 0.7, size * 0.6, -size * 0.6);
    combGrad.addColorStop(0, '#FF2348'); // hot pink/red
    combGrad.addColorStop(1, '#D946EF'); // vivid purple
    ctx.fillStyle = combGrad;
    ctx.shadowColor = '#FF2348';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(size * 0.32, -size * 0.68, size * 0.14, 0, Math.PI * 2);
    ctx.arc(size * 0.46, -size * 0.74, size * 0.14, 0, Math.PI * 2);
    ctx.arc(size * 0.6, -size * 0.68, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wattle (matching glowing red throat drop)
    ctx.fillStyle = '#FF2348';
    ctx.shadowColor = '#FF2348';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(size * 0.58, -size * 0.15, size * 0.08, size * 0.13, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wings (glowing cyan cybernetic/detailed wing)
    const wingGrad = ctx.createLinearGradient(-size * 0.4, 0, 0, size * 0.2);
    wingGrad.addColorStop(0, '#FFFFFF');
    wingGrad.addColorStop(0.5, '#F0FDFA'); // minty cool
    wingGrad.addColorStop(1, '#CCFBF1'); // soft teal
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = '#00F5FF'; // neon cyan
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 245, 255, 0.3)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(-size * 0.18, -size * 0.02, size * 0.38, size * 0.24, -Math.PI / 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inside wing aesthetic panel lines
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.05);
    ctx.lineTo(-size * 0.1, -size * 0.08);
    ctx.moveTo(-size * 0.25, size * 0.05);
    ctx.lineTo(-size * 0.08, size * 0.01);
    ctx.stroke();

    // Tail feathers (stylized, holographic, aerodynamic trails)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF2348'; // pink-neon tip
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#FF2348';
    ctx.shadowBlur = 4;
    
    // Feather 1 (upper)
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 0.1);
    ctx.quadraticCurveTo(-size * 0.95, -size * 0.5, -size * 0.72, -size * 0.52);
    ctx.quadraticCurveTo(-size * 0.58, -size * 0.32, -size * 0.4, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Feather 2 (lower, sleek offset)
    ctx.strokeStyle = '#00F5FF'; // cyan tipped
    ctx.shadowColor = '#00F5FF';
    ctx.beginPath();
    ctx.moveTo(-size * 0.58, 0);
    ctx.quadraticCurveTo(-size * 0.92, -size * 0.2, -size * 0.74, -size * 0.24);
    ctx.quadraticCurveTo(-size * 0.56, -size * 0.12, -size * 0.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // Legs and feet (cybernetic golden carbon lines)
    ctx.strokeStyle = '#FF9F00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Leg 1
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, size * 0.45);
    ctx.lineTo(-size * 0.15, size * 0.65);
    ctx.lineTo(-size * 0.03, size * 0.68);
    ctx.moveTo(-size * 0.15, size * 0.65);
    ctx.lineTo(-size * 0.27, size * 0.68);
    ctx.stroke();
    
    // Leg 2
    ctx.beginPath();
    ctx.moveTo(size * 0.15, size * 0.45);
    ctx.lineTo(size * 0.15, size * 0.65);
    ctx.lineTo(size * 0.27, size * 0.68);
    ctx.moveTo(size * 0.15, size * 0.65);
    ctx.lineTo(size * 0.03, size * 0.68);
    ctx.stroke();

    ctx.restore();
  };

  const getActiveWinnings = (): number => {
    if (chickenLane === 0) return 0;
    const mult = getMultiplier(chickenLane, difficulty);
    return Math.floor(betAmount * mult);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full text-white bg-[#000000] select-none relative pb-10 font-sans min-h-screen flex flex-col justify-between">
      
      {/* 1. LOADING SCREEN OVERLAY (PREMIUM JACKTOP SPEC) */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#000000] z-50 flex flex-col items-center justify-center p-6 select-none"
          >
            {/* Animated Gold Glowing Gentleman Logo */}
            <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D8A35D] to-[#f39c12] opacity-15 blur-2xl animate-pulse" />
              <div className="w-24 h-24 rounded-full border-2 border-[#D8A35D]/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(216,163,93,0.25)] bg-neutral-900/60 animate-bounce" style={{ animationDuration: '3.5s' }}>
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-[#D8A35D] fill-current drop-shadow-[0_0_8px_rgba(216,175,55,0.6)]">
                  <path d="M50,15 C58,15 62,20 62,24 C62,28 58,30 50,30 C42,30 38,28 38,24 C38,20 42,15 50,15 Z M25,40 L75,40 C78,40 80,41 80,43 C80,45 78,46 75,46 L68,46 L65,75 C64,80 58,84 50,84 C42,84 36,80 35,75 L32,46 L25,46 C22,46 20,45 20,43 C20,41 22,40 25,40 Z" />
                </svg>
              </div>
            </div>

            {/* Progress bar structure */}
            <div className="w-64 h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden shadow-inner relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#D8A35D] to-[#FFF] shadow-[0_0_10px_rgba(216,163,93,0.7)]"
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[420px] mx-auto px-4 flex flex-col gap-3">
        {/* Blank space above wallet balance section */}
        <div className="h-6" />
        
        {/* 2. TOP HEADER ROW (BALANCE & THREE SQUARE GOLD BUTTONS) */}
        <div className="flex items-center justify-between w-full">
          {/* Balance card (aligned to left, made smaller) */}
          <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded px-2.5 py-1 flex items-center justify-between w-[40%] h-8">
            <span className="text-white font-bold text-xs font-sans">
              {user.walletBalance.toFixed(2)}
            </span>
            <span className="text-white font-extrabold text-[9px] tracking-wide ml-2">
              INR
            </span>
          </div>

          {/* Three small square icon buttons (aligned to right, made smaller) */}
          <div className="flex items-center gap-1.5 justify-end">
            {/* Gentleman Avatar / Profile Button */}
            <div className="w-7 h-7 bg-black border border-[#D8A35D]/80 rounded flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_0_8px_rgba(216,163,93,0.15)]">
              <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 text-[#D8A35D] fill-current">
                <path d="M50,15 C58,15 62,20 62,24 C62,28 58,30 50,30 C42,30 38,28 38,24 C38,20 42,15 50,15 Z M25,40 L75,40 C78,40 80,41 80,43 C80,45 78,46 75,46 L68,46 L65,75 C64,80 58,84 50,84 C42,84 36,80 35,75 L32,46 L25,46 C22,46 20,45 20,43 C20,41 22,40 25,40 Z" />
              </svg>
            </div>

            {/* Sound Button */}
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="w-7 h-7 bg-black border border-[#D8A35D]/80 rounded flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_0_8px_rgba(216,163,93,0.15)]"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#D8A35D]/60" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#D8A35D]" />
              )}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(prev => !prev)}
              className="w-7 h-7 bg-black border border-[#D8A35D]/80 rounded flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_0_8px_rgba(216,163,93,0.15)] text-[#D8A35D] font-extrabold text-xs"
            >
              ?
            </button>
          </div>
        </div>

        {/* INSTRUCTION MANUAL / HELP OVERLAY */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg space-y-3 relative z-20 shadow-[0_12px_32px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-extrabold text-xs uppercase tracking-widest text-[#D8A35D] flex items-center gap-1.5">
                  🏆 GAME INSTRUCTIONS
                </span>
                <button onClick={() => setShowHelp(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-zinc-300 space-y-2 font-medium leading-relaxed">
                <p>🎯 <span className="text-[#9AF34A] font-bold">Objective:</span> Help the chicken navigate vertically-flowing crossfire traffic lanes. Each lane represents a massive multiplier reward plate.</p>
                <p>🕹️ <span className="text-[#D8A35D] font-bold">Controls:</span> Tapping <span className="text-[#9AF34A] font-bold">GO</span> hops the chicken forward by exactly one lane.</p>
                <p>💰 <span className="text-rose-400 font-bold">Cashing Out:</span> Place a bet to start. You can tap <span className="text-rose-500 font-bold">COLLECT</span> anytime to secure your current bet multiplied by reached lane value. Safely reaching the final grass zone yields absolute maximum multipliers!</p>
                <p>💥 <span className="text-red-500 font-bold">Risk Factor:</span> Getting hit by any vehicle triggers an instant crash, causing loss of current wagered bet.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* 4. CANVAS CONTAINER STAGE */}
        <div className="relative mx-auto w-full aspect-square rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#1a1a1a] select-none">
          {/* Screen Flash Overlay when crashed */}
          <div className={`absolute inset-0 bg-red-600/35 z-20 pointer-events-none transition-opacity duration-75 ${screenFlash ? 'opacity-100' : 'opacity-0'}`} />

          <canvas 
            ref={canvasRef} 
            className="w-full h-full block transform-gpu bg-[#1e222b]"
          />

          {/* Floating Game Status Banner (Crashed, Collected, Idle) */}
          <AnimatePresence>
            {gameState === 'crashed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600/25 border-2 border-rose-500 flex items-center justify-center text-2xl animate-ping" style={{ animationDuration: '2.5s' }}>
                  💥
                </div>
                <span className="font-sans font-black text-sm uppercase tracking-widest text-rose-400 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  CRASHED INTO TRAFFIC!
                </span>
                <p className="text-[11px] text-stone-400 font-medium tracking-tight">
                  Your bet of <span className="text-rose-500 font-black">{betAmount} INR</span> is lost.
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:brightness-110 text-white font-sans font-black text-[11px] uppercase tracking-wider rounded-lg cursor-pointer active:scale-95 transition-all"
                >
                  Play Again 🔄
                </button>
              </motion.div>
            )}

            {gameState === 'collected' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600/25 border-2 border-[#9AF34A] flex items-center justify-center text-2xl animate-bounce">
                  👑
                </div>
                <span className="font-sans font-black text-sm uppercase tracking-widest text-[#9AF34A] filter drop-shadow-[0_0_8px_rgba(154,243,74,0.5)]">
                  COLLECTED REWARDS!
                </span>
                <p className="text-[11px] text-stone-300 font-medium tracking-tight">
                  Won <span className="text-[#9AF34A] font-black">{formatBalance(getActiveWinnings())} INR</span> at <span className="text-yellow-400 font-black">{getMultiplier(chickenLane, difficulty).toFixed(2)}x Coef!</span>
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 px-6 py-2 bg-gradient-to-r from-[#22C55E] to-[#15803D] hover:brightness-110 text-white font-sans font-black text-[11px] uppercase tracking-wider rounded-lg cursor-pointer active:scale-95 transition-all"
                >
                  Start New Bet 💸
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. PLAY BUTTON */}
        <div className="w-full">
          {gameState === 'playing' ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Collect Button */}
              <button
                onClick={handleCollect}
                disabled={chickenLane === 0}
                className={`py-4 rounded-lg flex flex-col items-center justify-center border select-none active:scale-[0.98] transition-all cursor-pointer ${
                  chickenLane > 0 
                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-widest">COLLECT</span>
                <span className="text-[10px] font-mono font-bold mt-0.5">
                  {chickenLane > 0 ? `${formatBalance(getActiveWinnings())} INR` : 'No Safe Multiplier'}
                </span>
              </button>

              {/* GO Button */}
              <button
                onClick={handleGo}
                disabled={chickenPosRef.current.hopProgress < 1.0}
                className={`py-4 rounded-lg flex items-center justify-center select-none active:scale-[0.98] transition-all text-black font-black tracking-widest text-lg cursor-pointer ${
                  chickenPosRef.current.hopProgress < 1.0 
                    ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' 
                    : 'bg-[#9AF34A] hover:bg-[#a6fe54] shadow-[0_0_15px_rgba(154,243,74,0.3)]'
                }`}
              >
                GO
              </button>
            </div>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-4.5 bg-[#9AF34A] hover:bg-[#a6fe54] text-black rounded-lg text-lg font-black tracking-widest uppercase active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center shadow-[0_0_20px_rgba(154,243,74,0.25)] animate-pulse"
              style={{ animationDuration: '2s' }}
            >
              PLAY
            </button>
          )}
        </div>

        {/* 6. BETTING CONTROLS BELOW */}
        <div>
          <div className="grid grid-cols-5 gap-2 items-center bg-[#000000] p-1.5 rounded-lg border border-[#2A2A2A]">
            {/* Min Button */}
            <button
              onClick={() => { if (gameState !== 'playing') { sound.playHop(); setBetAmount(MIN_BET); } }}
              disabled={gameState === 'playing'}
              className="h-10 flex items-center justify-center text-xs font-bold rounded border border-[#D8A35D] text-[#D8A35D] hover:bg-[#D8A35D]/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              Min
            </button>

            {/* Minus Button */}
            <button
              onClick={() => {
                if (gameState !== 'playing') {
                  sound.playHop();
                  setBetAmount(prev => {
                    if (prev <= 10) return Math.max(MIN_BET, prev - 1);
                    if (prev <= 100) return Math.max(MIN_BET, prev - 10);
                    if (prev <= 1000) return Math.max(MIN_BET, prev - 100);
                    return Math.max(MIN_BET, prev - 1000);
                  });
                }
              }}
              disabled={gameState === 'playing'}
              className="h-10 flex items-center justify-center text-base font-bold rounded border border-[#D8A35D] text-[#D8A35D] hover:bg-[#D8A35D]/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              —
            </button>

            {/* Display Box */}
            <div className="h-10 flex flex-col items-center justify-center bg-black text-center select-none font-bold">
              <span className="text-[#D8A35D] text-sm font-extrabold tracking-wide font-sans">{betAmount} INR</span>
            </div>

            {/* Plus Button */}
            <button
              onClick={() => {
                if (gameState !== 'playing') {
                  sound.playHop();
                  setBetAmount(prev => {
                    if (prev < 10) return Math.min(MAX_BET, prev + 1);
                    if (prev < 100) return Math.min(MAX_BET, prev + 10);
                    if (prev < 1000) return Math.min(MAX_BET, prev + 100);
                    return Math.min(MAX_BET, prev + 1000);
                  });
                }
              }}
              disabled={gameState === 'playing'}
              className="h-10 flex items-center justify-center text-base font-bold rounded border border-[#D8A35D] text-[#D8A35D] hover:bg-[#D8A35D]/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              +
            </button>

            {/* Max Button */}
            <button
              onClick={() => {
                if (gameState !== 'playing') {
                  sound.playHop();
                  setBetAmount(Math.min(MAX_BET, Math.max(MIN_BET, Math.floor(user.walletBalance))));
                }
              }}
              disabled={gameState === 'playing'}
              className="h-10 flex items-center justify-center text-xs font-bold rounded border border-[#D8A35D] text-[#D8A35D] hover:bg-[#D8A35D]/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
            >
              Max
            </button>
          </div>
          <div className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Play
          </div>
        </div>

        {/* 7. DIFFICULTY SELECTOR UNDERNEATH */}
        <div>
          <div className="grid grid-cols-4 gap-1.5 bg-[#1A1A1A] p-1 rounded-lg border border-[#2A2A2A]">
            {(['easy', 'medium', 'hard', 'hardcore'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => changeDifficulty(diff)}
                disabled={gameState === 'playing'}
                className={`py-2 text-[11px] font-extrabold uppercase rounded transition-all text-center cursor-pointer ${
                  difficulty === diff
                    ? 'bg-black text-[#D8A35D] shadow-[0_0_10px_rgba(216,163,93,0.2)]'
                    : 'bg-transparent text-[#BDBDBD] hover:text-white disabled:opacity-50'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center px-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            <span>Game Chance</span>
            <span className="flex items-center gap-1">
              Difficulty <Info className="w-3 h-3 text-zinc-500" />
            </span>
          </div>
        </div>

        {/* 8. "MY PLAYS" SECTION BELOW IN A DARK CONTAINER */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden shadow-md mt-2">
          {/* Centered My Plays header */}
          <div className="bg-[#1C1C1C] py-2.5 text-center border-b border-[#2A2A2A]">
            <span className="font-extrabold text-xs uppercase tracking-widest text-white">
              My plays
            </span>
          </div>

          <div className="p-3">
            <div className="overflow-y-auto max-h-44 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 text-left pl-1">Time</th>
                    <th className="py-2 text-left">Play</th>
                    <th className="py-2 text-center">Coef.</th>
                    <th className="py-2 text-right pr-1">Win (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {history.map((h) => (
                    <tr key={h.id} className="text-[11px] font-mono hover:bg-white/[0.01] transition-colors">
                      <td className="py-2 text-zinc-400 pl-1">{h.time}</td>
                      <td className="py-2 text-zinc-200 font-bold">₹{h.play}</td>
                      <td className={`py-2 text-center font-bold ${h.result === 'win' ? 'text-[#9AF34A]' : 'text-zinc-500'}`}>
                        {h.coef !== '-' ? `${h.coef}x` : '—'}
                      </td>
                      <td className={`py-2 text-right pr-1 font-bold ${h.result === 'win' ? 'text-[#9AF34A]' : 'text-zinc-500'}`}>
                        {h.win !== '-' ? `₹${h.win}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                        No recent plays
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* sleeker exit button to lobby at the bottom of everything */}
        <button
          onClick={onClose}
          className="text-center text-zinc-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold mt-4 mb-2 flex items-center justify-center gap-1.5 cursor-pointer mx-auto"
        >
          <X className="w-3 h-3" />
          <span>Exit Game</span>
        </button>

      </div>

      {/* INSUFFICIENT BALANCE DIALOG MODAL */}
      <AnimatePresence>
        {insufficientBalance && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm bg-[#1A1A1A] border border-[#D8A35D]/30 rounded-lg p-6 shadow-2xl relative text-center flex flex-col items-center select-none"
            >
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 mb-4 animate-pulse">
                <ShieldAlert className="w-7 h-7 text-yellow-400" />
              </div>

              <h3 className="font-sans font-black text-sm uppercase tracking-widest text-[#D8A35D] mb-2">
                INSUFFICIENT BALANCE
              </h3>
              
              <p className="text-[11px] text-zinc-300 font-medium leading-relaxed mb-6 max-w-[280px]">
                Your wallet balance is too low to place this bet. Please top up your balance in the Bank tab.
              </p>

              <button
                onClick={() => setInsufficientBalance(false)}
                className="w-full py-3 bg-[#D8A35D] hover:brightness-110 text-black font-sans font-black text-[11px] uppercase tracking-widest rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                Close Popup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
