import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { 
  Bell, 
  Plus, 
  ArrowLeft,
  User,
  Building,
  Smartphone,
  Users,
  Gift,
  Ticket,
  ShieldCheck,
  Lock,
  Headphones,
  LogOut,
  Settings,
  ChevronRight,
  Copy,
  Check,
  X,
  CreditCard,
  QrCode,
  Bitcoin,
  Coins,
  ArrowUpRight,
  Send,
  Sparkles,
  Search,
  MessageSquare,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { playClick, playHover, playWin } from '../utils/audio';

interface SportsBettingSectionProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onOpenAviator?: () => void;
  onBackToLobby?: () => void;
  onNavigateBank?: (tab: 'deposit' | 'withdraw') => void;
  bankAccounts?: any[];
  onUpdateBankAccounts?: (accounts: any[]) => void;
  upiAccounts?: any[];
  onUpdateUpiAccounts?: (accounts: any[]) => void;
}

export default function SportsBettingSection({
  user,
  onUpdateUser,
  onAddTransaction,
  onBackToLobby,
  ...props
}: SportsBettingSectionProps) {
  // Navigation tabs matching the bottom bar in design: Home, My Bets
  const [activeNav, setActiveNav] = useState<'home' | 'bets' | 'wallet' | 'account'>('home');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  
  // Custom states for interactive features
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [selectedDepositType, setSelectedDepositType] = useState<'upi' | 'bank' | 'qr' | 'crypto' | null>(null);
  const [depositSuccessMessage, setDepositSuccessMessage] = useState<string | null>(null);

  // Quick withdrawal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedWithdrawChannel, setSelectedWithdrawChannel] = useState<'bank' | 'upi'>('upi');

  // Account views subdialogs overlay state
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // Feedback states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  // Bonus/Coupon Code
  const [promoCode, setPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);

  // Linked accounts default lists - Synchronized with shared parent states
  const bankAccountsList = props.bankAccounts || [];
  const upiAccountsList = props.upiAccounts || [];

  const userBanks = bankAccountsList.map((item: any) => ({
    id: item.id,
    bankName: item.bankName,
    number: item.accountNumber || item.number || '',
    holder: item.holderName || item.holder || '',
    ifsc: item.ifscCode || item.ifsc || ''
  }));

  const userUPIs = upiAccountsList.map((item: any) => item.upiId || item.vpa || '');

  const setUserUPIs = (updated: any) => {
    if (props.onUpdateUpiAccounts) {
      const resolvedList = typeof updated === 'function' ? updated(userUPIs) : updated;
      const upiObjects = resolvedList.map((upiStr: string, index: number) => ({
        id: `upi-${index + 1}-${Date.now()}`,
        nickname: `UPI Account ${index + 1}`,
        upiId: upiStr,
        vpa: upiStr,
        isDefault: index === 0,
        isPrimary: index === 0
      }));
      props.onUpdateUpiAccounts(upiObjects);
    }
  };

  const setUserBanks = (updated: any) => {
    if (props.onUpdateBankAccounts) {
      const resolvedList = typeof updated === 'function' ? updated(userBanks) : updated;
      const bankObjects = resolvedList.map((item: any, index: number) => ({
        id: item.id || `bank-${index + 1}-${Date.now()}`,
        bankName: item.bankName,
        accountNumber: item.number || item.accountNumber || '',
        number: item.number || item.accountNumber || '',
        holderName: item.holder || item.holderName || '',
        holder: item.holder || item.holderName || '',
        ifscCode: item.ifsc || item.ifscCode || '',
        ifsc: item.ifsc || item.isDefault || '',
        isDefault: index === 0,
        isPrimary: index === 0
      }));
      props.onUpdateBankAccounts(bankObjects);
    }
  };

  const [newUpi, setNewUpi] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankNum, setNewBankNum] = useState('');
  const [newBankIfsc, setNewBankIfsc] = useState('');

  // Daily reward checklist state
  const [checkedDays, setCheckedDays] = useState<boolean[]>([true, false, false, false, false, false, false]);

  // Luxury Concierge Support Simulator Chat state
  const [supportMessage, setSupportMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([
    { sender: 'agent', text: 'Welcome to Tenzo VIP Concierge desk. How can I speed up your settlements today?', time: '04:16 AM' }
  ]);

  // Past transactions display state
  const [txnSearch, setTxnSearch] = useState('');

  // Notification bulletins list
  const bulletins = [
    "🌟 Match Boost: IND v AUS live total match runs odds boosted to 1.85x!",
    "💰 Vault Secures: UPI transfers are settled instantly within 90 seconds.",
    "🏆 Cash Out Available: Instantly pullout stakes anytime during play."
  ];

  // Dummy bets for the 'My Bets' tab
  const [myBets, setMyBets] = useState<any[]>([]);

  const handleCopyId = () => {
    navigator.clipboard.writeText("TENZ" + (user.referralCode || "987654"));
    setCopiedId(true);
    playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://tenzobet.vip/register?code=${user.referralCode || "987654"}`);
    setCopiedCode(true);
    playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const executeDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt < 200) {
      alert("Minimum deposit limit is ₹200");
      return;
    }
    if (amt > 50000) {
      alert("Maximum deposit limit is ₹50,000");
      return;
    }
    
    // Update user profile balance
    onUpdateUser({
      ...user,
      walletBalance: user.walletBalance + amt,
      totalDeposited: (user.totalDeposited || 0) + amt
    });

    // Create deposit transaction row
    onAddTransaction({
      id: 'DEP-' + Math.floor(Math.random() * 89999 + 10000),
      type: 'deposit',
      amount: amt,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      description: `Secured Instant Deposit via ${selectedDepositType?.toUpperCase() || 'UPI'}`
    });

    playWin();
    setDepositSuccessMessage(`🎉 Deposit of ₹${amt.toLocaleString('en-IN')} approved instantly! Your balance has been updated.`);
  };

  const executeWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > user.walletBalance) {
      alert("Insufficient wallet balance for withdrawal!");
      return;
    }
    if (amt < 500) {
      alert("Minimum withdrawal limit is ₹500");
      return;
    }

    onUpdateUser({
      ...user,
      walletBalance: user.walletBalance - amt,
      totalWithdrawn: (user.totalWithdrawn || 0) + amt
    });

    onAddTransaction({
      id: 'WTH-' + Math.floor(Math.random() * 89999 + 10000),
      type: 'withdraw',
      amount: amt,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      description: `Withdrawal transfer routing to ${selectedWithdrawChannel.toUpperCase()} Account`
    });

    playClick();
    setWithdrawSuccess(true);
  };

  const handleSaveUsername = () => {
    if (!usernameInput.trim()) return;
    onUpdateUser({
      ...user,
      username: usernameInput.trim()
    });
    setIsEditingUsername(false);
    playClick();
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    playClick();
    const cleanCode = promoCode.trim().toUpperCase();
    if (cleanCode === 'TENZO500' || cleanCode === 'WELCOME100') {
      if (promoApplied) {
        setPromoFeedback('❌ You already applied a promo code on this session.');
        return;
      }
      const bonusGained = cleanCode === 'TENZO500' ? 500 : 100;
      onUpdateUser({
        ...user,
        bonusBalance: user.bonusBalance + bonusGained
      });

      // Add as wheel bonus txn or checkin bonus txn
      onAddTransaction({
        id: 'PRM-' + Math.floor(Math.random() * 89999 + 10000),
        type: 'wheel_bonus',
        amount: bonusGained,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        description: `Promo Code ${cleanCode} Applied Successfully`
      });

      playWin();
      setPromoFeedback(`🏆 Success! ₹${bonusGained} added to your bonus pool.`);
      setPromoApplied(true);
    } else {
      setPromoFeedback('❌ Invalid or expired coupon code. Try code "TENZO500".');
    }
  };

  const handleCheckInClaim = (dayIdx: number) => {
    if (checkedDays[dayIdx]) return;
    if (dayIdx > 0 && !checkedDays[dayIdx - 1]) {
      alert("Please claim previous day's reward first!");
      return;
    }

    const rewardAmounts = [100, 250, 500, 750, 1000, 1500, 5000];
    const prize = rewardAmounts[dayIdx];

    onUpdateUser({
      ...user,
      walletBalance: user.walletBalance + prize,
      checkedInToday: true
    });

    onAddTransaction({
      id: 'STK-' + Math.floor(Math.random() * 89999 + 10000),
      type: 'checkin_bonus',
      amount: prize,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      description: `Streak Rewards - Day ${dayIdx + 1} Check-In Completed`
    });

    const nextChecked = [...checkedDays];
    nextChecked[dayIdx] = true;
    setCheckedDays(nextChecked);

    playWin();
    alert(`🎉 Day ${dayIdx + 1} Check-In Secured! ₹${prize} cash settled to Main Balance.`);
  };

  const handleAddUpiAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpi.trim() || !newUpi.includes('@')) {
      alert("Please enter a valid UPI VPA structure (e.g. user@bank)");
      return;
    }
    setUserUPIs([...userUPIs, newUpi.trim().toLowerCase()]);
    setNewUpi('');
    playClick();
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newBankNum.trim() || !newBankIfsc.trim()) {
      alert("Please fill all bank parameters standardly.");
      return;
    }
    setUserBanks([
      ...userBanks,
      {
        id: String(Date.now()),
        bankName: newBankName.trim(),
        number: `•••• •••• ${newBankNum.slice(-4)}`,
        holder: user.username,
        ifsc: newBankIfsc.trim().toUpperCase()
      }
    ]);
    setNewBankName('');
    setNewBankNum('');
    setNewBankIfsc('');
    playClick();
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    playClick();
    const userMsg = supportMessage.trim();
    const updatedChat = [...chatLog, { sender: 'user' as const, text: userMsg, time: 'Now' }];
    setChatLog(updatedChat);
    setSupportMessage('');

    // Simulated responses based on keywords
    setTimeout(() => {
      let responseText = "Understood. Our VIP system is inspecting your account logs. One moment.";
      if (userMsg.toLowerCase().includes('withdraw') || userMsg.toLowerCase().includes('pay')) {
        responseText = "🔒 VIP Notice: All UPI and bank transfers settle within 90 seconds. Your pending withdrawals are marked high priority!";
      } else if (userMsg.toLowerCase().includes('deposit')) {
        responseText = "💰 UPI Fast Deposit channels are fully operational. Click the [+] Red badge to instantly top up.";
      } else if (userMsg.toLowerCase().includes('bonus') || userMsg.toLowerCase().includes('promo')) {
        responseText = "🎉 Have you tried using active promo code 'TENZO500' in the Bonus center? Enjoy ₹500 extra!";
      }

      setChatLog(prev => [...prev, { sender: 'agent' as const, text: responseText, time: 'Now' }]);
    }, 1200);
  };

  return (
    <div className="w-full bg-[#FAFAFA] text-[#111111] min-h-screen relative font-sans flex flex-col justify-between selection:bg-[#FF3333]/10 selection:text-[#FF3333] overflow-x-hidden pb-20">
      
      {/* 1. TOP PREMIUM HEADER */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-transparent px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Logo segment like CRED/Apple Wallet */}
          <div className="flex items-center gap-3">

            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-[#EDEDED]">
              <div className="relative font-sans text-xl font-black italic tracking-tighter text-[#111111] flex items-center select-none">
                T
                <div className="absolute top-[2px] right-[-4px] w-2 h-2 rounded-full bg-[#FF3333]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black tracking-tight uppercase text-[#111111]">Tenzo</span>
                <span className="text-[10px] font-extrabold uppercase text-[#FF3333] tracking-widest">Bet</span>
              </div>
            </div>
          </div>

          {/* Wallet and Actions */}
          <div className="flex items-center gap-3">
            
            {/* Quick Balance Capsule */}
            <div className="bg-white border border-[#EDEDED] pl-3 pr-2 py-1.5 rounded-full flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="text-left select-none">
                <span className="text-[8px] text-[#666666] font-medium uppercase tracking-wider block">Balance</span>
                <span className="text-xs font-black text-[#111111] font-mono leading-none">
                  ₹{(user.walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button 
                onClick={() => {
                  playClick();
                  if (props.onNavigateBank) {
                    props.onNavigateBank('deposit');
                  } else {
                    setSelectedDepositType(null);
                    setDepositSuccessMessage(null);
                    setShowDepositModal(true);
                  }
                }}
                className="w-7 h-7 rounded-full bg-[#FF3333] flex items-center justify-center text-white shadow-md active:scale-95 transition-all outline-none cursor-pointer"
                title="Instant Deposit"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* RENDER DYNAMIC AREA BASED ON TABS */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 relative bg-[#FAFAFA]">

        <AnimatePresence mode="wait">
          
          {/* HOME TAB - CLEAN MINIMAL */}
          {activeNav === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-center py-16 px-4"
            >
              <div className="text-neutral-400 text-xs py-8">
                Sports markets are active. Place stakes to track your active tickets directly.
              </div>
            </motion.div>
          )}

          {/* MY BETS TAB - TICKETS GRID */}
          {activeNav === 'bets' && (
            <motion.div
              key="bets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-widest">My Bets Board</h3>
                <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/20 px-2.5 py-1 rounded-full">{myBets.length} Active Tickets</span>
              </div>

              <div className="space-y-3">
                {myBets.length === 0 ? (
                  <div className="bg-white border border-[#EDEDED] p-8 rounded-2xl shadow-sm text-center">
                    <span className="text-3xl">🎫</span>
                    <h4 className="text-xs font-black uppercase text-neutral-400 mt-3 tracking-wider">No Active Tickets</h4>
                    <p className="text-[11px] text-neutral-400 mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                      You haven't placed any sports bets yet. Select active markets to place stakes.
                    </p>
                  </div>
                ) : (
                  myBets.map((bx, idx) => (
                    <div key={idx} className="bg-white border border-[#EDEDED] p-4 rounded-2xl shadow-sm relative overflow-hidden">
                      {/* Status Top corner badge */}
                      <span className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded-bl-xl ${
                        bx.status === 'LIVE' ? 'bg-[#FF3333]/10 text-[#FF3333]' :
                        bx.status === 'WON' ? 'bg-red-950/20 text-red-400' :
                        'bg-neutral-100 text-neutral-400 font-medium'
                      }`}>
                        {bx.status}
                      </span>

                      <span className="text-[9px] font-bold text-neutral-400 block">{bx.time} • ID: {bx.id}</span>
                      <h4 className="text-xs font-black mt-1.5 text-neutral-800 leading-tight">{bx.match}</h4>
                      <p className="text-xs font-medium text-neutral-500 mt-1">Pick: <span className="text-[#111111] font-bold">{bx.selection}</span> ({bx.odd}x odds)</p>
                      
                      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-dashed border-neutral-100 text-left">
                        <div>
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">Stake</span>
                          <span className="text-xs font-bold font-mono">₹{bx.stake.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">Potential Profit</span>
                          <span className="text-xs font-black font-mono text-red-400">₹{bx.potentialProfit.toLocaleString()}</span>
                        </div>
                      </div>

                      {bx.status === 'LIVE' && (
                        <button 
                          onClick={() => {
                            playClick();
                            // cashout operation removes wager
                            alert("💸 Cash Out Settled! ₹1,120.00 instantly returned to your balance.");
                            onUpdateUser({ ...user, walletBalance: user.walletBalance + 1120 });
                            setMyBets(myBets.filter(b => b.id !== bx.id));
                          }}
                          className="w-full mt-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          ⚡ Secure Cash Out (₹1,120)
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* WALLET TAB - BALANCE SHEET */}
          {activeNav === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 max-w-lg mx-auto text-left"
            >
              {/* Virtual ATM Card */}
              <div className="bg-gradient-to-tr from-[#1E293B] to-[#0F172A] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-44">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#FF3333]/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-[#FF3333]/5 blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-80">VIP TenzoCard</h4>
                    <span className="text-[9px] font-mono opacity-50 block">MEMBER ID • TENZ{user.referralCode || "987654"}</span>
                  </div>
                  <div className="text-right text-[#FF3333] text-sm font-black italic">TENZO STATUS</div>
                </div>

                <div>
                  <span className="text-[10px] opacity-60 uppercase font-medium tracking-wide">Main Wallet Available</span>
                  <div className="text-2xl font-black font-mono leading-none mt-1">₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[8px] uppercase opacity-40 block">Cardholder</span>
                    <span className="text-xs font-bold tracking-tight uppercase">{user.username}</span>
                  </div>
                  <div className="text-[10px] opacity-70 bg-white/10 border border-white/15 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VIP Lvl {user.vipLevel}
                  </div>
                </div>
              </div>

              {/* Transactions table */}
              <div className="bg-white border border-[#EDEDED] rounded-2.5xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider">Account History</h4>
                  <button 
                    onClick={() => { setActiveNav('account'); setActiveSubTab('transactions'); }}
                    className="text-[10px] font-bold text-[#FF3333]"
                  >
                    View All
                  </button>
                </div>

                <div className="mt-3 text-center py-6 text-neutral-400 text-xs">
                  <p>Deposit, withdrawal, and coupon logs are securely tracked.</p>
                  <button 
                    onClick={() => {
                      playClick();
                      if (props.onNavigateBank) {
                        props.onNavigateBank('deposit');
                      } else {
                        setSelectedDepositType(null);
                        setDepositSuccessMessage(null);
                        setShowDepositModal(true);
                      }
                    }}
                    className="mt-3 px-4 py-1.5 bg-[#FF3333] hover:brightness-110 active:scale-95 text-white font-black uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                  >
                    Instant Secure Deposit
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. ACCOUNT MAIN TAB- MATCHING SCREENSHOT PRECISELY */}
          {activeNav === 'account' && activeSubTab === null && (
            <motion.div
              key="account-main"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="max-w-xl mx-auto space-y-6"
            >
              {/* Outer Wrapper Redesigned Card with exact elements */}
              <div className="bg-white rounded-[32px] p-6 border border-[#F0F0F0] shadow-[0_8px_32px_rgba(0,0,0,0.03)] relative overflow-hidden">
                
                {/* Background graphic effect similar to screenshot */}
                <div className="absolute right-0 top-0 w-36 h-36 bg-red-950/20/20 rounded-full blur-3xl pointer-events-none" />

                {/* Profile Card Header Layout */}
                <div className="flex items-start gap-4">
                  {/* Photo with pinkish/gradient ring and pencil edit marker */}
                  <div className="relative">
                    <div className="w-18 h-18 rounded-full p-[3px] bg-gradient-to-tr from-[#FF5E89] via-[#8923FF]/30 to-[#FF3333]">
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono font-bold text-lg">
                        {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                      </div>
                    </div>
                    {/* Tiny Pencil edit badge button */}
                    <button 
                      onClick={() => {
                        playClick();
                        setIsEditingUsername(!isEditingUsername);
                      }}
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-[#EDEDED] shadow flex items-center justify-center text-[11px] hover:bg-neutral-50 transition-all cursor-pointer"
                      title="Edit Profile Nickname"
                    >
                      ✍️
                    </button>
                  </div>

                  {/* Profile info values */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {isEditingUsername ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input 
                            type="text" 
                            value={usernameInput} 
                            onChange={(e) => setUsernameInput(e.target.value)}
                            className="bg-neutral-100 px-2 py-0.5 rounded text-xs font-bold text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#FF3333] w-28"
                          />
                          <button onClick={handleSaveUsername} className="bg-[#FF3333] text-white text-[9px] font-bold px-2 py-1 rounded">Save</button>
                        </div>
                      ) : (
                        <h3 className="text-base font-black text-neutral-900 tracking-tight leading-none uppercase flex items-center gap-1.5">
                          {user.username}
                        </h3>
                      )}
                      
                      {/* Orange VIP badge with Crown */}
                      <span className="bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/25 text-[8.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 tracking-wider uppercase">
                        👑 VIP
                      </span>
                    </div>

                    {/* User ID block with copy icon */}
                    <div className="flex items-center gap-1 mt-1 text-neutral-500">
                      <span className="text-xs font-medium font-sans">
                        User ID: TENZ{user.referralCode || "987654"}
                      </span>
                      <button 
                        onClick={handleCopyId}
                        className="p-1 hover:text-[#111111] text-neutral-400 rounded-md transition-colors active:scale-90"
                        title="Copy Member ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* VIP Level subtext link */}
                    <button 
                      onClick={() => { playClick(); setActiveSubTab('rewards'); }}
                      className="flex items-center gap-1 text-xs text-[#FF8C00] font-black uppercase tracking-wider mt-2.5 bg-[#FF8C00]/5 px-2.5 py-1 rounded-full outline-none"
                    >
                      ⭐ VIP Level {user.vipLevel || 3} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Triple Column stats balance card in White Box with Gray separator lines */}
                <div className="bg-white border border-[#EDEDED] rounded-2.5xl p-4.5 mt-6 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                  <div className="grid grid-cols-3 divide-x divide-[#F0F0F0]">
                    
                    {/* Column 1: Main Balance */}
                    <div className="text-center px-1">
                      <span className="text-[9px] uppercase font-bold text-[#666666] tracking-wider block">Main Balance</span>
                      <span className="text-xs font-black text-[#111111] font-mono block mt-1.5">
                        ₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Column 2: Bonus Pool */}
                    <div className="text-center px-1">
                      <span className="text-[9px] uppercase font-bold text-[#666666] tracking-wider block">Bonus</span>
                      <span className="text-xs font-black text-[#111111] font-mono block mt-1.5">
                        ₹{(user.bonusBalance || 2450.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Column 3: Winning Pool */}
                    <div className="text-center px-1">
                      <span className="text-[9px] uppercase font-bold text-[#666666] tracking-wider block">Winning</span>
                      <span className="text-xs font-black text-red-400 font-mono block mt-1.5">
                        ₹{(user.walletBalance * 0.21).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                  </div>

                  {/* Dual Action Primary Pills */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button 
                      onClick={() => {
                        playClick();
                        if (props.onNavigateBank) {
                          props.onNavigateBank('deposit');
                        } else {
                          setSelectedDepositType(null);
                          setDepositSuccessMessage(null);
                          setShowDepositModal(true);
                        }
                      }}
                      className="bg-[#FF3333] text-white font-extrabold uppercase tracking-wide text-xs h-12 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255, 51, 51,0.22)] active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white font-black" /> DEPOSIT
                    </button>
                    <button 
                      onClick={() => {
                        playClick();
                        if (props.onNavigateBank) {
                          props.onNavigateBank('withdraw');
                        } else {
                          setWithdrawSuccess(false);
                          setShowWithdrawModal(true);
                        }
                      }}
                      className="bg-white hover:bg-[#F9F9F9] border border-[#EDEDED] text-[#111111] font-extrabold uppercase tracking-wide text-xs h-12 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4 text-[#FF3333]" /> WITHDRAW
                    </button>
                  </div>
                </div>

                {/* Horizontal Quick Actions Grid Items (5 item slots match style) */}
                <div className="grid grid-cols-5 gap-3 mt-6">
                  {[
                    { id: 'deposit_icon', label: 'Deposit', icon: '📥', colorBg: 'bg-[#FF3333]/5 text-[#FF3333]' },
                    { id: 'withdraw_icon', label: 'Withdraw', icon: '💸', colorBg: 'bg-red-950/20 text-red-400' },
                    { id: 'bets_icon', label: 'My Bets', icon: '🎫', colorBg: 'bg-blue-50 text-blue-600' },
                    { id: 'tx_icon', label: 'Transaction', icon: '📄', colorBg: 'bg-purple-50 text-purple-600' },
                    { id: 'wallet_icon', label: 'My Wallet', icon: '💳', colorBg: 'bg-amber-50 text-amber-600' }
                  ].map((actObj) => (
                    <button
                      key={actObj.id}
                      onClick={() => {
                        playClick();
                        if (actObj.id === 'deposit_icon') {
                          if (props.onNavigateBank) {
                            props.onNavigateBank('deposit');
                          } else {
                            setSelectedDepositType(null); setDepositSuccessMessage(null); setShowDepositModal(true);
                          }
                        } else if (actObj.id === 'withdraw_icon') {
                          if (props.onNavigateBank) {
                            props.onNavigateBank('withdraw');
                          } else {
                            setWithdrawSuccess(false); setShowWithdrawModal(true);
                          }
                        } else if (actObj.id === 'bets_icon') {
                          setActiveNav('bets');
                        } else if (actObj.id === 'tx_icon') {
                          setActiveSubTab('transactions');
                        } else if (actObj.id === 'wallet_icon') {
                          setActiveNav('wallet');
                        }
                      }}
                      className="flex flex-col items-center gap-2 outline-none group cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-2xl ${actObj.colorBg} flex items-center justify-center text-lg shadow-[0_2px_6px_rgba(0,0,0,0.015)] group-hover:scale-105 transition-transform`}>
                        {actObj.icon}
                      </div>
                      <span className="font-sans text-[10px] font-black tracking-tight text-neutral-800 leading-none">
                        {actObj.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Double Column settings menu under ACCOUNT label */}
                <div className="mt-8 text-left">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-[#999999] mb-3">
                    Account
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {[
                      { id: 'profile', label: 'Personal Details', color: 'text-blue-500 bg-blue-50', icon: <User className="w-4 h-4" /> },
                      { id: 'banks', label: 'Bank Accounts', color: 'text-red-400 bg-red-950/20', icon: <Building className="w-4 h-4" /> },
                      { id: 'upis', label: 'UPI Accounts', color: 'text-stone-500 bg-stone-50', icon: <Smartphone className="w-4 h-4" /> },
                      { id: 'refer', label: 'Refer & Earn', color: 'text-orange-500 bg-orange-50', icon: <Users className="w-4 h-4" /> },
                      { id: 'rewards', label: 'Rewards', color: 'text-rose-500 bg-rose-50', icon: <Gift className="w-4 h-4" /> },
                      { id: 'bonuses', label: 'Bonuses', color: 'text-purple-500 bg-purple-50', icon: <Ticket className="w-4 h-4" /> },
                      { id: 'notifications', label: 'Notifications', color: 'text-blue-500 bg-blue-50', icon: <Bell className="w-4 h-4" /> },
                      { id: 'security', label: 'Security', color: 'text-teal-500 bg-teal-50', icon: <ShieldCheck className="w-4 h-4" /> },
                      { id: 'settings', label: 'Settings', color: 'text-[#666666] bg-neutral-100', icon: <Settings className="w-4 h-4" /> },
                      { id: 'support', label: 'Help & Support', color: 'text-sky-500 bg-sky-50', icon: <Headphones className="w-4 h-4" /> }
                    ].map((mItem) => (
                      <button
                        key={mItem.id}
                        onClick={() => {
                          playClick();
                          setActiveSubTab(mItem.id);
                        }}
                        className="flex items-center justify-between p-3 border border-[#F2F2F2] hover:border-neutral-200 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:bg-[#FAFAFA] transition-all cursor-pointer text-left outline-none group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${mItem.color} flex items-center justify-center`}>
                            {mItem.icon}
                          </div>
                          <span className="text-xs font-extrabold text-neutral-800 tracking-tight">{mItem.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wide Logout action button */}
                <div className="mt-6 border-t border-[#F0F0F0] pt-6">
                  <button
                    onClick={() => {
                      playClick();
                      if (confirm("Are you sure you want to securely exit Tenzo VIP platform?")) {
                        if (onBackToLobby) onBackToLobby();
                      }
                    }}
                    className="w-full h-12 bg-white border border-[#EDEDED] text-[#FF3333] hover:bg-neutral-50 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#FF3333]" /> Logout
                  </button>
                </div>

              </div>

              {/* Invitation Refer banner bottom component with coins decoration */}
              <div className="bg-gradient-to-tr from-[#6366F1]/10 via-[#D946EF]/5 to-[#FF3333]/5 border border-[#EDEDED] p-5 rounded-[28px] relative overflow-hidden flex flex-col md:flex-row justify-between items-center text-left gap-4">
                <div className="absolute top-2 right-4 text-3xl font-serif text-[#FF3333]/10 pointer-events-none select-none">🎁</div>
                
                <div>
                  <h4 className="text-sm font-black text-neutral-900 tracking-tight leading-snug">Invite Friends & Earn More</h4>
                  <p className="text-neutral-500 text-xs font-medium mt-1">Earn exciting rewards on every referral registration.</p>
                </div>

                <button 
                  onClick={() => { playClick(); setActiveSubTab('refer'); }}
                  className="bg-[#FF3333] hover:brightness-110 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider h-10 px-6 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Refer Now
                </button>
              </div>

            </motion.div>
          )}

          {/* 3. DYNAMIC DRAWER BACKEND SUBTABS FOR ACCOUNT SECTION */}
          {activeNav === 'account' && activeSubTab !== null && (
            <motion.div
              key="account-subview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-[32px] p-6 border border-[#F0F0F0] shadow-sm text-left">
                
                {/* Secondary navigation bar */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
                  <button 
                    onClick={() => { playClick(); setActiveSubTab(null); }}
                    className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-600 hover:text-neutral-900 outline-none cursor-pointer"
                  >
                    <X className="w-4 h-4 text-[#FF3333]" /> Close
                  </button>
                  <span className="text-[10px] uppercase font-black text-neutral-400 tracking-widest">
                    {activeSubTab.replace('_', ' ')} Settings
                  </span>
                </div>

                {/* 1. PERSONAL DETAILS */}
                {activeSubTab === 'profile' && (
                  <div className="space-y-4 text-left">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">👤 ID Personal details</h3>
                    <div className="space-y-3 mt-4">
                      <div className="p-3 bg-neutral-50 border border-[#F0F0F0] rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Standard UserName</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-neutral-800">{user.username}</span>
                          <button onClick={() => { playClick(); setIsEditingUsername(true); setActiveSubTab(null); }} className="text-[10px] uppercase font-black text-[#FF3333]">Edit</button>
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-[#F0F0F0] rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">VIP Status Category</span>
                        <span className="text-xs font-black text-[#FF8C00] block mt-1">Tier-3 Prime Platinum Patron</span>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-[#F0F0F0] rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Registered Mobile / Email</span>
                        <span className="text-xs font-black text-neutral-700 block mt-1">{user.username.replace(/\s+/g,'').toLowerCase()}@okaxis.com</span>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-[#F0F0F0] rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Registered Referrer Code</span>
                        <span className="text-xs font-bold font-mono text-neutral-700 block mt-1">{user.referralCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BANK ACCOUNTS */}
                {activeSubTab === 'banks' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">🏦 Link Saved Banks</h3>
                    
                    <div className="space-y-2.5 my-3">
                      {userBanks.map((bankObj) => (
                        <div key={bankObj.id} className="p-4 bg-zinc-50 border border-[#ECECEC] rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-950/200/10 text-red-400 flex items-center justify-center text-lg">
                              🏛️
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-800">{bankObj.bankName}</h4>
                              <p className="text-[10px] text-neutral-500 mt-1">Holder: {bankObj.holder} • IFSC: {bankObj.ifsc}</p>
                              <span className="text-[10px] font-mono text-neutral-700 block mt-0.5">{bankObj.number}</span>
                            </div>
                          </div>
                          {userBanks.length > 1 && (
                            <button 
                              onClick={() => { playClick(); setUserBanks(userBanks.filter(b => b.id !== bankObj.id)); }}
                              className="text-red-400 hover:text-emerald-800 p-1 rounded hover:bg-red-950/20 transition-colors text-xs font-bold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddBank} className="border-t border-dashed border-neutral-100 pt-4 space-y-3">
                      <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block">Add New Account</span>
                      
                      <div>
                        <label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Bank Name</label>
                        <input 
                          type="text" 
                          placeholder="State Bank of India (SBI)" 
                          value={newBankName} 
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full h-11 border border-[#EDEDED] pl-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Account Number</label>
                          <input 
                            type="text" 
                            placeholder="30419201948" 
                            value={newBankNum} 
                            onChange={(e) => setNewBankNum(e.target.value)}
                            className="w-full h-11 border border-[#EDEDED] pl-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">IFSC Code</label>
                          <input 
                            type="text" 
                            placeholder="SBIN0001092" 
                            value={newBankIfsc} 
                            onChange={(e) => setNewBankIfsc(e.target.value)}
                            className="w-full h-11 border border-[#EDEDED] pl-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111]"
                          />
                        </div>
                      </div>
                      
                      <button 
                        type="submit"
                        className="w-full h-11 bg-[#FF3333] text-white font-black uppercase text-xs tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        Register Bank Account
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. UPI ACCOUNTS */}
                {activeSubTab === 'upis' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">📲 Saved UPI Addresses</h3>
                    
                    <div className="space-y-2 my-3">
                      {userUPIs.map((upiId, index) => (
                        <div key={index} className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-black text-neutral-800 font-mono select-all">
                            {upiId}
                          </span>
                          {userUPIs.length > 1 && (
                            <button 
                              onClick={() => { playClick(); setUserUPIs(userUPIs.filter(u => u !== upiId)); }}
                              className="text-red-400 hover:text-emerald-800 text-xs font-bold p-1 rounded"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddUpiAccount} className="border-t border-dashed border-neutral-100 pt-4 space-y-3">
                      <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block">Link Virtual Payment Address (VPA)</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="debupam@okhdfcbank" 
                          value={newUpi} 
                          onChange={(e) => setNewUpi(e.target.value)}
                          className="flex-1 h-11 border border-[#EDEDED] pl-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111]"
                        />
                        <button 
                          type="submit"
                          className="px-5 bg-stone-900 text-white font-extrabold uppercase text-xs tracking-wide rounded-xl active:scale-95 transition-transform cursor-pointer"
                        >
                          Add VPA
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 4. REFER & EARN */}
                {activeSubTab === 'refer' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">👥 Referrals Dashboard</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Invite your community network. When your match associates sign-up and place their first dynamic predictions, both of you secure premium cash bonuses instantly.
                    </p>

                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 mt-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Personal Refer Code</span>
                        <div className="flex items-center justify-between bg-white border border-[#EDEDED] px-3 py-2 rounded-xl mt-1">
                          <span className="text-xs font-black font-mono text-neutral-800">{user.referralCode || "TENZ987654"}</span>
                          <button onClick={handleCopyReferral} className="text-[#FF3333] text-xs font-bold">
                            {copiedCode ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-white border border-[#EDEDED] p-3 rounded-xl text-center">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Total Invites</span>
                          <strong className="text-sm font-black text-neutral-800 block mt-1">12 Members</strong>
                        </div>
                        <div className="bg-white border border-[#EDEDED] p-3 rounded-xl text-center">
                          <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Earning claimed</span>
                          <strong className="text-sm font-black text-red-400 block mt-1">₹{(user.totalReferralEarning || 4500).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. REWARDS (DAILY CHECK-IN STRK) */}
                {activeSubTab === 'rewards' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">🎁 7-Day Streak Rewards</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                      Claim free cash rewards every 24 hours. Don't skip a day, or your check-in progress will revert to Day 1.
                    </p>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[100, 250, 500, 750, 1000, 1500, 5000].map((rv, index) => {
                        const isClaimed = checkedDays[index];
                        const isNextEligible = index === 0 ? !checkedDays[0] : checkedDays[index - 1] && !checkedDays[index];
                        
                        return (
                          <div 
                            key={index}
                            onClick={() => !isClaimed && isNextEligible && handleCheckInClaim(index)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              isClaimed ? 'bg-red-950/20 border-red-900/40 text-emerald-800' :
                              isNextEligible ? 'bg-red-950/20/70 border-[#FF3333] text-[#FF3333] animate-pulse scale-105' :
                              'bg-neutral-50 border-neutral-200 text-neutral-400'
                            }`}
                          >
                            <span className="text-[9px] block uppercase font-bold text-neutral-400 leading-none">Day {index + 1}</span>
                            <span className="text-[13px] block font-black mt-2">₹{rv}</span>
                            <span className="text-[8px] block font-extrabold uppercase mt-1">
                              {isClaimed ? 'Claimed' : isNextEligible ? 'Claim' : 'Locked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. BONUSES (PROMO CODE MODULES) */}
                {activeSubTab === 'bonuses' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">🎫 VIP Promo Bonuses</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Enter any valid promotional bonus voucher to secure instant, direct credits to your gaming wallets.
                    </p>

                    <form onSubmit={handleApplyCoupon} className="space-y-3.5 mt-2">
                      <div>
                        <label className="text-[9px] uppercase font-black text-neutral-400 block mb-1">Coupon Promo Code</label>
                        <input 
                          type="text"
                          placeholder="e.g. TENZO500"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full h-11 border border-[#EDEDED] pl-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111] uppercase"
                        />
                      </div>

                      {promoFeedback && (
                        <div className="p-3 rounded-lg text-xs font-bold bg-neutral-50 text-neutral-700">
                          {promoFeedback}
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full h-11 bg-neutral-900 border border-neutral-800 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-transform cursor-pointer"
                      >
                        Apply Voucher Code
                      </button>
                    </form>

                    <div className="p-3.5 border border-[#F2F2F2] rounded-2xl bg-stone-50 text-xs text-neutral-600 mt-4 leading-relaxed">
                      <span className="font-extrabold text-[#FF3333] uppercase block mb-1 text-[10px]">Available Promos:</span>
                      • Use code <strong className="font-mono text-stone-800 select-all font-black">TENZO500</strong> for an instant bonus of ₹500.<br />
                      • Use code <strong className="font-mono text-stone-800 select-all font-black">WELCOME100</strong> for ₹100 direct cash.
                    </div>
                  </div>
                )}

                {/* 7. NOTIFICATIONS */}
                {activeSubTab === 'notifications' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">🔔 Inbox Broadcasts</h3>
                    <div className="space-y-2.5 mt-3">
                      {bulletins.map((item, id) => (
                        <div key={id} className="text-xs text-[#111111] leading-relaxed p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-400 block mb-1 font-bold">SYSTEM ALERT • 2026-06-23</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. SECURITY */}
                {activeSubTab === 'security' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">🛡️ VIP Platform Security</h3>
                    <div className="space-y-3.5 mt-3">
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-neutral-800 block">Two-Factor Authentication</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">Secure logins via OTP codes</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF3333] cursor-pointer" />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-neutral-800 block">Biometrics / PIN lock</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">Locks cashouts on verification mismatch</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF3333] cursor-pointer" />
                      </div>

                      <div className="p-3.5 bg-red-950/20/50 border border-emerald-200 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-700 block font-bold">Secured Logins History</span>
                        <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
                          Active IP Address: 157.48.91.100 (Chennai, India)<br />
                          Device platform: Apple WebKit Mobile API<br />
                          Session expires in: 11 hours 42 minutes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. SETTINGS */}
                {activeSubTab === 'settings' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">⚙️ General Settings</h3>
                    
                    <div className="space-y-4 mt-4">
                      {/* Volume Slider control */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-black text-neutral-800">UI Interaction Volume</label>
                          <span className="text-xs font-extrabold font-mono text-[#FF3333]">80%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          defaultValue="80" 
                          className="w-full accent-[#FF3333]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-neutral-800 block">Haptic feedback</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">Vibrate mobile on bet slip tap</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF3333] cursor-pointer" />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-neutral-800 block">Sound FX Synthesizers</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">Play dynamic chimes on winnings</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF3333] cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. HELP & SUPPORT CONCIERGE CHAT SIMULATOR */}
                {activeSubTab === 'support' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">📞 VIP Concierge Chat Desk</h3>
                    
                    {/* Chat Logs Window Panel */}
                    <div className="h-60 border border-neutral-200 rounded-2xl p-3 overflow-y-auto space-y-2.5 bg-neutral-50 flex flex-col no-scrollbar">
                      {chatLog.map((chatObj, cIdx) => (
                        <div 
                          key={cIdx} 
                          className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                            chatObj.sender === 'user' 
                              ? 'bg-[#FF3333] text-white self-end ml-10 rounded-br-none' 
                              : 'bg-white border border-[#EDEDED] text-neutral-800 self-start mr-10 rounded-bl-none shadow-[0_2px_4px_rgba(0,0,0,0.015)]'
                          }`}
                        >
                          <p className="font-medium">{chatObj.text}</p>
                          <span className={`text-[8px] font-bold block mt-1 ${chatObj.sender === 'user' ? 'text-white/60 text-right' : 'text-neutral-400'}`}>
                            {chatObj.time}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendSupportMessage} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type support concern (e.g. withdraw delay)..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="flex-1 h-11 border border-[#EDEDED] pl-3 text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-[#FF3333] bg-white text-[#111111]"
                      />
                      <button 
                        type="submit"
                        className="px-5 bg-neutral-900 text-white font-extrabold uppercase text-xs tracking-wide rounded-xl active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="flex gap-1.5 flex-wrap pt-1.5">
                      {['Withdraw status', 'Fast UPI deposits', 'Claim bonus codes'].map((topicBtn, tbId) => (
                        <button
                          key={tbId}
                          type="button"
                          onClick={() => { setSupportMessage(topicBtn); playClick(); }}
                          className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/50 text-[10px] sm:text-xs font-bold text-neutral-700 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                        >
                          ❓ {topicBtn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 11. DETAILED TRANSACTION HISTORY */}
                {activeSubTab === 'transactions' && (
                  <div className="space-y-4 text-left">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-tight">📄 Statements & Logs</h3>
                    
                    <div className="flex bg-neutral-100 p-1 rounded-xl items-center mb-3">
                      <input 
                        type="text" 
                        placeholder="Search deposits/withdrawals..." 
                        value={txnSearch}
                        onChange={(e) => setTxnSearch(e.target.value)}
                        className="w-full bg-transparent px-3 py-1.5 border-none outline-none text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                      {/* Hardcoded + dynamic mock statements block matching real types */}
                      {[
                        { id: 'DEP-10924', type: 'deposit', amount: 5000, date: 'Today, 03:14 AM', status: 'SUCCESS' },
                        { id: 'WTH-09252', type: 'withdraw', amount: 1500, date: 'Yesterday, 10:45 PM', status: 'SUCCESS' },
                        { id: 'DEP-08912', type: 'deposit', amount: 10000, date: '21 Jun 2026', status: 'SUCCESS' },
                        { id: 'WTH-08711', type: 'withdraw', amount: 3000, date: '20 Jun 2026', status: 'FAILED' }
                      ]
                      .filter(t => t.id.toLowerCase().includes(txnSearch.toLowerCase()) || t.type.toLowerCase().includes(txnSearch.toLowerCase()))
                      .map((tObj, idx) => (
                        <div key={idx} className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block ${
                              tObj.type === 'deposit' ? 'bg-red-950/20 text-red-400' : 'bg-rose-50 text-[#FF3333]'
                            }`}>
                              {tObj.type}
                            </span>
                            <span className="text-[10px] font-bold font-mono text-neutral-400 block">ID: {tObj.id} • {tObj.date}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-black ${tObj.type === 'deposit' ? 'text-red-400' : 'text-neutral-800'}`}>
                              {tObj.type === 'deposit' ? '+' : '-'} ₹{tObj.amount.toLocaleString()}
                            </span>
                            <span className={`text-[8.5px] block font-extrabold uppercase mt-0.5 ${
                              tObj.status === 'SUCCESS' ? 'text-red-400 animate-pulse' : 'text-red-400'
                            }`}>
                              {tObj.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 2. UNIVERSAL PREMIUM DEPOSIT BOTTOM SHEET OVERLAY */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop Dimmer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { playClick(); setShowDepositModal(false); }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Bottom Sheet container */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white rounded-t-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.18)] p-6 z-10 text-left outline-none"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />

              {selectedDepositType === null ? (
                // Step 1: Select deposit method list
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-base font-black text-neutral-950 uppercase tracking-tight">Secure Cashier Deposit</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-none">Instant, automated VIP settlements</p>
                    </div>
                    <button 
                      onClick={() => { playClick(); setShowDepositModal(false); }}
                      className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center focus:outline-none"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'upi', title: 'UPI Deposit', desc: 'Instant payment settled in 90s', color: 'bg-indigo-50 text-indigo-600', icon: <Smartphone className="w-5 h-5" /> },
                      { id: 'bank', title: 'Bank Transfer', desc: 'NEFT / IMPS corporate routings', color: 'bg-blue-50 text-blue-600', icon: <Building className="w-5 h-5" /> },
                      { id: 'qr', title: 'QR Deposit', desc: 'Scan and pay using any wallet app', color: 'bg-orange-50 text-orange-600', icon: <QrCode className="w-5 h-5" /> },
                      { id: 'crypto', title: 'Crypto Deposit', desc: 'USDT TRC20 currency standard', color: 'bg-red-950/20 text-red-400', icon: <Bitcoin className="w-5 h-5" /> },
                    ].map((modeItem) => (
                      <button
                        key={modeItem.id}
                        onClick={() => {
                          playClick();
                          setSelectedDepositType(modeItem.id as any);
                        }}
                        className="w-full p-4 border border-[#F2F2F2] hover:border-neutral-200 bg-white rounded-2.5xl flex items-center justify-between text-left transition-all active:scale-98 shadow-[0_2px_8px_rgba(0,0,0,0.005)] hover:bg-neutral-50 outline-none group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl ${modeItem.color} flex items-center justify-center`}>
                            {modeItem.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-neutral-900 leading-tight">{modeItem.title}</h4>
                            <p className="text-[11px] text-neutral-500 mt-1 leading-none">{modeItem.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Step 2: Specific payment form input
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => { playClick(); setSelectedDepositType(null); }}
                      className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mr-1 cursor-pointer hover:bg-neutral-100 transition-colors"
                      title="Cancel & Choose Another"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                    <div>
                      <h3 className="text-sm font-black text-neutral-950 uppercase tracking-tight">
                        Deposit via {selectedDepositType.toUpperCase()}
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Automated settlement pool active</p>
                    </div>
                  </div>

                  {depositSuccessMessage ? (
                    <div className="space-y-4 text-center py-6">
                      <div className="text-4xl">💎</div>
                      <div className="text-xs font-bold text-neutral-700 leading-relaxed bg-[#FAFAFA] p-4 rounded-2xl border border-[#EDEDED]">
                        {depositSuccessMessage}
                      </div>
                      <button 
                        onClick={() => {
                          playClick();
                          setShowDepositModal(false);
                          setSelectedDepositType(null);
                          setDepositSuccessMessage(null);
                        }}
                        className="w-full h-12 bg-neutral-900 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                      >
                        Got It, Done
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {selectedDepositType === 'qr' && (
                        <div className="text-center py-2 bg-neutral-50 border border-neutral-200 rounded-2xl">
                          <div className="text-lg mb-1">🤳</div>
                          <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Dynamic QR Generated</span>
                          {/* Beautiful simulated scanner box */}
                          <div className="w-28 h-28 border-2 border-neutral-300 mx-auto mt-2 rounded-xl flex items-center justify-center bg-white relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-[#FF3333]/50 animate-bounce" />
                            <QrCode className="w-20 h-20 text-neutral-800" />
                          </div>
                        </div>
                      )}

                      {selectedDepositType === 'crypto' && (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Secured USDT TRC20 Wallet Address</span>
                          <div className="flex bg-white border border-[#EDEDED] p-2 rounded-lg items-center justify-between">
                            <span className="font-mono text-[9px] text-neutral-700 select-all truncate mr-2">TX8d...yLq179p</span>
                            <span className="text-[10px] text-[#FF3333] font-bold cursor-pointer font-sans" onClick={() => { playClick(); alert("Coin Address Copied!"); }}>Copy</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] uppercase font-black text-neutral-400 block mb-1.5">Enter Deposit Stakes (₹)</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4.5 text-lg font-black text-neutral-600 font-mono">₹</span>
                          <input 
                            type="number"
                            min="200"
                            max="50000"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="500"
                            className="w-full h-14 border-2 border-neutral-100 bg-white shadow-inner pl-9 text-base font-black text-neutral-900 font-mono rounded-2.5xl focus:border-[#FF3333] outline-none"
                          />
                        </div>
                      </div>

                      {/* Chips quick selector row */}
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {['200', '500', '1000', '5000', '10000'].map((chipVal) => (
                          <button
                            key={chipVal}
                            onClick={() => { playClick(); setDepositAmount(chipVal); }}
                            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 font-mono text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            +₹{Number(chipVal).toLocaleString()}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={executeDeposit}
                        className="w-full h-13 mt-2 bg-[#FF3333] hover:brightness-110 active:scale-95 text-white font-black uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255, 51, 51,0.3)] transition-transform cursor-pointer"
                      >
                        ⚡ Standard Deposit Now
                      </button>

                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. UNIVERSAL WITHDRAW MODAL OVERLAY */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop dimmer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { playClick(); setShowWithdrawModal(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-6 border border-[#EDEDED] shadow-2xl relative w-full max-w-md z-10 text-left outline-none"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">Withdraw Securities</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Transfers are processed instantly via UPI</p>
                </div>
                <button 
                  onClick={() => { playClick(); setShowWithdrawModal(false); }}
                  className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center focus:outline-none"
                >
                  <X className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {withdrawSuccess ? (
                <div className="space-y-4 text-center py-6">
                  <div className="text-4xl">🕒</div>
                  <h4 className="text-sm font-black text-neutral-800 uppercase tracking-tight">Settlement Request Registered</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed bg-neutral-50 border border-[#F0F0F0] p-4 rounded-xl">
                    ₹{Number(withdrawAmount).toLocaleString('en-IN')} is queued for distribution to your selected payout wallet. Our IMPS gateway settles withdrawals in 90 seconds. Keep an eye on system logs!
                  </p>
                  <button 
                    onClick={() => { playClick(); setShowWithdrawModal(false); }}
                    className="w-full h-11 bg-stone-900 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    Done, return
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Select payout channel */}
                  <div>
                    <label className="text-[9px] uppercase font-black text-neutral-400 block mb-1.5">Payout Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => { playClick(); setSelectedWithdrawChannel('upi'); }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedWithdrawChannel === 'upi' ? 'border-[#FF3333] bg-red-950/20/20 text-[#FF3333]' : 'border-[#EDEDED] bg-white text-neutral-500'
                        }`}
                      >
                        <span className="text-xs font-black block">📲 UPI Pay out</span>
                        <span className="text-[9px] block mt-0.5 font-mono">{userUPIs[0] || 'VPA Not linked'}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => { playClick(); setSelectedWithdrawChannel('bank'); }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedWithdrawChannel === 'bank' ? 'border-[#FF3333] bg-red-950/20/20 text-[#FF3333]' : 'border-[#EDEDED] bg-white text-neutral-500'
                        }`}
                      >
                        <span className="text-xs font-black block">🏦 IMPS/NEFT</span>
                        <span className="text-[9px] block mt-0.5 font-mono">{userBanks[0]?.number || 'Bank Not linked'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-black text-neutral-400 block mb-1">Withdrawal Amount (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4.5 text-lg font-black text-neutral-600 font-mono">₹</span>
                      <input 
                        type="number"
                        min="500"
                        max={user.walletBalance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="1000"
                        className="w-full h-13 border-2 border-neutral-100 bg-white shadow-inner pl-9 text-base font-black text-neutral-900 font-mono rounded-2xl focus:border-[#FF3333] outline-none"
                      />
                    </div>
                    <span className="text-[9px] text-[#22C55E] font-medium block mt-1.5 px-0.5">
                      Available payout balance: ₹{user.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Limits and security notice disclaimer */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-2.5">
                    <span className="text-base leading-none">⚙️</span>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Payout channel undergoes multi-factor security reviews. Withdrawal is limited to verified premium members with a minimum floor value of ₹500.
                    </p>
                  </div>

                  <button 
                    onClick={executeWithdraw}
                    className="w-full h-12 bg-[#FF3333] hover:brightness-110 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-md transition-transform cursor-pointer"
                  >
                    Confirm Secure Cashout
                  </button>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. STICKY FOOTER BOTTOM NAVIGATION CONTROLS */}
      <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-md z-45 bg-white/90 backdrop-blur-3xl border-t border-[#F0F0F0] px-3 py-2.5 flex items-center justify-between shadow-[0_-10px_35px_rgba(0,0,0,0.03)] h-16">
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'bets', label: 'My Bets', icon: '🎫' }
        ].map((item) => {
          const isSelected = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playClick();
                setActiveNav(item.id as any);
                setActiveSubTab(null); // Close active sub tab drawers
              }}
              onMouseEnter={() => playHover()}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-200 outline-none cursor-pointer ${
                isSelected ? 'text-[#FF3333]' : 'text-neutral-500'
              }`}
            >
              <span className={`text-[15px] filter transition-transform ${isSelected ? 'scale-105' : 'opacity-70'}`}>
                {item.icon}
              </span>
              <span className={`font-sans text-[10px] tracking-wide transition-all ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>

              {/* Indicator micro dot active red */}
              {isSelected && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF3333]" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
