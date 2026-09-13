import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Lock, Mail, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

export function AdminLoginPage({ onLoginSuccess, onBackToPlayer }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre alanları boş bırakılamaz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (onLoginSuccess) onLoginSuccess(credential.user);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.');
      } else if (code === 'auth/too-many-requests') {
        setError('Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.');
      } else if (code === 'auth/invalid-email') {
        setError('Geçersiz e-posta formatı.');
      } else {
        setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#070A10] p-4">
      {/* Background Grid Effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(142,255,113,0.03)_0%,_transparent_70%)]" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#8eff71]/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#8eff71]/20 bg-[#8eff71]/10 shadow-[0_0_40px_rgba(142,255,113,0.1)]">
            <Shield className="h-8 w-8 text-[#8eff71]" />
          </div>
          <h1 className="font-montserrat text-3xl font-black tracking-tight text-white">
            H.İ.V. <span className="text-[#8eff71]">ADMIN</span>
          </h1>
          <p className="mt-1 text-xs text-white/40">Web Yönetim Paneli — Yetkili Girişi</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/5 bg-[#0E1017]/90 p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-[#ff7351]/30 bg-[#ff7351]/10 p-3 text-xs font-semibold text-[#ff7351]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/50">
                Admin E-Posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hivhalisaha.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] py-3 pl-10 pr-4 text-sm font-medium text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none focus:ring-1 focus:ring-[#8eff71]/20 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/50">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] py-3 pl-10 pr-12 text-sm font-medium text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none focus:ring-1 focus:ring-[#8eff71]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#8eff71] py-3.5 text-sm font-black uppercase tracking-wider text-[#064200] shadow-[0_0_30px_rgba(142,255,113,0.25)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Doğrulanıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-white/5 pt-4 text-center space-y-3">
            {onBackToPlayer && (
              <button
                type="button"
                onClick={onBackToPlayer}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                ← Oyuncu Portalı'na Geri Dön
              </button>
            )}
            <p className="text-[10px] text-white/30">
              Bu panel yalnızca yetkili yöneticiler içindir.
              <br />
              Tüm işlemler kayıt altına alınmaktadır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
