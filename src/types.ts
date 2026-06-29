export interface Game {
  id: string;
  name: string;
  category: 'slots' | 'aviator' | 'casino' | 'roulette' | 'fishing' | 'lottery' | 'poker' | 'sports';
  image: string;
  isHot?: boolean;
  isNew?: boolean;
  livePlayers: number;
  rtp: number;
  jackpotAmount?: number;
  featured?: boolean;
}

export interface UserProfile {
  username: string;
  avatar: string;
  vipLevel: number;
  vipExp: number;
  vipExpMax: number;
  walletBalance: number;
  bonusBalance: number;
  totalReferralEarning: number;
  totalDeposited: number;
  totalWithdrawn: number;
  referralCode: string;
  dailyStreak: number;
  checkedInToday: boolean;
  balanceVersion?: number;
  phone?: string;
  email?: string;
  id?: string;
  user_id?: string;
  full_name?: string;
  isBalanceLoading?: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'referral_bonus' | 'wheel_bonus' | 'checkin_bonus';
  amount: number;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  commission: number;
  totalReferrals: number;
}
