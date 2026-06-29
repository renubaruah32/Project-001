import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, Users, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginGateProps {
  onLogin: (user: any, token: string) => void;
}

const PRESET_AVATARS = [
  { id: 'lady-vip', initials: 'CC', label: 'Cyber Crimson', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
  { id: 'agent', initials: 'HR', label: 'High Roller', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
  { id: 'boss', initials: 'LB', label: 'Lucky Boss', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
  { id: 'vip-gent', initials: 'SG', label: 'Sovereign Gold', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' }
];

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);

  // Register fields
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState<number>(0);
  const [inviteCode, setInviteCode] = useState<string>('TENZO_ROYAL_77');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      console.log("[LoginGate] Supabase is not configured. Falling back to local mock session authentication.");
      setTimeout(() => {
        setLoading(false);
        const username = email.trim().split('@')[0] || "Player";
        const mockUserId = "mock-" + username.toLowerCase() + "-" + Math.floor(1000 + Math.random() * 9000);
        const mockUserObj = {
          id: mockUserId,
          email: email.trim(),
          username: username,
          avatar: 'lady-vip',
          vip_level: 1,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        };
        const mockToken = `mock-token-${mockUserId}-${username}`;
        onLogin(mockUserObj, mockToken);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || email.trim().split('@')[0],
          avatar: data.user.user_metadata?.avatar || 'lady-vip',
          vip_level: 1,
          balance: 0,
          bonus_balance: 0,
          balance_version: 0
        };
        onLogin(userObj, data.session?.access_token || '');
      } else {
        setErrorMessage('Invalid user data returned from authentication.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Authentication error.');
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regEmail.trim() || !regUsername.trim() || !regPassword.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setErrorMessage('Nickname must be at least 3 characters.');
      return;
    }
    if (regPassword.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      console.log("[LoginGate] Supabase is not configured. Falling back to local mock registration.");
      setTimeout(() => {
        setLoading(false);
        const avatarId = PRESET_AVATARS[selectedAvatarIdx].id;
        const mockUserId = "mock-" + regUsername.trim().toLowerCase() + "-" + Math.floor(1000 + Math.random() * 9000);
        const mockUserObj = {
          id: mockUserId,
          email: regEmail.trim(),
          username: regUsername.trim(),
          avatar: avatarId,
          vip_level: 1,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        };
        const mockToken = `mock-token-${mockUserId}-${regUsername.trim()}`;
        onLogin(mockUserObj, mockToken);
      }, 500);
      return;
    }

    try {
      const avatarId = PRESET_AVATARS[selectedAvatarIdx].id;

      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword.trim(),
        options: {
          data: {
            username: regUsername.trim(),
            avatar: avatarId
          }
        }
      });

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          username: regUsername.trim(),
          avatar: avatarId,
          vip_level: 1,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        };
        onLogin(userObj, data.session?.access_token || '');
      } else {
        setErrorMessage('Failed to create account.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Registration error.');
    }
  };

  return (
    <div className="w-full max-w-[360px] mx-auto bg-[#0d1117]/95 border border-zinc-800 rounded-2xl shadow-xl p-6 relative font-sans text-white">
      {/* Mini close button is provided in App.tsx overlay */}

      {/* Brand Header */}
      <div className="text-center mb-6">
        <h2 className="font-sans font-bold text-xl tracking-wider uppercase text-zinc-100">
          TENZO 247
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Premium Gaming Outpost
        </p>
      </div>

      {/* Clean Tabs */}
      <div className="flex border-b border-zinc-800 mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setErrorMessage('');
          }}
          className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
            activeTab === 'login'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setErrorMessage('');
          }}
          className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center ${
            activeTab === 'register'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Output */}
      {errorMessage && (
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400">
            {errorMessage}
          </div>
          
          {errorMessage.toLowerCase().includes("confirm") && (
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-[11px] text-amber-300 space-y-2 leading-relaxed">
              <span className="font-bold uppercase tracking-wider block text-amber-200 text-[10px]">💡 How to bypass this error:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check your inbox/spam folder for a verification email.</li>
                <li>
                  <strong>To sign up instantly without verification:</strong> Go to your <span className="underline">Supabase Dashboard</span> &gt; <span className="font-semibold">Authentication</span> &gt; <span className="font-semibold">Providers</span> &gt; <span className="font-semibold">Email</span> and turn off <span className="font-bold text-red-400">"Confirm email"</span>.
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Forms switcher */}
      <AnimatePresence mode="wait">
        {activeTab === 'login' ? (
          <motion.form
            key="login-form"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onSubmit={handleLoginSubmit}
            className="space-y-4"
          >
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-9 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-[0_4px_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800/80"></div>
                <span className="flex-shrink mx-3 text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Or Skip Sign In</span>
                <div className="flex-grow border-t border-zinc-800/80"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const guestUser = {
                    id: "guest-player-777",
                    email: "guest@tenzo247.com",
                    username: "RoyalGuest",
                    avatar: "boss",
                    vip_level: 2,
                    balance: 10000,
                    bonus_balance: 500,
                    balance_version: 1
                  };
                  onLogin(guestUser, "guest-bypass-token");
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 active:scale-[0.98] transition-all text-[11px] font-bold text-zinc-100 uppercase tracking-wider cursor-pointer"
              >
                🕹️ Instant Play as Guest
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="register-form"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onSubmit={handleRegisterSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Nickname */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Nickname</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="PlayerNickname"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Password (min 6 chars)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Invite Code</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="TENZO_ROYAL_77"
                  className="w-full bg-[#161b22] border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-[#FF2E2E] placeholder-zinc-600 uppercase focus:outline-none focus:border-red-500 transition-colors font-semibold"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all text-xs font-bold text-white uppercase tracking-wider cursor-pointer shadow-[0_4px_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="text-[10px] text-zinc-600 text-center mt-6">
        Secure SHA-256 connection. Standard gaming bounds apply.
      </div>
    </div>
  );
}
