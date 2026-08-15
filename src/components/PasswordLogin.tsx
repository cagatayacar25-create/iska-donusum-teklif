import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

interface PasswordLoginProps {
  onSuccess: () => void;
  savedLogoUrl?: string;
}

export const PasswordLogin: React.FC<PasswordLoginProps> = ({ onSuccess, savedLogoUrl }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // You can set the default system password here or load from localStorage
  const getSystemPassword = () => {
    return localStorage.getItem('iska_system_password') || 'iska2026';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getSystemPassword();

    if (password === correctPassword) {
      setError(null);
      if (rememberMe) {
        localStorage.setItem('iska_auth_session', 'authenticated');
      } else {
        sessionStorage.setItem('iska_auth_session', 'authenticated');
      }
      onSuccess();
    } else {
      setError('Girdiğiniz şifre hatalı! Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Section */}
        <div className="bg-slate-900 p-8 text-center text-white relative border-b border-slate-800">
          <div className="mx-auto w-20 h-20 bg-slate-800 rounded-2xl p-2 flex items-center justify-center border border-slate-700/80 shadow-inner mb-4">
            {savedLogoUrl ? (
              <img src={savedLogoUrl} alt="İSKA Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center text-amber-400">
                <Building2 className="w-10 h-10" />
              </div>
            )}
          </div>

          <h1 className="text-xl font-black tracking-tight text-white">
            İSKA DÖNÜŞÜM YAPI LABORATUVARI
          </h1>
          <p className="text-xs text-amber-400 font-bold mt-1 tracking-wide uppercase">
            Riskli Bina & Performans Teklifi Modülü
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Sisteme Giriş Yapın
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Devam etmek için lütfen sistem erişim şifrenizi girin.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Sistem Şifresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Şifrenizi yazın..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Varsayılan sistem şifresi: <strong className="text-slate-700">iska2026</strong>
              </p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                Oturumu açık tut
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              Giriş Yap
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          Güvenli Teklif Oluşturma & Hesaplama Portalı © {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
};
