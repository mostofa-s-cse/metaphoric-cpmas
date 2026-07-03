'use client';

/**
 * CPMAS — Login Page
 * Powered by React Hook Form + Zod validation + RTK Query login mutation.
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ShieldAlert, HardHat, Eye, EyeOff, Lock, Mail, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormValues } from '@/lib/schemas';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@cpmas.com', color: 'text-amber-400 border-amber-500/20 hover:border-amber-500/40' },
  { label: 'Admin', email: 'admin@cpmas.com', color: 'text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40' },
  { label: 'Accountant', email: 'accountant@cpmas.com', color: 'text-green-400 border-green-500/20 hover:border-green-500/40' },
  { label: 'Project Manager', email: 'pm@cpmas.com', color: 'text-blue-400 border-blue-500/20 hover:border-blue-500/40' },
];

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    const result = await login(values.email, values.password);
    if (result.success) {
      setIsRedirecting(true);
    } else {
      setServerError(result.error || 'Invalid credentials');
    }
  };

  const handleQuickSelect = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setServerError('');
  };

  const isBusy = isLoggingIn || isSubmitting || isRedirecting;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Full-screen Redirecting Loader */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 border-t-2 border-cyan-400 border-solid rounded-full animate-spin"></div>
            <div className="absolute w-20 h-20 border-r-2 border-blue-500 border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <HardHat className="h-10 w-10 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse tracking-widest">
            PREPARING WORKSPACE...
          </h2>
          <p className="text-slate-400 text-sm mt-2">Loading your dashboard</p>
        </div>
      )}

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 hover:border-slate-700/60 transition-colors">
          {/* Branding */}
          <Link href="/" className="flex flex-col items-center mb-8 group cursor-pointer">
            <div className="h-14 w-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform">
              <HardHat className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight group-hover:opacity-80 transition-opacity">
              Metaphoric Architect
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 text-center font-medium">
              Construction Project Management &amp; Accounting System
            </p>
          </Link>

          {/* Server Error */}
          {serverError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm flex items-center gap-2 mb-6 animate-in slide-in-from-top duration-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@cpmas.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none text-sm transition-all ${
                    errors.email
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-rose-400 text-[11px] mt-1.5 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none text-sm transition-all ${
                    errors.password
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-400 text-[11px] mt-1.5 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isBusy}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isRedirecting ? 'Redirecting...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider text-center mb-3">
              Demo Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickSelect(account.email)}
                  className={`py-2 px-3 rounded-lg bg-slate-950/40 border text-xs font-semibold transition-all cursor-pointer hover:bg-slate-950/80 ${account.color}`}
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="text-center text-slate-600 text-[10px] mt-3">
              All demo accounts use password:{' '}
              <code className="text-slate-400 font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
