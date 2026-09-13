import React from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Shield, 
  MapPin, 
  Settings, 
  Activity,
  LogOut,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, counts = {}, adminUser, onLogout }) {
  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard, count: null },
    { id: 'matches', label: 'Maç Yönetimi', icon: Trophy, count: counts.matches || 0 },
    { id: 'users', label: 'Oyuncular & Üyeler', icon: Users, count: counts.users || 0 },
    { id: 'clubs', label: 'Kulüpler & Lig', icon: Shield, count: counts.clubs || 0 },
    { id: 'pitches', label: 'Halısahalar & Tesisler', icon: MapPin, count: counts.pitches || 0 },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings, count: null },
  ];

  const adminEmail = adminUser?.email || 'admin@hivhalisaha.com';
  const adminInitials = adminEmail.substring(0, 2).toUpperCase();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-white/5 bg-[#0A0C13] p-5">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#8eff71]/30 bg-[#8eff71]/10 shadow-[0_0_20px_rgba(142,255,113,0.15)]">
          <span className="font-montserrat text-xl font-black italic text-[#8eff71]">H</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-montserrat text-lg font-black tracking-tight text-white">H.İ.V. ADMIN</span>
            <span className="rounded bg-[#8eff71]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#8eff71]">v2.4</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Halısaha Kontrol Paneli</p>
        </div>
      </div>

      {/* Live System Status Indicator */}
      <div className="my-5 flex items-center justify-between rounded-xl border border-white/5 bg-[#12141C] p-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8eff71] opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8eff71]"></span>
          </span>
          <span className="text-xs font-bold text-white/80">Firebase Canlı Veri</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase text-[#8eff71]">Aktif</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/30">
          Modüller
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'border border-[#8eff71]/20 bg-[#8eff71]/10 text-[#8eff71] shadow-[0_0_20px_rgba(142,255,113,0.08)]'
                  : 'text-white/60 hover:border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 transition ${isActive ? 'text-[#8eff71]' : 'text-white/40 group-hover:text-white/70'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== null && (
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-black ${
                    isActive ? 'bg-[#8eff71]/20 text-[#8eff71]' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Footer — Dynamic from Firebase Auth */}
      <div className="mt-auto border-t border-white/5 pt-4 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-[#12141C] p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-[#8eff71]/30 bg-[#1e2330] flex items-center justify-center font-black text-[#8eff71] text-xs">
              {adminInitials}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{adminUser?.displayName || 'Admin'}</div>
              <div className="text-[10px] text-white/40 truncate max-w-[140px]">{adminEmail}</div>
            </div>
          </div>
          <span className="inline-block h-2 w-2 rounded-full bg-[#8eff71]"></span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            aria-label="Çıkış Yap"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-white/50 hover:bg-[#ff7351]/10 hover:text-[#ff7351] transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Oturumu Kapat</span>
          </button>
        )}
      </div>
    </aside>
  );
}
