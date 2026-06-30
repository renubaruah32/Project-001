import React, { useState, useEffect, FormEvent } from 'react';
import { UserProfile, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Award, 
  Coins, 
  Edit3, 
  Save,
  CheckCircle2,
  Gift,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowLeft,
  History,
  PiggyBank,
  ChevronRight,
  Plus,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Headphones,
  Sparkles,
  Lock,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  LogOut,
  Share2,
  Landmark
} from 'lucide-react';
import { playClick, playHover, playWin } from '../utils/audio';

interface AccountTabProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddTransaction: (tx: Transaction) => void;
  onLogout: () => void;
  onNavigate?: (tab: 'bank' | 'games' | 'wheel' | 'refer' | 'account', subTab?: 'deposit' | 'withdraw') => void;
  bankAccounts?: any[];
  onUpdateBankAccounts?: (accounts: any[]) => void;
  upiAccounts?: any[];
  onUpdateUpiAccounts?: (accounts: any[]) => void;
  transactions?: Transaction[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  ifsc: string;
  isPrimary: boolean;
}

interface UpiId {
  id: string;
  vpa: string;
  isPrimary: boolean;
}

export default function AccountTab({ 
  user, 
  onUpdateUser, 
  onAddTransaction, 
  onLogout,
  onNavigate,
  transactions = [],
  ...props
}: AccountTabProps) {
  const [claiming, setClaiming] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>(user.username);
  const [showSaveFeedback, setShowSaveFeedback] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>('');
  const [isBankDetailsOpen, setIsBankDetailsOpen] = useState<boolean>(true);

  // Count today's successful or pending withdrawals dynamically
  const dailyWithdrawalsDone = (transactions || []).filter(tx => {
    if (tx.type !== 'withdraw') return false;
    if (tx.status !== 'SUCCESS' && tx.status !== 'PENDING') return false;
    
    const ts = tx.timestamp.toLowerCase();
    if (ts.includes('yesterday')) return false;
    if (ts.includes('jun') || ts.includes('jul') || ts.includes('may')) return false;
    
    return true;
  }).length;

  // Local state for linked payment details (stored dynamically with premium defaults)
  const [localLinkedBanks, setLocalLinkedBanks] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('tenzo_linked_banks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse linked banks:", e);
    }
    return [
      {
        id: 'bank-1',
        bankName: 'HDFC Bank',
        accountNumber: '5010048192811',
        holderName: 'Debupam Gogoi',
        ifsc: 'HDFC0001234',
        isPrimary: true
      }
    ];
  });
  const linkedBanks = props.bankAccounts || localLinkedBanks;
  const setLinkedBanks = (updated: any) => {
    const nextVal = typeof updated === 'function' ? updated(linkedBanks) : updated;
    if (props.onUpdateBankAccounts) {
      props.onUpdateBankAccounts(nextVal);
    } else {
      setLocalLinkedBanks(nextVal);
    }
  };

  const [localLinkedUpis, setLocalLinkedUpis] = useState<UpiId[]>(() => {
    try {
      const saved = localStorage.getItem('tenzo_linked_upis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse linked upis:", e);
    }
    return [
      {
        id: 'upi-1',
        vpa: 'debupam7@okaxis',
        isPrimary: true
      }
    ];
  });
  const linkedUpis = props.upiAccounts || localLinkedUpis;
  const setLinkedUpis = (updated: any) => {
    const nextVal = typeof updated === 'function' ? updated(linkedUpis) : updated;
    if (props.onUpdateUpiAccounts) {
      props.onUpdateUpiAccounts(nextVal);
    } else {
      setLocalLinkedUpis(nextVal);
    }
  };

  // Save linked credentials to local cache on update
  useEffect(() => {
    if (!props.bankAccounts) {
      localStorage.setItem('tenzo_linked_banks', JSON.stringify(linkedBanks));
    }
  }, [linkedBanks, props.bankAccounts]);

  useEffect(() => {
    if (!props.upiAccounts) {
      localStorage.setItem('tenzo_linked_upis', JSON.stringify(linkedUpis));
    }
  }, [linkedUpis, props.upiAccounts]);

  // Modal overlays state
  const [activeOverlay, setActiveOverlay] = useState<null | 'add_bank' | 'add_upi' | 'transfer' | 'history' | 'kyc' | 'rewards' | 'support' | 'bank_details'>(null);

  // Modal subforms
  const [newBankName, setNewBankName] = useState('');
  const [newBankNumber, setNewBankNumber] = useState('');
  const [newBankHolder, setNewBankHolder] = useState(user.username);
  const [newBankIfsc, setNewBankIfsc] = useState('');

  const [newUpiVpa, setNewUpiVpa] = useState('');

  // Transfer status states
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Support chat state
  const [supportMessage, setSupportMessage] = useState('');
  const [supportHistory, setSupportHistory] = useState<{ sender: 'user' | 'agent', text: string, time: string }[]>([
    { sender: 'agent', text: 'Hi debupam! Welcome to Tenzo VIP Concierge Desk. How may I assist your deposits or withdrawals today?', time: '11:45 PM' }
  ]);

  const checkInRewards = [
    { day: 1, reward: 100, exp: 10 },
    { day: 2, reward: 200, exp: 15 },
    { day: 3, reward: 300, exp: 20 },
    { day: 4, reward: 500, exp: 25 },
    { day: 5, reward: 800, exp: 35 },
    { day: 6, reward: 1200, exp: 45 },
    { day: 7, reward: 5000, exp: 100 }
  ];

  // Particle list mapping for ambient design rules
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, delay: number, size: number }[]>([]);
  useEffect(() => {
    // Generate organic positions for custom background glow red particles
    const generated = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 10,
      delay: Math.random() * 4,
      size: Math.random() * 3 + 2
    }));
    setParticles(generated);
  }, []);

  const handleWeeklyCheckIn = () => {
    if (user.checkedInToday) return;

    setClaiming(true);
    playClick();

    const targetDay = (user.dailyStreak % 7) + 1;
    const rewardItem = checkInRewards[targetDay - 1];

    setTimeout(() => {
      let updatedUser = {
        ...user,
        walletBalance: user.walletBalance + rewardItem.reward,
        vipExp: Math.min(user.vipExp + rewardItem.exp, user.vipExpMax),
        dailyStreak: user.dailyStreak + 1,
        checkedInToday: true
      };

      // Handle VIP Level Upgrade logic
      if (updatedUser.vipExp >= updatedUser.vipExpMax) {
        updatedUser.vipLevel += 1;
        updatedUser.vipExp = 0;
        updatedUser.vipExpMax = Math.floor(updatedUser.vipExpMax * 1.5);
      }

      onUpdateUser(updatedUser);
      setClaiming(false);
      playWin();

      onAddTransaction({
        id: `checkin-${Date.now()}`,
        type: 'checkin_bonus',
        amount: rewardItem.reward,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'SUCCESS',
        description: `Day ${targetDay} Streak Daily Loyalty Reward!`
      });
    }, 750);
  };

  const handleSaveUsername = () => {
    if (!newUsername.trim()) return;
    playClick();
    onUpdateUser({
      ...user,
      username: newUsername.trim()
    });
    setIsEditingName(false);
    setShowSaveFeedback(true);
    setTimeout(() => {
      setShowSaveFeedback(false);
    }, 2000);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newBankNumber) return;
    playClick();

    const formattedNum = '•••• •••• ' + newBankNumber.slice(-4);
    const newRecord: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: newBankName,
      accountNumber: formattedNum,
      holderName: newBankHolder.toUpperCase() || user.username.toUpperCase(),
      ifsc: newBankIfsc.toUpperCase() || 'IFSC0001',
      isPrimary: linkedBanks.length === 0
    };

    setLinkedBanks([...linkedBanks, newRecord]);
    setNewBankName('');
    setNewBankNumber('');
    setNewBankIfsc('');
    setActiveOverlay(null);
    playWin();
  };

  const handleAddUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpiVpa.trim()) return;
    playClick();

    const newRecord: UpiId = {
      id: `upi-${Date.now()}`,
      vpa: newUpiVpa.toLowerCase().trim(),
      isPrimary: linkedUpis.length === 0
    };

    setLinkedUpis([...linkedUpis, newRecord]);
    setNewUpiVpa('');
    setActiveOverlay(null);
    playWin();
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    playClick();

    const userText = supportMessage.trim();
    const newChat = [...supportHistory, { sender: 'user' as const, text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setSupportHistory(newChat);
    setSupportMessage('');

    setTimeout(() => {
      let response = "Your ticket has been prioritized by Tenzo desk. Payouts or webhooks generally settle on the ledger instantly. If you need manual validation, we are ready!";
      if (userText.toLowerCase().includes('withdraw') || userText.toLowerCase().includes('payout')) {
        response = "Standard cashing out uses manual or direct IMPS gateways. Please ensure your linked bank information is accurate for immediate settlement.";
      } else if (userText.toLowerCase().includes('deposit') || userText.toLowerCase().includes('payment')) {
        response = "To perform real-time tracking, switch to Method B, set your routing VPA, and click copy on the generated Order ID remarks code. It matches automatically!";
      }
      setSupportHistory(prev => [...prev, { sender: 'agent' as const, text: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(transferAmount);
    if (!transferTarget.trim()) {
      setTransferError('Please enter a recipient username or VPA.');
      return;
    }
    if (isNaN(numAmt) || numAmt <= 0) {
      setTransferError('Please input a valid transfer amount.');
      return;
    }
    if (numAmt > user.walletBalance) {
      setTransferError('Insufficient balance for this transfer.');
      return;
    }

    playClick();
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance - numAmt
    };
    onUpdateUser(updatedUser);

    onAddTransaction({
      id: `trans-${Date.now()}`,
      type: 'withdraw',
      amount: numAmt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SUCCESS',
      description: `P2P Wallet Vault transfer to ${transferTarget}`
    });

    setTransferSuccess(true);
    setTransferAmount('');
    setTransferTarget('');
    playWin();
    setTimeout(() => {
      setTransferSuccess(false);
      setActiveOverlay(null);
    }, 1800);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    playClick();
    setCopiedText(code);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Pre-load current transactions log (filtered for simplicity view)
  const transactionHistoryList = () => {
    // Standard mock list fallback if none exist
    const items = [
      { id: '1', type: 'deposit', amt: 50000, label: 'Instant UPI Webhook Deposit', state: 'SUCCESS', time: '11:45 PM' },
      { id: '2', type: 'win', amt: 14200, label: 'Aviator Multiplier x4.20 Win', state: 'SUCCESS', time: '10:30 PM' },
      { id: '3', type: 'withdraw', amt: 12000, label: 'IMPS Bank Cashout', state: 'SUCCESS', time: 'Yesterday' }
    ];
    return items;
  };

  const initialLetter = user.username ? user.username.charAt(0).toUpperCase() : 'V';

  return (
    <div className="relative font-sans text-white space-y-6 pb-36 select-none max-w-md mx-auto">
      {/* Dynamic Keyframe style helper injection */}
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-40px) scale(1.1); opacity: 0.55; }
          100% { transform: translateY(-80px) scale(1); opacity: 0.25; }
        }
        .text-glow-crimson {
          text-shadow: 0 0 16px rgba(255, 59, 77, 0.45);
        }
        .card-glow-red {
          box-shadow: 0 0 25px rgba(255, 59, 77, 0.12);
        }
      `}</style>

      {/* Floating Red Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#ff3b4d] blur-[1px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `drift ${5 + p.id}s infinite linear`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 space-y-5 px-1 pt-6">
        {/* Spacer below the header (approx 10-15% of screen height) */}
        <div className="h-[12vh] w-full pointer-events-none" id="header-spacer" />
        
        {/* ==================== 5. WITHDRAW CARD ==================== */}
        <div className="glass-panel p-5 rounded-[20px] border border-[#ff3b4d]/10 bg-black/60 relative overflow-hidden backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <span className="text-[9px] text-[#ff3b4d] font-bold uppercase tracking-wider block">Withdrawable Balance</span>
              <span className="font-sans font-extrabold text-xl text-white">
                {user.isBalanceLoading ? 'Loading...' : formatCurrency(user.walletBalance)}
              </span>
            </div>
            <div className="text-right flex flex-col items-end justify-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Daily Withdrawals</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-sans font-black text-xs text-white">
                  {dailyWithdrawalsDone} / 3
                </span>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase">Done</span>
              </div>
              <span className="font-sans font-extrabold text-[9px] text-[#ff3b4d] bg-[#ff3b4d]/10 border border-[#ff3b4d]/20 px-1.5 py-0.5 rounded-md mt-1.5 uppercase tracking-wider">
                Max 3 / Day
              </span>
            </div>
          </div>

          <button
            onClick={() => { if (onNavigate) onNavigate('bank', 'withdraw'); }}
            onMouseEnter={() => playHover()}
            className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-[#ff3b4d] to-[#160000] hover:from-[#ff5565] border border-[#ff3b4d]/30 text-white font-extrabold text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(255,59,77,0.25)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Withdraw Now</span>
            <ArrowUpRight className="w-4 h-4 text-white animate-bounce-horizontal" />
          </button>
        </div>

        {/* ==================== 4. QUICK ACTIONS ==================== */}
        <div className="grid grid-cols-4 gap-2.5 pt-1">
          {[
            { 
              label: 'Deposit', 
              icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
              action: () => { if (onNavigate) onNavigate('bank', 'deposit'); }
            },
            { 
              label: 'Withdraw', 
              icon: <ArrowUpRight className="w-5 h-5 text-amber-400" />,
              action: () => { if (onNavigate) onNavigate('bank', 'withdraw'); }
            },
            { 
              label: 'Bank', 
              icon: <Landmark className="w-5 h-5 text-blue-400" />,
              action: () => { playClick(); setActiveOverlay('bank_details'); }
            },
            { 
              label: 'History', 
              icon: <History className="w-5 h-5 text-[#ff3b4d]" />,
              action: () => { playClick(); setActiveOverlay('history'); }
            }
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={act.action}
              onMouseEnter={() => playHover()}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[20px] bg-black/50 border border-white/5 active:scale-95 transition-all text-center group cursor-pointer hover:border-[#ff3b4d]/25 hover:bg-[#160000]/35"
            >
              <div className="p-2 bg-white/5 rounded-xl group-hover:bg-[#ff3b4d]/10 transition-colors">
                {act.icon}
              </div>
              <span className="font-sans text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">
                {act.label}
              </span>
            </button>
          ))}
        </div>




        {/* Signout / Dev Control buttons replaced by fixed floating footer bar at the bottom */}

      </div>

      {/* ==================== INTERACTIVE GLASS SHEET OVERLAYS ==================== */}
      <AnimatePresence>
        {activeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#090909]/90 backdrop-blur-md flex items-end justify-center"
            onClick={() => setActiveOverlay(null)}
          >
            <motion.div
              initial={{ translateY: "100%" }}
              animate={{ translateY: "0%" }}
              exit={{ translateY: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-[#090909] border-t border-[#ff3b4d]/30 rounded-t-[30px] p-6 space-y-4 max-h-[85vh] overflow-y-auto relative card-glow-red"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sliding handle */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" />

              {/* OVERLAY A: LINK BANK */}
              {activeOverlay === 'add_bank' && (
                <form onSubmit={handleAddBank} className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <button
                      type="button"
                      onClick={() => { playClick(); setActiveOverlay('bank_details'); }}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md"
                    >
                      ← Back
                    </button>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Secure Bank Ledger</span>
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Link Secured Bank Credentials</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Cashing out requires linking a verified recipient banking ledger.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#ff3b4d] uppercase font-black tracking-widest block mb-1">Bank Institution Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India, HDFC, ICICI"
                        required
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff3b4d] font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-[#ff3b4d] uppercase font-black tracking-widest block mb-1">Account Number</label>
                      <input
                        type="text"
                        pattern="\d*"
                        minLength={9}
                        maxLength={18}
                        placeholder="e.g. 100456123498"
                        required
                        value={newBankNumber}
                        onChange={(e) => setNewBankNumber(e.target.value)}
                        className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff3b4d] font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-[#ff3b4d] uppercase font-black tracking-widest block mb-1">Beneficiary Name</label>
                        <input
                          type="text"
                          required
                          value={newBankHolder}
                          onChange={(e) => setNewBankHolder(e.target.value)}
                          className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff3b4d] font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#ff3b4d] uppercase font-black tracking-widest block mb-1">IFSC Code (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. SBIN0001890"
                          value={newBankIfsc}
                          onChange={(e) => setNewBankIfsc(e.target.value)}
                          className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff3b4d] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#ff3b4d] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-[#ff5565]"
                  >
                    Authorize & Secure Link
                  </button>
                </form>
              )}

              {/* OVERLAY B: LINK UPI */}
              {activeOverlay === 'add_upi' && (
                <form onSubmit={handleAddUpi} className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <button
                      type="button"
                      onClick={() => { playClick(); setActiveOverlay('bank_details'); }}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md"
                    >
                      ← Back
                    </button>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Secure UPI VPA</span>
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Link Recipient UPI ID (VPA)</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Accelerates peer-to-peer micro payouts under 5 minutes.</p>
                  </div>

                  <div>
                    <label className="text-[9px] text-blue-400 uppercase font-black tracking-widest block mb-1">UPI VPA String</label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@paytm or business@okaxis"
                      required
                      value={newUpiVpa}
                      onChange={(e) => setNewUpiVpa(e.target.value)}
                      className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-blue-600"
                  >
                    Authenticate VPA ID
                  </button>
                </form>
              )}

              {/* OVERLAY H: BANK DETAILS */}
              {activeOverlay === 'bank_details' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#ff3b4d]" />
                      <span>Bank & UPI Details</span>
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Your secure linked payment options for payouts.</p>
                  </div>

                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                    {/* Primary Linked Bank Account */}
                    {linkedBanks.map((bk) => (
                      <div 
                        key={bk.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#090909] border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#ff3b4d]/10 border border-[#ff3b4d]/20 rounded-lg">
                            <PiggyBank className="w-4 h-4 text-[#ff3b4d]" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-white uppercase block leading-tight">{bk.bankName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono tracking-wider">{bk.accountNumber}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                          {linkedBanks.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                setLinkedBanks(linkedBanks.filter(b => b.id !== bk.id));
                              }}
                              className="text-zinc-600 hover:text-[#FF3333] p-1 opacity-100 transition-opacity cursor-pointer"
                              title="Remove Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Linked UPI VPA IDs */}
                    {linkedUpis.map((up) => (
                      <div 
                        key={up.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#090909]/60 border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <Coins className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <span className="text-[10.5px] font-bold text-zinc-200 block leading-tight">UPI ID (VPA)</span>
                            <span className="text-[10px] text-zinc-300 font-mono italic">{up.vpa}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {linkedUpis.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                setLinkedUpis(linkedUpis.filter(u => u.id !== up.id));
                              }}
                              className="text-zinc-600 hover:text-[#FF3333] p-1 opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Trigger Add actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => { playClick(); setActiveOverlay('add_bank'); }}
                      className="py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white border border-white/10 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#ff3b4d]" />
                      <span>+ Link Bank</span>
                    </button>
                    <button
                      onClick={() => { playClick(); setActiveOverlay('add_upi'); }}
                      className="py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white border border-white/10 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Link VPA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY C: P2P TRANSFER */}
              {activeOverlay === 'transfer' && (
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-1">
                      <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                      <span>Tenzo Wallet-to-Wallet Send</span>
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Transfer vault funds instantly with zero commission fee.</p>
                  </div>

                  {transferError && (
                    <div className="p-2.5 rounded-lg bg-black/50 text-[#FF3333] border border-[#FF3333]/20 text-[10px] font-mono text-center">
                      ⚠ {transferError}
                    </div>
                  )}

                  {transferSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 text-emerald-400 border border-red-500/10 text-[10px] font-mono text-center animate-pulse">
                      ✓ Wallet Vault Transfer complete successfully!
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block mb-1">Target Username / VPA</label>
                      <input
                        type="text"
                        placeholder="e.g. WinnerGod999"
                        required
                        value={transferTarget}
                        onChange={(e) => { setTransferTarget(e.target.value); setTransferError(''); }}
                        className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block mb-1">Transfer Amount (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. ₹5,000"
                        required
                        value={transferAmount}
                        onChange={(e) => { setTransferAmount(e.target.value); setTransferError(''); }}
                        className="w-full bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] text-zinc-500">Available: {formatCurrency(user.walletBalance)}</span>
                        <span 
                          onClick={() => { playClick(); setTransferAmount(user.walletBalance.toString()); }}
                          className="text-[9px] text-[#ff3b4d] cursor-pointer hover:underline"
                        >
                          Send All Max
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-blue-600 cursor-pointer"
                  >
                    Confirm Vault Dispatch
                  </button>
                </form>
              )}

              {/* OVERLAY D: READ LEDGER LOGS */}
              {activeOverlay === 'history' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Immutable Wallet Logs</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Authorized transaction ledgers matching NCPI regulations.</p>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {transactionHistoryList().map((lh) => (
                      <div 
                        key={lh.id}
                        className="p-3 bg-[#090909] border border-white/5 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg text-xs shrink-0 ${
                            lh.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' :
                            lh.type === 'win' ? 'bg-[#ff3b4d]/10 text-[#ff3b4d]' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {lh.type === 'deposit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> :
                             lh.type === 'win' ? <Sparkles className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10.5px] font-bold text-stone-200 block truncate leading-tight">{lh.label}</span>
                            <span className="text-[8.5px] text-zinc-500 block font-mono">{lh.time} • SUCCESS</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-mono font-black shrink-0 ${
                          lh.type === 'deposit' || lh.type === 'win' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {lh.type === 'deposit' || lh.type === 'win' ? '+' : '-'}{formatCurrency(lh.amt)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveOverlay(null)}
                    className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 text-[10px] font-bold uppercase tracking-widest text-center hover:text-white"
                  >
                    Done & Close
                  </button>
                </div>
              )}

              {/* OVERLAY E: KYC STATUS */}
              {activeOverlay === 'kyc' && (
                <div className="space-y-4 text-center">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wider">KYC Identification Portal</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Complying with secure international anti-fraud compliance.</p>
                  </div>

                  <div className="bg-[#090909] border border-white/5 p-4 rounded-xl text-left space-y-3 font-sans text-[11px]">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Verifying Parameter:</span>
                      <span className="text-white font-bold">Standard Indian PAN Card</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Ledger Compliance Status:</span>
                      <span className="text-emerald-400 font-extrabold uppercase bg-emerald-500/10 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px]">ACTIVE TIER 1</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Transaction Daily Limit:</span>
                      <span className="text-red-400 font-bold uppercase tracking-wider text-[10px]">{dailyWithdrawalsDone} / 3 Used Today</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Registered Beneficiary Name:</span>
                      <span className="text-white font-bold font-mono tracking-wide">{user.username.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#160000]/40 border border-[#ff3b4d]/15 rounded-xl text-left">
                    <span className="text-[9.5px] font-black text-[#ff3b4d] uppercase block mb-0.5">💡 Unlock Unlimited Tier 2 Limit</span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Link Aadhaar Card manual OTP validation inside our secure vault to expand cash outs limits to unlimited daily payouts. Contact your VIP coordinator.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveOverlay(null)}
                    className="w-full py-3 bg-[#ff3b4d] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-[#ff5565]"
                  >
                    Maintain Safe Status
                  </button>
                </div>
              )}

              {/* OVERLAY F: REWARDS STEAK CHECK IN */}
              {activeOverlay === 'rewards' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Gift className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <span>Loyalty Streak Rewards Center</span>
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Claim free cash balance on every consecutive 24 hour check-in!</p>
                  </div>

                  {/* Daily Stepper */}
                  <div className="grid grid-cols-7 gap-1 bg-[#090909] p-2.5 rounded-xl border border-white/5">
                    {checkInRewards.map((cr, index) => {
                      const curDay = index + 1;
                      const hasStreak = user.dailyStreak >= curDay;
                      const isTodayTarget = (user.dailyStreak % 7) + 1 === curDay && !user.checkedInToday;

                      return (
                        <div 
                          key={index}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all ${
                            hasStreak 
                              ? 'bg-emerald-500/10 border-red-500/30 text-emerald-400'
                              : isTodayTarget
                              ? 'bg-[#ff3b4d]/20 border-[#ff3b4d]/60 text-[#ff3b4d] animate-pulse shadow-[0_0_10px_rgba(255,59,77,0.15)]'
                              : 'bg-[#090909] border-white/5 text-zinc-600'
                          }`}
                        >
                          <span className="text-[8px] font-mono font-bold uppercase block">D{cr.day}</span>
                          <span className="text-[9px] font-mono block mt-1 tracking-tighter">₹{cr.reward}</span>
                          <span className="text-[7.5px] block font-semibold text-zinc-500 font-mono">+{cr.exp}xp</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-[#090909] border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold">Consecutive Daily Streak</span>
                      <span className="text-white font-extrabold text-base tracking-wide flex items-center gap-1">
                        <span>🔥 {user.dailyStreak} Days Active</span>
                      </span>
                    </div>

                    <button
                      onClick={handleWeeklyCheckIn}
                      disabled={claiming || user.checkedInToday}
                      className={`py-2.5 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        user.checkedInToday
                          ? 'bg-[#090909] border border-white/10 text-zinc-500 cursor-not-allowed'
                          : claiming
                          ? 'bg-emerald-500/50 text-white cursor-wait'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      {user.checkedInToday ? 'CLAIMED TODAY' : claiming ? 'CLAIMING...' : 'COLLECT CASH'}
                    </button>
                  </div>

                  <div className="text-[9px] text-zinc-500 text-center uppercase tracking-wider leading-relaxed">
                    Disclaimer: Consecutive streak resets back to Day 1 once a 36-hour interval threshold transitions without manual verification.
                  </div>
                </div>
              )}

              {/* OVERLAY G: COCONUT DIRECT CHAT */}
              {activeOverlay === 'support' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">VIP Concierge Support Panel</h2>
                    <p className="text-[11px] text-zinc-400 mt-1">Average routing queue speed: <span className="text-[#ff3b4d] font-bold">Instant</span></p>
                  </div>

                  {/* Message log wrapper */}
                  <div className="bg-[#090909] border border-white/5 rounded-xl p-3 h-[250px] overflow-y-auto space-y-3 flex flex-col font-sans">
                    {supportHistory.map((sh, idx) => (
                      <div 
                        key={idx}
                        className={`flex flex-col max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs ${
                          sh.sender === 'user' 
                            ? 'bg-[#ff3b4d] text-white self-end rounded-tr-none'
                            : 'bg-white/5 text-zinc-200 self-start rounded-tl-none border border-white/5'
                        }`}
                      >
                        <p className="leading-relaxed">{sh.text}</p>
                        <span className="text-[8px] text-zinc-500 text-right mt-1 font-mono leading-none">{sh.time}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendSupport} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type query e.g. status of deposit..."
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="flex-1 bg-[#090909] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff3b4d] font-sans"
                    />
                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-[#ff3b4d] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-[#ff5565]"
                    >
                      SEND
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED LOGOUT FLOATING FOOTER BAR */}
      <div className="fixed bottom-4 inset-x-0 mx-auto flex justify-center z-40 select-none pb-safe">
        <div className="flex items-center justify-center p-1.5 rounded-xl bg-[#090909]/90 backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
          <button
            onClick={() => {
              playClick();
              onLogout();
            }}
            onMouseEnter={() => playHover()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF2A2A] to-[#ff3b4d] text-white font-sans font-black text-[9.5px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
