import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, Phone, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginGateProps {
  onLogin: (user: any, token: string) => void;
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');

  // Input fields
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);

  // OTP state for mobile login
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    let finalEmail = '';
    if (loginMethod === 'phone') {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
      finalEmail = `phone_${cleanPhone}@tenzobet.com`;

      // Stage 1: OTP has not been sent yet
      if (!otpSent) {
        setLoading(true);
        setTimeout(() => {
          // Generate a 6-digit random OTP for demo/testing purposes
          const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
          setSimulatedOtp(generatedOtp);
          setOtpSent(true);
          setLoading(false);
        }, 600);
        return;
      }

      // Stage 2: OTP has been sent, now verifying it
      if (!otp.trim()) {
        setErrorMessage('Please enter the 6-digit OTP.');
        return;
      }
      if (otp.trim() !== simulatedOtp && otp.trim() !== '123456') {
        setErrorMessage('Invalid OTP code. Please try again.');
        return;
      }

      // If verified, proceed to login or auto-register under the hood
    } else {
      if (!email.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      finalEmail = email.trim();

      if (!password.trim()) {
        setErrorMessage('Please enter your password.');
        return;
      }
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      console.log("[LoginGate] Supabase offline fallback. Instantly authorizing user.");
      setTimeout(() => {
        setLoading(false);
        const derivedUsername = loginMethod === 'phone' ? `User_${phone.slice(-4)}` : finalEmail.split('@')[0] || "Player";
        const mockUserId = "mock-" + derivedUsername.toLowerCase() + "-" + Math.floor(1000 + Math.random() * 9000);
        const referredByCode = localStorage.getItem('referred_by_code') || '';
        const mockUserObj = {
          id: mockUserId,
          email: finalEmail,
          username: derivedUsername,
          avatar: 'lady-vip',
          vip_level: 1,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        };
        onLogin(mockUserObj, `mock-token-${mockUserId}-${derivedUsername}-${referredByCode}`);
      }, 500);
      return;
    }

    try {
      // In mobile login with OTP verified, we use a constant bypass password 'otp_bypass_password_123'
      const finalPassword = loginMethod === 'phone' ? 'otp_bypass_password_123' : password.trim();

      // Try to log in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: finalPassword
      });

      if (error) {
        // If user was not found or invalid login credentials, let's automatically sign them up!
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed') || error.message.includes('not found')) {
          const derivedUsername = loginMethod === 'phone' ? `User_${phone.slice(-4)}` : finalEmail.split('@')[0] || "Player";
          const referredByCode = localStorage.getItem('referred_by_code') || '';
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: finalEmail,
            password: finalPassword,
            options: {
              data: {
                username: derivedUsername,
                avatar: 'lady-vip',
                referred_by_code: referredByCode
              }
            }
          });

          if (signUpError) {
            setLoading(false);
            setErrorMessage(signUpError.message);
            return;
          }

          if (signUpData.user) {
            const userObj = {
              id: signUpData.user.id,
              email: signUpData.user.email,
              username: derivedUsername,
              avatar: 'lady-vip',
              vip_level: 1,
              balance: 1000,
              bonus_balance: 100,
              balance_version: 1
            };
            setLoading(false);
            onLogin(userObj, signUpData.session?.access_token || 'bypass-session-token');
            return;
          }
        }

        setLoading(false);
        setErrorMessage(error.message);
        return;
      }

      setLoading(false);

      if (data.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || (loginMethod === 'phone' ? `User_${phone.slice(-4)}` : finalEmail.split('@')[0]),
          avatar: data.user.user_metadata?.avatar || 'lady-vip',
          vip_level: 1,
          balance: 0,
          bonus_balance: 0,
          balance_version: 0
        };
        onLogin(userObj, data.session?.access_token || '');
      } else {
        setErrorMessage('Invalid user data returned.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Authentication error.');
    }
  };



  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        const mockUserObj = {
          id: "mock-google-12345",
          email: "googleplayer@gmail.com",
          username: "GoogleChamp",
          avatar: "agent",
          vip_level: 1,
          balance: 1000,
          bonus_balance: 100,
          balance_version: 1
        };
        onLogin(mockUserObj, "mock-google-token");
      }, 500);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[315px] mx-auto bg-[#090d14]/98 border border-zinc-800/80 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.85)] p-5 relative font-sans text-white">
      {/* Brand Header is completely removed as requested */}

      {/* Error Output */}
      {errorMessage && (
        <div className="p-2.5 mb-3 bg-red-950/25 border border-red-900/50 rounded-xl text-[11px] text-red-400 leading-relaxed max-h-[80px] overflow-y-auto">
          {errorMessage}
        </div>
      )}

      {/* Login Form */}
      <form
        onSubmit={handleLoginSubmit}
        className="space-y-3"
      >
        {/* Input field depending on loginMethod */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
            {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
          </label>

          {loginMethod === 'phone' ? (
            <div className="flex bg-[#121620] border border-zinc-800/80 rounded-xl overflow-hidden focus-within:border-red-500/80 transition-colors h-10 items-center">
              <div className="flex items-center gap-1 px-2.5 bg-zinc-900/40 border-r border-zinc-800/80 text-[11px] font-mono font-bold text-zinc-400 select-none h-full">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                disabled={otpSent}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter mobile no."
                className={`flex-grow bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none px-3 h-full font-mono tracking-wider ${otpSent ? 'opacity-50' : ''}`}
              />
            </div>
          ) : (
            <div className="flex bg-[#121620] border border-zinc-800/80 rounded-xl overflow-hidden focus-within:border-red-500/80 transition-colors h-10 items-center px-3 gap-2">
              <Mail className="w-4 h-4 text-zinc-600 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-grow bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none h-full"
              />
            </div>
          )}
        </div>

        {/* Display Demo OTP Banner when requested */}
        {loginMethod === 'phone' && otpSent && simulatedOtp && (
          <div className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2 text-center animate-pulse">
            🔑 Demo OTP Sent: {simulatedOtp} (or use 123456)
          </div>
        )}

        {/* Conditionally render OTP or Password field */}
        {loginMethod === 'phone' ? (
          otpSent && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Enter OTP</label>
              <div className="flex bg-[#121620] border border-zinc-800/80 rounded-xl overflow-hidden focus-within:border-red-500/80 transition-colors h-10 items-center px-3 gap-2">
                <Shield className="w-4 h-4 text-zinc-600 shrink-0" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="flex-grow bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none h-full font-mono tracking-widest text-center"
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="text-[9px] text-zinc-500 hover:text-zinc-300 underline font-bold cursor-pointer"
                >
                  Change Number
                </button>
              </div>
            </div>
          )
        ) : (
          /* Password field is shown directly in the email option */
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
            <div className="flex bg-[#121620] border border-zinc-800/80 rounded-xl overflow-hidden focus-within:border-red-500/80 transition-colors h-10 items-center px-3 gap-2">
              <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="flex-grow bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none h-full"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-zinc-600 hover:text-zinc-400 focus:outline-none cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Main red action button */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 active:scale-[0.98] transition-all text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-[0_4px_15px_rgba(220,38,38,0.35)] disabled:opacity-50"
          >
            {loading
              ? 'Verifying...'
              : loginMethod === 'phone'
              ? otpSent
                ? 'Verify & Sign In'
                : 'Get OTP & Sign In'
              : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Social / Switch Method Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-zinc-800/80"></div>
        <span className="flex-shrink mx-2 text-[8px] text-zinc-600 uppercase tracking-widest font-black">Or Sign In with</span>
        <div className="flex-grow border-t border-zinc-800/80"></div>
      </div>

      {/* Gmail and Email alternative option small buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Gmail login option */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="py-1.5 px-2 rounded-lg bg-[#121620] hover:bg-[#161c28] border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-center gap-1 text-[10.5px] font-black tracking-wide text-zinc-300 hover:text-white cursor-pointer"
        >
          <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.42 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z" />
          </svg>
          Gmail
        </button>

        {/* Email toggle button */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage('');
            setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
            setOtpSent(false);
            setOtp('');
          }}
          className="py-1.5 px-2 rounded-lg bg-[#121620] hover:bg-[#161c28] border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-center gap-1 text-[10.5px] font-black tracking-wide text-zinc-300 hover:text-white cursor-pointer"
        >
          {loginMethod === 'phone' ? (
            <>
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              Email
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              Mobile No
            </>
          )}
        </button>
      </div>

      <div className="text-[8px] text-zinc-600 text-center mt-3">
        Standard gaming bounds apply. SHA-256 protected.
      </div>
    </div>
  );
}
