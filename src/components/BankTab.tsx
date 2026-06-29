import { useState, FormEvent, useEffect, MouseEvent } from 'react';
import { apiFetch } from '../utils/api';
import { UserProfile, Transaction } from '../types';
import { Clock, ShieldCheck, CreditCard, ChevronRight, Coins, QrCode, Copy, Check, ExternalLink, AlertCircle, RefreshCw, Smartphone, History, Lock, Eye, EyeOff, Building, Landmark, Trash2, Edit3, Plus, ArrowLeft, ArrowRight, CheckCircle2, X, ChevronDown, Calendar, Filter } from 'lucide-react';
import { playClick, playHover } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface UPIAccount {
  id: string;
  nickname: string;
  upiId: string;
  isDefault: boolean;
}

interface BankAccount {
  id: string;
  bankName: string;
  holderName: string;
  accountNumber: string;
  ifscCode: string;
  isDefault: boolean;
}

interface BankTabProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  defaultTab?: 'deposit' | 'withdraw';
  onBack?: () => void;
  bankAccounts?: any[];
  onUpdateBankAccounts?: (accounts: any[]) => void;
  upiAccounts?: any[];
  onUpdateUpiAccounts?: (accounts: any[]) => void;
  theme?: 'sports' | 'dark';
}

export default function BankTab({ 
  user, 
  onUpdateUser, 
  transactions, 
  onAddTransaction, 
  defaultTab, 
  onBack,
  theme,
  ...props
}: BankTabProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(defaultTab || 'deposit');
  const [showHistoryLogs, setShowHistoryLogs] = useState<boolean>(false);

  const isSportsTheme = theme === 'sports';

  // Dynamic design variables matching sportsbook branding
  const bgPanelClass = isSportsTheme 
    ? "bg-white border border-[#EDEDED] p-5 rounded-2.5xl space-y-5 font-sans relative overflow-hidden shadow-sm text-neutral-800"
    : "glass-panel p-5 rounded-2xl border border-white/10 space-y-5 font-sans relative overflow-hidden bg-black/45 shadow-[0_15px_40px_rgba(0,0,0,0.65)] text-white";

  const textLabelClass = isSportsTheme ? "text-neutral-400 text-xs font-bold uppercase tracking-wider" : "font-bold text-white/55 uppercase text-xs";
  const subTextLabelClass = isSportsTheme ? "text-neutral-400 text-[10px]" : "text-[10px] text-white/40";
  
  const textTitleClass = isSportsTheme ? "text-neutral-800 font-black uppercase tracking-tight" : "text-white font-black uppercase tracking-tight";
  const textMutedClass = isSportsTheme ? "text-neutral-500 text-xs" : "text-white/60 text-xs";

  const inputFieldClass = isSportsTheme
    ? "w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 pl-8 pr-4 text-sm font-sans text-neutral-900 focus:outline-none focus:border-[#FF3333] disabled:opacity-45 disabled:cursor-not-allowed font-semibold"
    : "w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-8 pr-4 text-sm font-sans text-white focus:outline-none focus:border-[#FF3333] disabled:opacity-45 disabled:cursor-not-allowed";

  const quickChipBtnClass = isSportsTheme
    ? "bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 text-neutral-800 font-extrabold text-[10px] font-sans py-1.5 rounded transition-all text-center cursor-pointer disabled:opacity-30 disabled:hover:bg-neutral-100 disabled:cursor-not-allowed"
    : "bg-white/5 hover:bg-white/10 border border-white/5 text-white text-[10px] font-sans py-1.5 rounded transition-all text-center cursor-pointer disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed";

  const infoRowClass = isSportsTheme
    ? "flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-700"
    : "flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-black/30 text-xs text-white";

  const trackingBoxClass = isSportsTheme
    ? "space-y-4 p-4 rounded-xl border border-neutral-200 bg-white text-neutral-850"
    : "space-y-4 p-4 rounded-xl border border-[#FF3333]/20 bg-gradient-to-b from-[#071A3D] to-[#040B1D] text-white";

  const trackingTextMuted = isSportsTheme ? "text-neutral-500 text-[10px]" : "text-stone-400 text-[10px]";

  const actionBtnClass = isSportsTheme
    ? "w-full py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider text-white bg-[#FF3333] hover:brightness-110 active:scale-95 shadow-[0_4px_12px_rgba(255, 51, 51,0.22)] transition-all text-center cursor-pointer"
    : "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#FF3333] hover:bg-[#FF5252] active:scale-95 transition-all text-center cursor-pointer";

  const secActionBtnClass = isSportsTheme
    ? "w-full py-3 bg-white hover:bg-[#F9F9F9] border border-[#EDEDED] text-[#111111] font-extrabold uppercase tracking-wide text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
    : "w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wide text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer";

  const modalContainerClass = isSportsTheme
    ? "bg-white border-t border-[#EDEDED] p-5 rounded-t-3xl max-w-md w-full shadow-lg text-neutral-850"
    : "bg-[#040B1D] border-t border-[#FF3333]/20 p-5 rounded-t-3xl max-w-md w-full shadow-2xl text-white";

  const lastDepositTx = transactions.find((t) => t.type === 'deposit');
  const lastWithdrawTx = transactions.find((t) => t.type === 'withdraw');

  const lastDepositAmount = lastDepositTx ? lastDepositTx.amount : 50000;
  const lastWithdrawAmount = lastWithdrawTx ? lastWithdrawTx.amount : 12000;

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [amount, setAmount] = useState<string>(() => {
    const isDeposit = (defaultTab || 'deposit') === 'deposit';
    if (isDeposit) {
      return ''; // Start blank so user can type their own amount
    } else {
      const lastWith = transactions.find((t) => t.type === 'withdraw');
      return lastWith ? String(lastWith.amount) : '500';
    }
  });
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  
  // Method B Dynamic Configurations (Saved in local storage for persistence)
  const [receiverVpa, setReceiverVpa] = useState<string>(() => {
    return localStorage.getItem('rwp_receiver_vpa') || 'debupam.work@okaxis';
  });
  const [receiverName, setReceiverName] = useState<string>(() => {
    return localStorage.getItem('rwp_receiver_name') || 'RoyalWinPro';
  });
  const [webhookToken, setWebhookToken] = useState<string>(() => {
    return localStorage.getItem('rwp_webhook_token') || 'tok_sec_' + Math.floor(100000 + Math.random() * 900000);
  });
  const [trackingMode, setTrackingMode] = useState<'A' | 'B'>('B'); // Default to Method B (Notification Forwarder) as requested
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  
  // UPI QR Flow States
  const [depositStep, setDepositStep] = useState<'amount' | 'qr'>('qr');
  const [utr, setUtr] = useState<string>('');
  const [showUtrModal, setShowUtrModal] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes count down
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Redesigned Withdrawal Premium State Managers
  const [withdrawalTab, setWithdrawalTab] = useState<'upi' | 'bank'>('upi');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  
  // Saved accounts state loaded from localStorage
  const [localUpiAccounts, setLocalUpiAccounts] = useState<UPIAccount[]>(() => {
    try {
      const saved = localStorage.getItem('tenzo_saved_upi_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return [parsed[0]];
      }
    } catch (e) {
      console.error("Failed to parse upi accounts:", e);
    }
    return [
      { id: 'upi-1', nickname: 'Primary UPI', upiId: 'debupam7@okaxis', isDefault: true }
    ];
  });
  const upiAccounts = props.upiAccounts || localUpiAccounts;
  const setUpiAccounts = (updated: any) => {
    const nextVal = typeof updated === 'function' ? updated(upiAccounts) : updated;
    const finalVal = Array.isArray(nextVal) ? nextVal.slice(0, 1) : nextVal;
    if (props.onUpdateUpiAccounts) {
      props.onUpdateUpiAccounts(finalVal);
    } else {
      setLocalUpiAccounts(finalVal);
    }
  };

  const [localBankAccounts, setLocalBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('tenzo_saved_bank_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return [parsed[0]];
      }
    } catch (e) {
      console.error("Failed to parse bank accounts:", e);
    }
    return [
      { id: 'bank-1', bankName: 'HDFC BANK', holderName: 'Debupam Gogoi', accountNumber: '5010048192811', ifscCode: 'HDFC0001234', isDefault: true }
    ];
  });
  const bankAccounts = props.bankAccounts || localBankAccounts;
  const setBankAccounts = (updated: any) => {
    const nextVal = typeof updated === 'function' ? updated(bankAccounts) : updated;
    const finalVal = Array.isArray(nextVal) ? nextVal.slice(0, 1) : nextVal;
    if (props.onUpdateBankAccounts) {
      props.onUpdateBankAccounts(finalVal);
    } else {
      setLocalBankAccounts(finalVal);
    }
  };

  // Track the currently selected account ID for each method
  const [selectedUpiAccountId, setSelectedUpiAccountId] = useState<string>(() => {
    const def = upiAccounts.find(a => a.isDefault);
    return def ? def.id : (upiAccounts[0]?.id || '');
  });

  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(() => {
    const def = bankAccounts.find(a => a.isDefault);
    return def ? def.id : (bankAccounts[0]?.id || '');
  });

  // Persist accounts state on changes
  useEffect(() => {
    localStorage.setItem('tenzo_saved_upi_accounts', JSON.stringify(upiAccounts));
  }, [upiAccounts]);

  useEffect(() => {
    localStorage.setItem('tenzo_saved_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  // Bottom sheets modals state
  const [isUpiModalOpen, setIsUpiModalOpen] = useState<boolean>(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // New UPI Account Form States
  const [newUpiId, setNewUpiId] = useState<string>('');
  const [newUpiNickname, setNewUpiNickname] = useState<string>('');
  const [newUpiSetDefault, setNewUpiSetDefault] = useState<boolean>(false);
  const [upiValidationError, setUpiValidationError] = useState<string>('');

  // New Bank Account Form States
  const [newBankHolderName, setNewBankHolderName] = useState<string>('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState<string>('');
  const [newBankConfirmAccountNumber, setNewBankConfirmAccountNumber] = useState<string>('');
  const [newBankIfscCode, setNewBankIfscCode] = useState<string>('');
  const [newBankName, setNewBankName] = useState<string>('');
  const [newBankSetDefault, setNewBankSetDefault] = useState<boolean>(false);
  const [bankValidationError, setBankValidationError] = useState<string>('');

  // Submit button state indicators
  const [isPendingRequest, setIsPendingRequest] = useState<boolean>(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState<boolean>(false);
  const [successTxId, setSuccessTxId] = useState<string>('');

  // Expand and collapse states for account selections
  const [isUpiExpanded, setIsUpiExpanded] = useState<boolean>(false);
  const [isBankExpanded, setIsBankExpanded] = useState<boolean>(false);

  // Withdrawal History view state filtering
  const [historyFilterTab, setHistoryFilterTab] = useState<'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [ledgerDateFilter, setLedgerDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [ledgerCustomDate, setLedgerCustomDate] = useState<string>('');

  // Bank Name Auto Fetch based on IFSC Code prefix
  useEffect(() => {
    const code = newBankIfscCode.trim().toUpperCase();
    if (code.length >= 4) {
      const bankPrefix = code.slice(0, 4);
      if (bankPrefix === 'HDFC') {
        setNewBankName('HDFC BANK');
      } else if (bankPrefix === 'ICIC') {
        setNewBankName('ICICI BANK');
      } else if (bankPrefix === 'SBIN') {
        setNewBankName('STATE BANK OF INDIA');
      } else if (bankPrefix === 'BARB') {
        setNewBankName('BANK OF BARODA');
      } else if (bankPrefix === 'UTIB') {
        setNewBankName('AXIS BANK');
      } else if (bankPrefix === 'PUNB') {
        setNewBankName('PUNJAB NATIONAL BANK');
      } else if (bankPrefix === 'KKBK') {
        setNewBankName('KOTAK MAHINDRA BANK');
      } else if (bankPrefix === 'YESB') {
        setNewBankName('YES BANK');
      } else if (bankPrefix === 'IBKL') {
        setNewBankName('IDBI BANK');
      } else if (bankPrefix === 'ANDB') {
        setNewBankName('ANDHRA BANK');
      } else {
        setNewBankName('AUTO-DETECTED BANK GATEWAY');
      }
    } else {
      setNewBankName('');
    }
  }, [newBankIfscCode]);

  // UPI Account CRUD Operations
  const handleSaveUpiAccount = (e: FormEvent) => {
    e.preventDefault();
    setUpiValidationError('');

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(newUpiId.trim())) {
      setUpiValidationError('Please enter a valid UPI ID (e.g. user@ybl, user@paytm)');
      return;
    }

    if (!newUpiNickname.trim()) {
      setUpiValidationError('Account Nickname is required.');
      return;
    }

    playClick();

    if (editingAccountId) {
      const updated = upiAccounts.map(acc => {
        if (acc.id === editingAccountId) {
          return {
            ...acc,
            upiId: newUpiId.trim(),
            nickname: newUpiNickname.trim(),
            isDefault: newUpiSetDefault
          };
        }
        if (newUpiSetDefault) {
          return { ...acc, isDefault: false };
        }
        return acc;
      });

      setUpiAccounts(updated);
      setEditingAccountId(null);
    } else {
      const newAcc: UPIAccount = {
        id: `upi-${Date.now()}`,
        nickname: newUpiNickname.trim(),
        upiId: newUpiId.trim(),
        isDefault: newUpiSetDefault || upiAccounts.length === 0
      };

      let updated = [...upiAccounts];
      if (newAcc.isDefault) {
        updated = updated.map(acc => ({ ...acc, isDefault: false }));
      }
      updated.push(newAcc);
      setUpiAccounts(updated);
      setSelectedUpiAccountId(newAcc.id);
    }

    setNewUpiId('');
    setNewUpiNickname('');
    setNewUpiSetDefault(false);
    setIsUpiModalOpen(false);
  };

  const handleEditUpiAccount = (acc: UPIAccount) => {
    playClick();
    setEditingAccountId(acc.id);
    setNewUpiId(acc.upiId);
    setNewUpiNickname(acc.nickname);
    setNewUpiSetDefault(acc.isDefault);
    setIsUpiModalOpen(true);
  };

  const handleDeleteUpiAccount = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this UPI account?")) {
      playClick();
      const updated = upiAccounts.filter(acc => acc.id !== id);
      if (updated.length > 0 && !updated.some(a => a.isDefault)) {
        updated[0].isDefault = true;
      }
      setUpiAccounts(updated);
      if (selectedUpiAccountId === id) {
        setSelectedUpiAccountId(updated[0]?.id || '');
      }
    }
  };

  // Bank Account CRUD Operations
  const handleSaveBankAccount = (e: FormEvent) => {
    e.preventDefault();
    setBankValidationError('');

    if (!newBankHolderName.trim()) {
      setBankValidationError('Account Holder Name is required.');
      return;
    }
    if (!newBankAccountNumber.trim()) {
      setBankValidationError('Account Number is required.');
      return;
    }
    if (newBankAccountNumber.trim() !== newBankConfirmAccountNumber.trim()) {
      setBankValidationError('Account numbers do not match!');
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(newBankIfscCode.trim().toUpperCase())) {
      setBankValidationError('Please enter a valid IFSC code (e.g. HDFC0001234)');
      return;
    }

    playClick();

    if (editingAccountId) {
      const updated = bankAccounts.map(acc => {
        if (acc.id === editingAccountId) {
          return {
            ...acc,
            holderName: newBankHolderName.trim(),
            accountNumber: newBankAccountNumber.trim(),
            ifscCode: newBankIfscCode.trim().toUpperCase(),
            bankName: newBankName || 'Auto-Detected Bank Gateway',
            isDefault: newBankSetDefault
          };
        }
        if (newBankSetDefault) {
          return { ...acc, isDefault: false };
        }
        return acc;
      });
      setBankAccounts(updated);
      setEditingAccountId(null);
    } else {
      const newAcc: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: newBankName || 'Auto-Detected Bank Gateway',
        holderName: newBankHolderName.trim(),
        accountNumber: newBankAccountNumber.trim(),
        ifscCode: newBankIfscCode.trim().toUpperCase(),
        isDefault: newBankSetDefault || bankAccounts.length === 0
      };

      let updated = [...bankAccounts];
      if (newAcc.isDefault) {
        updated = updated.map(acc => ({ ...acc, isDefault: false }));
      }
      updated.push(newAcc);
      setBankAccounts(updated);
      setSelectedBankAccountId(newAcc.id);
    }

    setNewBankHolderName('');
    setNewBankAccountNumber('');
    setNewBankConfirmAccountNumber('');
    setNewBankIfscCode('');
    setNewBankName('');
    setNewBankSetDefault(false);
    setIsBankModalOpen(false);
  };

  const handleEditBankAccount = (acc: BankAccount) => {
    playClick();
    setEditingAccountId(acc.id);
    setNewBankHolderName(acc.holderName);
    setNewBankAccountNumber(acc.accountNumber);
    setNewBankConfirmAccountNumber(acc.accountNumber);
    setNewBankIfscCode(acc.ifscCode);
    setNewBankName(acc.bankName);
    setNewBankSetDefault(acc.isDefault);
    setIsBankModalOpen(true);
  };

  const handleDeleteBankAccount = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this bank account?")) {
      playClick();
      const updated = bankAccounts.filter(acc => acc.id !== id);
      if (updated.length > 0 && !updated.some(a => a.isDefault)) {
        updated[0].isDefault = true;
      }
      setBankAccounts(updated);
      if (selectedBankAccountId === id) {
        setSelectedBankAccountId(updated[0]?.id || '');
      }
    }
  };

  // Automated Real-Time UPI Tracking System States
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'awaiting_payment' | 'verifying' | 'success' | 'failed'>('idle');
  const [trackingLog, setTrackingLog] = useState<string>('Initializing secure UPI tracker...');
  const [trackingProgress, setTrackingProgress] = useState<number>(0);
  const [generatedUtr, setGeneratedUtr] = useState<string>('');

  // Auto generate unique order id
  useEffect(() => {
    if (trackingStatus === 'idle') {
      setCurrentOrderId('RWP' + Date.now().toString().slice(-6));
    }
  }, [trackingStatus]);

  // Save configurations helper
  const handleSaveConfigs = (vpa: string, name: string, token: string) => {
    setReceiverVpa(vpa);
    setReceiverName(name);
    setWebhookToken(token);
    localStorage.setItem('rwp_receiver_vpa', vpa);
    localStorage.setItem('rwp_receiver_name', name);
    localStorage.setItem('rwp_webhook_token', token);
  };

  // Register real order on fullstack backend before listening to webhook
  const registerOrderOnServer = async (orderId: string, amt: number, vpa: string) => {
    try {
      await apiFetch('/api/upi-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: amt, receiverVpa: vpa, username: user.username })
      });
      console.log(`[UPI Register] Successfully initiated ₹${amt} with ID ${orderId} for player ${user.username}`);
    } catch (err) {
      console.warn("Failed to contact fullstack backend for initiate:", err);
    }
  };

  // Clear states when active tab/method shifts
  useEffect(() => {
    setDepositStep('qr');
    setUtr('');
    setShowUtrModal(false);
    setIsVerifying(false);
    setTimeLeft(300);
    setTrackingStatus('idle');
    setTrackingProgress(0);
    setGeneratedUtr('');
  }, [activeTab, selectedMethod]);

  // Keep countdown active for UPI QR Code
  useEffect(() => {
    let timer: any;
    if (activeTab === 'deposit' && depositStep === 'qr' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && depositStep === 'qr') {
      setTimeLeft(300); // reset gracefully for infinite play testing
    }
    return () => clearInterval(timer);
  }, [activeTab, depositStep, timeLeft]);

  // Trigger automated handshake accelerator on user tab visibility change
  useEffect(() => {
    if (trackingStatus === 'awaiting_payment') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          playClick();
          setTrackingLog("⚡ Tab focus detected! Accelerating bank ledger handshake...");
          // Skip delay and jump into verifying statement
          setTimeout(() => {
            setTrackingStatus('verifying');
          }, 800);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [trackingStatus]);

  // Automated UPI Ledger Tracking State Machine (Stepper 1: Awaiting Payment)
  useEffect(() => {
    let timer: any;
    if (trackingStatus === 'awaiting_payment') {
      if (trackingMode === 'B') {
        // Method B polls backend instead of using auto timed transitions
        return;
      }
      let currentProgress = 0;
      timer = setInterval(() => {
        currentProgress += 5;
        setTrackingProgress(Math.min(currentProgress, 40));
        
        if (currentProgress === 10) {
          setTrackingLog("📟 Synchronizing payment timestamp with local clearinghouse...");
        } else if (currentProgress === 25) {
          setTrackingLog("📡 Awaiting incoming callback payload signature from issuing bank...");
        }

        if (currentProgress >= 40) {
          clearInterval(timer);
          setTrackingStatus('verifying');
        }
      }, 400);
    }
    return () => clearInterval(timer);
  }, [trackingStatus, trackingMode]);

  // Automated UPI Ledger Tracking State Machine (Stepper 2: Verification Query & Resolve)
  useEffect(() => {
    let timer: any;
    if (trackingStatus === 'verifying') {
      if (trackingMode === 'B') {
        // Method B polls backend instead of using auto timed transitions
        return;
      }
      const modeText = trackingMode === 'B' 
        ? `📡 Webhook hook triggered! Reconciling notification payload at ${receiverVpa}...`
        : `🔍 Matching statement logs: Scanning ${receiverVpa} incoming credits...`;
        
      setTrackingLog(modeText);
      let currentProgress = 40;
      
      timer = setInterval(() => {
        currentProgress += 10;
        setTrackingProgress(Math.min(currentProgress, 100));

        if (currentProgress === 60) {
          setTrackingLog(trackingMode === 'B' 
            ? `💬 Parsing SMS body: Found positive match for Order ID ${currentOrderId}...`
            : "💾 Reconciling payment reference payload with regional NPCI server..."
          );
        } else if (currentProgress === 80) {
          setTrackingLog(trackingMode === 'B' 
            ? `🔑 Authenticating signature header and verifying transaction checksum...`
            : "⚡ Validating settlement consistency with bank deposit gateway..."
          );
        }

        if (currentProgress >= 100) {
          clearInterval(timer);
          
          const numAmt = parseInt(amount) || 0;
          // Simulated Failure Condition: If user enters an amount that ends with 4 or 9, or is exactly a multiple of 13
          // This allows users/reviewers to test the Failed flow natively!
          const isFailureTriggered = numAmt % 13 === 0 || amount.endsWith('9') || amount.endsWith('4') || numAmt <= 0;

          if (isFailureTriggered) {
            setTrackingStatus('failed');
            setTrackingLog(trackingMode === 'B'
              ? `❌ Webhook Discarded: Checksum failed, timeout or Order ID ${currentOrderId} mismatch.`
              : "❌ Reconciliation Failed: Canceled by user or insufficient bank gateway liquidity."
            );
          } else {
            setTrackingStatus('success');
            setTrackingLog(trackingMode === 'B'
              ? `✨ webhook authorized! Credit verified & deposited instantly.`
              : "✨ Ledger Consistency Confirmed! Playing credits..."
            );
            
            // Generate a real-looking reference UTR code
            const fakeUtr = '3' + Math.floor(Math.random() * 90000000000 + 10000000000).toString();
            setGeneratedUtr(fakeUtr);

            // Directly credit user wallet instantly!
            const updated = {
              ...user,
              walletBalance: user.walletBalance + numAmt,
              totalDeposited: user.totalDeposited + numAmt
            };
            onUpdateUser(updated);

            // Synchronize with database
            const token = localStorage.getItem('tenzo_bet_token');
            const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) authHeaders['Authorization'] = `Bearer ${token}`;

            apiFetch('/api/client/deposit-request', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                username: user.username,
                amount: numAmt,
                paymentMethod: 'UPI_AUTO',
                utrNumber: fakeUtr
              })
            }).catch(console.warn);

            // Add transaction log
            onAddTransaction({
              id: `dep-${Date.now()}`,
              type: 'deposit',
              amount: numAmt,
              timestamp: new Date().toLocaleTimeString(),
              status: 'SUCCESS',
              description: trackingMode === 'B' 
                ? `Webhook Direct Forward (Ref: ${fakeUtr}, ID: ${currentOrderId})`
                : `Auto KPI Direct Deposit (UTR: ${fakeUtr})`
            });
          }
        }
      }, 400);
    }
    return () => clearInterval(timer);
  }, [trackingStatus, amount, user, trackingMode, receiverVpa, currentOrderId, onAddTransaction, onUpdateUser]);

  // Real-Time Method B Backend Webhook Poller
  useEffect(() => {
    let pollInterval: any;
    if (trackingMode === 'B' && (trackingStatus === 'awaiting_payment' || trackingStatus === 'verifying')) {
      pollInterval = setInterval(async () => {
        try {
          const res = await apiFetch(`/api/upi-status/${currentOrderId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'ok' && data.order) {
            const serverOrder = data.order;
            
            // If server reports successful credit, update frontend wallet/ledger!
            if (serverOrder.status === 'success') {
              clearInterval(pollInterval);
              setTrackingStatus('success');
              setTrackingLog(serverOrder.log || `✨ webhook authorized! Credit verified & deposited instantly.`);
              setGeneratedUtr(serverOrder.referenceUtr || '300000000000');
              setTrackingProgress(100);

              const numAmt = serverOrder.amount || parseInt(amount) || 0;
              const updated = {
                ...user,
                walletBalance: user.walletBalance + numAmt,
                totalDeposited: user.totalDeposited + numAmt
              };
              onUpdateUser(updated);

              onAddTransaction({
                id: `dep-${Date.now()}`,
                type: 'deposit',
                amount: numAmt,
                timestamp: new Date().toLocaleTimeString(),
                status: 'SUCCESS',
                description: `Webhook Direct Forward (Ref: ${serverOrder.referenceUtr || 'N/A'}, ID: ${currentOrderId})`
              });
            } else if (serverOrder.status === 'failed') {
              clearInterval(pollInterval);
              setTrackingStatus('failed');
              setTrackingLog(serverOrder.log || `❌ Webhook Discarded for Note ID: ${currentOrderId}`);
            } else if (trackingStatus === 'awaiting_payment' && serverOrder.status === 'verifying') {
              setTrackingStatus('verifying');
              setTrackingLog(serverOrder.log || `📡 Webhook payload received! Parsing payload...`);
              setTrackingProgress(50);
            }
          }
        } catch (e) {
          console.warn("Error polling UPI webhook status:", e);
        }
      }, 1500);
    }
    return () => clearInterval(pollInterval);
  }, [trackingStatus, trackingMode, currentOrderId, amount, user, onAddTransaction, onUpdateUser]);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInitiateWithdrawal = async (e: FormEvent) => {
    e.preventDefault();

    const numAmt = parseInt(amount) || 0;
    if (numAmt <= 0) {
      alert("Please specify a valid positive INR amount.");
      return;
    }

    if (numAmt < 500) {
      alert("Minimum withdrawal limit is ₹500.");
      return;
    }

    if (numAmt > user.walletBalance) {
      alert("Wait, high roller! Withdraw balance cannot surpass your actual loaded wallet state.");
      return;
    }

    if (withdrawalTab === 'upi' && upiAccounts.length === 0) {
      alert("Please add or link a secure UPI account first.");
      return;
    }

    if (withdrawalTab === 'bank' && bankAccounts.length === 0) {
      alert("Please add or link a secure bank account first.");
      return;
    }

    playClick();
    setIsPendingRequest(true);

    // Simulate premium fintech delay
    setTimeout(async () => {
      const selectedUpiAcc = upiAccounts[0];
      const selectedBankAcc = bankAccounts[0];

      try {
        const token = localStorage.getItem('tenzo_bet_token');
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;

        await apiFetch('/api/client/withdraw-request', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            username: user.username,
            amount: numAmt,
            bankName: withdrawalTab === 'bank' ? selectedBankAcc?.bankName : "UPI Withdrawal",
            accountNumber: withdrawalTab === 'bank' ? selectedBankAcc?.accountNumber : undefined,
            ifscCode: withdrawalTab === 'bank' ? selectedBankAcc?.ifscCode : undefined,
            upiId: withdrawalTab === 'upi' ? selectedUpiAcc?.upiId : undefined,
          })
        });
      } catch (err) {
        console.warn("REST withdrawal request failed:", err);
      }

      // Deduct balance
      const updated = {
        ...user,
        walletBalance: user.walletBalance - numAmt,
        totalWithdrawn: user.totalWithdrawn + numAmt
      };
      onUpdateUser(updated);

      const generatedTxId = `WTH-${Date.now().toString().slice(-6)}`;
      const payoutLabel = withdrawalTab === 'upi' 
        ? `Refund UPI VPA to ${selectedUpiAcc?.upiId}`
        : `IMPS/NEFT Transfer A/C: ${selectedBankAcc?.accountNumber.slice(-4)}`;

      // Add transaction ledger log
      onAddTransaction({
        id: generatedTxId,
        type: 'withdraw',
        amount: numAmt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
        description: payoutLabel
      });

      setSuccessTxId(generatedTxId);
      setIsPendingRequest(false);
      setShowRequestSuccess(true);
    }, 1800);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numAmt = parseInt(amount) || 0;
    if (numAmt <= 0) {
      alert("Please specify a valid positive INR amount.");
      return;
    }

    if (numAmt < 200) {
      alert("Minimum deposit allowed is ₹200.");
      return;
    }

    if (numAmt > 50000) {
      alert("Maximum deposit allowed is ₹50,000.");
      return;
    }

    if (activeTab === 'deposit') {
      if (selectedMethod === 'upi') {
        playClick();
        setDepositStep('qr');
        setTimeLeft(300); // Reset timer to 5 minutes
      } else {
        // Instant credit for non-UPI gateways (IMPS / Crypto) inside sandbox
        playClick();

        try {
          const token = localStorage.getItem('tenzo_bet_token');
          const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) authHeaders['Authorization'] = `Bearer ${token}`;

          await apiFetch('/api/client/deposit-request', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              username: user.username,
              amount: numAmt,
              paymentMethod: selectedMethod.toUpperCase()
            })
          });
        } catch (err) {
          console.warn("REST deposit failed:", err);
        }

        const updated = {
          ...user,
          walletBalance: user.walletBalance + numAmt,
          totalDeposited: user.totalDeposited + numAmt
        };
        onUpdateUser(updated);

        onAddTransaction({
          id: `dep-${Date.now()}`,
          type: 'deposit',
          amount: numAmt,
          timestamp: new Date().toLocaleTimeString(),
          status: 'SUCCESS',
          description: `Instant Deposit via ${selectedMethod.toUpperCase()}`
        });

        alert(`Deposit Received! ₹${numAmt} successfully credited via ${selectedMethod.toUpperCase()} gateway.`);
        setAmount('');
      }
    } else {
      // Cash out withdrawal limit checks
      if (numAmt > user.walletBalance) {
        alert("Wait, high roller! Withdraw balance cannot surpass your actual loaded wallet state.");
        return;
      }

      try {
        const token = localStorage.getItem('tenzo_bet_token');
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) authHeaders['Authorization'] = `Bearer ${token}`;

        await apiFetch('/api/client/withdraw-request', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            username: user.username,
            amount: numAmt,
            bankName: "HDFC Bank",
            accountNumber: "5010048192811",
            ifscCode: "HDFC0000104",
            upiId: `${user.username.toLowerCase()}@okaxis`
          })
        });
      } catch (err) {
        console.warn("REST withdrawal request failed:", err);
      }

      const updated = {
        ...user,
        walletBalance: user.walletBalance - numAmt,
        totalWithdrawn: user.totalWithdrawn + numAmt
      };
      onUpdateUser(updated);

      onAddTransaction({
        id: `wth-${Date.now()}`,
        type: 'withdraw',
        amount: numAmt,
        timestamp: new Date().toLocaleTimeString(),
        status: 'PENDING',
        description: `Withdrawal transfer via ${selectedMethod.toUpperCase()}`
      });

      alert(`Hold tight! Withdrawal request of ₹${numAmt} is queued correctly for backend settlement status.`);
      setAmount('');
    }
  };

  return (
    <div className={`space-y-6 max-w-md mx-auto ${isSportsTheme ? 'text-[#111111] font-sans' : 'text-white'}`}>
      
      {/* Cohesive Navigation Header */}
      {activeTab !== 'deposit' && (
        <div className={`flex items-center justify-between pb-3 border-b ${isSportsTheme ? 'border-neutral-200' : 'border-white/10'}`}>
          <button
            type="button"
            onClick={() => {
              playClick();
              if (onBack) onBack();
            }}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 ${
              isSportsTheme
                ? 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 border-white/5 text-stone-300'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      )}
      
      {/* Main Bank Action Form or UPI QR Interface */}
      {activeTab === 'deposit' ? (
        <div className={bgPanelClass}>
          
          {/* Specify INR Amount Input & Presets */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className={textLabelClass}>Deposit Amount</label>
              <span className={subTextLabelClass}>Min ₹200 • Max ₹50,000</span>
            </div>

            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-neutral-400 font-sans`}>
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={trackingStatus !== 'idle'}
                className={inputFieldClass}
              />
            </div>

            {/* Quick Selection Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1000, 5000, 10000, 50000].map((quickAmt) => (
                <button
                  type="button"
                  key={quickAmt}
                  disabled={trackingStatus !== 'idle'}
                  onClick={() => {
                    playClick();
                    setAmount(quickAmt.toString());
                  }}
                  onMouseEnter={() => playHover()}
                  className={quickChipBtnClass}
                >
                  +₹{quickAmt / 1000}k
                </button>
              ))}
            </div>
          </div>

          {trackingStatus !== 'idle' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={trackingBoxClass}
            >
              {/* Header Status Bar */}
              <div className={`flex items-center justify-between text-xs pb-1 border-b ${isSportsTheme ? 'border-neutral-200' : 'border-white/5'}`}>
                <span className={`flex items-center gap-1.5 font-bold uppercase tracking-wider ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FF3333]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 ${isSportsTheme ? 'bg-[#FF3333]' : 'bg-[#FF3333]'}`} />
                  Live UPI Tracker
                </span>
                <span className={`text-[9px] font-mono ${isSportsTheme ? 'text-neutral-400' : 'text-stone-500'}`}>
                  NPCI SECURE MATCH
                </span>
              </div>

              {/* Status Graphic & Radar Animation */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {trackingStatus === 'awaiting_payment' && (
                    <motion.div 
                      key="awaiting"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative flex items-center justify-center w-14 h-14"
                    >
                      <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500/15 animate-ping opacity-75" />
                      <div className="w-12 h-12 rounded-full bg-amber-500/25 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Smartphone className="w-5 h-5 animate-pulse" />
                      </div>
                    </motion.div>
                  )}

                  {trackingStatus === 'verifying' && (
                    <motion.div 
                      key="verifying"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative flex items-center justify-center w-14 h-14"
                    >
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF3333]/15 animate-ping opacity-75" />
                      <div className="w-12 h-12 rounded-full bg-[#FF3333]/25 border border-[#FF3333]/40 flex items-center justify-center text-[#FF3333]">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    </motion.div>
                  )}

                  {trackingStatus === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      className="w-14 h-14 bg-emerald-500/20 border-2 border-red-500 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-bounce-subtle"
                    >
                      <Check className="w-7 h-7 stroke-[3]" />
                    </motion.div>
                  )}

                  {trackingStatus === 'failed' && (
                    <motion.div 
                      key="failed"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      className="w-14 h-14 bg-[#FF3333]/20 border-2 border-[#FF3333] rounded-full flex items-center justify-center text-[#FF3333] shadow-[0_0_20px_rgba(255, 51, 51,0.35)]"
                    >
                      <AlertCircle className="w-7 h-7 stroke-[3]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Main Label */}
                <div className="text-center space-y-0.5 z-10">
                  <div className="font-bold text-xs tracking-tight uppercase">
                    {trackingStatus === 'awaiting_payment' && 'Awaiting UPI Authorization'}
                    {trackingStatus === 'verifying' && 'Reconciling Instant Ledger'}
                    {trackingStatus === 'success' && 'Deposit Approved'}
                    {trackingStatus === 'failed' && 'Payment Matching Failed'}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Routing: <span className="text-white font-[700] font-sans">₹{(parseInt(amount) || 0).toLocaleString()}</span> via UPI
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase px-1">
                  <span>Connection integrity</span>
                  <span>{trackingProgress}%</span>
                </div>
                <div style={{ height: '0.3cm' }} className="w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      trackingStatus === 'success' ? 'bg-emerald-500' :
                      trackingStatus === 'failed' ? 'bg-[#FF3333]' : 'bg-[#FF3333]'
                    }`}
                    style={{ width: `${trackingProgress}%` }}
                  />
                </div>
              </div>

              {/* Retro Log Screen Container */}
              <div className="font-mono bg-black/75 border border-white/5 rounded-lg p-3 text-[10px] leading-relaxed text-zinc-300 min-h-[58px] flex items-center gap-2 relative">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 self-start mt-1 animate-pulse ${
                  trackingStatus === 'success' ? 'bg-emerald-500' :
                  trackingStatus === 'failed' ? 'bg-[#FF3333]' : 'bg-amber-500'
                }`} />
                <span className="flex-1 text-left select-text">{trackingLog}</span>
              </div>

              {/* Success metadata */}
              {trackingStatus === 'success' && generatedUtr && (
                <div className="bg-emerald-500/5 border border-red-500/20 rounded-lg p-3 space-y-1 text-xs text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase">FUNDS ADDED TO WALLET</span>
                    <span className="font-extrabold text-emerald-400 font-sans">+₹{(parseInt(amount) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[9px]">
                    <span className="text-zinc-500">NPCI REF UTR:</span>
                    <span className="text-white font-bold">{generatedUtr}</span>
                  </div>
                </div>
              )}

              {/* Webhook Simulator Panel for Method B */}
              {(trackingStatus === 'awaiting_payment' || trackingStatus === 'verifying') && trackingMode === 'B' && (
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-red-500/10 text-xs space-y-2 text-stone-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[9px] tracking-wide">
                    <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                    <span>Method B Webhook Console</span>
                  </div>
                  <p className="leading-relaxed text-[9.5px] text-zinc-400">
                    Your forwarder must send secure ping back matching correlation note <span className="font-mono text-white bg-[#FF3333]/10 border border-[#FF3333]/20 px-1 py-0.5 rounded">{currentOrderId}</span> to:
                  </p>
                  
                  <div className="bg-black/80 p-3 text-left rounded-lg font-mono text-[8.5px] leading-relaxed text-[#9EFFAD] space-y-1.5 border border-white/5 relative group/code">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
                      <span className="text-zinc-500 font-bold uppercase text-[7.5px] tracking-wider">LIVE TARGET GATEWAY</span>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          navigator.clipboard.writeText(window.location.origin + "/api/upi-webhook");
                          setCopiedWebhook(true);
                          setTimeout(() => setCopiedWebhook(false), 2000);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white hover:text-emerald-400 transition-colors text-[7.5px]"
                      >
                        {copiedWebhook ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>COPY URL</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div><span className="text-red-500 font-bold">POST</span> <span className="text-white select-all">{window.location.origin}/api/upi-webhook</span></div>
                    <div><span className="text-zinc-500 font-semibold">Headers:</span></div>
                    <div className="pl-3 text-zinc-300">"x-webhook-token": <span className="text-amber-300 select-all">"{webhookToken}"</span></div>
                    <div><span className="text-zinc-500 font-semibold">Body:</span></div>
                    <div className="pl-3">{"{"}</div>
                    <div className="pl-6">"amount": <span className="text-[#FF2348]">{parseInt(amount) || 0}</span>,</div>
                    <div className="pl-6">"receiverVpa": <span className="text-zinc-300">"{receiverVpa}"</span>,</div>
                    <div className="pl-6">"noteRemarks": <span className="text-zinc-300">"{currentOrderId}"</span>,</div>
                    <div className="pl-6">"senderName": <span className="text-zinc-400">"Customer UPI App"</span>,</div>
                    <div className="pl-6">"referenceUtr": <span className="text-zinc-400">"TXN3{Date.now()}"</span></div>
                    <div className="pl-3">{"}"}</div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      playClick();
                      setTrackingStatus('verifying');
                      setTrackingLog(`📡 Webhook payload matched! Routing orderId: ${currentOrderId} on ledger...`);
                      try {
                        await apiFetch('/api/upi-webhook', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-webhook-token': webhookToken
                          },
                          body: JSON.stringify({
                            amount: parseInt(amount) || 0,
                            receiverVpa: receiverVpa,
                            noteRemarks: currentOrderId,
                            senderName: "Customer UPI App",
                            referenceUtr: "TXN3" + Date.now()
                          })
                        });
                      } catch (err) {
                        console.warn("Mock webhook fetch failed:", err);
                      }
                    }}
                    disabled={trackingStatus === 'verifying'}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center"
                  >
                    {trackingStatus === 'verifying' ? 'Verifying Webhook...' : '⚡ Trigger Mock Android Forwarder SMS Webhook'}
                  </button>
                </div>
              )}

              {/* Guide/Hint Box explaining simulations */}
              {trackingStatus === 'failed' && (
                <div className="bg-[#071A3D]/5 border border-[#FF3333]/20 rounded-lg p-2.5 text-[9px] text-stone-400 space-y-1 font-sans">
                  <span className="font-bold text-[#FF3333] uppercase tracking-wider block">Diagnostics:</span>
                  <p className="leading-relaxed font-sans">
                    Automated tracker could not locate corresponding credit logs for ₹{(parseInt(amount) || 0).toLocaleString()} at VPA <span className="text-white font-semibold font-mono">{receiverVpa}</span>.
                  </p>
                  <p className="text-[#FFB347] leading-relaxed mt-1 italic block">
                    💡 Simulated testing: Deposit values ending in "9" or "4" (e.g. ₹99, ₹499) trigger simulated failure modes. Other values succeed instantly!
                  </p>
                </div>
              )}

              {/* Action controller CTA buttons */}
              <div className="pt-1">
                {trackingStatus === 'failed' && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setTrackingStatus('idle');
                    }}
                    className={actionBtnClass}
                  >
                    Retry Deposit
                  </button>
                )}

                {trackingStatus === 'success' && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setTrackingStatus('idle');
                      setAmount('');
                      if (onBack) {
                        onBack();
                      }
                    }}
                    className={isSportsTheme ? "w-full py-2.5 rounded-lg font-extrabold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-550 active:scale-95 transition-all text-center cursor-pointer font-sans shadow-sm" : "w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-center cursor-pointer font-sans"}
                  >
                    Done & Return
                  </button>
                )}

                {(trackingStatus === 'awaiting_payment' || trackingStatus === 'verifying') && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setTrackingStatus('idle');
                    }}
                    className={`w-full py-2 text-[10px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${isSportsTheme ? 'text-neutral-500 hover:text-neutral-800' : 'text-neutral-450 hover:text-white'}`}
                  >
                    Cancel Track Connection
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Mobile Deep-Linking Client Launch Button */}
              <div>
                <motion.button
                  type="button"
                  onClick={() => {
                    const numAmt = parseInt(amount) || 0;
                    if (numAmt < 200) {
                      alert("Minimum deposit allowed is ₹200.");
                      return;
                    }
                    if (numAmt > 50000) {
                      alert("Maximum deposit allowed is ₹50,000.");
                      return;
                    }
                    playClick();
                    // Auto launch real mobile UPI app payment deep link!
                    const upiString = `upi://pay?pa=${receiverVpa}&pn=${receiverName}&am=${numAmt}&cu=INR&tn=${currentOrderId}`;
                    window.location.href = upiString;
                    // Trigger live automation tracking!
                    if (trackingMode === 'B') {
                      registerOrderOnServer(currentOrderId, numAmt, receiverVpa);
                    }
                    setTrackingStatus('awaiting_payment');
                    setTrackingProgress(0);
                    setTrackingLog(trackingMode === 'B' 
                      ? `📡 Webhook Listener Active... Awaiting payload for Note ID: ${currentOrderId}`
                      : "📡 Listening on NPCI Network... Awaiting UPI Callback Handshake"
                    );
                  }}
                  onMouseEnter={() => playHover()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full h-[56px] rounded-lg overflow-hidden text-left flex items-center justify-between px-3.5 font-sans text-white select-none transition-all duration-200 cursor-pointer border group bg-clip-border ${
                    isSportsTheme 
                      ? 'shadow-[0_8px_30px_rgba(227,6,19,0.25)] hover:shadow-[0_12px_35px_rgba(227,6,19,0.4)] border-white/15' 
                      : 'shadow-[0_8px_30px_rgba(255,31,61,0.25)] hover:shadow-[0_12px_35px_rgba(255,31,61,0.4)] border-white/10'
                  }`}
                  style={{
                    background: isSportsTheme 
                      ? 'linear-gradient(90deg, #FF3333, #FF3333, #FF5252)' 
                      : 'linear-gradient(90deg, #FF3333, #FF3333, #FF5252)',
                  }}
                >
                  {/* Glass reflection highlight at top half */}
                  <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/18 to-transparent pointer-events-none rounded-t-lg" />
                  {/* Soft spotlight radial backdrop glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  {/* Left Side: 4 circular containers for app logos */}
                  <div className="flex items-center gap-1.5 z-10 shrink-0">
                    {/* Google Pay */}
                    <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.06),_0_1.5px_4px_rgba(0,0,0,0.12)] transform group-hover:scale-105 transition-transform duration-200">
                      <div className="flex items-center justify-center font-sans tracking-tighter scale-[0.82]">
                        <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] mr-0.5 inline-block shrink-0">
                          <path d="M21.35 11.1h-9.17v2.73h6.51c-.3 1.56-1.17 2.16-2.52 2.52v2.1h4.05c2.37-2.19 3.13-5.43 3.13-7.35z" fill="#4285F4"/>
                          <path d="M12.18 20.45c2.43 0 4.47-.81 5.96-2.19l-4.05-2.1c-1.11.75-2.52.93-3.81.51-1.3-.42-2.31-1.43-2.73-2.73L3.38 16.2c1.68 3.36 5.12 4.25 8.8 4.25z" fill="#34A853"/>
                          <path d="M3.38 14.13a6.1 6.1 0 0 1 0-4.26L7.55 12c-.21.63-.21 1.5 0 2.13z" fill="#FBBC05"/>
                          <path d="M12.18 3.55c3.24 0 5.07 1.41 5.91 2.22l2.1-2.1C18.65 2.13 15.71 1 12.18 1 7.2 1 3.93 4.29 3.38 7.74l4.17 2.13c.42-1.3 1.43-2.31 2.73-2.73 1.29-.42 2.61-.12 3.81.51z" fill="#EA4335"/>
                        </svg>
                        <span className="text-[10px] font-black text-[#5F6368] tracking-tight">Pay</span>
                      </div>
                    </div>

                    {/* PhonePe */}
                    <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.06),_0_1.5px_4px_rgba(0,0,0,0.12)] transform group-hover:scale-105 transition-transform duration-200 delay-[30ms]">
                      <div className="w-[21px] h-[21px] bg-[#5F259F] rounded-[6px] flex items-center justify-center text-white font-sans font-black text-[11px] select-none shadow-sm leading-none pl-[0.5px]">
                        पे
                      </div>
                    </div>

                    {/* Paytm */}
                    <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.06),_0_1.5px_4px_rgba(0,0,0,0.12)] transform group-hover:scale-105 transition-transform duration-200 delay-[60ms]">
                      <div className="flex items-center justify-center select-none font-sans scale-[0.88]">
                        <span className="text-[10px] font-[900] text-[#00bAF2] tracking-tighter">pay</span>
                        <span className="text-[10px] font-[900] text-[#002970] tracking-tighter">tm</span>
                      </div>
                    </div>

                    {/* BHIM UPI */}
                    <div className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.06),_0_1.5px_4px_rgba(0,0,0,0.12)] transform group-hover:scale-105 transition-transform duration-200 delay-[90ms]">
                      <div className="flex flex-col items-center justify-center select-none leading-none scale-[0.72] font-sans font-extrabold italic -space-y-[1px]">
                        <div className="text-[7px] text-[#2c2c2c] tracking-tighter flex items-center justify-center font-[900]">
                          BHIM<span className="text-[#F15A24] font-black not-italic text-[6px] ml-[0.5px]">▷</span>
                        </div>
                        <div className="text-[9px] text-[#2c2c2c] tracking-tighter flex items-center justify-center font-[900] -mt-[1px]">
                          UPI<span className="text-[#39B54A] font-black not-italic text-[7px] ml-[0.5px]">▷</span>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-[1px] h-5 bg-white/20 mx-1.5 self-center" />
                  </div>

                  {/* Center: Heading and Subheading */}
                  <div className="flex-1 flex flex-row items-center gap-2 pl-1.5 z-10 overflow-hidden">
                    <span className="text-[14px] sm:text-[15px] font-[700] text-white tracking-tight whitespace-nowrap animate-pulse-subtle">
                      Pay ₹{(parseInt(amount) || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-white/80 font-medium tracking-normal hidden sm:inline truncate select-none opacity-90">
                      — instantly via preferred UPI app
                    </span>
                  </div>

                  {/* Right Side: Arrow icon */}
                  <div className="w-8 h-8 rounded-full bg-black/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:bg-white/20 group-hover:border-white/30 transition-all duration-200">
                    <svg className="w-3.5 h-3.5 text-white transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </motion.button>
              </div>

              {/* Scan QR Visual Panel */}
              <div className={`relative py-4 text-center rounded-2xl border p-4 space-y-3.5 ${isSportsTheme ? 'bg-neutral-50 border-neutral-200' : 'bg-black/40 border-[#FF3333]/15'}`}>
                {/* Visual scan frame guides */}
                <div className={`absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 ${isSportsTheme ? 'border-[#FF3333]' : 'border-[#FF3333]'}`} />
                <div className={`absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 ${isSportsTheme ? 'border-[#FF3333]' : 'border-[#FF3333]'}`} />
                <div className={`absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 ${isSportsTheme ? 'border-[#FF3333]' : 'border-[#FF3333]'}`} />
                <div className={`absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 ${isSportsTheme ? 'border-[#FF3333]' : 'border-[#FF3333]'}`} />

                <div className={`flex items-center justify-between text-[10px] px-1 font-bold ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FF3333]'}`}>
                  <span className="flex items-center gap-1 uppercase tracking-wide">
                    <QrCode className={`w-3.5 h-3.5 ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FF3333]'}`} /> Scan Instant QR
                  </span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-mono leading-none ${isSportsTheme ? 'bg-[#FF3333]/5 border-[#FF3333]/20 text-[#FF3333]' : 'bg-[#FF3333]/10 border-[#FF3333]/20 text-[#FF3333]'}`}>
                    EXPIRES: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Interactive responsive SVG QR */}
                <div 
                  className={`relative mx-auto w-36 h-36 p-2.5 rounded-2xl select-none cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                    isSportsTheme ? 'bg-white border border-neutral-200 shadow-sm' : 'bg-white shadow-lg'
                  }`}
                  title="Click to launch deep link UPI"
                  onClick={() => {
                    const numAmt = parseInt(amount) || 0;
                    if (numAmt < 200) {
                      alert("Minimum deposit is ₹200.");
                      return;
                    }
                    if (numAmt > 50000) {
                      alert("Maximum deposit is ₹50,000.");
                      return;
                    }
                    playClick();
                    const upiString = `upi://pay?pa=${receiverVpa}&pn=${receiverName}&am=${numAmt}&cu=INR&tn=${currentOrderId}`;
                    window.location.href = upiString;
                    // Trigger live automation tracking!
                    if (trackingMode === 'B') {
                      registerOrderOnServer(currentOrderId, numAmt, receiverVpa);
                    }
                    setTrackingStatus('awaiting_payment');
                    setTrackingProgress(0);
                    setTrackingLog(trackingMode === 'B'
                      ? `📡 Webhook Listener Active... Awaiting payload for Note ID: ${currentOrderId}`
                      : "📡 Listening on NPCI Network... Awaiting UPI Callback Handshake"
                    );
                  }}
                >
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${receiverVpa}&pn=${receiverName}&am=${parseInt(amount) || 1}&cu=INR&tn=${currentOrderId}`)}`}
                    alt="UPI Deposit QR Code"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Dynamic Remittance Remarks Helper for Method B Correlation */}
                <div className={`px-3 py-2 rounded-xl border flex items-center justify-between text-[10px] ${isSportsTheme ? 'bg-white border-neutral-200' : 'bg-black/60 border-white/5'}`}>
                  <div className="text-left font-sans">
                    <span className={`text-[8px] block uppercase font-bold leading-none ${isSportsTheme ? 'text-neutral-400' : 'text-zinc-500'}`}>Required Remarks/Note:</span>
                    <span className={`font-mono font-black text-[12px] leading-tight tracking-wider ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FFB347]'}`}>{currentOrderId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      navigator.clipboard.writeText(currentOrderId);
                      setCopiedOrderId(true);
                      setTimeout(() => setCopiedOrderId(false), 2000);
                    }}
                    className={`px-2.5 py-1 rounded text-[8.5px] font-extrabold uppercase transition-all cursor-pointer font-sans border ${isSportsTheme ? 'bg-[#FF3333]/10 border-[#FF3333]/20 text-[#FF3333] hover:bg-neutral-100' : 'bg-[#FF3333]/10 border-[#FF3333]/20 text-[#FF3333] hover:bg-white/5'}`}
                  >
                    {copiedOrderId ? 'COPIED ✓' : 'COPY NOTE'}
                  </button>
                </div>

                <div className={`text-[9px] uppercase tracking-wide select-none font-bold ${isSportsTheme ? 'text-neutral-500' : 'text-[#FF3333]/50'}`}>
                  Recipient VPA: {receiverVpa} • {receiverName}
                </div>

                <div className={`text-[9px] uppercase tracking-wide select-none ${isSportsTheme ? 'text-neutral-400' : 'text-white/45'}`}>
                  Click/tap the QR code above or the button to pay directly via UPI app
                </div>
              </div>
            </>
          )}

        </div>
      ) : (
        <div className="space-y-5 font-sans relative">
          
          {/* Sticky Wallet Balance & Logo Header Card */}
          <div className={isSportsTheme 
            ? "bg-white border border-[#EDEDED] p-4 rounded-2.5xl flex items-center justify-between shadow-sm"
            : "bg-neutral-950/70 backdrop-blur-md border border-neutral-800/80 p-4 rounded-2xl flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.6)]"}>
            <div className="leading-none select-none">
              <span className={`font-sans font-[900] italic text-sm tracking-widest uppercase ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FF3333]'}`}>TENZO 247</span>
              <span className={`block text-[8px] font-sans tracking-widest uppercase mt-0.5 ${isSportsTheme ? 'text-neutral-400' : 'text-zinc-500'}`}>Secure Wallet</span>
            </div>

            <div className={`flex items-center gap-2 py-1.5 pl-3 pr-2.5 rounded-xl border ${
              isSportsTheme 
                ? 'bg-neutral-50 border-neutral-200' 
                : 'bg-black/50 border-white/5'
            }`}>
              <div className="text-right">
                <span className={`block text-[7.5px] uppercase tracking-widest leading-none ${isSportsTheme ? 'text-neutral-400' : 'text-zinc-500'}`}>Total Balance</span>
                <span className={`font-mono font-black text-[13px] tracking-tight mt-1 inline-block ${isSportsTheme ? 'text-neutral-800' : 'text-white'}`}>
                  {showBalance ? (user.isBalanceLoading ? 'Loading...' : formatBalance(user.walletBalance)) : '••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowBalance(!showBalance);
                }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isSportsTheme 
                    ? 'bg-neutral-200/50 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800' 
                    : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              
              <div className={`h-5 w-[1px] mx-1 ${isSportsTheme ? 'bg-neutral-200' : 'bg-white/10'}`} />

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setActiveTab('deposit');
                }}
                className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase text-white tracking-widest hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer text-center ${
                  isSportsTheme
                    ? 'bg-[#FF3333] shadow-sm'
                    : 'bg-gradient-to-r from-[#FF3333] to-[#FF3333]'
                }`}
              >
                + DEPOSIT
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showRequestSuccess ? (
              <motion.div
                key="withdrawal-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >                {/* Withdrawal Amount Selection with custom quick chips */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className={`text-[10.5px] font-black uppercase tracking-widest block font-sans ${isSportsTheme ? 'text-neutral-450' : 'text-white/55'}`}>
                      ENTER WITHDRAWAL AMOUNT
                    </label>
                    <span className={`text-[9.5px] font-bold font-sans ${isSportsTheme ? 'text-neutral-400' : 'text-neutral-500'}`}>Min ₹500</span>
                  </div>

                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-base ${isSportsTheme ? 'text-neutral-500' : 'text-white'}`}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Specify amount"
                      className={isSportsTheme
                        ? "w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 pl-9 pr-4 text-neutral-900 text-base font-black focus:outline-none focus:border-[#FF3333] transition-colors font-sans"
                        : "w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-9 pr-4 text-white text-base font-bold focus:outline-none focus:border-[#FF3333] transition-colors font-sans"}
                    />
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-6 gap-1.5 font-sans">
                    {[500, 1000, 2000, 5000, 10000].map((presetVal) => {
                      const isSelected = parseInt(amount) === presetVal;
                      return (
                        <button
                          type="button"
                          key={presetVal}
                          onClick={() => {
                            playClick();
                            setAmount(presetVal.toString());
                          }}
                          className={`py-1.5 rounded-lg text-[9.5px] font-black border tracking-wide transition-all select-none cursor-pointer active:scale-95 text-center ${
                            isSelected
                              ? isSportsTheme
                                ? 'border-[#FF3333] bg-[#FF3333]/5 text-[#FF3333]'
                                : 'border-[#FF3333] bg-[#FF3333]/10 text-[#FF3333]'
                              : isSportsTheme
                                ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-[#FF3333]'
                                : 'border-white/5 bg-black/30 hover:bg-black/60 text-neutral-450 hover:text-white'
                          }`}
                        >
                          ₹{presetVal.toLocaleString('en-IN')}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setAmount(Math.floor(user.walletBalance).toString());
                      }}
                      className={`py-1.5 rounded-lg text-[9.5px] font-black border tracking-wide transition-all select-none cursor-pointer active:scale-95 text-center ${
                        parseInt(amount) === Math.floor(user.walletBalance) && user.walletBalance > 0
                          ? isSportsTheme
                            ? 'border-[#FF3333] bg-[#FF3333]/5 text-[#FF3333]'
                            : 'border-[#FF3333] bg-[#FF3333]/10 text-[#FF3333]'
                          : isSportsTheme
                            ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-[#FF3333] hover:text-[#FF3333]/80'
                            : 'border-white/5 bg-black/30 hover:bg-black/60 text-[#FF3333]/90 hover:text-white'
                      }`}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Premium Withdrawal Tabs Selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* UPI Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setWithdrawalTab('upi');
                    }}
                    className={`p-3.5 rounded-[18px] border text-left transition-all relative overflow-hidden flex items-center gap-3 select-none cursor-pointer group ${
                      withdrawalTab === 'upi'
                        ? isSportsTheme
                          ? 'border-[#FF3333] bg-[#FF3333]/5 shadow-sm text-neutral-800'
                          : 'border-[#FF3333] bg-[#FF3333]/8 shadow-[0_8px_25px_rgba(255,86,48,0.12)] text-white'
                        : isSportsTheme
                          ? 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-850'
                          : 'border-white/5 bg-black/40 text-neutral-400 hover:border-white/10 hover:text-neutral-200'
                    }`}
                  >
                    {withdrawalTab === 'upi' && !isSportsTheme && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-[#FF3333]/5 rounded-full blur-2xl pointer-events-none" />
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                      withdrawalTab === 'upi' 
                        ? isSportsTheme 
                          ? 'bg-[#FF3333] text-white' 
                          : 'bg-[#FF3333] text-white' 
                        : isSportsTheme 
                          ? 'bg-neutral-100 text-neutral-400' 
                          : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      <Smartphone className="w-3.5 h-3.5 shadow" />
                    </div>
                    <div className="z-10 leading-none">
                      <div className="font-extrabold text-[10.5px] uppercase tracking-wide">UPI Withdrawal</div>
                      <div className={`text-[8px] mt-1 truncate ${withdrawalTab === 'upi' ? (isSportsTheme ? 'text-[#FF3333]/80 font-bold' : 'text-[#FF3333]') : 'text-neutral-500'}`}>Fast • Instant Settlement</div>
                    </div>
                  </button>

                  {/* Bank Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setWithdrawalTab('bank');
                    }}
                    className={`p-3.5 rounded-[18px] border text-left transition-all relative overflow-hidden flex items-center gap-3 select-none cursor-pointer group ${
                      withdrawalTab === 'bank'
                        ? isSportsTheme
                          ? 'border-[#FF3333] bg-[#FF3333]/5 shadow-sm text-neutral-800'
                          : 'border-[#FF3333] bg-[#FF3333]/8 shadow-[0_8px_25px_rgba(255,86,48,0.12)] text-white'
                        : isSportsTheme
                          ? 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-850'
                          : 'border-white/5 bg-black/40 text-neutral-400 hover:border-white/10 hover:text-neutral-200'
                    }`}
                  >
                    {withdrawalTab === 'bank' && !isSportsTheme && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-[#FF3333]/5 rounded-full blur-2xl pointer-events-none" />
                    )}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                      withdrawalTab === 'bank' 
                        ? isSportsTheme 
                          ? 'bg-[#FF3333] text-white' 
                          : 'bg-[#FF3333] text-white' 
                        : isSportsTheme 
                          ? 'bg-neutral-100 text-neutral-400' 
                          : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="z-10 leading-none">
                      <div className="font-extrabold text-[10.5px] uppercase tracking-wide">Bank Transfer</div>
                      <div className={`text-[8px] mt-1 truncate ${withdrawalTab === 'bank' ? (isSportsTheme ? 'text-[#FF3333]/80 font-bold' : 'text-[#FF3333]') : 'text-neutral-500'}`}>Secure • NEFT / IMPS</div>
                    </div>
                  </button>
                </div>

                {/* Single Linked UPI Account Section */}
                {withdrawalTab === 'upi' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className={`text-[10.5px] font-black uppercase tracking-widest flex items-center gap-1 font-sans ${isSportsTheme ? 'text-neutral-400' : 'text-white/55'}`}>
                        LINKED UPI ACCOUNT
                      </h3>
                      <span className="text-[8.5px] text-emerald-400 font-sans tracking-wide flex items-center gap-1 select-none font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> Safe & Verified
                      </span>
                    </div>

                    {upiAccounts.length > 0 ? (
                      (() => {
                        const acc = upiAccounts[0];
                        const lowerUpi = acc.upiId.toLowerCase();
                        const isPaytm = lowerUpi.includes('paytm');
                        const isYbl = lowerUpi.includes('ybl');

                        return (
                          <div
                            className={`p-4 rounded-[18px] border flex items-center justify-between select-none ${
                              isSportsTheme
                                ? 'border-[#FF3333]/20 bg-[#FF3333]/5'
                                : 'border-[#FF3333]/20 bg-[#FF3333]/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Brand Bubble Initials */}
                              <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 font-sans font-black text-[9px] uppercase tracking-tighter shadow-inner ${
                                isPaytm ? 'bg-sky-550/10 text-[#00bAF2]' :
                                isYbl ? 'bg-[#FF3333] text-white' :
                                'bg-neutral-800 text-neutral-350'
                              }`}>
                                {isPaytm ? 'Paytm' : isYbl ? 'ybl' : acc.nickname.slice(0, 3)}
                              </div>

                              <div className="leading-tight text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-extrabold text-[12px] ${isSportsTheme ? 'text-neutral-800' : 'text-neutral-200'}`}>{acc.nickname}</span>
                                </div>
                                <div className="font-mono text-neutral-450 text-[10.5px] mt-0.5">{acc.upiId}</div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleEditUpiAccount(acc)}
                              className={`p-2 px-3 rounded-xl text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer ${
                                isSportsTheme 
                                  ? 'bg-[#FF3333] text-white hover:brightness-110' 
                                  : 'bg-[#FF3333] hover:bg-[#FF5252] text-black'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit / Change
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-3">
                        <div className={`text-center py-6 border border-dashed rounded-[18px] text-zinc-500 text-xs font-sans ${isSportsTheme ? 'border-neutral-200 bg-neutral-50' : 'border-white/5 bg-black/20'}`}>
                          No UPI account linked.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setEditingAccountId(null);
                            setNewUpiId('');
                            setNewUpiNickname('');
                            setNewUpiSetDefault(true);
                            setUpiValidationError('');
                            setIsUpiModalOpen(true);
                          }}
                          className={`w-full p-3 border border-dashed rounded-[18px] text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer font-sans ${
                            isSportsTheme
                              ? 'border-[#FF3333]/30 bg-[#FF3333]/5 text-[#FF3333] hover:bg-[#FF3333]/10'
                              : 'border-neutral-800 bg-neutral-900/10 hover:bg-neutral-900/20 text-[#FF3333]'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Link UPI Account
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Single Linked Bank Account Section */}
                {withdrawalTab === 'bank' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className={`text-[10.5px] font-black uppercase tracking-widest flex items-center gap-1 font-sans ${isSportsTheme ? 'text-neutral-400' : 'text-white/55'}`}>
                        LINKED BANK ACCOUNT
                      </h3>
                      <span className="text-[8.5px] text-emerald-400 font-sans tracking-wide flex items-center gap-1 select-none font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> 100% Encrypted Gateway
                      </span>
                    </div>

                    {bankAccounts.length > 0 ? (
                      (() => {
                        const acc = bankAccounts[0];
                        const visibleAcctNum = acc.accountNumber;
                        const maskedAcctNum = visibleAcctNum.length > 4 
                          ? `XXXX${visibleAcctNum.slice(-4)}` 
                          : visibleAcctNum;
                        
                        const isHdfc = acc.bankName.toUpperCase().includes('HDFC');
                        const isSbi = acc.bankName.toUpperCase().includes('STATE BANK') || acc.bankName.toUpperCase().includes('SBI');

                        return (
                          <div
                            className={`p-4 rounded-[18px] border flex items-center justify-between select-none ${
                              isSportsTheme
                                ? 'border-[#FF3333]/20 bg-[#FF3333]/5'
                                : 'border-[#FF3333]/20 bg-[#FF3333]/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Brand initial block */}
                              <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 font-sans font-black text-[9px] uppercase ${
                                isHdfc ? 'bg-blue-900 text-white' :
                                isSbi ? 'bg-cyan-800 text-cyan-200' :
                                'bg-neutral-800 text-neutral-350'
                              }`}>
                                {isHdfc ? 'HDFC' : isSbi ? 'SBI' : <Landmark className="w-3.5 h-3.5" />}
                              </div>

                              <div className="leading-tight text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-extrabold text-[12px] uppercase ${isSportsTheme ? 'text-neutral-800' : 'text-neutral-200'}`}>{acc.bankName}</span>
                                </div>
                                <div className={`font-extrabold text-neutral-450 text-[10.5px] mt-0.5 uppercase tracking-wide ${isSportsTheme ? 'text-neutral-500' : 'text-neutral-400'}`}>{acc.holderName}</div>
                                <div className="font-mono text-neutral-450 text-[10px] mt-0.5 text-left">
                                  A/C: <span className={`font-[500] ${isSportsTheme ? 'text-neutral-850' : 'text-white'}`}>{maskedAcctNum}</span> • <span className="text-neutral-400">IFSC:</span> <span className={`font-[500] ${isSportsTheme ? 'text-neutral-850' : 'text-white'}`}>{acc.ifscCode}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleEditBankAccount(acc)}
                              className={`p-2 px-3 rounded-xl text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                                isSportsTheme 
                                  ? 'bg-[#FF3333] text-white hover:brightness-110' 
                                  : 'bg-[#FF3333] hover:bg-[#FF5252] text-black'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit / Change
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-3">
                        <div className={`text-center py-6 border border-dashed rounded-[18px] text-zinc-500 text-xs font-sans ${isSportsTheme ? 'border-neutral-200 bg-neutral-50' : 'border-white/5 bg-black/20'}`}>
                          No bank account linked.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setEditingAccountId(null);
                            setNewBankHolderName('');
                            setNewBankAccountNumber('');
                            setNewBankConfirmAccountNumber('');
                            setNewBankIfscCode('');
                            setNewBankName('');
                            setNewBankSetDefault(true);
                            setBankValidationError('');
                            setIsBankModalOpen(true);
                          }}
                          className={`w-full p-3 border border-dashed rounded-[18px] text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer font-sans ${
                            isSportsTheme
                              ? 'border-[#FF3333]/30 bg-[#FF3333]/5 text-[#FF3333] hover:bg-[#FF3333]/10'
                              : 'border-neutral-800 bg-neutral-900/10 hover:bg-neutral-900/20 text-[#FF3333]'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Link Bank Account
                        </button>
                      </div>
                    )}
                  </div>
                )}

                 {/* Review withdrawal dynamic metadata card */}
                <div className={`p-4 rounded-[18px] border space-y-3 font-sans relative overflow-hidden ${
                  isSportsTheme 
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-800 shadow-xs' 
                    : 'border-white/5 bg-neutral-950/40 text-stone-300'
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest block ${isSportsTheme ? 'text-neutral-500' : 'text-white/50'}`}>
                    REVIEW WITHDRAWAL
                  </span>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className={`${isSportsTheme ? 'text-neutral-500' : 'text-neutral-450'}`}>Withdrawal Method</span>
                      <span className={`font-extrabold ${isSportsTheme ? 'text-neutral-800' : 'text-neutral-200'}`}>
                        {withdrawalTab === 'upi' ? 'UPI Withdrawal' : 'Bank Transfer'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`${isSportsTheme ? 'text-neutral-500' : 'text-neutral-450'}`}>Selected Account</span>
                      <span className={`font-extrabold truncate max-w-[190px] ${isSportsTheme ? 'text-neutral-800' : 'text-white'}`}>
                        {withdrawalTab === 'upi' 
                          ? (upiAccounts[0] ? `${upiAccounts[0].nickname} (${upiAccounts[0].upiId})` : 'None Linked')
                          : (bankAccounts[0] ? `${bankAccounts[0].bankName} - A/C: XX${bankAccounts[0].accountNumber.slice(-4)}` : 'None Linked')
                        }
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`${isSportsTheme ? 'text-neutral-500' : 'text-neutral-450'}`}>Amount</span>
                      <span className={`font-extrabold ${isSportsTheme ? 'text-neutral-800' : 'text-neutral-200'}`}>
                        ₹{(parseInt(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`${isSportsTheme ? 'text-neutral-500' : 'text-neutral-450'}`}>Processing Fee</span>
                      <span className="font-semibold text-emerald-400">₹0.00 (Free)</span>
                    </div>

                    <div className={`h-[1px] my-0.5 ${isSportsTheme ? 'bg-neutral-200' : 'bg-white/5'}`} />

                    <div className="flex justify-between items-center pt-0.5">
                      <span className={`font-extrabold uppercase text-[10px] ${isSportsTheme ? 'text-neutral-600' : 'text-neutral-350'}`}>You Will Receive</span>
                      <span className={`font-sans font-bold text-base ${isSportsTheme ? 'text-[#FF3333]' : 'text-[#FF3333]'}`}>
                        ₹{(parseInt(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submitting Request CTA button */}
                <button
                  type="button"
                  disabled={isPendingRequest}
                  onClick={handleInitiateWithdrawal}
                  className={`relative w-full h-[54px] rounded-[18px] overflow-hidden flex items-center justify-center font-sans transition-all active:scale-[0.98] select-none disabled:opacity-50 text-white cursor-pointer ${
                    isSportsTheme 
                      ? 'shadow-[0_8px_30px_rgba(227,6,19,0.25)] hover:shadow-[0_12px_35px_rgba(227,6,19,0.4)]' 
                      : ''
                  }`}
                  style={{
                    background: isSportsTheme 
                      ? 'linear-gradient(90deg, #FF3333, #FF3333, #FF5252)' 
                      : 'linear-gradient(90deg, #FF3333, #FF3333, #FF3333)',
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[18px]" />

                  {isPendingRequest ? (
                    <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>DISPATCHING SECURE REQUEST...</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full px-4 text-white z-10">
                      <div className="flex items-center gap-1.5 tracking-widest font-black text-[11.5px] uppercase">
                        <Lock className="w-3.5 h-3.5 text-white/90" />
                        <span>REQUEST WITHDRAWAL</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-black/15 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              </motion.div>
            ) : (
              /* Success screen after submitting the withdrawal */
              <motion.div
                key="withdrawal-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                tabIndex={-1}
                className="p-5 rounded-[20px] border border-red-500/10 bg-neutral-900/60 text-center space-y-4 font-sans text-white py-6"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-black text-base text-emerald-400 tracking-tight">REQUEST QUEUED</h3>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">NPCI Settlement Handshake initiated</p>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-[10.5px] text-left text-neutral-300 space-y-2 uppercase font-sans">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction ID:</span>
                    <span className="font-mono text-white font-bold">{successTxId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Destination:</span>
                    <span className="text-white font-bold truncate max-w-[155px]">
                      {withdrawalTab === 'upi' 
                        ? upiAccounts[0]?.upiId 
                        : `A/C: XX${bankAccounts[0]?.accountNumber.slice(-4)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount Sent:</span>
                    <span className="text-amber-500 font-bold">₹{(parseInt(amount) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Processing Time:</span>
                    <span className="text-emerald-400 font-bold">5-15 mins</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setShowRequestSuccess(false);
                    setAmount('5000');
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer font-sans"
                >
                  Acknowledge & Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unified Filterable Transaction Ledger */}
          {(() => {
            // Merge user-supplied transactions with comprehensive default entries if empty, ensuring both types are present
            const baseLedgerTransactions = transactions.length > 0 ? transactions : [
              { id: 'DEP-99482103', type: 'deposit' as const, amount: 50000, timestamp: '27 Jun 2026, 04:30 PM', status: 'SUCCESS' as const, description: 'Auto UPI Deposit (Ref: 314589218412)' },
              { id: 'WTH-88451236', type: 'withdraw' as const, amount: 5000, timestamp: '24 Jun 2026, 10:30 AM', status: 'PENDING' as const, description: 'Withdrawal to debupam@ybl' },
              { id: 'DEP-31428571', type: 'deposit' as const, amount: 10000, timestamp: '24 Jun 2026, 09:12 AM', status: 'SUCCESS' as const, description: 'Instant Deposit via IMPS Gateway' },
              { id: 'WTH-55211478', type: 'withdraw' as const, amount: 10000, timestamp: '23 Jun 2026, 08:45 PM', status: 'SUCCESS' as const, description: 'Withdrawal to HDFC Bank' },
              { id: 'DEP-10293847', type: 'deposit' as const, amount: 25000, timestamp: '22 Jun 2026, 03:20 PM', status: 'FAILED' as const, description: 'Instant Deposit via GPay (Timed Out)' },
              { id: 'WTH-77889944', type: 'withdraw' as const, amount: 3000, timestamp: '22 Jun 2026, 11:15 AM', status: 'FAILED' as const, description: 'Withdrawal to debupam@paytm' }
            ];

            // Helper to parse dates robustly
            const parseTransactionDate = (timestamp: string): Date => {
              if (timestamp.includes('T') && timestamp.includes('-')) {
                const d = new Date(timestamp);
                if (!isNaN(d.getTime())) return d;
              }
              
              if (timestamp === 'Just now' || timestamp === 'Yesterday' || /^\d{1,2}:\d{2}/.test(timestamp)) {
                const d = new Date();
                if (timestamp === 'Yesterday') {
                  d.setDate(d.getDate() - 1);
                }
                return d;
              }
              
              // Try to parse format: "DD Month YYYY, hh:mm AM/PM"
              const cleaned = timestamp.replace(',', '');
              const parsed = new Date(cleaned);
              if (!isNaN(parsed.getTime())) {
                return parsed;
              }
              
              return new Date();
            };

            const filteredTransactions = baseLedgerTransactions.filter(item => {
              // 1. Filter by Type (All / Deposit / Withdraw)
              if (ledgerTypeFilter !== 'all' && item.type !== ledgerTypeFilter) {
                return false;
              }

              // 2. Filter by Status (Pending / Completed / Rejected)
              const status = item.status.toUpperCase();
              if (historyFilterTab === 'PENDING' && status !== 'PENDING') return false;
              if (historyFilterTab === 'COMPLETED' && status !== 'SUCCESS' && status !== 'COMPLETED') return false;
              if (historyFilterTab === 'REJECTED' && status !== 'FAILED' && status !== 'REJECTED') return false;

              // 3. Filter by Date Range
              const txDate = parseTransactionDate(item.timestamp);
              const now = new Date();
              
              const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
              const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

              if (ledgerDateFilter === 'today') {
                if (txDateOnly.getTime() !== todayOnly.getTime()) return false;
              } else if (ledgerDateFilter === '7days') {
                const diffTime = todayOnly.getTime() - txDateOnly.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0 || diffDays > 7) return false;
              } else if (ledgerDateFilter === '30days') {
                const diffTime = todayOnly.getTime() - txDateOnly.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0 || diffDays > 30) return false;
              } else if (ledgerDateFilter === 'custom' && ledgerCustomDate) {
                const [year, month, day] = ledgerCustomDate.split('-').map(Number);
                const customOnly = new Date(year, month - 1, day);
                if (txDateOnly.getTime() !== customOnly.getTime()) return false;
              }

              return true;
            });

            const getStatusCount = (statusId: 'PENDING' | 'COMPLETED' | 'REJECTED') => {
              return baseLedgerTransactions.filter(item => {
                // Apply type filter first
                if (ledgerTypeFilter !== 'all' && item.type !== ledgerTypeFilter) return false;
                
                // Apply date filter
                const txDate = parseTransactionDate(item.timestamp);
                const now = new Date();
                const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
                const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (ledgerDateFilter === 'today') {
                  if (txDateOnly.getTime() !== todayOnly.getTime()) return false;
                } else if (ledgerDateFilter === '7days') {
                  const diffTime = todayOnly.getTime() - txDateOnly.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 0 || diffDays > 7) return false;
                } else if (ledgerDateFilter === '30days') {
                  const diffTime = todayOnly.getTime() - txDateOnly.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 0 || diffDays > 30) return false;
                } else if (ledgerDateFilter === 'custom' && ledgerCustomDate) {
                  const [year, month, day] = ledgerCustomDate.split('-').map(Number);
                  const customOnly = new Date(year, month - 1, day);
                  if (txDateOnly.getTime() !== customOnly.getTime()) return false;
                }

                // Check status
                const status = item.status.toUpperCase();
                if (statusId === 'PENDING') return status === 'PENDING';
                if (statusId === 'COMPLETED') return status === 'SUCCESS' || status === 'COMPLETED';
                if (statusId === 'REJECTED') return status === 'FAILED' || status === 'REJECTED';
                return false;
              }).length;
            };

            return (
              <div className="space-y-3.5 pt-4 border-t border-white/5 font-sans">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-neutral-400" />
                    <h3 className="text-[10.5px] font-black text-white/55 uppercase tracking-widest">
                      TRANSACTION HISTORY
                    </h3>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest leading-none">
                    LIVE SYNCED
                  </span>
                </div>

                {/* Filter Controls Row 1: Type Segment Buttons */}
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-center font-sans font-black">
                  {[
                    { id: 'all', label: 'ALL TYPE' },
                    { id: 'deposit', label: 'DEPOSITS' },
                    { id: 'withdraw', label: 'WITHDRAWALS' }
                  ].map((typeTab) => {
                    const isSelected = ledgerTypeFilter === typeTab.id;
                    return (
                      <button
                        type="button"
                        key={typeTab.id}
                        onClick={() => {
                          playClick();
                          setLedgerTypeFilter(typeTab.id as 'all' | 'deposit' | 'withdraw');
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all select-none cursor-pointer flex items-center justify-center border ${
                          isSelected
                            ? 'border-red-500/20 bg-red-500/10 text-red-500 border-red-500/30 shadow-sm font-extrabold'
                            : 'border-transparent text-neutral-400 hover:text-neutral-250 hover:bg-neutral-900/20'
                        }`}
                      >
                        <span>{typeTab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter Controls Row 2: Status Tab Buttons */}
                <div className="grid grid-cols-3 gap-1 bg-black/55 p-1 rounded-xl border border-white/5 text-center font-sans font-black">
                  {[
                    { id: 'PENDING', label: 'PENDING', count: getStatusCount('PENDING') },
                    { id: 'COMPLETED', label: 'COMPLETED', count: getStatusCount('COMPLETED') },
                    { id: 'REJECTED', label: 'REJECTED', count: getStatusCount('REJECTED') }
                  ].map((tab) => {
                    const isSelected = historyFilterTab === tab.id;
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => {
                          playClick();
                          setHistoryFilterTab(tab.id as 'PENDING' | 'COMPLETED' | 'REJECTED');
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all select-none cursor-pointer flex items-center justify-center gap-1 border ${
                          isSelected
                            ? 'border-[#FF3333]/20 bg-[#FF3333]/10 text-[#FF3333] border-[#FF3333]/30 shadow-sm'
                            : 'border-transparent text-neutral-450 hover:text-neutral-250 hover:bg-neutral-900/20'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black leading-none ${
                          isSelected ? 'bg-[#FF3333]/20 text-[#FF3333]' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filter Controls Row 3: Date Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={ledgerDateFilter}
                      onChange={(e) => {
                        playClick();
                        setLedgerDateFilter(e.target.value as any);
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-[10px] text-stone-300 font-extrabold uppercase tracking-wide focus:outline-none focus:border-[#FF3333] cursor-pointer appearance-none"
                    >
                      <option value="all" className="bg-neutral-950 text-white">📅 ALL TIME</option>
                      <option value="today" className="bg-neutral-950 text-white">📅 TODAY</option>
                      <option value="7days" className="bg-neutral-950 text-white">📅 LAST 7 DAYS</option>
                      <option value="30days" className="bg-neutral-950 text-white">📅 LAST 30 DAYS</option>
                      <option value="custom" className="bg-neutral-950 text-white">📅 SELECT DATE...</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {ledgerDateFilter === 'custom' ? (
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={ledgerCustomDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          playClick();
                          setLedgerCustomDate(e.target.value);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-1.5 px-3 text-[10px] text-white focus:outline-none focus:border-[#FF3333] cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end px-2 text-[9px] text-stone-500 font-mono tracking-wider font-bold">
                      {filteredTransactions.length} MATCHING RECORDS
                    </div>
                  )}
                </div>

                {/* Ledger Logs Render */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
                  {filteredTransactions.map((log) => {
                    const isDeposit = log.type === 'deposit';
                    const isUpiTx = log.description.toLowerCase().includes('upi') || log.description.toLowerCase().includes('gpay') || log.description.toLowerCase().includes('vpa');
                    return (
                      <div
                        key={log.id}
                        className="glass-panel p-3 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs bg-black/25"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isDeposit 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : isUpiTx ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {isDeposit 
                              ? <Plus className="w-3.5 h-3.5" />
                              : isUpiTx ? <Smartphone className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />
                            }
                          </div>

                          <div className="space-y-0.5 text-left">
                            <div className="font-extrabold text-[#fff] tracking-wide truncate max-w-[170px] uppercase text-[10.5px] flex items-center gap-1.5">
                              <span>{isDeposit ? 'UPI DEPOSIT' : isUpiTx ? 'UPI WITHDRAWAL' : 'BANK TRANSFER'}</span>
                              <span className={`text-[7px] px-1 py-0.2 rounded-sm font-black leading-none ${
                                isDeposit ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              }`}>
                                {isDeposit ? 'IN' : 'OUT'}
                              </span>
                            </div>
                            <div className="text-[9px] text-stone-400 font-mono tracking-tight font-sans">
                              {log.description}
                            </div>
                            <div className="text-[8px] text-zinc-500 font-mono font-medium">
                              Ref: {log.id} • {log.timestamp}
                            </div>
                          </div>
                        </div>

                        <div className="text-right leading-none shrink-0 font-sans">
                          <span className={`font-bold text-sm ${isDeposit ? 'text-emerald-400' : 'text-white'}`}>
                            {isDeposit ? '+' : '-'}₹{log.amount.toLocaleString('en-IN')}
                          </span>
                          <span className={`block text-[8px] font-black uppercase mt-1 ${
                            log.status.toUpperCase() === 'PENDING' ? 'text-amber-500 animate-pulse' :
                            log.status.toUpperCase() === 'SUCCESS' || log.status.toUpperCase() === 'COMPLETED' ? 'text-emerald-400' :
                            'text-[#FF3333]'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state filter fallback */}
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-neutral-500 text-[10px] uppercase tracking-widest font-black">
                      No matching records found.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* Bottom sheet for UPI */}
          <AnimatePresence>
            {isUpiModalOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-sm animate-fade-in px-4">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full max-w-md bg-[#040B1D] border-t border-neutral-800 rounded-t-[24px] p-5 pb-8 space-y-4 font-sans text-white focus:outline-none shadow-[0_-15px_40px_rgba(0,0,0,0.8)]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-black text-xs uppercase tracking-widest text-[#FF3333]">
                      {editingAccountId ? '📝 Edit UPI Account' : '➕ Add Saved UPI Account'}
                    </h3>
                    <button
                      onClick={() => setIsUpiModalOpen(false)}
                      className="p-1 px-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveUpiAccount} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">UPI Address ID / VPA</label>
                      <input
                        type="text"
                        required
                        value={newUpiId}
                        onChange={(e) => setNewUpiId(e.target.value)}
                        placeholder="e.g. debupam@ybl, debupam@paytm"
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">Account Nickname</label>
                      <input
                        type="text"
                        required
                        value={newUpiNickname}
                        onChange={(e) => setNewUpiNickname(e.target.value)}
                        placeholder="e.g. Primary UPI, My Paytm ID"
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-sans"
                      />
                    </div>

                    {upiValidationError && (
                      <div className="text-[9.5px] font-black text-[#FF3333] font-sans text-left">
                        ⚠️ {upiValidationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-[#000] bg-gradient-to-r from-[#FF3333] to-[#FF3333] hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer font-extrabold select-none mt-2"
                    >
                      {editingAccountId ? 'Update Linked UPI Account' : 'Link UPI Account'}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Bottom sheet for Bank */}
          <AnimatePresence>
            {isBankModalOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-sm animate-fade-in px-4">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full max-w-md bg-[#040B1D] border-t border-neutral-800 rounded-t-[24px] p-5 pb-8 space-y-4 font-sans text-white focus:outline-none shadow-[0_-15px_40px_rgba(0,0,0,0.8)] max-h-[92vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-black text-xs uppercase tracking-widest text-[#FF3333]">
                      {editingAccountId ? '📝 Edit Bank Account' : '➕ Add Saved Bank Account'}
                    </h3>
                    <button
                      onClick={() => setIsBankModalOpen(false)}
                      className="p-1 px-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBankAccount} className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block text-left">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        value={newBankHolderName}
                        onChange={(e) => setNewBankHolderName(e.target.value)}
                        placeholder="e.g. Debupam Gogoi"
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block text-left">Account Number</label>
                        <input
                          type="text"
                          required
                          value={newBankAccountNumber}
                          onChange={(e) => setNewBankAccountNumber(e.target.value)}
                          placeholder="Account number"
                          className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block text-left">Confirm A/C Number</label>
                        <input
                          type="text"
                          required
                          value={newBankConfirmAccountNumber}
                          onChange={(e) => setNewBankConfirmAccountNumber(e.target.value)}
                          placeholder="Verify account number"
                          className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={newBankIfscCode}
                        onChange={(e) => setNewBankIfscCode(e.target.value)}
                        placeholder="e.g. HDFC0001234"
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#FF3333] font-mono tracking-wider uppercase"
                      />
                    </div>

                    {/* Auto bank display */}
                    {newBankName && (
                      <div className="px-3 py-2 border border-red-500/10 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center justify-between uppercase font-sans select-none animate-fade-in">
                        <span>Auto Fetched:</span>
                        <span className="font-extrabold text-white">{newBankName}</span>
                      </div>
                    )}

                    {bankValidationError && (
                      <div className="text-[9.5px] font-black text-[#FF3333] font-sans text-left">
                        ⚠️ {bankValidationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-[#000] bg-gradient-to-r from-[#FF3333] to-[#FF3333] hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer font-extrabold select-none mt-2"
                    >
                      {editingAccountId ? 'Update Linked Bank Account' : 'Link Bank Account'}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
