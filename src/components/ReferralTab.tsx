import React, { useState } from 'react';
import { UserProfile, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Send, 
  Users, 
  Coins, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  Wallet,
  Building,
  Smartphone,
  CheckCircle,
  X,
  Info,
  CreditCard,
  Plus,
  Trash2,
  TrendingUp,
  History,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { playClick, playWin } from '../utils/audio';

interface ReferralTabProps {
  user: UserProfile;
  leaderboard?: any;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
}

interface LedgerEntry {
  id: string;
  type: 'referral_signup' | 'commission_bet' | 'payout_bank' | 'payout_wallet';
  user?: string;
  game?: string;
  amount: number;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

interface SavedBank {
  id: string;
  bankName: string;
  holderName: string;
  accountNo: string;
  ifsc: string;
}

interface SavedUpi {
  id: string;
  upiId: string;
}

export default function ReferralTab({ 
  user, 
  onUpdateUser, 
  onAddTransaction 
}: ReferralTabProps) {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [simulatedTodayIncome, setSimulatedTodayIncome] = useState<number>(450);
  const [simulatedFriendsCount, setSimulatedFriendsCount] = useState<number>(8);
  const [referralVaultBalance, setReferralVaultBalance] = useState<number>(850); // Available withdrawable referral money
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Bank & UPI Saved Accounts List
  const [savedBanks, setSavedBanks] = useState<SavedBank[]>([
    { id: 'bank-1', bankName: 'State Bank of India', holderName: user.username || 'High Roller', accountNo: '•••• •••• 5824', ifsc: 'SBIN0001042' }
  ]);
  const [savedUpis, setSavedUpis] = useState<SavedUpi[]>([
    { id: 'upi-1', upiId: 'highroller@okaxis' }
  ]);

  // Selected withdrawal target
  const [selectedTargetType, setSelectedTargetType] = useState<'upi' | 'bank'>('upi');
  const [selectedUpiId, setSelectedUpiId] = useState<string>('upi-1');
  const [selectedBankId, setSelectedBankId] = useState<string>('bank-1');

  // Modal & form states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [showAddMethodForm, setShowAddMethodForm] = useState<'bank' | 'upi' | null>(null);
  const [withdrawChannelPopup, setWithdrawChannelPopup] = useState<'upi' | 'bank' | null>(null);

  // Inputs for adding a new Bank account
  const [newBankName, setNewBankName] = useState<string>('');
  const [newAccountHolder, setNewAccountHolder] = useState<string>('');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newIfscCode, setNewIfscCode] = useState<string>('');

  // Inputs for adding a new UPI
  const [newUpiId, setNewUpiId] = useState<string>('');

  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);
  const [lastWithdrawnAmount, setLastWithdrawnAmount] = useState<number>(0);

  // Recent Transaction ledger passbook
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { id: 'ledger-1', type: 'commission_bet', game: 'Crashfire Chicken', amount: 125, timestamp: '10:42 AM', status: 'SUCCESS' },
    { id: 'ledger-2', type: 'referral_signup', user: 'RacerX99', amount: 250, timestamp: '08:15 AM', status: 'SUCCESS' },
    { id: 'ledger-3', type: 'payout_bank', amount: 500, timestamp: 'Yesterday', status: 'SUCCESS' },
    { id: 'ledger-4', type: 'commission_bet', game: 'Casino Roulette', amount: 75, timestamp: 'Yesterday', status: 'SUCCESS' },
  ]);

  // Dynamic Referral Code & Link setup
  const referralCode = user.referralCode || 'TENZO77';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const getAffiliateTier = (count: number) => {
    if (count < 10) {
      return {
        name: 'BRONZE',
        badge: 'BRONZE',
        color: 'text-stone-950 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 border-amber-400/50 shadow-[0_3px_12px_rgba(180,83,9,0.35)]',
        gradient: 'from-[#121214] via-[#211612] to-[#0c0c0e]',
        nextTier: 'SILVER',
        nextThreshold: 10,
        progressBarColor: 'bg-amber-600'
      };
    }
    if (count < 50) {
      return {
        name: 'SILVER',
        badge: 'SILVER',
        color: 'text-stone-950 bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 border-zinc-200/50 shadow-[0_3px_12px_rgba(156,163,175,0.35)]',
        gradient: 'from-[#121214] via-[#242426] to-[#0c0c0e]',
        nextTier: 'GOLD',
        nextThreshold: 50,
        progressBarColor: 'bg-zinc-400'
      };
    }
    if (count < 100) {
      return {
        name: 'GOLD',
        badge: 'GOLD',
        color: 'text-stone-950 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 border-yellow-300/50 shadow-[0_3px_12px_rgba(245,158,11,0.35)]',
        gradient: 'from-[#121214] via-[#2b2716] to-[#0c0c0e]',
        nextTier: 'DIAMOND',
        nextThreshold: 100,
        progressBarColor: 'bg-yellow-500'
      };
    }
    if (count < 200) {
      return {
        name: 'DIAMOND',
        badge: 'DIAMOND',
        color: 'text-stone-950 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 border-cyan-300/50 shadow-[0_3px_12px_rgba(6,182,212,0.35)]',
        gradient: 'from-[#121214] via-[#12282e] to-[#0c0c0e]',
        nextTier: 'PLATINUM',
        nextThreshold: 200,
        progressBarColor: 'bg-cyan-500'
      };
    }
    if (count < 500) {
      return {
        name: 'PLATINUM',
        badge: 'PLATINUM',
        color: 'text-stone-950 bg-gradient-to-r from-fuchsia-400 via-fuchsia-500 to-purple-600 border-fuchsia-300/50 shadow-[0_3px_12px_rgba(217,70,239,0.35)]',
        gradient: 'from-[#121214] via-[#2a122e] to-[#0c0c0e]',
        nextTier: 'ULTIMATE',
        nextThreshold: 500,
        progressBarColor: 'bg-fuchsia-500'
      };
    }
    return {
      name: 'ULTIMATE',
      badge: 'ULTIMATE',
      color: 'text-white bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 border-rose-400/50 shadow-[0_3px_12px_rgba(244,63,94,0.35)]',
      gradient: 'from-[#121214] via-[#2a0e14] to-[#0c0c0e]',
      nextTier: null,
      nextThreshold: null,
      progressBarColor: 'bg-rose-500'
    };
  };

  const tier = getAffiliateTier(simulatedFriendsCount);
  const progressPercent = tier.nextThreshold 
    ? Math.min(Math.round((simulatedFriendsCount / tier.nextThreshold) * 100), 100)
    : 100;
  
  // Straightforward invite text
  const inviteMessage = `💸 Get ₹500 Signup Bonus! Join Tenzo 247 & Earn Passive Income on every game. Register using my link: ${referralLink}`;

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    playClick();
    setCopiedLink(true);
    triggerToast("✅ Invite Link Copied! Ready to share on WhatsApp.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareWhatsApp = () => {
    playClick();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    playClick();
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank');
  };

  const triggerToast = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Simulates a friend signing up, immediately showing earnings update
  const triggerSimulatedSignup = () => {
    const rewards = [150, 250, 300, 500];
    const baseReward = rewards[Math.floor(Math.random() * rewards.length)];

    const randomUsers = ['MatrixGamer', 'AlphaBet_88', 'HyperVIP', 'LobbyKing', 'GoldDigger', 'RedLine7'];
    const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)] + '_' + Math.floor(Math.random() * 99);

    playWin();
    setSimulatedTodayIncome(prev => prev + baseReward);
    setSimulatedFriendsCount(prev => prev + 1);
    setReferralVaultBalance(prev => prev + baseReward);

    // Push to top of Ledger passbook
    const newEntry: LedgerEntry = {
      id: `ledger-${Date.now()}`,
      type: 'referral_signup',
      user: randomUser,
      amount: baseReward,
      timestamp: 'Just now',
      status: 'SUCCESS'
    };
    setLedger(prev => [newEntry, ...prev]);

    triggerToast(`🎉 New Affiliate Joined! +₹${baseReward} credited to Vault!`);
  };

  // Option 1: Direct Transfer to Game Wallet
  const handleWithdrawToGameWallet = () => {
    playClick();
    if (referralVaultBalance <= 0) {
      triggerToast("❌ You have ₹0 inside your Referral Vault to transfer.");
      return;
    }

    const currentVault = referralVaultBalance;
    playWin();

    // Reset referral vault balance
    setReferralVaultBalance(0);

    // Update real user wallet state
    const updated = {
      ...user,
      walletBalance: user.walletBalance + currentVault,
      totalReferralEarning: user.totalReferralEarning + currentVault
    };
    onUpdateUser(updated);

    // Write transactional history
    onAddTransaction({
      id: `ref-wallet-${Date.now()}`,
      type: 'referral_bonus',
      amount: currentVault,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SUCCESS',
      description: `Referral vault transfer to gaming wallet`
    });

    // Add to ledger
    const newEntry: LedgerEntry = {
      id: `ledger-${Date.now()}`,
      type: 'payout_wallet',
      amount: currentVault,
      timestamp: 'Just now',
      status: 'SUCCESS'
    };
    setLedger(prev => [newEntry, ...prev]);

    triggerToast(`💰 Transferred ₹${currentVault} directly to your Gaming Wallet!`);
  };

  // Option 2: Withdraw directly to Bank Account or UPI
  const openBankWithdrawModal = () => {
    playClick();
    if (referralVaultBalance <= 0) {
      triggerToast("❌ You have ₹0 inside your Referral Vault to withdraw.");
      return;
    }
    setWithdrawSuccess(false);
    setIsWithdrawing(false);
    setIsWithdrawModalOpen(true);
  };

  // Add a new Bank Account dynamically
  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!newBankName.trim() || !newAccountNumber.trim() || !newIfscCode.trim() || !newAccountHolder.trim()) {
      triggerToast("⚠️ Please fill in all bank details.");
      return;
    }

    const maskedAcc = '•••• •••• ' + newAccountNumber.slice(-4);
    const newBank: SavedBank = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim(),
      holderName: newAccountHolder.trim(),
      accountNo: maskedAcc,
      ifsc: newIfscCode.trim().toUpperCase()
    };

    setSavedBanks(prev => [...prev, newBank]);
    setSelectedBankId(newBank.id);
    setSelectedTargetType('bank');
    setShowAddMethodForm(null);

    // Reset inputs
    setNewBankName('');
    setNewAccountHolder('');
    setNewAccountNumber('');
    setNewIfscCode('');

    triggerToast("🏦 Successfully linked bank account to affiliate dashboard!");
  };

  // Add a new UPI ID dynamically
  const handleAddUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!newUpiId.trim() || !newUpiId.includes('@')) {
      triggerToast("⚠️ Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }

    const newUpi: SavedUpi = {
      id: `upi-${Date.now()}`,
      upiId: newUpiId.trim().toLowerCase()
    };

    setSavedUpis(prev => [...prev, newUpi]);
    setSelectedUpiId(newUpi.id);
    setSelectedTargetType('upi');
    setShowAddMethodForm(null);

    // Reset input
    setNewUpiId('');

    triggerToast("📱 Successfully linked UPI account to affiliate dashboard!");
  };

  // Remove payment methods
  const removeBank = (id: string) => {
    playClick();
    setSavedBanks(prev => prev.filter(b => b.id !== id));
    triggerToast("🗑️ Bank account removed.");
  };

  const removeUpi = (id: string) => {
    playClick();
    setSavedUpis(prev => prev.filter(u => u.id !== id));
    triggerToast("🗑️ UPI ID removed.");
  };

  const handleBankWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (selectedTargetType === 'upi' && savedUpis.length === 0) {
      triggerToast("⚠️ Please link a UPI ID first.");
      return;
    }

    if (selectedTargetType === 'bank' && savedBanks.length === 0) {
      triggerToast("⚠️ Please link a Bank Account first.");
      return;
    }

    const activePayoutDetail = selectedTargetType === 'upi' 
      ? savedUpis.find(u => u.id === selectedUpiId)?.upiId || 'Selected UPI'
      : savedBanks.find(b => b.id === selectedBankId)?.bankName + ` (${savedBanks.find(b => b.id === selectedBankId)?.accountNo.slice(-4)})`;

    setIsWithdrawing(true);

    // Simulate database transfer in 1.2 seconds
    setTimeout(() => {
      playWin();
      const withdrawnAmount = referralVaultBalance;
      setLastWithdrawnAmount(withdrawnAmount);

      // Reset referral vault
      setReferralVaultBalance(0);

      // Update user lifetime earning totals
      const updated = {
        ...user,
        totalReferralEarning: user.totalReferralEarning + withdrawnAmount
      };
      onUpdateUser(updated);

      // Record transaction globally
      onAddTransaction({
        id: `ref-bank-${Date.now()}`,
        type: 'withdraw',
        amount: withdrawnAmount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
        description: `Withdrawn to ${activePayoutDetail}`
      });

      // Add to local passbook ledger
      const newEntry: LedgerEntry = {
        id: `ledger-${Date.now()}`,
        type: 'payout_bank',
        amount: withdrawnAmount,
        timestamp: 'Just now',
        status: 'PENDING'
      };
      setLedger(prev => [newEntry, ...prev]);

      setIsWithdrawing(false);
      setWithdrawSuccess(true);
    }, 1200);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="relative font-sans text-white pb-24 select-none max-w-md mx-auto px-2 space-y-4">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-50 bg-[#FF2348] text-white font-extrabold text-xs text-center py-3.5 px-4 rounded-xl shadow-[0_10px_25px_rgba(255,35,72,0.35)] border border-[#FF2348] leading-tight"
          >
            {showNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banking Dashboard view directly rendered */}
      <div className="space-y-4">
          
          {/* Elite Premium Banking Card Overlay */}
          <div className={`bg-gradient-to-br ${tier.gradient} border border-white/10 p-6 rounded-3xl relative overflow-hidden shadow-2xl space-y-5 transition-all duration-500`}>
            {/* Glossy card overlay shine */}
            <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-12 pointer-events-none" />
            
            {/* Card Header details */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`text-[10px] font-black tracking-[0.18em] uppercase px-4.5 py-1.5 rounded-full inline-block transition-all duration-500 border ${tier.color}`}>
                  {tier.badge}
                </span>
                <h3 className="text-xs md:text-sm text-zinc-100 font-black tracking-widest uppercase mt-2">
                  {user.username || user.phone || user.email || user.id || user.user_id || 'TENZO MEMBER'}
                </h3>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#FF2348] drop-shadow-[0_0_8px_rgba(255,35,72,0.4)]" />
            </div>

            {/* Progress bar to next tier */}
            {tier.nextThreshold && (
              <div className="space-y-1 mt-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>Next Level: {tier.nextTier}</span>
                  <span>{simulatedFriendsCount} / {tier.nextThreshold} Refs ({progressPercent}%)</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full ${tier.progressBarColor} transition-all duration-700 ease-out`} 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Smart EMV Card Chip & Wireless indicator */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-8 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-md border border-amber-600/30 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 border-r border-b border-black/10 flex flex-wrap p-0.5 opacity-65">
                  <div className="w-1/3 h-1/2 border-r border-b border-black/20" />
                  <div className="w-1/3 h-1/2 border-r border-b border-black/20" />
                  <div className="w-1/3 h-1/2 border-b border-black/20" />
                </div>
              </div>
              <span className="font-mono text-zinc-500 text-[9px] tracking-widest uppercase font-bold">SECURED CORE</span>
            </div>

            {/* Balances block */}
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Available Balance</span>
                <span className="font-sans font-black text-3.5xl text-white tracking-tight leading-none block">
                  {formatCurrency(referralVaultBalance)}
                </span>
              </div>
            </div>

            {/* Real-time Cashout Quick Actions Row */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <button
                onClick={handleWithdrawToGameWallet}
                className="py-3 px-4 bg-[#1e1c1d] hover:bg-[#2a2729] active:scale-95 border border-white/10 rounded-xl transition-all font-sans font-black text-[10px] text-zinc-300 hover:text-white uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Wallet className="w-4 h-4 text-zinc-400" />
                <span>To Gaming Wallet</span>
              </button>

              <button
                onClick={openBankWithdrawModal}
                className="py-3 px-4 bg-[#2b1016] hover:bg-[#3d1620] active:scale-95 border border-[#FF2348]/20 hover:border-[#FF2348]/40 rounded-xl transition-all font-sans font-black text-[10px] text-white uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <ArrowUpRight className="w-4 h-4 text-[#FF2348]" />
                <span>Withdraw to Bank</span>
              </button>
            </div>
          </div>

      </div>

      {/* Quick Share Buttons */}
      <div className="pt-2 grid grid-cols-2 gap-3.5 w-full">
        {/* Share on WhatsApp */}
        <button
          onClick={shareWhatsApp}
          className="py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 transition-all rounded-xl font-sans font-black text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase tracking-wider"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span>WhatsApp</span>
        </button>

        {/* Share on Telegram */}
        <button
          onClick={shareTelegram}
          className="py-3.5 px-4 bg-[#0088cc] hover:bg-[#0077b3] active:scale-95 transition-all rounded-xl font-sans font-black text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase tracking-wider"
        >
          <Send className="w-4 h-4 shrink-0" />
          <span>Telegram</span>
        </button>
      </div>

      {/* Bank/UPI withdrawal modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#161616] to-[#111111] border border-[#FF2348]/20 rounded-2xl overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="font-sans font-black text-sm uppercase tracking-wider text-white">
                    WITHDRAW REFERRAL EARNINGS
                  </span>
                </div>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Success */}
              {withdrawSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-16 h-16 rounded-full bg-[#FF2348]/10 border border-[#FF2348] flex items-center justify-center text-[#FF2348] shadow-[0_0_20px_rgba(255,35,72,0.2)]"
                    >
                      <CheckCircle className="w-9 h-9" />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-black text-base text-white">
                      Withdrawal Request Submitted!
                    </h3>
                    <p className="text-zinc-300 text-xs px-2 leading-relaxed">
                      Your payout of <strong className="text-[#FF2348] text-sm block my-1">{formatCurrency(lastWithdrawnAmount)}</strong> is being processed. Funds will reflect in your account within <strong className="text-white">15 minutes</strong>.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => setIsWithdrawModalOpen(false)}
                      className="w-full py-3 px-4 rounded-xl bg-[#FF2348] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#FF2348]/80 transition-colors cursor-pointer active:scale-95"
                    >
                      GOT IT, THANKS
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBankWithdrawSubmit} className="space-y-4">
                  
                  {/* Amount indicator */}
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Payout Amount:</span>
                    <span className="font-sans font-black text-base text-[#FF2348]">{formatCurrency(referralVaultBalance)}</span>
                  </div>

                  {/* Payment Type Selector */}
                  <div className="flex p-1 bg-black/50 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedTargetType('upi');
                      }}
                      className={`flex-1 py-2.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectedTargetType === 'upi' ? 'bg-[#FF2348] text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>UPI ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedTargetType('bank');
                      }}
                      className={`flex-1 py-2.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectedTargetType === 'bank' ? 'bg-[#FF2348] text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Bank Account</span>
                    </button>
                  </div>

                  {/* Linked accounts selection list depending on payout method */}
                  <div className="space-y-2">
                    <label className="text-[9.5px] text-zinc-400 font-black uppercase tracking-wider block">
                      Target Destination:
                    </label>

                    {selectedTargetType === 'upi' ? (
                      savedUpis.length > 0 ? (
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[#FF2348]" />
                            <span className="font-mono text-xs text-white font-bold">{savedUpis[0].upiId}</span>
                          </div>
                          <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Selected</span>
                        </div>
                      ) : (
                        <div className="p-3 text-center border border-dashed border-white/10 rounded-xl bg-black/40">
                          <span className="text-[10px] text-zinc-500 block font-bold mb-1">No UPI addresses linked</span>
                          <button
                            type="button"
                            onClick={() => { playClick(); setIsWithdrawModalOpen(false); }}
                            className="px-2 py-1.5 bg-[#FF2348] text-white rounded text-[8.5px] font-bold uppercase transition-all"
                          >
                            Close & Link UPI
                          </button>
                        </div>
                      )
                    ) : (
                      savedBanks.length > 0 ? (
                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-bold text-white">{savedBanks[0].bankName}</span>
                            <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Selected</span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400">A/C: {savedBanks[0].accountNo}</span>
                          <span className="font-mono text-[9px] text-zinc-500">Holder: {savedBanks[0].holderName} | IFSC: {savedBanks[0].ifsc}</span>
                        </div>
                      ) : (
                        <div className="p-3 text-center border border-dashed border-white/10 rounded-xl bg-black/40">
                          <span className="text-[10px] text-zinc-500 block font-bold mb-1">No bank accounts linked</span>
                          <button
                            type="button"
                            onClick={() => { playClick(); setIsWithdrawModalOpen(false); }}
                            className="px-2 py-1.5 bg-[#FF2348] text-white rounded text-[8.5px] font-bold uppercase transition-all"
                          >
                            Close & Link Bank
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* Safety Notice */}
                  <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="text-[9.5px] text-zinc-400 leading-snug">
                      Payment routing details are secured. Instant settlement takes place over safe UPI networks.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isWithdrawing || (selectedTargetType === 'upi' ? savedUpis.length === 0 : savedBanks.length === 0)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2348] to-[#B4002C] text-white font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-40"
                    >
                      {isWithdrawing ? (
                        <>
                          <div className="w-4.5 h-4.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Routing funds...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Funds to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </motion.div>
          </div>
        )}

        {/* UPI Management Popup */}
        {withdrawChannelPopup === 'upi' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWithdrawChannelPopup(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#161616] to-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#FF2348]" />
                  <span className="font-sans font-black text-xs uppercase tracking-wider text-white">
                    Manage UPI Wallet
                  </span>
                </div>
                <button
                  onClick={() => setWithdrawChannelPopup(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {savedUpis.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold inline-block">
                      Active Pathway
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm text-white select-all font-semibold block tracking-wide">
                          {savedUpis[0].upiId}
                        </span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-wider block mt-1 font-bold">
                          Linked Virtual Address
                        </span>
                      </div>
                      <button
                        onClick={() => removeUpi(savedUpis[0].id)}
                        className="p-2 text-zinc-400 hover:text-[#FF2348] hover:bg-[#FF2348]/10 transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold uppercase border border-white/5 hover:border-[#FF2348]/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-400 text-center leading-relaxed">
                    To link a different UPI address, please delete the current one first.
                  </p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    handleAddUpiSubmit(e);
                    setWithdrawChannelPopup(null);
                  }} 
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-400 font-bold uppercase block">Enter UPI ID (VPA)</label>
                    <input
                      type="text"
                      required
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      placeholder="e.g. name@upi, 9876543210@paytm"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF2348] font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#FF2348] to-[#B4002C] text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
                  >
                    Link UPI Account
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Bank Management Popup */}
        {withdrawChannelPopup === 'bank' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWithdrawChannelPopup(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#161616] to-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#FF2348]" />
                  <span className="font-sans font-black text-xs uppercase tracking-wider text-white">
                    Manage Bank Payout
                  </span>
                </div>
                <button
                  onClick={() => setWithdrawChannelPopup(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {savedBanks.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3">
                    <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold inline-block">
                      Active Pathway
                    </span>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-sans text-xs font-bold text-white block">
                          {savedBanks[0].bankName}
                        </span>
                        <span className="font-mono text-[9.5px] text-zinc-400 block tracking-wide">
                          A/C: {savedBanks[0].accountNo}
                        </span>
                        <span className="font-mono text-[8.5px] text-zinc-500 block">
                          IFSC: {savedBanks[0].ifsc} | Holder: {savedBanks[0].holderName}
                        </span>
                      </div>
                      <button
                        onClick={() => removeBank(savedBanks[0].id)}
                        className="p-2 text-zinc-400 hover:text-[#FF2348] hover:bg-[#FF2348]/10 transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold uppercase border border-white/5 hover:border-[#FF2348]/20 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-400 text-center leading-relaxed">
                    To link a different bank account, please delete the current one first.
                  </p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    handleAddBankSubmit(e);
                    setWithdrawChannelPopup(null);
                  }} 
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase block">Bank Name</label>
                      <input
                        type="text"
                        required
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="e.g. State Bank"
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#FF2348]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase block">Holder Name</label>
                      <input
                        type="text"
                        required
                        value={newAccountHolder}
                        onChange={(e) => setNewAccountHolder(e.target.value)}
                        placeholder="Name on passbook"
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#FF2348]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase block">Account No</label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="e.g. 501002341924"
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#FF2348] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-bold uppercase block">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={newIfscCode}
                        onChange={(e) => setNewIfscCode(e.target.value)}
                        placeholder="e.g. SBIN0001042"
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#FF2348] font-mono uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-1 bg-gradient-to-r from-[#FF2348] to-[#B4002C] text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
                  >
                    Link Bank Account
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
