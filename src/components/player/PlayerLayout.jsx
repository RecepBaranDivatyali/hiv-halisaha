import React, { useState } from 'react';
import { 
  Home, 
  Trophy, 
  Shield, 
  MapPin, 
  User, 
  Plus, 
  Smartphone, 
  Monitor, 
  Lock, 
  Activity, 
  Search,
  Bell,
  SlidersHorizontal
} from 'lucide-react';
import { usePlayerAuth } from '../../context/PlayerAuthContext';

export function PlayerLayout({ 
  activeTab, 
  setActiveTab, 
  children, 
  onOpenCreateMatch,
  onOpenAdminPanel,
  isSimulatorMode,
  onToggleSimulator
}) {
  const { currentUser, switchPlayer, availableDemoPlayers } = usePlayerAuth();
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'matches', label: 'Maçlar', icon: Trophy },
    { id: 'clubs', label: 'Kulüpler', icon: Shield },
    { id: 'pitches', label: 'Tesisler', icon: MapPin },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#070A10] text-white">
      {/* ─── DESKTOP TOP NAVIGATION HEADER (Only visible on wide screen when not in simulator) ─── */}
      <header className={`${isSimulatorMode ? 'hidden' : 'hidden md:flex'} h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A0C13]/90 px-6 backdrop-blur-xl z-30`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#8eff71]/30 bg-[#8eff71]/10 shadow-[0_0_20px_rgba(142,255,113,0.2)]">
            <span className="font-montserrat text-lg font-black italic text-[#8eff71]">H</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-montserrat text-base font-black tracking-tight text-white">H.İ.V.</span>
              <span className="rounded-md bg-[#8eff71]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#8eff71]">WEB APP</span>
            </div>
            <p className="text-[10px] text-white/40">Halısahaya İhtiyacım Var</p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-2xl border border-white/5 bg-[#12141C] p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#8eff71] text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Quick Create Match Button */}
          <button
            onClick={onOpenCreateMatch}
            className="flex items-center gap-1.5 rounded-xl bg-[#8eff71] px-3.5 py-2 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Maç Aç</span>
          </button>

          {/* Simulator Toggle Button */}
          <button
            onClick={onToggleSimulator}
            title="Mobil Cihaz Görünümüne Geç"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 hover:bg-[#8eff71]/10 hover:text-[#8eff71] hover:border-[#8eff71]/30 transition"
          >
            <Smartphone className="h-4 w-4 text-[#8eff71]" />
            <span className="hidden lg:inline">Mobil Önizleme</span>
          </button>

          {/* Switch Demo Player Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDemoSwitcherOpen(!isDemoSwitcherOpen)}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#12141C] p-1.5 pr-3 hover:border-white/20 transition"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-[#8eff71]/30"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                <p className="text-[9px] text-[#8eff71] font-semibold">{currentUser.position}</p>
              </div>
            </button>

            {isDemoSwitcherOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/10 bg-[#12141C] p-2 shadow-2xl backdrop-blur-xl">
                <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white/40">
                  Oyuncu Değiştir (Test)
                </p>
                {availableDemoPlayers.map((p, idx) => (
                  <button
                    key={p.uid}
                    onClick={() => {
                      switchPlayer(idx);
                      setIsDemoSwitcherOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                      currentUser.uid === p.uid
                        ? 'bg-[#8eff71]/15 text-[#8eff71]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <img src={p.avatar} alt={p.name} className="h-6 w-6 rounded-md object-cover" />
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] opacity-60">{p.position}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin Panel Shortcut */}
          <button
            onClick={onOpenAdminPanel}
            title="Yönetici Paneline Geç"
            className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-2 text-white/50 hover:bg-[#ff7351]/10 hover:text-[#ff7351] hover:border-[#ff7351]/30 transition"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE TOP HEADER (Visible on small screen or inside simulator) ─── */}
      <div className={`${isSimulatorMode ? 'flex' : 'flex md:hidden'} h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A0C13]/90 px-4 backdrop-blur-xl z-20`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#8eff71]/30 bg-[#8eff71]/10 shadow-[0_0_15px_rgba(142,255,113,0.2)]">
            <span className="font-montserrat text-sm font-black italic text-[#8eff71]">H</span>
          </div>
          <div>
            <span className="font-montserrat text-sm font-black text-white">H.İ.V.</span>
            <span className="ml-1.5 rounded bg-[#8eff71]/20 px-1 py-0.2 text-[8px] font-extrabold text-[#8eff71]">CANLI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSimulatorMode && (
            <button
              onClick={onToggleSimulator}
              title="Masaüstü / Simülatör Geçişi"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60"
            >
              <Smartphone className="h-4 w-4 text-[#8eff71]" />
            </button>
          )}

          <button
            onClick={onOpenCreateMatch}
            className="flex h-8 items-center gap-1 rounded-lg bg-[#8eff71] px-2.5 text-[11px] font-black uppercase text-[#064200] shadow-[0_0_15px_rgba(142,255,113,0.2)]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Maç</span>
          </button>

          <button
            onClick={onOpenAdminPanel}
            title="Yönetim"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT VIEWPORT ─── */}
      <main className="flex-1 overflow-y-auto bg-[#070A10]">
        {children}
      </main>

      {/* ─── MOBILE BOTTOM TAB BAR (Visible on small screen or inside simulator) ─── */}
      <nav className={`${isSimulatorMode ? 'flex' : 'flex md:hidden'} h-16 shrink-0 items-center justify-around border-t border-white/5 bg-[#0D0F17]/95 px-2 backdrop-blur-2xl z-30`}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition ${
                isActive ? 'text-[#8eff71]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(142,255,113,0.5)]' : ''} transition`} />
              <span className={`text-[10px] font-extrabold tracking-tight ${isActive ? 'text-[#8eff71]' : 'text-white/40'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
