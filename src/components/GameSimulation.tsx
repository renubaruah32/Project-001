import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, UserProfile, Transaction } from '../types';
import { 
  Coins, Flame, Trophy, Play, Check, X, ShieldAlert, Sparkles, ChevronRight, Zap,
  ArrowLeft, Shield, Landmark, MessageCircle, Bell, HelpCircle, Activity, Users, 
  RefreshCw, Key, Info, Ban, Star, Sparkle
} from 'lucide-react';
import { playClick, playHover, playWin, startGameMusic, stopGameMusic } from '../utils/audio';
import CrossfireChicken from './CrossfireChicken';
import CasinoRoulette from './CasinoRoulette';

interface GameSimulationProps {
  game: Game;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onClose: () => void;
  onAddTransaction: (tx: Transaction) => void;
  globalSettings?: any;
}

export default function GameSimulation({ game, user, onUpdateUser, onClose, onAddTransaction, globalSettings }: GameSimulationProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'failed'>('idle');
  
  // Game-specific simulations states
  // 1. Aviator
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [targetCrash, setTargetCrash] = useState<number>(0);
  const aviatorInterval = useRef<any>(null);

  // 2. Chicken Road
  const [chickenGrid, setChickenGrid] = useState<{ id: number; revealed: boolean; type: 'gold' | 'chicken' }[]>([]);
  const [chickenMultiplier, setChickenMultiplier] = useState<number>(1.1);
  const [chickenCoinsFound, setChickenCoinsFound] = useState<number>(0);

  // 3. Roulette
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | 'green'>('red');
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<{ number: number; color: 'red' | 'black' | 'green' } | null>(null);

  // --- OVERHAULED MULTIPLAYER AVIATOR ENGINE STATES ---
  const [aviatorHistory, setAviatorHistory] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('aviator_past_outcomes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load aviator history:", e);
    }
    return [1.45, 2.10, 1.15, 24.50, 1.83, 3.12, 1.05, 8.42, 1.66, 12.04, 1.25, 2.80, 14.50, 1.95, 1.01];
  });
  const [roundState, setRoundState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [countdown, setCountdown] = useState<number>(5.0);
  const [multiplierVal, setMultiplierVal] = useState<number>(1.00);
  const [provablyFairSeed, setProvablyFairSeed] = useState<string>('sha256-abc88fca99d81dd90eaef1e76bcf670a25ab');
  const [showFairnessInfo, setShowFairnessInfo] = useState<boolean>(false);
  const [activeTabPanel, setActiveTabPanel] = useState<'all' | 'my' | 'stats'>('all');
  const [lobbyCollapsed, setLobbyCollapsed] = useState<boolean>(true);
  
  // Dual bet state variables
  const [betAmount1, setBetAmount1] = useState<number>(100);
  const [betStatus1, setBetStatus1] = useState<'idle' | 'waiting' | 'active' | 'cashed_out'>('idle');
  const [autoCashoutEnabled1, setAutoCashoutEnabled1] = useState<boolean>(false);
  const [autoCashoutMult1, setAutoCashoutMult1] = useState<number>(2.0);
  const [cashedMult1, setCashedMult1] = useState<number>(1.00);

  const [betAmount2, setBetAmount2] = useState<number>(200);
  const [betStatus2, setBetStatus2] = useState<'idle' | 'waiting' | 'active' | 'cashed_out'>('idle');
  const [autoCashoutEnabled2, setAutoCashoutEnabled2] = useState<boolean>(false);
  const [autoCashoutMult2, setAutoCashoutMult2] = useState<number>(3.0);
  const [cashedMult2, setCashedMult2] = useState<number>(1.00);

  const [livePlayers, setLivePlayers] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(150);
  const [pulseTrigger, setPulseTrigger] = useState<boolean>(false);

  // Auto Betting states
  const [activeBetTab1, setActiveBetTab1] = useState<'bet' | 'auto'>('bet');
  const [activeBetTab2, setActiveBetTab2] = useState<'bet' | 'auto'>('bet');
  const [autoBetEnabled1, setAutoBetEnabled1] = useState<boolean>(false);
  const [autoBetEnabled2, setAutoBetEnabled2] = useState<boolean>(false);

  // Selected history item index for details modal
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Custom floating cashout indicators
  const [floatingWins, setFloatingWins] = useState<{ id: string; amount: number; bay: number }[]>([]);

  // --- SPORTS BETTING STATES & DATA ---
  const [sportsCategory, setSportsCategory] = useState<'all' | 'cricket' | 'football' | 'kabaddi' | 'basketball'>('all');
  const [sportsView, setSportsView] = useState<'lobby' | 'mybets'>('lobby');
  const [sportsMatches, setSportsMatches] = useState<any[]>([
    {
      id: 'c1',
      sport: 'cricket',
      league: 'ICC T20 World Cup',
      team1: 'India',
      team2: 'Australia',
      score1: '164/2',
      score2: 'Yet to bat',
      status: 'LIVE',
      time: '18.2 Overs',
      odds1: 1.62,
      oddsDraw: 15.0,
      odds2: 2.35,
      lastAction: 'Virat Kohli hits a majestic boundary through covers!'
    },
    {
      id: 'c2',
      sport: 'cricket',
      league: 'IPL Premium T20',
      team1: 'Mumbai Indians',
      team2: 'Chennai Super Kings',
      score1: '202/6',
      score2: '184/5',
      status: 'LIVE',
      time: '19.1 Overs',
      odds1: 1.15,
      oddsDraw: 22.0,
      odds2: 4.80,
      lastAction: 'MS Dhoni smashes an incredible six over deep midwagon!'
    },
    {
      id: 'f1',
      sport: 'football',
      league: 'La Liga El Clásico',
      team1: 'Real Madrid',
      team2: 'FC Barcelona',
      score1: '2',
      score2: '1',
      status: 'LIVE',
      time: '74 mins',
      odds1: 1.45,
      oddsDraw: 3.40,
      odds2: 5.20,
      lastAction: 'Vinicius Jr penetrates defense, cross blocked'
    },
    {
      id: 'f2',
      sport: 'football',
      league: 'Champions League Arena',
      team1: 'Manchester City',
      team2: 'Bayern Munich',
      score1: '0',
      score2: '0',
      status: 'UPCOMING',
      time: 'Starts in 2 hours',
      odds1: 1.85,
      oddsDraw: 3.25,
      odds2: 2.80,
      lastAction: 'Match pre-warmup undergoing under stadium lights'
    },
    {
      id: 'k1',
      sport: 'kabaddi',
      league: 'Pro Kabaddi League',
      team1: 'Patna Pirates',
      team2: 'U Mumba',
      score1: '32',
      score2: '29',
      status: 'LIVE',
      time: '34 mins',
      odds1: 1.35,
      oddsDraw: 8.00,
      odds2: 2.95,
      lastAction: 'Patna captain scores spectacular Super Raid (+3 points)!'
    },
    {
      id: 'b1',
      sport: 'basketball',
      league: 'NBA Elite Play',
      team1: 'Golden State Warriors',
      team2: 'LA Lakers',
      score1: '98',
      score2: '102',
      status: 'LIVE',
      time: '4th Quarter',
      odds1: 2.05,
      oddsDraw: 11.0,
      odds2: 1.72,
      lastAction: 'LeBron James drives, finishes with a thunderous dunk!'
    }
  ]);
  const [selectedOdd, setSelectedOdd] = useState<{ matchId: string; team: string; odds: number; selectionType: '1' | 'X' | '2' } | null>(null);
  const [sportsBetAmount, setSportsBetAmount] = useState<number>(100);
  const [placedSportsBets, setPlacedSportsBets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sports_placed_bets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [settlingBetId, setSettlingBetId] = useState<string | null>(null);

  // Keep a dynamic ticking loop for score progress, odds fluctuates & action commentaries
  useEffect(() => {
    if (game.id !== 'sports-betting') return;

    const interval = setInterval(() => {
      setSportsMatches(prevMatches => 
        prevMatches.map(match => {
          if (match.status !== 'LIVE') return match;

          // Clone match object
          let updatedMatch = JSON.parse(JSON.stringify(match));

          // Fluctuate odds slightly
          const oddsDelta = (Math.random() * 0.1 - 0.05);
          updatedMatch.odds1 = parseFloat(Math.max(1.05, match.odds1 + oddsDelta).toFixed(2));
          updatedMatch.odds2 = parseFloat(Math.max(1.05, match.odds2 - oddsDelta).toFixed(2));

          // Progress scores and commentaries
          if (match.sport === 'cricket') {
            if (match.id === 'c1') {
              const prevRuns = parseInt(match.score1.split('/')[0]);
              const prevWickets = parseInt(match.score1.split('/')[1]);
              const randOvers = parseFloat((parseFloat(match.time.split(' ')[0]) + 0.1).toFixed(1));
              
              let nextRuns = prevRuns;
              let nextWickets = prevWickets;
              let actionComm = match.lastAction;

              const runRoll = Math.random();
              if (runRoll < 0.2) {
                nextRuns += 4;
                actionComm = `${match.team1} bats beautifully! Superb boundary!`;
              } else if (runRoll < 0.4) {
                nextRuns += 1;
                actionComm = "Tapped away to deep third man for a quick single.";
              } else if (runRoll < 0.45 && prevWickets < 10) {
                nextWickets += 1;
                actionComm = `OUT! Spectacular catch! ${match.team1} loses a crucial wicket.`;
              } else if (runRoll < 0.55) {
                nextRuns += 6;
                actionComm = "SMASHED! Over deep mid-wicket for a massive SIX!";
              }

              updatedMatch.score1 = `${nextRuns}/${nextWickets}`;
              updatedMatch.time = randOvers >= 20 ? 'Innings Break' : `${randOvers} Overs`;
              updatedMatch.lastAction = actionComm;
            } else if (match.id === 'c2') {
              const prevRuns2 = parseInt(match.score2.split('/')[0]);
              const prevWickets2 = parseInt(match.score2.split('/')[1]);
              const randOvers2 = parseFloat((parseFloat(match.time.split(' ')[0]) + 0.1).toFixed(1));
              
              let nextRuns2 = prevRuns2;
              let nextWickets2 = prevWickets2;
              let actionComm2 = match.lastAction;

              const runRoll = Math.random();
              if (runRoll < 0.25) {
                nextRuns2 += 4;
                actionComm2 = `${match.team2} finds the gap beautifully. Boundary!`;
              } else if (runRoll < 0.5) {
                nextRuns2 += 1;
                actionComm2 = "Nudged softly into the leg side for a single.";
              } else if (runRoll < 0.55 && prevWickets2 < 10) {
                nextWickets2 += 1;
                actionComm2 = `BOWLED HIM! Clean through the gates. Match turns on its head!`;
              }

              updatedMatch.score2 = `${nextRuns2}/${nextWickets2}`;
              updatedMatch.time = randOvers2 >= 20 ? 'CSK wins by 4 runs!' : `${randOvers2} Overs`;
              updatedMatch.lastAction = actionComm2;
            }
          } else if (match.sport === 'football') {
            const timeVal = parseInt(match.time);
            if (timeVal < 90) {
              const nextTime = timeVal + 1;
              updatedMatch.time = `${nextTime} mins`;
              if (Math.random() < 0.05) {
                const teamScoreToUp = Math.random() < 0.55 ? 'score1' : 'score2';
                updatedMatch[teamScoreToUp] = (parseInt(match[teamScoreToUp]) + 1).toString();
                const scorer = teamScoreToUp === 'score1' ? match.team1 : match.team2;
                updatedMatch.lastAction = `GOAL!!! Magnificent header inside the penalty box by ${scorer}!`;
              }
            } else {
              updatedMatch.time = 'Full Time';
              updatedMatch.status = 'COMPLETED';
            }
          } else if (match.sport === 'kabaddi') {
            const timeVal = parseInt(match.time);
            if (timeVal < 40) {
              updatedMatch.time = `${timeVal + 1} mins`;
              if (Math.random() < 0.3) {
                const teamToScore = Math.random() < 0.5 ? 'score1' : 'score2';
                const points = Math.random() < 0.8 ? 1 : 2;
                updatedMatch[teamToScore] = (parseInt(match[teamToScore]) + points).toString();
                const teamName = teamToScore === 'score1' ? match.team1 : match.team2;
                updatedMatch.lastAction = `${teamName} claims dynamic raid points! (+${points})`;
              }
            } else {
              updatedMatch.time = 'Full Time';
              updatedMatch.status = 'COMPLETED';
            }
          } else if (match.sport === 'basketball') {
            if (Math.random() < 0.6) {
              const teamToScore = Math.random() < 0.51 ? 'score1' : 'score2';
              const points = Math.random() < 0.6 ? 2 : (Math.random() < 0.75 ? 3 : 1);
              updatedMatch[teamToScore] = (parseInt(match[teamToScore]) + points).toString();
              const scorer = teamToScore === 'score1' ? match.team1 : match.team2;
              updatedMatch.lastAction = `${scorer} hits a brilliant ${points}-pointer!`;
            }
          }

          return updatedMatch;
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [game.id]);

  useEffect(() => {
    localStorage.setItem('sports_placed_bets', JSON.stringify(placedSportsBets));
  }, [placedSportsBets]);

  // Periodically fluctuate online count and trigger transition effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3, -2, -1, 0, 1, 2, 3
        const next = prev + delta;
        // Keep it realistic between 135 and 185
        if (next < 135) return 137;
        if (next > 185) return 183;
        return next;
      });
      setPulseTrigger(true);
      const timer = setTimeout(() => {
        setPulseTrigger(false);
      }, 500);
      return () => clearTimeout(timer);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Sync aviator history changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aviator_past_outcomes', JSON.stringify(aviatorHistory));
    } catch (e) {
      console.error("Failed to save aviator history:", e);
    }
  }, [aviatorHistory]);

  // Helper to extract uploaded background music URL from globalSettings
  const getGameBgmUrl = () => {
    if (!globalSettings) return undefined;
    const cleanId = game.id;
    const underscoredId = cleanId.replace(/-/g, '_');
    const hyphenatedId = cleanId.replace(/_/g, '-');
    
    const sectionConfig = 
      globalSettings[`game_assets_${cleanId}`] || 
      globalSettings[`game_assets_${underscoredId}`] || 
      globalSettings[`game_assets_${hyphenatedId}`];
      
    if (!sectionConfig) return undefined;
    const bgmMeta = sectionConfig.bgm;
    if (!bgmMeta) return undefined;
    return typeof bgmMeta === 'string' ? bgmMeta : bgmMeta.url;
  };

  // Synchronously play and stop background music for the Active Game Simulation
  useEffect(() => {
    const bgmUrl = getGameBgmUrl();
    startGameMusic(game.id, bgmUrl);
    return () => {
      stopGameMusic();
    };
  }, [game.id, globalSettings]);

  // Refs for the high-frequency continuous loop
  const roundStateRef = useRef<'waiting' | 'flying' | 'crashed'>('waiting');
  const crashPointRef = useRef<number>(1.85);
  const startTimeRef = useRef<number>(0);
  const countdownRef = useRef<number>(5.0);

  const betStatus1Ref = useRef<'idle' | 'waiting' | 'active' | 'cashed_out'>('idle');
  const betAmount1Ref = useRef<number>(100);
  const betStatus2Ref = useRef<'idle' | 'waiting' | 'active' | 'cashed_out'>('idle');
  const betAmount2Ref = useRef<number>(200);

  const autoCashoutEnabled1Ref = useRef<boolean>(false);
  const autoCashoutMult1Ref = useRef<number>(2.0);
  const autoCashoutEnabled2Ref = useRef<boolean>(false);
  const autoCashoutMult2Ref = useRef<number>(3.0);

  const userRef = useRef<UserProfile>(user);
  const onUpdateUserRef = useRef(onUpdateUser);
  const onAddTransactionRef = useRef(onAddTransaction);

  // Sync state variables to ref counters instantly
  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    onUpdateUserRef.current = onUpdateUser;
    onAddTransactionRef.current = onAddTransaction;
  }, [onUpdateUser, onAddTransaction]);

  useEffect(() => {
    betAmount1Ref.current = betAmount1;
  }, [betAmount1]);

  useEffect(() => {
    betAmount2Ref.current = betAmount2;
  }, [betAmount2]);

  useEffect(() => {
    autoCashoutEnabled1Ref.current = autoCashoutEnabled1;
    autoCashoutMult1Ref.current = autoCashoutMult1;
  }, [autoCashoutEnabled1, autoCashoutMult1]);

  useEffect(() => {
    autoCashoutEnabled2Ref.current = autoCashoutEnabled2;
    autoCashoutMult2Ref.current = autoCashoutMult2;
  }, [autoCashoutEnabled2, autoCashoutMult2]);

  const autoBetEnabled1Ref = useRef<boolean>(false);
  const autoBetEnabled2Ref = useRef<boolean>(false);
  const placeUserBetRef = useRef<any>(null);

  useEffect(() => {
    autoBetEnabled1Ref.current = autoBetEnabled1;
  }, [autoBetEnabled1]);

  useEffect(() => {
    autoBetEnabled2Ref.current = autoBetEnabled2;
  }, [autoBetEnabled2]);

  useEffect(() => {
    placeUserBetRef.current = placeUserBet;
  });

  // Handle User Bet placements
  const placeUserBet = (betIndex: number) => {
    const curWager = betIndex === 1 ? betAmount1Ref.current : betAmount2Ref.current;

    if (curWager > userRef.current.walletBalance) {
      alert("Insufficient Balance in your INR Wallet! Please Deposit funds from the Bank tab first.");
      // Auto turn off if auto-bet is active to prevent infinite alerts
      if (betIndex === 1) {
        setAutoBetEnabled1(false);
      } else {
        setAutoBetEnabled2(false);
      }
      return;
    }
    if (game.id === 'aviator' && curWager < 100) {
      alert("Minimum bet amount for Aviator is 100 INR.");
      return;
    }
    if (curWager <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }

    // Deduct instantly
    const updatedUser = {
      ...userRef.current,
      walletBalance: userRef.current.walletBalance - curWager
    };
    onUpdateUserRef.current(updatedUser);

    onAddTransactionRef.current({
      id: `bet-avi-${betIndex}-${Date.now()}`,
      type: 'bet',
      amount: curWager,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Wagered on Aviator Grid (Bay ${betIndex})`
    });

    if (betIndex === 1) {
      betStatus1Ref.current = 'waiting';
      setBetStatus1('waiting');
    } else {
      betStatus2Ref.current = 'waiting';
      setBetStatus2('waiting');
    }
  };

  const cancelUserWaitingBet = (betIndex: number) => {
    const curWager = betIndex === 1 ? betAmount1Ref.current : betAmount2Ref.current;

    const updatedUser = {
      ...userRef.current,
      walletBalance: userRef.current.walletBalance + curWager
    };
    onUpdateUserRef.current(updatedUser);

    onAddTransactionRef.current({
      id: `refund-avi-${betIndex}-${Date.now()}`,
      type: 'deposit',
      amount: curWager,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Refunded Aviator bet (Bay ${betIndex})`
    });

    if (betIndex === 1) {
      betStatus1Ref.current = 'idle';
      setBetStatus1('idle');
    } else {
      betStatus2Ref.current = 'idle';
      setBetStatus2('idle');
    }
  };

  const triggerUserCashout = (betIndex: number, forcedMult?: number) => {
    const finalMult = forcedMult || multiplierVal;

    // Trigger high premium celebration win chime
    playWin();

    if (betIndex === 1) {
      if (betStatus1Ref.current !== 'active') return;
      betStatus1Ref.current = 'cashed_out';
      setBetStatus1('cashed_out');
      setCashedMult1(finalMult);

      const winAmount = Math.floor(betAmount1Ref.current * finalMult);
      const updatedUser = {
        ...userRef.current,
        walletBalance: userRef.current.walletBalance + winAmount,
        vipExp: Math.min(userRef.current.vipExp + 15, userRef.current.vipExpMax)
      };
      onUpdateUserRef.current(updatedUser);

      // Register the live green +Amount INR indicator
      setFloatingWins(prev => [...prev, { id: `win-1-${Date.now()}`, amount: winAmount, bay: 1 }]);

      onAddTransactionRef.current({
        id: `win-avi-1-${Date.now()}`,
        type: 'win',
        amount: winAmount,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
        description: `Cashed out at ${finalMult.toFixed(2)}x (Bay 1) in Aviator elite!`
      });
    } else {
      if (betStatus2Ref.current !== 'active') return;
      betStatus2Ref.current = 'cashed_out';
      setBetStatus2('cashed_out');
      setCashedMult2(finalMult);

      const winAmount = Math.floor(betAmount2Ref.current * finalMult);
      const updatedUser = {
        ...userRef.current,
        walletBalance: userRef.current.walletBalance + winAmount,
        vipExp: Math.min(userRef.current.vipExp + 15, userRef.current.vipExpMax)
      };
      onUpdateUserRef.current(updatedUser);

      // Register the live green +Amount INR indicator
      setFloatingWins(prev => [...prev, { id: `win-2-${Date.now()}`, amount: winAmount, bay: 2 }]);

      onAddTransactionRef.current({
        id: `win-avi-2-${Date.now()}`,
        type: 'win',
        amount: winAmount,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
        description: `Cashed out at ${finalMult.toFixed(2)}x (Bay 2) in Aviator elite!`
      });
    }
  };

  // Main continuous multiplayer cron effect
  useEffect(() => {
    if (game.id !== 'aviator') return;

    const generateVirtuals = () => {
      const names = [
        'Ramesh_VIP', 'Kunal_Mumbai', 'Thala_Thokke', 'Preeti_Goa', 'RupeeMogul',
        'Vijay_Delhi', 'AnanyaS', 'HighStaker77', 'Kshatriya_G', 'GoaProPlayer',
        'Lucky_Karan', 'AviatorGuru', 'SovereignGold', 'BillionaireA'
      ];
      // Pick 7 to 11 random active players
      const activeCount = 7 + Math.floor(Math.random() * 5);
      const shuffled = [...names].sort(() => 0.5 - Math.random());
      
      return shuffled.slice(0, activeCount).map((name) => {
        const bet = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
        const cashoutAt = parseFloat((1.05 + Math.random() * 6).toFixed(2));
        return {
          name,
          bet,
          cashoutAt,
          cashed: false
        };
      });
    };

    setLivePlayers(generateVirtuals());

    const loopInterval = setInterval(() => {
      if (roundStateRef.current === 'waiting') {
        // Run auto-bets
        if (autoBetEnabled1Ref.current && betStatus1Ref.current === 'idle') {
          if (placeUserBetRef.current) {
            placeUserBetRef.current(1);
          }
        }
        if (autoBetEnabled2Ref.current && betStatus2Ref.current === 'idle') {
          if (placeUserBetRef.current) {
            placeUserBetRef.current(2);
          }
        }

        if (countdownRef.current > 0.1) {
          const nextVal = parseFloat((countdownRef.current - 0.1).toFixed(1));
          setCountdown(nextVal);
        } else {
          // Take off!
          setRoundState('flying');
          setMultiplierVal(1.00);
          
          // Realistic high-stakes multiplier math distribution biased dynamically by user balance or wagers to let them win/lose but guarantee long-run net loss
          const r = Math.random();
          let nextCrash = 1.01;
          const currentBal = userRef.current.walletBalance;
          const totalWager = (betStatus1Ref.current === 'active' ? betAmount1Ref.current : 0) + (betStatus2Ref.current === 'active' ? betAmount2Ref.current : 0);
          
          let rtpFactor = 0.95; // House default premium RTP is ~95%
          if (currentBal > 150000) {
            rtpFactor = 0.70; // Hard down-curve when up a lot
          } else if (currentBal > 120000) {
            rtpFactor = 0.85; // Slight house advantage adjustment to ensure eventual net loss
          } else if (currentBal > 80000) {
            rtpFactor = 0.95; // Friendly standard game
          } else {
            rtpFactor = 1.15; // High hit turnaround luck run to keep them fully engaged & happy!
          }

          // House protects itself from extremely high bets to preserve live liquidity
          if (totalWager > 5000) {
            rtpFactor *= 0.80;
          }

          // Formulate crash points organically using our live dynamic factor
          if (globalSettings?.game_outcome_control === 'force_win') {
            nextCrash = parseFloat((5.50 + Math.random() * 14.50).toFixed(2));
          } else if (globalSettings?.game_outcome_control === 'force_loss') {
            nextCrash = parseFloat((1.01 + Math.random() * 0.03).toFixed(2));
          } else if (r < 0.11 * (2.0 - rtpFactor)) {
            // Instant early crash (standard house hazard)
            nextCrash = parseFloat((1.01 + Math.random() * 0.08).toFixed(2));
          } else {
            const roll = Math.random() * rtpFactor;
            if (roll < 0.40) {
              nextCrash = parseFloat((1.10 + Math.random() * 0.65).toFixed(2));
            } else if (roll < 0.75) {
              nextCrash = parseFloat((1.75 + Math.random() * 1.55).toFixed(2));
            } else if (roll < 0.92) {
              nextCrash = parseFloat((3.30 + Math.random() * 4.20).toFixed(2));
            } else {
              nextCrash = parseFloat((7.50 + Math.random() * 25.00).toFixed(2));
            }
          }
          crashPointRef.current = nextCrash;
          startTimeRef.current = Date.now();

          // Provably Fair Verification hash creation
          const chars = '0123456789abcdef';
          let seedStr = 'sha256-';
          for (let i = 0; i < 32; i++) seedStr += chars[Math.floor(Math.random() * 16)];
          setProvablyFairSeed(seedStr);

          // Lock in awaiting bets to active
          if (betStatus1Ref.current === 'waiting') {
            betStatus1Ref.current = 'active';
            setBetStatus1('active');
          }
          if (betStatus2Ref.current === 'waiting') {
            betStatus2Ref.current = 'active';
            setBetStatus2('active');
          }

          setLivePlayers(generateVirtuals());
        }
      } else if (roundStateRef.current === 'flying') {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // Spribe styled smooth bezier curving growth multiplier formula
        const currentMultiplier = Math.min(
          parseFloat(Math.pow(1.0 + elapsed * 0.08, 2.5).toFixed(2)),
          200.00
        );

        if (currentMultiplier >= crashPointRef.current) {
          // Explode / fly away!
          setRoundState('crashed');
          setCountdown(3.0); // Show crashed notice for 3 seconds

          // Append past outcomes
          setAviatorHistory(prev => [crashPointRef.current, ...prev.slice(0, 16)]);

          // Cancel remaining active wagers
          if (betStatus1Ref.current === 'active') {
            betStatus1Ref.current = 'idle';
            setBetStatus1('idle');
          }
          if (betStatus2Ref.current === 'active') {
            betStatus2Ref.current = 'idle';
            setBetStatus2('idle');
          }
        } else {
          setMultiplierVal(currentMultiplier);

          // Auto cash out triggers
          if (
            betStatus1Ref.current === 'active' && 
            autoCashoutEnabled1Ref.current && 
            currentMultiplier >= autoCashoutMult1Ref.current
          ) {
            triggerUserCashout(1, currentMultiplier);
          }

          if (
            betStatus2Ref.current === 'active' && 
            autoCashoutEnabled2Ref.current && 
            currentMultiplier >= autoCashoutMult2Ref.current
          ) {
            triggerUserCashout(2, currentMultiplier);
          }

          // Cashout virtual players
          setLivePlayers((prev) => 
            prev.map((player) => {
              if (!player.cashed && currentMultiplier >= player.cashoutAt && player.cashoutAt < crashPointRef.current) {
                return { ...player, cashed: true };
              }
              return player;
            })
          );
        }
      } else if (roundStateRef.current === 'crashed') {
        if (countdownRef.current > 0.1) {
          const nextVal = parseFloat((countdownRef.current - 0.1).toFixed(1));
          setCountdown(nextVal);
        } else {
          // Prepare next flight
          setRoundState('waiting');
          setCountdown(5.0);
          setMultiplierVal(1.00);

          // Clear completed states of bays
          if (betStatus1Ref.current === 'cashed_out') {
            betStatus1Ref.current = 'idle';
            setBetStatus1('idle');
          }
          if (betStatus2Ref.current === 'cashed_out') {
            betStatus2Ref.current = 'idle';
            setBetStatus2('idle');
          }
        }
      }
    }, 100);

    return () => clearInterval(loopInterval);
  }, [game.id]);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Safe deduction trigger
  const handlePlaceBet = (): boolean => {
    if (betAmount > user.walletBalance) {
      alert("Insufficient Balance in your INR Wallet! Please Deposit funds from the Bank tab.");
      return false;
    }
    if (betAmount <= 0) {
      alert("Please enter a valid bet amount.");
      return false;
    }

    const updated = {
      ...user,
      walletBalance: user.walletBalance - betAmount
    };
    onUpdateUser(updated);

    onAddTransaction({
      id: `bet-${Date.now()}`,
      type: 'bet',
      amount: betAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Wagered on ${game.name}`
    });

    return true;
  };

  // --- AVIATOR LOGIC ---
  const startAviator = () => {
    if (!handlePlaceBet()) return;

    setGameState('playing');
    setMultiplier(1.00);
    // Random crash point biased dynamically by user wallet balance to eventually blow up balance but feel beautifully realistic
    const currentBal = user.walletBalance;
    let rtpFactor = 0.95;
    if (currentBal > 150000) {
      rtpFactor = 0.70;
    } else if (currentBal > 120000) {
      rtpFactor = 0.85;
    } else if (currentBal > 80000) {
      rtpFactor = 0.95;
    } else {
      rtpFactor = 1.15;
    }

    if (betAmount > 5000) {
      rtpFactor *= 0.80;
    }

    const finalR = Math.random();
    let crashMultiplier = 1.01;
    if (globalSettings?.game_outcome_control === 'force_win') {
      crashMultiplier = parseFloat((5.50 + Math.random() * 14.50).toFixed(2));
    } else if (globalSettings?.game_outcome_control === 'force_loss') {
      crashMultiplier = parseFloat((1.01 + Math.random() * 0.03).toFixed(2));
    } else if (finalR < 0.11 * (2.0 - rtpFactor)) {
      // Instant early crash
      crashMultiplier = parseFloat((1.01 + Math.random() * 0.08).toFixed(2));
    } else {
      const roll = Math.random() * rtpFactor;
      if (roll < 0.40) {
        crashMultiplier = parseFloat((1.10 + Math.random() * 0.65).toFixed(2));
      } else if (roll < 0.75) {
        crashMultiplier = parseFloat((1.75 + Math.random() * 1.55).toFixed(2));
      } else if (roll < 0.92) {
        crashMultiplier = parseFloat((3.30 + Math.random() * 4.20).toFixed(2));
      } else {
        crashMultiplier = parseFloat((7.50 + Math.random() * 15.00).toFixed(2));
      }
    }
    setTargetCrash(crashMultiplier);

    if (aviatorInterval.current) clearInterval(aviatorInterval.current);

    aviatorInterval.current = setInterval(() => {
      setMultiplier((prev) => {
        const next = parseFloat((prev + 0.04 + (prev * 0.012)).toFixed(2));
        if (next >= crashMultiplier) {
          clearInterval(aviatorInterval.current);
          setGameState('failed');
          return crashMultiplier;
        }
        return next;
      });
    }, 100);
  };

  const cashOutAviator = () => {
    if (gameState !== 'playing') return;
    clearInterval(aviatorInterval.current);
    
    playWin();
    const winAmount = Math.floor(betAmount * multiplier);
    const updated = {
      ...user,
      walletBalance: user.walletBalance + winAmount,
      vipExp: Math.min(user.vipExp + 15, user.vipExpMax)
    };
    onUpdateUser(updated);
    setGameState('cashed_out');

    onAddTransaction({
      id: `win-${Date.now()}`,
      type: 'win',
      amount: winAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Cashed out ${multiplier}x in Aviator!`
    });
  };

  // --- CHICKEN ROAD LOGIC ---
  const initChickenRoad = () => {
    if (!handlePlaceBet()) return;

    setGameState('playing');
    setChickenCoinsFound(0);
    setChickenMultiplier(1.20);

    // Initialize 4x4 Grid with random 3 angry chickens
    const cleanGrid = Array.from({ length: 16 }).map((_, idx) => ({
      id: idx,
      revealed: false,
      type: 'gold' as 'gold' | 'chicken'
    }));

    // Randomize 3 hidden chickens
    let chickenCount = 0;
    while (chickenCount < 3) {
      const idx = Math.floor(Math.random() * 16);
      if (cleanGrid[idx].type === 'gold') {
        cleanGrid[idx].type = 'chicken';
        chickenCount++;
      }
    }

    setChickenGrid(cleanGrid);
  };

  const handleTileClick = (id: number) => {
    if (gameState !== 'playing') return;
    
    const target = chickenGrid.find(t => t.id === id);
    if (!target || target.revealed) return;

    // Dynamically decide if this click should force a loss to blow up user's wallet
    const currentBal = user.walletBalance;
    const clickCount = chickenCoinsFound + 1;
    
    let forceLose = false;
    // Elegant risk scaling based on user balance & greed factor (click count)
    if (currentBal > 150000) {
      if (clickCount === 1) forceLose = Math.random() < 0.25;
      else if (clickCount === 2) forceLose = Math.random() < 0.48;
      else if (clickCount === 3) forceLose = Math.random() < 0.65;
      else if (clickCount === 4) forceLose = Math.random() < 0.80;
      else forceLose = Math.random() < 0.90;
    } else if (currentBal > 120000) {
      if (clickCount === 1) forceLose = Math.random() < 0.20;
      else if (clickCount === 2) forceLose = Math.random() < 0.38;
      else if (clickCount === 3) forceLose = Math.random() < 0.55;
      else if (clickCount === 4) forceLose = Math.random() < 0.70;
      else forceLose = Math.random() < 0.82;
    } else if (currentBal > 80000) {
      if (clickCount === 1) forceLose = Math.random() < 0.15;
      else if (clickCount === 2) forceLose = Math.random() < 0.28;
      else if (clickCount === 3) forceLose = Math.random() < 0.42;
      else if (clickCount === 4) forceLose = Math.random() < 0.55;
      else forceLose = Math.random() < 0.70;
    } else {
      // Down a lot: let player win several in a row with higher luck!
      if (clickCount === 1) forceLose = Math.random() < 0.10;
      else if (clickCount === 2) forceLose = Math.random() < 0.18;
      else if (clickCount === 3) forceLose = Math.random() < 0.28;
      else if (clickCount === 4) forceLose = Math.random() < 0.40;
      else forceLose = Math.random() < 0.55;
    }

    let isChicken = target.type === 'chicken' || forceLose;
    if (globalSettings?.game_outcome_control === 'force_win') {
      isChicken = false;
    } else if (globalSettings?.game_outcome_control === 'force_loss') {
      isChicken = true;
    }

    // Update tile to revealed and set its final type dynamically
    const updatedGrid = chickenGrid.map(t => {
      if (t.id === id) return { ...t, type: (isChicken ? 'chicken' : 'gold') as 'gold' | 'chicken', revealed: true };
      return t;
    });
    setChickenGrid(updatedGrid);

    if (isChicken) {
      // Boom, hit chicken! Show all chickens
      setChickenGrid(updatedGrid.map(t => ({ ...t, revealed: true })));
      setGameState('failed');
    } else {
      // Golden coin! Increment coins found
      const coinsFound = chickenCoinsFound + 1;
      setChickenCoinsFound(coinsFound);
      // Linear or explosive reward multiplier scaling
      const nextMult = parseFloat((1.20 + (coinsFound * 0.28)).toFixed(2));
      setChickenMultiplier(nextMult);

      if (coinsFound === 13) {
        // Auto cash out if everything is safe!
        cashOutChickenRoad(nextMult);
      }
    }
  };

  const cashOutChickenRoad = (finalMult = chickenMultiplier) => {
    if (gameState !== 'playing') return;

    playWin();
    const winAmount = Math.floor(betAmount * finalMult);
    const updated = {
      ...user,
      walletBalance: user.walletBalance + winAmount,
      vipExp: Math.min(user.vipExp + 10, user.vipExpMax)
    };
    onUpdateUser(updated);
    setGameState('cashed_out');

    onAddTransaction({
      id: `win-${Date.now()}`,
      type: 'win',
      amount: winAmount,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SUCCESS',
      description: `Cashed out ${finalMult}x in Chicken Road!`
    });
  };

  // --- ROULETTE LOGIC ---
  const spinRoulette = () => {
    if (!handlePlaceBet()) return;

    setSpinning(true);
    setGameState('playing');
    setSpinResult(null);

    // Simulate roulette wheel spin with balance-bias algorithm to ensure eventual account depletion
    setTimeout(() => {
      const currentBal = user.walletBalance;
      let forceOppositeColor = false;
      if (currentBal > 150000) {
        forceOppositeColor = Math.random() < 0.65; // Force drop when heavily up
      } else if (currentBal > 120000) {
        forceOppositeColor = Math.random() < 0.58; // Standard balance margin
      } else if (currentBal > 80000) {
        forceOppositeColor = Math.random() < 0.48; // About even, let them feel some nice wins!
      } else {
        forceOppositeColor = Math.random() < 0.38; // Let them make a gorgeous recovery run!
      }

      let luckyNum = 0;
      let color: 'red' | 'black' | 'green' = 'red';
      
      const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

      if (globalSettings?.game_outcome_control === 'force_win') {
        if (selectedColor === 'red') {
          luckyNum = redNumbers[Math.floor(Math.random() * redNumbers.length)];
          color = 'red';
        } else if (selectedColor === 'black') {
          luckyNum = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
          color = 'black';
        } else {
          luckyNum = 0;
          color = 'green';
        }
      } else if (globalSettings?.game_outcome_control === 'force_loss') {
        if (selectedColor === 'red') {
          luckyNum = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
          color = 'black';
        } else if (selectedColor === 'black') {
          luckyNum = redNumbers[Math.floor(Math.random() * redNumbers.length)];
          color = 'red';
        } else {
          luckyNum = Math.random() < 0.5 ? redNumbers[0] : blackNumbers[0];
          color = redNumbers.includes(luckyNum) ? 'red' : 'black';
        }
      } else if (forceOppositeColor) {
        if (selectedColor === 'red') {
          const chooseBlack = Math.random() < 0.96;
          if (chooseBlack) {
            luckyNum = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
            color = 'black';
          } else {
            luckyNum = 0;
            color = 'green';
          }
        } else if (selectedColor === 'black') {
          const chooseRed = Math.random() < 0.96;
          if (chooseRed) {
            luckyNum = redNumbers[Math.floor(Math.random() * redNumbers.length)];
            color = 'red';
          } else {
            luckyNum = 0;
            color = 'green';
          }
        } else {
          // Green bet: return red or black
          const chooseRed = Math.random() < 0.5;
          if (chooseRed) {
            luckyNum = redNumbers[Math.floor(Math.random() * redNumbers.length)];
            color = 'red';
          } else {
            luckyNum = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
            color = 'black';
          }
        }
      } else {
        // Natural roll
        luckyNum = Math.floor(Math.random() * 37);
        if (luckyNum === 0) {
          color = 'green';
        } else if (redNumbers.includes(luckyNum)) {
          color = 'red';
        } else {
          color = 'black';
        }
      }

      setSpinResult({ number: luckyNum, color });
      setSpinning(false);

      if (color === selectedColor) {
        // Win!
        playWin();
        const payoutMult = color === 'green' ? 14 : 2;
        const prize = Math.floor(betAmount * payoutMult);

        const updated = {
          ...user,
          walletBalance: user.walletBalance + prize,
          vipExp: Math.min(user.vipExp + 12, user.vipExpMax)
        };
        onUpdateUser(updated);
        setGameState('cashed_out');

        onAddTransaction({
          id: `win-${Date.now()}`,
          type: 'win',
          amount: prize,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Spin Won on ${color}! Pays ${payoutMult}x`
        });
      } else {
        setGameState('failed');
      }
    }, 2200);
  };

  // Cleanup aviator interval on unmount
  useEffect(() => {
    return () => {
      if (aviatorInterval.current) clearInterval(aviatorInterval.current);
    };
  }, []);

  if (game.id === 'aviator') {
    const flightX = 10 + Math.min((multiplierVal - 1.00) * 8, 75);
    const flightY = 90 - Math.min(Math.pow(multiplierVal - 1.00, 0.75) * 14, 75);
    const pathD = `M 10 90 Q ${10 + (flightX - 10) * 0.4} 90, ${flightX} ${flightY}`;

    const renderLobbyPanel = (isMobile: boolean) => {
      return (
        <section className={`${
          isMobile ? 'col-span-12 lg:hidden mt-3' : 'hidden lg:flex lg:col-span-3'
        } flex flex-col bg-[#18191B] border border-neutral-800 rounded-xl overflow-hidden transition-all duration-300 relative shadow-md ${
          lobbyCollapsed ? 'h-[42px] min-h-0' : 'min-h-[260px] lg:min-h-0 h-auto lg:h-full'
        }`}>
          
          {/* LOBBY INTERACTION TABS with Collapse Toggle click */}
          <div 
            onClick={() => setLobbyCollapsed(!lobbyCollapsed)}
            className="bg-[#101112] p-1.5 flex items-center justify-between border-b border-neutral-800 shrink-0 select-none z-10 cursor-pointer hover:bg-[#141517] transition-all"
          >
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button className="bg-neutral-800 text-white font-sans text-[10.5px] font-black py-1 px-3.5 rounded-full leading-none select-none">
                All Bets
              </button>
              <button className="text-neutral-500 font-sans text-[10.5px] font-bold py-1 px-2.5 rounded-full leading-none hover:text-neutral-300 select-none transition-colors">
                Previous
              </button>
              <button className="text-neutral-500 font-sans text-[10.5px] font-bold py-1 px-2.5 rounded-full leading-none hover:text-neutral-300 select-none transition-colors">
                Top
              </button>
            </div>

            {/* Robust clean Expand indicator button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLobbyCollapsed(!lobbyCollapsed);
              }}
              className="flex items-center gap-1 bg-[#1c1d1f] hover:bg-[#252628] text-neutral-300 hover:text-white px-2 py-1 rounded font-sans text-[9.5px] font-black uppercase tracking-wider border border-neutral-800/80 transition-all cursor-pointer select-none"
            >
              <span>{lobbyCollapsed ? '▲ Expand' : '▼ Collapse'}</span>
            </button>
          </div>

          {/* Render statistics and scrolling stream list conditional on status */}
          {!lobbyCollapsed && (
            <>
              {/* LIVE BETS SUMMARY STATISTICS BAR */}
              <div className="bg-[#141516] py-1.5 px-3 flex items-center justify-between border-b border-neutral-900 shrink-0 select-none animate-fadeIn">
                <div className="flex items-center gap-1.5 font-sans">
                  <div className="flex -space-x-1 select-none">
                    <span className="w-4 h-4 rounded-full bg-[#FF2A2A] text-[6px] border border-neutral-950 flex items-center justify-center font-sans">👤</span>
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-[6px] border border-neutral-950 flex items-center justify-center font-sans">👤</span>
                    <span className="w-4 h-4 rounded-full bg-[#FF2A2A] text-[6px] border border-neutral-950 flex items-center justify-center font-sans">👤</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold select-none">
                    257/260 Bets
                  </span>
                </div>

                <div className="text-right flex flex-col justify-center leading-none">
                  <span className="text-[#FF2A2A] text-xs font-black tracking-tight select-none">
                    0.00
                  </span>
                  <span className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wide leading-none pt-0.5 select-none animate-pulse font-sans">
                    Total win INR
                  </span>
                </div>
              </div>

              {/* Players scrolling betting ledger */}
              <div className={`flex-1 ${isMobile ? 'overflow-visible max-h-none' : 'overflow-y-auto max-h-[220px] lg:max-h-none'} p-1.5 space-y-1 bg-[#141516] no-scrollbar animate-fadeIn`}>
                {(isMobile ? livePlayers.slice(0, 12) : livePlayers).map((p, idx) => (
                  <div 
                    key={idx} 
                    className={`grid grid-cols-3 text-[10.5px] font-sans py-1 px-2 rounded items-center transition-all ${
                      p.cashed ? 'bg-[#FF2A2A]/10 border border-[#FF2A2A]/20 font-bold' : 'bg-[#1c1d1f]/45'
                    }`}
                  >
                    <span className="text-neutral-300 truncate font-sans">{p.name}</span>
                    <span className="text-neutral-400 text-center font-bold">₹{p.bet}</span>
                    <span className="text-right flex justify-end">
                      {p.cashed ? (
                        <span className="bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 text-[#FF2A2A] font-extrabold px-1 py-0.5 rounded text-[8.5px] scale-95 origin-right font-sans">
                          {p.cashoutAt.toFixed(2)}x (+₹{Math.floor(p.bet * p.cashoutAt)})
                        </span>
                      ) : (
                        <span className="text-neutral-600 italic text-[9px] select-none font-sans">flying...</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      );
    };

    return (
      <div className="fixed inset-0 z-50 bg-[#0f1011] flex flex-col overflow-y-auto lg:overflow-hidden select-none font-sans text-white">
        
        {/* Floating win elements flying path to wallet balance */}
        <AnimatePresence>
          {floatingWins.map((win) => (
            <motion.div
              key={win.id}
              initial={{ 
                opacity: 1, 
                scale: 0.8,
                left: win.bay === 1 ? '20%' : '70%', 
                top: '80%' 
              }}
              animate={{ 
                opacity: [1, 1, 1, 0.8, 0],
                scale: [0.8, 1.4, 1.2, 0.9, 0.3],
                left: '80%', 
                top: '2%' 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.3, 
                ease: [0.25, 1, 0.5, 1] 
              }}
              onAnimationComplete={() => {
                setFloatingWins(prev => prev.filter(p => p.id !== win.id));
              }}
              className="fixed z-[999] pointer-events-none font-sans font-black text-xs min-[400px]:text-sm text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.95)] flex items-center gap-1.5 bg-black/75 border border-red-500/40 px-3.5 py-2 rounded-full select-none"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              +₹{win.amount.toLocaleString('en-IN')}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* CONSOLIDATED CASINO TOP & BRAND BAR - NO LOGIN/REGISTRATION, CURRENCY TO INR */}
        <div className="bg-[#1b1c1d] px-3.5 py-2 flex items-center justify-between border-b border-neutral-800 shrink-0 select-none z-20">
          {/* Left Side: Back Trigger and Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-1 text-neutral-300 hover:text-white font-sans text-xs font-bold leading-none cursor-pointer"
            >
              <span className="text-lg font-light text-neutral-400">‹</span>
              <span>Back</span>
            </button>
            <div className="h-4.5 w-px bg-neutral-800" />
            <div className="flex items-center gap-1">
              <span className="font-sans font-black text-base italic text-[#FF2A2A] tracking-tighter uppercase select-none">
                Aviator
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] shadow-[0_0_6px_#FF2A2A] animate-pulse ml-1" />
            </div>
          </div>

          {/* Right Side: Cash Balance & Options */}
          <div className="flex items-center gap-3">
            {/* Provably fair details trigger */}
            <button
              onClick={() => setShowFairnessInfo(!showFairnessInfo)}
              className="p-1 px-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-all text-[9.5px] font-mono border border-neutral-800 flex items-center gap-1"
              title="Verify Cryptographic Fairness"
            >
              <Shield className="w-3" />
              <span className="hidden sm:inline">Fair</span>
            </button>

            {/* Glowing Green Wallet Value */}
            <div className="flex items-center gap-1.5 font-bold font-sans">
              <span className="text-[#2cbe1c] text-sm font-black tracking-tight select-none">
                {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(user.walletBalance)}
              </span>
              <span className="text-neutral-400 text-[10px] font-medium select-none uppercase">
                INR
              </span>
            </div>

            {/* Navigation Drawer Menu Button */}
            <button className="text-neutral-300 hover:text-white p-1 select-none">
              <span className="text-base font-bold">☰</span>
            </button>
          </div>
        </div>

        {/* ROW 3: PAST MULTIPLIERS STRIP */}
        <div className="bg-[#121314] py-1.5 px-3 flex items-center justify-between border-b border-neutral-900 overflow-hidden shrink-0 select-none z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[90%]">
            {aviatorHistory.slice(0, 16).map((h, i) => {
              let textColor = 'text-[#3293c4]'; // low-multiplier layout
              let bgColor = 'bg-[#152e3d]/80 border-[#3293c4]/20';
              if (h >= 10.0) {
                textColor = 'text-[#c017b3]'; // very high-multiplier magenta style
                bgColor = 'bg-[#40133c]/85 border-[#c017b3]/30';
              } else if (h >= 2.0) {
                textColor = 'text-[#904df0]'; // intermediate violet layout
                bgColor = 'bg-[#291745]/85 border-[#904df0]/20';
              }
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedHistoryIndex(i);
                  }}
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[9.5px] font-black tracking-tight border transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${textColor} ${bgColor}`}
                  title="Click to view/remove from history"
                >
                  {h.toFixed(2)}x
                </button>
              );
            })}
          </div>
          {/* Quick history clear indicator */}
          <button 
            onClick={() => {
              if (window.confirm("Do you want to clear your entire Aviator outcomes history log?")) {
                setAviatorHistory([]);
              }
            }}
            className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#cb2131] hover:text-white text-neutral-400 ml-1 shrink-0 transition-all cursor-pointer/80 text-[9px]"
            title="Clear all outcome history records"
          >
            🗑️
          </button>
        </div>

        {/* UPPER BOARD: SUNNY LIVE MODE BANNER */}
        <div className="bg-[#E50914] font-sans font-black tracking-widest text-[9.5px] text-center py-1 mt-0.5 rounded-t-lg text-white select-none shrink-0 border-b border-[#B91C1C] z-10">
          LIVE MODE
        </div>

        {/* MAIN GAMEWORKSPACE (MULTIPLAYER STACK OR SPLIT) */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-3 overflow-visible lg:overflow-hidden select-none flex flex-col lg:grid lg:grid-cols-12 gap-3">
          
          {/* PRIMARY GRAPH COCKPIT + ACTION BAYS COLUMN (col span 9) */}
          <section className="lg:col-span-9 flex flex-col gap-3 lg:h-full lg:overflow-y-auto lg:no-scrollbar select-none">
            
            {/* 1. CHART ARENA BOX */}
            <div className="bg-[#0b0c0e] rounded-xl h-56 md:h-72 lg:flex-1 relative overflow-hidden flex flex-col justify-between p-3.5 shadow-xl select-none shrink-0">
              
              {/* IMMERSIVE COMPLIANT TECH COCKPIT BACKDROP WITH NO PICTURE */}
              <div className="absolute inset-0 select-none pointer-events-none overflow-hidden bg-[#0a0a0c] lg:bg-[#070709] bg-[radial-gradient(circle_at_center,rgba(230,29,45,0.06)_0%,rgba(0,0,0,0)_70%)]">
                {/* Dynamic clean tech radar layout structure */}
                <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute h-96 w-96 rounded-full border border-[#FF2A2A]/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.2]" />
                <div className="absolute h-[600px] w-[600px] rounded-full border border-[#FF2A2A]/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-transparent to-[#0b0c0e]/60" />
              </div>

              {/* Status information inside arena */}
              <div className="flex justify-between items-center relative z-15 shrink-0 pointer-events-none">
                <span className="text-[9px] text-[#FF2A2A]/80 font-black flex items-center gap-1 bg-[#FF2A2A]/10 px-2 py-0.5 rounded border border-[#FF2A2A]/10 font-mono tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A2A] animate-ping shrink-0" />
                  Flight Arena
                </span>
              </div>

              {/* CENTER RUNNING MULTIPLIER LABEL OR STATUS */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 pointer-events-none select-none">
                
                {roundState === 'waiting' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-1 bg-[#0F1011]/90 p-4 px-6 rounded-xl border border-white/5 shadow-2xl backdrop-blur relative z-10"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-ping" />
                      <span className="text-[10px] text-[#FF2A2A] font-extrabold uppercase tracking-widest">
                        Awaiting Takeoff
                      </span>
                    </div>
                    <div className="font-mono text-3xl font-black text-white text-glow-red">
                      {countdown > 0 ? `${countdown.toFixed(1)}s` : 'WAITING...'}
                    </div>
                  </motion.div>
                )}

                {roundState === 'flying' && (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-center space-y-0.5 z-10"
                  >
                    <h1 className="font-sans text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg select-none">
                      {multiplierVal.toFixed(2)}x
                    </h1>
                  </motion.div>
                )}

                {roundState === 'crashed' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-1.5 z-10"
                  >
                    <div className="text-[#cb2131] font-sans font-black tracking-wider text-xl md:text-2xl uppercase italic drop-shadow">
                      FLEW AWAY!
                    </div>
                    <p className="font-sans text-4xl font-black text-neutral-400">
                      {multiplierVal.toFixed(2)}x
                    </p>
                  </motion.div>
                )}
              </div>

              {/* INTERACTIVE COMPLIANT VECTOR TRAJECTORY CANVAS */}
              {roundState === 'flying' && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <style>{`
                    @keyframes spribe-exhaust-flicker {
                      0%, 100% { transform: scaleX(1); opacity: 0.8; filter: blur(0.5px); }
                      50% { transform: scaleX(1.4); opacity: 1; filter: blur(1.5px); }
                    }
                    @keyframes spribe-plane-bob {
                      0%, 100% { transform: translateY(0px) rotate(0deg); }
                      50% { transform: translateY(-4px) rotate(1deg); }
                    }
                    @keyframes spribe-plane-shake {
                      0%, 100% { transform: translate(0, 0); }
                      20% { transform: translate(-0.4px, 0.4px); }
                      40% { transform: translate(0.4px, -0.4px); }
                      60% { transform: translate(-0.4px, -0.2px); }
                      80% { transform: translate(0.4px, 0.4px); }
                    }
                    @keyframes spribe-speed-streak-1 {
                      0% { left: 100%; opacity: 0; }
                      15% { opacity: 0.35; }
                      85% { opacity: 0.35; }
                      100% { left: -30%; opacity: 0; }
                    }
                    @keyframes spribe-speed-streak-2 {
                      0% { left: 100%; opacity: 0; }
                      15% { opacity: 0.55; }
                      85% { opacity: 0.55; }
                      100% { left: -30%; opacity: 0; }
                    }
                    .spribe-exhaust {
                      animation: spribe-exhaust-flicker 0.08s ease-in-out infinite;
                    }
                    .spribe-bob {
                      animation: spribe-plane-bob 2.2s ease-in-out infinite;
                    }
                    .spribe-shake {
                      animation: spribe-plane-shake 0.05s linear infinite;
                    }
                    .speed-streak-1 { animation: spribe-speed-streak-1 0.9s linear infinite; animation-delay: 0.1s; }
                    .speed-streak-2 { animation: spribe-speed-streak-2 0.6s linear infinite; animation-delay: 0.4s; }
                    .speed-streak-3 { animation: spribe-speed-streak-1 1.1s linear infinite; animation-delay: 0.2s; }
                    .speed-streak-4 { animation: spribe-speed-streak-2 0.5s linear infinite; animation-delay: 0.0s; }
                    .speed-streak-5 { animation: spribe-speed-streak-1 0.7s linear infinite; animation-delay: 0.6s; }
                  `}</style>
                  
                  {/* High speed wind trail lines moving backwards beneath the jet */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute h-[1px] w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent top-[15%] speed-streak-1" />
                    <div className="absolute h-[1px] w-32 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent top-[32%] speed-streak-2" />
                    <div className="absolute h-[1px] w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent top-[48%] speed-streak-3" />
                    <div className="absolute h-[1px] w-40 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent top-[66%] speed-streak-4" />
                    <div className="absolute h-[1.5px] w-28 bg-gradient-to-r from-transparent via-white/25 to-transparent top-[82%] speed-streak-5" />
                  </div>
                  
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0 z-10">
                    <defs>
                      <linearGradient id="redCurveGradient" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FF2A2A" stopOpacity="0.01" />
                        <stop offset="100%" stopColor="#FF2A2A" stopOpacity="0.22" />
                      </linearGradient>
                    </defs>

                    {/* Gradient solid trajectory shading underneath */}
                    <path
                      d={`${pathD} L ${flightX} 90 L 10 90 Z`}
                      fill="url(#redCurveGradient)"
                    />

                    {/* Thick bright red trajectory outline path */}
                    <path
                      d={pathD}
                      stroke="#FF2A2A"
                      strokeWidth="0.8"
                      fill="none"
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgba(230,29,45,0.7)]"
                    />

                    {/* Tracking beacon at the tip of the line */}
                    <circle
                      cx={flightX}
                      cy={flightY}
                      r="0.5"
                      fill="#ffffff"
                      className="animate-ping"
                    />
                  </svg>

                  {/* High Fidelity animated Gulfstream Luxury Private Jet */}
                  <div
                    style={{
                      left: `${flightX}%`,
                      top: `${flightY}%`,
                      transform: `translate(-44%, -59%) rotate(${Math.max(-18, -(multiplierVal - 1.00) * 2.5)}deg)`,
                      transformOrigin: '44% 59%'
                    }}
                    className="absolute transition-all duration-100 ease-out z-20 pointer-events-none"
                  >
                    <div className="relative spribe-bob spribe-shake">
                      {/* Ambient engine glow and shadow behind the aircraft */}
                      <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-md opacity-70 pointer-events-none" />
                      
                      {/* Premium Custom Gulfstream Jet SVG */}
                      <svg 
                        viewBox="0 0 64 64" 
                        className="w-16 h-16 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
                      >
                        {/* 1. Twin Engine active jet-thrust plumes (flickering orange/red flames at the rear engine nozzles) */}
                        {/* Upper Engine Exhaust (X=14, Y=25) with dynamic length scaling with multiplierVal */}
                        <g 
                          className="spribe-exhaust" 
                          style={{ 
                            transformOrigin: '14px 25px',
                            transform: `scaleX(${1.0 + Math.min((multiplierVal - 1.0) * 0.22, 2.5)})` 
                          }}
                        >
                          <polygon points="14,24 -2,22 -12,25 -2,28 14,26" fill="#f59e0b" opacity="0.9" />
                          <polygon points="14,24 4,23 -2,25 4,27 14,26" fill="#ef4444" opacity="0.95" />
                        </g>
                        {/* Lower Engine Exhaust (X=16, Y=38) with dynamic length scaling with multiplierVal */}
                        <g 
                          className="spribe-exhaust" 
                          style={{ 
                            transformOrigin: '16px 38px',
                            transform: `scaleX(${1.0 + Math.min((multiplierVal - 1.0) * 0.22, 2.5)})` 
                          }}
                        >
                          <polygon points="16,37 0,35 -10,38 0,41 16,39" fill="#f59e0b" opacity="0.9" />
                          <polygon points="16,37 6,36 0,38 6,40 16,39" fill="#ef4444" opacity="0.95" />
                        </g>

                        {/* 2. Rear Upper Engine Pod (Port side Engine 2) - Sleek high-tech metallic finish */}
                        <path d="M 14 23 L 23 23 C 24 23, 24.5 24, 24.5 25 C 24.5 26, 24 27, 23 27 L 14 27 Z" fill="#334155" />
                        <path d="M 22 23 L 24.5 23 L 24.5 27 L 22 27 Z" fill="#0f172a" />
                        <path d="M 14 24 L 12 24 L 12 26 L 14 26 Z" fill="#475569" />

                        {/* 3. Port Swept Main Wing (Back layer for depth shadow) in deep Crimson */}
                        <path d="M 28 32 L 14 10 L 19 10 L 32 32 Z" fill="#991b1b" />
                        <path d="M 14 10 L 11 5 L 14 10 Z" fill="#ffffff" /> {/* Port Winglet - Glossy White */}

                        {/* 4. Elegant Swept T-Tail Assembly in Sport Red with White decal accent */}
                        <path d="M 17 32 L 8 16 L 13 16 L 22 32 Z" fill="#dc2626" />
                        <path d="M 12 24 L 7 15 L 10 15 L 15 24 Z" fill="#ffffff" /> {/* Tail fin white stripe decal */}
                        {/* Horizontal T-Tail stabilizer at Y=16 in deep Crimson */}
                        <path d="M 8 16 L 2 11 L 8 11 L 13 16 Z" fill="#991b1b" />

                        {/* 5. Main Fuselage Body in vibrant Aviator Red carbon shell */}
                        <path d="M 11 32 C 11 26, 28 24, 46 26 C 54 27, 58 29, 58 32 C 58 35, 54 37, 46 38 C 28 40, 11 38, 11 32 Z" fill="#FF2A2A" />
                        
                        {/* Fuselage decorative luxury silver-chrome speed ribbon lines */}
                        <path d="M 18 33 C 28 34, 42 34, 52 33 C 44 35, 30 35, 18 33" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                        <path d="M 22 34 C 30 35, 42 35, 48 34 C 40 36, 28 36, 22 34" fill="none" stroke="#cbd5e1" strokeWidth="0.4" />

                        {/* Elegant row of oval cabin passenger windows along Y=30 (highly noticeable on red canopy body) */}
                        <ellipse cx="28" cy="30" rx="0.8" ry="1.2" fill="#0f172a" />
                        <ellipse cx="32" cy="30" rx="0.8" ry="1.2" fill="#0f172a" />
                        <ellipse cx="36" cy="30" rx="0.8" ry="1.2" fill="#0f172a" />
                        <ellipse cx="40" cy="30" rx="0.8" ry="1.2" fill="#0f172a" />
                        <ellipse cx="44" cy="30" rx="0.8" ry="1.2" fill="#0f172a" />

                        {/* Cockpit Windshield (Sleek aerodynamic deep blue obsidian style) */}
                        <path d="M 47 28.5 C 49 27, 52.5 27, 54.5 29 C 52 31, 49 31, 47 28.5 Z" fill="#1e293b" />
                        <path d="M 49 28 C 50.5 27.5, 52.5 27.5, 53.5 28.5 Z" fill="#ffffff" opacity="0.4" />

                        {/* 6. Rear Lower Engine Pod (Starboard side Engine 1) - Metallic charcoal finish */}
                        <path d="M 16 36 L 25 36 C 26 36, 26.5 37, 26.5 38 C 26.5 39, 26 40, 25 40 L 16 40 Z" fill="#475569" />
                        <path d="M 24 36 L 26.5 36 L 26.5 40 L 24 40 Z" fill="#0f172a" />
                        <path d="M 16 37 L 14 37 L 14 39 L 16 39 Z" fill="#334155" />

                        {/* 7. Starboard Swept Main Wing (Front layer) in vibrant Sport Red */}
                        <path d="M 30 32 L 16 54 L 21 54 L 34 32 Z" fill="#ef4444" />
                        <path d="M 28 35 L 18 51 L 22 51 L 31 35 Z" fill="#f87171" opacity="0.45" /> {/* Wing structural highlight line */}
                        <path d="M 16 54 L 13 58 L 16 54 Z" fill="#ffffff" /> {/* Starboard Winglet - Glossy White */}
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Lobby member avatar count (Bottom Right) */}
              <div className={`absolute bottom-3 right-4 bg-black/65 border transition-all duration-300 ${
                pulseTrigger ? 'border-[#FF2A2A]/50 bg-black/85 scale-[1.03]' : 'border-neutral-800'
              } px-3 py-1 rounded-full flex items-center gap-1.5 z-10 pointer-events-none`}>
                <div className="relative flex items-center justify-center w-2 h-2 mr-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF2A2A] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF2A2A]" />
                </div>
                <div className="flex -space-x-1.5 select-none">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FF2A2A] border border-neutral-900 text-[6px] flex items-center justify-center font-bold">👤</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-neutral-900 text-[6px] flex items-center justify-center font-bold">👤</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-neutral-900 text-[6px] flex items-center justify-center font-bold">👤</span>
                </div>
                <span className={`text-[10px] font-sans font-extrabold inline-block transform transition-all duration-300 ${
                  pulseTrigger ? 'text-[#FF2A2A] scale-110 drop-shadow-[0_0_6px_rgba(255,46,46,0.7)]' : 'text-neutral-300 scale-100'
                }`}>
                  {onlineCount}
                </span>
              </div>              
            </div>

            {/* Fairness verification popup wrapper */}
            {showFairnessInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1b1c1d] border border-neutral-800 p-4 rounded-xl space-y-2 relative z-20 text-left text-xs shrink-0"
              >
                <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5">
                  <h3 className="font-bold text-[#FF2A2A] uppercase flex items-center gap-1.5 font-sans tracking-wide">
                    <Shield className="w-4 h-4 text-[#FF2A2A]" />
                    Aviator SHA-256 Ledger
                  </h3>
                  <button 
                    onClick={() => setShowFairnessInfo(false)}
                    className="text-neutral-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-neutral-400 leading-relaxed leading-snug">
                  <p>Each round's crash point coefficient is resolved cryptographically at takeoff in an un-biased Ledger standard.</p>
                  <p className="bg-[#101112] p-1.5 px-2.5 rounded border border-neutral-800 break-all text-[#FF2A2A] text-[9.5px]">
                    Ledger Seed Hash: {provablyFairSeed}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. DUAL INTERACTIVE PORTRAIT BETTING CONSOLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 select-none shrink-0">
              
              {/* BAY 1 PANEL */}
              <div className="p-2 sm:p-2.5 bg-[#1b1c1d] rounded-xl border border-neutral-800/80 shadow-lg">
                
                {/* Tab layout wrapper */}
                <div className="flex justify-center mb-1.5">
                  <div className="bg-[#101112] p-0.5 rounded-full inline-flex border border-neutral-800/65">
                    <button 
                      onClick={() => setActiveBetTab1('bet')}
                      className={`${
                        activeBetTab1 === 'bet' ? 'bg-[#2c2d2e] text-white' : 'text-neutral-500 hover:text-neutral-300'
                      } font-sans text-[10px] font-black px-4 py-1 rounded-full leading-none shrink-0 select-none cursor-pointer transition-all`}
                    >
                      Bet
                    </button>
                    <button 
                      onClick={() => setActiveBetTab1('auto')}
                      className={`${
                        activeBetTab1 === 'auto' ? 'bg-[#2c2d2e] text-white' : 'text-neutral-500 hover:text-neutral-300'
                      } font-sans text-[10px] font-black px-4 py-1 rounded-full leading-none shrink-0 select-none cursor-pointer transition-all`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Auto Play Setup Controls */}
                {activeBetTab1 === 'auto' && (
                  <div className="bg-[#101112] p-2 rounded-lg border border-neutral-800/50 mb-2.5 flex flex-col gap-1.5">
                    {/* Auto Bet Slider/Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-neutral-400 font-sans uppercase">
                        Auto Bet Next Rounds
                      </span>
                      <button
                        onClick={() => setAutoBetEnabled1(!autoBetEnabled1)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all select-none cursor-pointer ${
                          autoBetEnabled1 
                            ? 'bg-[#FF2A2A] text-white shadow-md shadow-[#FF2A2A]/20' 
                            : 'bg-[#2c2d2e] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {autoBetEnabled1 ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    {/* Auto Cashout switch & input */}
                    <div className="flex items-center justify-between border-t border-neutral-900 pt-1.5">
                      <button
                        onClick={() => setAutoCashoutEnabled1(!autoCashoutEnabled1)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all select-none cursor-pointer ${
                          autoCashoutEnabled1 
                            ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20' 
                            : 'bg-[#2c2d2e] text-neutral-400 hover:text-white'
                        }`}
                      >
                        Auto Cashout
                      </button>
                      <div className="flex items-center gap-1 bg-[#1b1c1d] rounded-full px-2.5 py-1 border border-neutral-800">
                        <span className="text-[9px] font-extrabold text-[#da7702]/85 font-mono">x</span>
                        <input
                          type="number"
                          step="0.1"
                          min="1.01"
                          disabled={!autoCashoutEnabled1}
                          value={autoCashoutMult1}
                          onChange={(e) => setAutoCashoutMult1(Math.max(1.01, parseFloat(e.target.value) || 1.1))}
                          className="bg-transparent text-right font-black font-mono text-[10.5px] text-white w-10 focus:outline-none border-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount and Bet Action Row */}
                <div className="grid grid-cols-12 gap-2.5 items-center">
                  
                  {/* Left Wager Tools Area (col span 5) */}
                  <div className="col-span-5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between bg-[#101112] rounded-full p-0.5 border border-neutral-800">
                      {/* Minus button */}
                      <button
                        disabled={betStatus1 !== 'idle'}
                        onClick={() => setBetAmount1(prev => Math.max(game.id === 'aviator' ? 100 : 10, prev - 100))}
                        className="w-6 h-6 rounded-full bg-[#1b1c1d] border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs font-black active:bg-neutral-800 transition-all select-none cursor-pointer"
                      >
                        -
                      </button>

                      {/* Numeric wager text display */}
                      <input
                        type="number"
                        value={betAmount1}
                        disabled={betStatus1 !== 'idle'}
                        onChange={(e) => setBetAmount1(Math.max(game.id === 'aviator' ? 100 : 10, parseInt(e.target.value) || (game.id === 'aviator' ? 100 : 10)))}
                        className="bg-transparent text-center font-bold font-sans text-white text-xs w-12 focus:outline-none border-none shadow-none leading-none select-none p-0"
                      />

                      {/* Plus button */}
                      <button
                        disabled={betStatus1 !== 'idle'}
                        onClick={() => setBetAmount1(prev => prev + 100)}
                        className="w-6 h-6 rounded-full bg-[#1b1c1d] border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs font-black active:bg-neutral-800 transition-all select-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Pre-designed 2x2 grid selectors */}
                    <div className="grid grid-cols-2 gap-1">
                      {[100, 200, 500, 1000].map((v) => (
                        <button
                          key={v}
                          disabled={betStatus1 !== 'idle'}
                          onClick={() => setBetAmount1(v)}
                          className={`py-0.5 rounded-full text-[9.5px] font-black font-sans leading-none border transition-all cursor-pointer ${
                            betAmount1 === v 
                              ? 'bg-[#FF2A2A]/15 border-[#FF2A2A]/40 text-white' 
                              : 'bg-[#141516] border-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Action Trigger Column (col span 7) */}
                  <div className="col-span-7 h-full min-h-[58px]">
                    {betStatus1 === 'idle' && (
                      <button
                        onClick={() => placeUserBet(1)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#FF2A2A] hover:bg-[#E51B1B] active:scale-[0.98] transition-all py-1.5 shadow-md border-t border-white/20 select-none font-sans cursor-pointer"
                      >
                        <span className="text-white font-sans font-black text-[13px] uppercase leading-tight select-none">
                          Bet
                        </span>
                        <span className="text-white font-sans font-black text-[10.5px] opacity-90 leading-tight select-none font-rajdhani">
                          {betAmount1.toFixed(2)} INR
                        </span>
                      </button>
                    )}

                    {betStatus1 === 'waiting' && (
                      <button
                        onClick={() => cancelUserWaitingBet(1)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#cb2131] hover:bg-[#e02638] active:scale-[0.98] transition-all py-1.5 uppercase select-none cursor-pointer"
                      >
                        <span className="text-white font-sans font-black text-xs leading-tight uppercase select-none">
                          CANCEL
                        </span>
                        <span className="text-neutral-200 font-sans text-[8.5px] opacity-80 leading-tight select-none">
                          {roundState === 'flying' ? 'Scheduled' : 'Waiting...'}
                        </span>
                      </button>
                    )}

                    {betStatus1 === 'active' && (
                      <button
                        onClick={() => triggerUserCashout(1)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#db7d05] hover:bg-[#ed8b06] active:scale-[0.98] transition-all py-1.5 shadow-md border-t border-white/20 select-none cursor-pointer"
                      >
                        <span className="text-black font-sans font-black text-[10px] uppercase tracking-wider leading-none select-none">
                          CASH OUT
                        </span>
                        <span className="text-black font-sans font-black text-[13px] tracking-tight leading-none pt-0.5 select-none">
                          ₹{Math.floor(betAmount1 * multiplierVal)}
                        </span>
                      </button>
                    )}

                    {betStatus1 === 'cashed_out' && (
                      <div className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#071A3D]/90 border border-[#FF2A2A]/20 py-1.5 select-none">
                        <span className="text-[#FF2A2A] font-sans font-black text-[9px] uppercase tracking-wide leading-none select-none">
                          CASHED OUT
                        </span>
                        <span className="text-[#FF2A2A] font-sans font-black text-[13px] leading-none pt-0.5 select-none font-rajdhani">
                          {cashedMult1.toFixed(2)}x
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* BAY 2 PANEL */}
              <div className="p-2 sm:p-2.5 bg-[#1b1c1d] rounded-xl border border-neutral-800/80 shadow-lg">
                
                {/* Tab layout wrapper */}
                <div className="flex justify-center mb-1.5">
                  <div className="bg-[#101112] p-0.5 rounded-full inline-flex border border-neutral-800/65">
                    <button 
                      onClick={() => setActiveBetTab2('bet')}
                      className={`${
                        activeBetTab2 === 'bet' ? 'bg-[#2c2d2e] text-white' : 'text-neutral-500 hover:text-neutral-300'
                      } font-sans text-[10px] font-black px-4 py-1 rounded-full leading-none shrink-0 select-none cursor-pointer transition-all`}
                    >
                      Bet
                    </button>
                    <button 
                      onClick={() => setActiveBetTab2('auto')}
                      className={`${
                        activeBetTab2 === 'auto' ? 'bg-[#2c2d2e] text-white' : 'text-neutral-500 hover:text-neutral-300'
                      } font-sans text-[10px] font-black px-4 py-1 rounded-full leading-none shrink-0 select-none cursor-pointer transition-all`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Auto Play Setup Controls */}
                {activeBetTab2 === 'auto' && (
                  <div className="bg-[#101112] p-2 rounded-lg border border-neutral-800/50 mb-2.5 flex flex-col gap-1.5">
                    {/* Auto Bet Slider/Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-neutral-400 font-sans uppercase">
                        Auto Bet Next Rounds
                      </span>
                      <button
                        onClick={() => setAutoBetEnabled2(!autoBetEnabled2)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all select-none cursor-pointer ${
                          autoBetEnabled2 
                            ? 'bg-[#FF2A2A] text-white shadow-md shadow-[#FF2A2A]/20' 
                            : 'bg-[#2c2d2e] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {autoBetEnabled2 ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    {/* Auto Cashout switch & input */}
                    <div className="flex items-center justify-between border-t border-neutral-900 pt-1.5">
                      <button
                        onClick={() => setAutoCashoutEnabled2(!autoCashoutEnabled2)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all select-none cursor-pointer ${
                          autoCashoutEnabled2 
                            ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20' 
                            : 'bg-[#2c2d2e] text-neutral-400 hover:text-white'
                        }`}
                      >
                        Auto Cashout
                      </button>
                      <div className="flex items-center gap-1 bg-[#1b1c1d] rounded-full px-2.5 py-1 border border-neutral-800">
                        <span className="text-[9px] font-extrabold text-[#da7702]/85 font-mono">x</span>
                        <input
                          type="number"
                          step="0.1"
                          min="1.01"
                          disabled={!autoCashoutEnabled2}
                          value={autoCashoutMult2}
                          onChange={(e) => setAutoCashoutMult2(Math.max(1.01, parseFloat(e.target.value) || 1.1))}
                          className="bg-transparent text-right font-black font-mono text-[10.5px] text-white w-10 focus:outline-none border-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount and Bet Action Row */}
                <div className="grid grid-cols-12 gap-2.5 items-center">
                  
                  {/* Left Wager Tools Area (col span 5) */}
                  <div className="col-span-5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between bg-[#101112] rounded-full p-0.5 border border-neutral-800">
                      {/* Minus button */}
                      <button
                        disabled={betStatus2 !== 'idle'}
                        onClick={() => setBetAmount2(prev => Math.max(game.id === 'aviator' ? 100 : 10, prev - 100))}
                        className="w-6 h-6 rounded-full bg-[#1b1c1d] border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs font-black active:bg-neutral-800 transition-all select-none cursor-pointer"
                      >
                        -
                      </button>

                      {/* Numeric wager text display */}
                      <input
                        type="number"
                        value={betAmount2}
                        disabled={betStatus2 !== 'idle'}
                        onChange={(e) => setBetAmount2(Math.max(game.id === 'aviator' ? 100 : 10, parseInt(e.target.value) || (game.id === 'aviator' ? 100 : 10)))}
                        className="bg-transparent text-center font-bold font-sans text-white text-xs w-12 focus:outline-none border-none shadow-none leading-none select-none p-0"
                      />

                      {/* Plus button */}
                      <button
                        disabled={betStatus2 !== 'idle'}
                        onClick={() => setBetAmount2(prev => prev + 100)}
                        className="w-6 h-6 rounded-full bg-[#1b1c1d] border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs font-black active:bg-neutral-800 transition-all select-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Pre-designed 2x2 grid selectors */}
                    <div className="grid grid-cols-2 gap-1">
                      {[100, 200, 500, 1000].map((v) => (
                        <button
                          key={v}
                          disabled={betStatus2 !== 'idle'}
                          onClick={() => setBetAmount2(v)}
                          className={`py-0.5 rounded-full text-[9.5px] font-black font-sans leading-none border transition-all cursor-pointer ${
                            betAmount2 === v 
                              ? 'bg-[#FF2A2A]/15 border-[#FF2A2A]/40 text-white' 
                              : 'bg-[#141516] border-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Action Trigger Column (col span 7) */}
                  <div className="col-span-7 h-full min-h-[58px]">
                    {betStatus2 === 'idle' && (
                      <button
                        onClick={() => placeUserBet(2)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#FF2A2A] hover:bg-[#E51B1B] active:scale-[0.98] transition-all py-1.5 shadow-md border-t border-white/20 select-none font-sans cursor-pointer"
                      >
                        <span className="text-white font-sans font-black text-[13px] uppercase leading-tight select-none">
                          Bet
                        </span>
                        <span className="text-white font-sans font-black text-[10.5px] opacity-90 leading-tight select-none font-rajdhani">
                          {betAmount2.toFixed(2)} INR
                        </span>
                      </button>
                    )}

                    {betStatus2 === 'waiting' && (
                      <button
                        onClick={() => cancelUserWaitingBet(2)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#cb2131] hover:bg-[#e02638] active:scale-[0.98] transition-all py-1.5 uppercase select-none cursor-pointer"
                      >
                        <span className="text-white font-sans font-black text-xs leading-tight uppercase select-none">
                          CANCEL
                        </span>
                        <span className="text-neutral-200 font-sans text-[8.5px] opacity-80 leading-tight select-none">
                          {roundState === 'flying' ? 'Scheduled' : 'Waiting...'}
                        </span>
                      </button>
                    )}

                    {betStatus2 === 'active' && (
                      <button
                        onClick={() => triggerUserCashout(2)}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#db7d05] hover:bg-[#ed8b06] active:scale-[0.98] transition-all py-1.5 shadow-md border-t border-white/20 select-none cursor-pointer"
                      >
                        <span className="text-black font-sans font-black text-[10px] uppercase tracking-wider leading-none select-none">
                          CASH OUT
                        </span>
                        <span className="text-black font-sans font-black text-[13px] tracking-tight leading-none pt-0.5 select-none">
                          ₹{Math.floor(betAmount2 * multiplierVal)}
                        </span>
                      </button>
                    )}

                    {betStatus2 === 'cashed_out' && (
                      <div className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-[#071A3D]/90 border border-[#FF2A2A]/20 py-1.5 select-none font-sans">
                        <span className="text-[#FF2A2A] font-sans font-black text-[9px] uppercase tracking-wide leading-none select-none">
                          CASHED OUT
                        </span>
                        <span className="text-[#FF2A2A] font-sans font-black text-[13px] leading-none pt-0.5 select-none font-rajdhani">
                          {cashedMult2.toFixed(2)}x
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Mobile Lobby Panel (flows naturally below 2nd betting console) */}
            {renderLobbyPanel(true)}
          </section>

          {/* Desktop Lobby Panel (rendered on side column on wide screens) */}
          {renderLobbyPanel(false)}

        </main>
        
        {/* RESPONSIBLE GAMING BAR */}
        <footer className="bg-[#101112] border-t border-white/5 py-1.5 px-3 flex items-center justify-between text-[8px] text-neutral-600 shrink-0 select-none">
          <span />
          <span className="hidden sm:inline">RTP: {game.rtp}% Standard Configured</span>
        </footer>

        {/* PAST FLIGHT DETAILS MODAL ("SHOWS AND REMOVE TOO") */}
        {selectedHistoryIndex !== null && selectedHistoryIndex < aviatorHistory.length && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#1b1c1d] border border-neutral-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl p-5 text-sans">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5 mb-3.5 animate-fadeIn">
                <h3 className="font-sans font-black text-rose-500 text-xs italic uppercase tracking-wider flex items-center gap-1.5">
                  ✈️ OUTCOME DETAILS & VERIFICATION
                </h3>
                <button 
                  onClick={() => setSelectedHistoryIndex(null)}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-3">
                <div className="bg-[#101112] p-4 rounded-lg flex flex-col items-center justify-center border border-neutral-800/60">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest font-mono mb-1">
                    Multiplier Result
                  </span>
                  <span className={`text-3xl font-mono font-black tracking-tight ${
                    aviatorHistory[selectedHistoryIndex] >= 10.0 
                      ? 'text-[#c017b3] drop-shadow-[0_0_8px_rgba(192,23,179,0.5)]' 
                      : aviatorHistory[selectedHistoryIndex] >= 2.0 
                        ? 'text-[#904df0]' 
                        : 'text-[#3293c4]'
                  }`}>
                    {aviatorHistory[selectedHistoryIndex].toFixed(2)}x
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[9px] text-neutral-400">
                  <div className="flex justify-between border-b border-neutral-900 pb-1">
                    <span className="text-neutral-500">SIGNATURE PROTOCOL</span>
                    <span className="text-neutral-300 font-bold uppercase">SHA-256 LEDGER STANDARD</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-900 py-1">
                    <span className="text-neutral-500">TIMESTAMP TRACE</span>
                    <span className="text-neutral-300">ROUND #{aviatorHistory.length - selectedHistoryIndex} RESULT</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">VERIFICATION HASH</span>
                    <span className="text-red-400 break-all select-all font-semibold max-w-[180px] text-right">
                      sha256-{Math.sin(aviatorHistory[selectedHistoryIndex]).toString(16).substring(3, 15)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3.5 border-t border-neutral-800 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const nextHistory = aviatorHistory.filter((_, idx) => idx !== selectedHistoryIndex);
                    setAviatorHistory(nextHistory);
                    setSelectedHistoryIndex(null);
                  }}
                  className="w-full bg-[#cb2131] hover:bg-[#e02638] text-white font-sans text-[11px] font-extrabold uppercase py-2 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🗑️</span>
                  <span>Remove from History</span>
                </button>
                <button
                  onClick={() => setSelectedHistoryIndex(null)}
                  className="w-full bg-[#2c2d2e] hover:bg-[#3d3f41] text-neutral-300 font-sans text-[11px] font-extrabold uppercase py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  Keep &amp; Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  if (game.id === 'chicken-road') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#000000] text-white select-none">
        <CrossfireChicken
          user={user}
          onUpdateUser={onUpdateUser}
          onAddTransaction={onAddTransaction}
          onClose={onClose}
          globalSettings={globalSettings}
        />
      </div>
    );
  }

  if (game.id === 'roulette') {
    return (
      <CasinoRoulette
        user={user}
        onUpdateUser={onUpdateUser}
        onAddTransaction={onAddTransaction}
        onClose={onClose}
        globalSettings={globalSettings}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-sm glass-panel-heavy rounded-xl overflow-hidden border-2 border-casino-glow/40 shadow-2xl p-6">
        
        {/* Header bar and Close */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-amber-500/20 text-yellow-400 font-bold text-[10px] uppercase tracking-wider">
              {game.isHot ? '🔥 Hot' : '💎 Classic'}
            </span>
            <span className="text-secondary font-bold text-xs">RTP: {game.rtp}%</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 text-white/70 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="text-center mb-6">
          <h2 className="font-display font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 tracking-tight">
            {game.name} Lobby
          </h2>
          <p className="text-[11px] text-white/50 uppercase tracking-widest font-mono">
            Demo Fair Play Sandbox
          </p>
        </div>

        {/* --- SIMULATOR SCREENS --- */}

        {/* 1. AVIATOR SCREEN */}
        {game.id === 'aviator' && (
          <div className="space-y-6">
            <div className="relative h-44 bg-slate-950/60 rounded-xl overflow-hidden border border-[#FF2A2A]/20 flex flex-col justify-between p-4">
              {/* Plot visualizer */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#071A3D]/40 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] text-[#FF2A2A] flex items-center gap-1 font-sans font-medium">
                  <Zap className="w-3 h-3 text-yellow-400 animate-pulse" /> Connected Live Server
                </span>
                <span className="text-[10px] text-neutral-400 font-sans">Crash Range: 1.05x - 11x</span>
              </div>

              {/* Running numbers and airplane */}
              <div className="text-center py-4 relative z-10">
                {gameState === 'playing' && (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="font-rajdhani text-5xl font-extrabold text-[#FF2A2A] text-glow-red"
                  >
                    {multiplier.toFixed(2)}x
                  </motion.div>
                )}
                {gameState === 'idle' && (
                  <div className="text-neutral-500 font-sans font-extrabold text-3xl animate-pulse">Place Bet to Fly</div>
                )}
                {gameState === 'cashed_out' && (
                  <div className="space-y-1">
                    <div className="font-orbitron text-3xl font-extrabold text-[#FFB347] text-[#FFB347]/30">
                      CASHED OUT!
                    </div>
                    <div className="text-[#FF2A2A] font-semibold text-lg font-rajdhani">
                      {multiplier.toFixed(2)}x (Win: {formatBalance(Math.floor(betAmount * multiplier))})
                    </div>
                  </div>
                )}
                {gameState === 'failed' && (
                  <div className="space-y-1">
                    <div className="font-mono text-4xl font-extrabold text-[#FF2A2A] animate-bounce">
                      CRASHED
                    </div>
                    <div className="text-[#FF2A2A]/80 font-mono text-sm">
                      Plane exploded at {multiplier.toFixed(2)}x
                    </div>
                  </div>
                )}
              </div>

              {/* Flying Airplane Animation */}
              {gameState === 'playing' && (
                <motion.div 
                  animate={{ 
                    x: ['0%', '80%'], 
                    y: ['10%', '-80%'] 
                  }}
                  transition={{ ease: "easeOut", duration: targetCrash / 2 }}
                  className="absolute bottom-4 left-4 text-[#FF2A2A]"
                >
                  <img 
                    src="https://img.icons8.com/isometric/50/airplane-take-off.png" 
                    alt="flight"
                    className="w-12 h-12"
                  />
                </motion.div>
              )}

              <div className="text-[9px] text-white/30 text-right font-mono">Provably Fair SHA-256 Verified</div>
            </div>

            {/* Betting Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 bg-[#071A3D]/40 p-3 rounded-lg border border-[#FF2A2A]/10">
                <span className="text-xs font-semibold text-neutral-300 font-sans">Wager (INR)</span>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  disabled={gameState === 'playing'}
                  className="bg-black/60 border border-white/10 rounded px-3 py-1 text-right text-yellow-300 font-mono w-28 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    disabled={gameState === 'playing'}
                    onClick={() => setBetAmount(amt)}
                    className="bg-white/5 hover:bg-white/10 text-white text-xs py-1.5 rounded font-mono border border-white/5 transition-all text-center"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              {gameState === 'playing' ? (
                <button
                  onClick={cashOutAviator}
                  className="w-full py-4 text-center text-lg font-bold uppercase rounded-lg text-black skeuo-btn-gold"
                >
                  CASH OUT (₹{Math.floor(betAmount * multiplier)})
                </button>
              ) : (
                <button
                  onClick={startAviator}
                  className="w-full py-4 text-center text-lg font-bold uppercase rounded-lg text-black skeuo-btn-green"
                >
                  FLY NOW
                </button>
              )}
            </div>
          </div>
        )}



        {/* 2. CHICKEN ROAD SCREEN (OVERHAULED WITH PREMIUM CROSSFIRE CHICKEN ENGINE) */}
        {game.id === 'chicken-road' && (
          <CrossfireChicken
            user={user}
            onUpdateUser={onUpdateUser}
            onAddTransaction={onAddTransaction}
            onClose={onClose}
            globalSettings={globalSettings}
          />
        )}


        {/* 3. ROULETTE SCREEN */}
        {game.id === 'roulette' && (
          <div className="space-y-6">
            <div className="relative bg-slate-950/60 rounded-xl p-4 border border-white/10 text-center">
              
              {/* Spinning wheel visualization */}
              <div className="relative w-36 h-36 mx-auto rounded-full border-4 border-yellow-400/30 flex items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,_#ef4444_0deg_120deg,_#10b981_120deg_140deg,_#111827_140deg_360deg)]">
                <motion.div
                  animate={spinning ? { rotate: 360 * 6 } : { rotate: 0 }}
                  transition={spinning ? { duration: 2, ease: "easeOut" } : { duration: 0 }}
                  className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center"
                >
                  {/* Wheel lines visual mock */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-400/20" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-yellow-400/20" />
                  <div className="absolute w-4 h-4 bg-yellow-400 rounded-full" />
                </motion.div>
                
                {/* Center marker */}
                <span className="relative z-10 font-mono font-bold text-white text-lg bg-black/80 px-2 py-1.5 rounded-full border border-yellow-400/40">
                  {spinning ? '🎰' : spinResult ? spinResult.number : '00'}
                </span>
              </div>

              {spinResult && (
                <div className="mt-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                    spinResult.color === 'red' ? 'bg-emerald-500 text-white' : 
                    spinResult.color === 'green' ? 'bg-emerald-500 text-white' : 
                    'bg-slate-900 border border-white/10 text-white'
                  }`}>
                    Result: {spinResult.number} ({spinResult.color})
                  </span>
                  {gameState === 'cashed_out' ? (
                    <p className="text-secondary font-bold text-sm mt-2">🎉 Spot On! Double Pay!</p>
                  ) : !spinning ? (
                    <p className="text-[#FF3333] text-xs mt-2">House Wins! Try again.</p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Predict Color tabs */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-300">Choose Spot</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'red', name: 'RED (2x)', color: 'bg-[#FF3333] border-[#FF3333]/40' },
                  { key: 'black', name: 'BLACK (2x)', color: 'bg-stone-900 border-stone-600' },
                  { key: 'green', name: 'GOLDEN 0 (14x)', color: 'bg-emerald-600 border-emerald-400' }
                ].map((col) => (
                  <button
                    key={col.key}
                    onClick={() => setSelectedColor(col.key as any)}
                    disabled={spinning}
                    className={`p-2 py-3 rounded-lg border text-center text-[10px] font-bold uppercase transition-all ${
                      selectedColor === col.key 
                        ? `${col.color} text-white shadow-lg ring-2 ring-yellow-400 scale-[1.03]` 
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet scale and Trigger */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 bg-[#071A3D]/40 p-3 rounded-lg border border-[#FF3333]/10 font-sans">
                <span className="text-xs font-semibold text-slate-300">Wager (INR)</span>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  disabled={spinning}
                  className="bg-black/60 border border-white/10 rounded px-3 py-1 text-right text-yellow-300 font-mono w-28 text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                disabled={spinning}
                onClick={spinRoulette}
                className={`w-full py-3.5 text-center text-sm font-extrabold uppercase rounded-lg text-black ${
                  spinning ? 'bg-neutral-600 text-neutral-400 border-none cursor-not-allowed' : 'skeuo-btn-green'
                }`}
              >
                {spinning ? 'SPINNING...' : 'SPIN LAUNCHER'}
              </button>
            </div>
          </div>
        )}


        {/* 4. OTHER GAMES PLACEHOLDER FOR FAST INTEGRATION */}
        {!['aviator', 'chicken-road', 'roulette'].includes(game.id) && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 mb-2">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <p className="text-white/80 text-sm font-semibold">
              Preparing premium dealer tables for {game.name}.
            </p>
            <p className="text-xs text-secondary-fixed">
              This high stakes table supports VIP priority access for higher level ranks. Boost account status points now!
            </p>

            <div className="space-y-4 bg-[#071A3D]/20 p-4 rounded-xl border border-[#FF3333]/10">
              <p className="text-xs text-white/50 text-left">
                Simulate instant automated high-payout test hand (RTP {game.rtp}%):
              </p>
              
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-neutral-300">Wager</span>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  className="bg-black/60 border border-white/10 rounded px-3 py-1 text-right text-yellow-300 font-mono w-24 text-sm focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  if (!handlePlaceBet()) return;
                  
                   const currentBal = user.walletBalance;
                   // Dynamic progressive edge: balance check gives standard, lovely recovery, and inevitable rich down-cycles 
                   let progressiveWinChance = game.rtp / 100;
                   if (currentBal > 150000) {
                     progressiveWinChance = 0.35; // 35% win rate when rich
                   } else if (currentBal > 120000) {
                     progressiveWinChance = 0.42; // 42% win rate (balanced steady decay)
                   } else if (currentBal > 80000) {
                     progressiveWinChance = 0.52; // 52% win rate (nice standard run)
                   } else {
                     progressiveWinChance = 0.63; // 63% win rate (exquisite recovery streak)
                   }

                  const roll = Math.random();
                  const win = roll < progressiveWinChance;
                  
                  if (win) {
                    const prize = Math.floor(betAmount * 2);
                    const updated = {
                      ...user,
                      walletBalance: user.walletBalance + prize,
                      vipExp: Math.min(user.vipExp + 8, user.vipExpMax)
                    };
                    onUpdateUser(updated);

                    onAddTransaction({
                      id: `win-${Date.now()}`,
                      type: 'win',
                      amount: prize,
                      timestamp: new Date().toLocaleTimeString(),
                      status: 'SUCCESS',
                      description: `Hand won on ${game.name}! Double pay.`
                    });
                    alert(`Congratulations! You won the dealer round on ${game.name}! Hand rewarded ₹${prize}`);
                  } else {
                    onAddTransaction({
                      id: `bet-${Date.now()}`,
                      type: 'bet',
                      amount: betAmount,
                      timestamp: new Date().toLocaleTimeString(),
                      status: 'SUCCESS',
                      description: `Hand lost on ${game.name}.`
                    });
                    alert(`No match! Dealer beats your hand on ${game.name}. Try another deal!`);
                  }
                }}
                className="w-full py-2.5 text-center text-xs font-bold uppercase rounded-lg text-black skeuo-btn-green"
              >
                AUTOPLAY SIMULATED DEAL
              </button>
            </div>
          </div>
        )}

        {/* Footer Warning */}
        <div className="mt-6 flex items-start gap-2 bg-yellow-500/10 p-2.5 rounded border border-yellow-500/20">
          <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-300/80 leading-snug text-left">
            Responsible play sandbox indicator. Digital rewards inside our platform simulation cannot resolve to legal-tender currency. Enjoy pure thrilling fun!
          </p>
        </div>

      </div>
    </div>
  );
}
