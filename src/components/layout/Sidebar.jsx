import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Shield,
  MapPin,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export function Sidebar({
  activeTab,
  setActiveTab,
  counts = {},
  adminUser,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard, count: null, alertCount: 0 },
    { id: 'matches', label: 'Maç Yönetimi', icon: Trophy, count: counts.matches || 0, alertCount: 0 },
    {
      id: 'users',
      label: 'Oyuncular & Üyeler',
      icon: Users,
      count: counts.users || 0,
      alertCount: counts.pendingDeletions || 0,
    },
    { id: 'clubs', label: 'Kulüpler & Lig', icon: Shield, count: counts.clubs || 0, alertCount: 0 },
    {
      id: 'pitches',
      label: 'Halısahalar & Tesisler',
      icon: MapPin,
      count: counts.pitches || 0,
      alertCount: counts.pendingProposals || 0,
    },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings, count: null, alertCount: 0 },
  ];

  const adminEmail = adminUser?.email || 'Yönetici';
  const adminInitials = adminEmail.substring(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="flex h-full w-72 flex-col border-r border-white/5 bg-[#0A0C13] p-5">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#8eff71]/30 bg-[#8eff71]/10 shadow-[0_0_20px_rgba(142,255,113,0.15)]">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="H.İ.V."
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-montserrat text-lg font-black tracking-tight text-white">
                H.İ.V. ADMIN
              </span>
              <span className="rounded bg-[#8eff71]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#8eff71]">
                v2.4
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Halısaha Kontrol Paneli
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto pr-1">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/30">
          Modüller
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'border border-[#8eff71]/20 bg-[#8eff71]/10 text-[#8eff71] shadow-[0_0_20px_rgba(142,255,113,0.08)]'
                  : 'text-white/60 hover:border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition ${
                    isActive ? 'text-[#8eff71]' : 'text-white/40 group-hover:text-white/70'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.alertCount > 0 && (
                  <span
                    title="Bekleyen talep / öneri"
                    className="rounded-full bg-[#ff7351] px-1.5 py-0.5 text-[10px] font-black text-white"
                  >
                    {item.alertCount}
                  </span>
                )}
                {item.count !== null && (
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-black ${
                      isActive ? 'bg-[#8eff71]/20 text-[#8eff71]' : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Footer — Dynamic from Firebase Auth */}
      <div className="mt-auto border-t border-white/5 pt-4 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-[#12141C] p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#8eff71]/30 bg-[#1e2330] text-xs font-black text-[#8eff71]">
              {adminInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-white">
                {adminUser?.displayName || 'Yönetici'}
              </div>
              <div className="truncate text-[10px] text-white/40">{adminEmail}</div>
            </div>
          </div>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Çıkış Yap"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-white/50 hover:bg-[#ff7351]/10 hover:text-[#ff7351] transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Oturumu Kapat</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden h-screen shrink-0 lg:flex">{sidebarContent}</aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
