import { Game, LeaderboardEntry } from '../types';

export const INITIAL_GAMES: Game[] = [
  {
    id: 'aviator',
    name: 'Aviator',
    category: 'aviator',
    image: '',
    isHot: true,
    livePlayers: 4820,
    rtp: 98.7,
    jackpotAmount: 18500000,
    featured: true
  },
  {
    id: 'chicken-road',
    name: 'Crossfire Chicken',
    category: 'slots',
    image: '',
    isHot: true,
    livePlayers: 3240,
    rtp: 97.5,
    jackpotAmount: 12400000,
    featured: false
  },
  {
    id: 'roulette',
    name: 'Neon Roulette',
    category: 'roulette',
    image: '',
    isNew: true,
    livePlayers: 1950,
    rtp: 98.2,
    jackpotAmount: 9500000,
    featured: false
  },
  {
    id: 'mines',
    name: 'Mines Outpost',
    category: 'casino',
    image: '',
    isHot: false,
    livePlayers: 2810,
    rtp: 96.8,
    jackpotAmount: 4100000,
    featured: false
  },
  {
    id: 'plinko',
    name: 'Plinko Strike',
    category: 'slots',
    image: '',
    isNew: true,
    livePlayers: 5400,
    rtp: 99.1,
    jackpotAmount: 15000000,
    featured: true
  },
  {
    id: 'fortune-wheel',
    name: 'Fortune Wheel 3D',
    category: 'slots',
    image: '',
    isHot: true,
    livePlayers: 4120,
    rtp: 97.9,
    jackpotAmount: 6700000,
    featured: false
  }
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    username: 'Rudra_KingPin',
    avatar: '',
    commission: 425000,
    totalReferrals: 382
  },
  {
    rank: 2,
    username: 'Ananya_Boss',
    avatar: '',
    commission: 290000,
    totalReferrals: 219
  },
  {
    rank: 3,
    username: 'Lucky_Vihaan',
    avatar: '',
    commission: 112000,
    totalReferrals: 94
  },
  {
    rank: 4,
    username: 'Kabir_BettingPros',
    avatar: '',
    commission: 84500,
    totalReferrals: 76
  }
];
