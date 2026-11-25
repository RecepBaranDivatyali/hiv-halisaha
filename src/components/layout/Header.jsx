import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, RefreshCw, X, CheckCircle, Menu, UserX } from 'lucide-react';

export function Header({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onQuickAction,
  quickActionLabel,
  searchQuery = '',
  onSearchChange,
  onBackToPlayer,
  pendingProposals = [],
  pendingProposalsCount = 0,
  pendingDeletionsCount = 0,
  onNavigateToPitches,
  onNavigateToDeletions,
  onOpenMobileMenu,
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (val) => {
    if (onSearchChange) onSearchChange(val);
  };

  const totalPendingAlerts = pendingProposalsCount + pendingDeletionsCount;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-white/5 bg-[#070A10]/90 px-4 lg:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0 shrink">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Menüyü aç"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#12141C] text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-montserrat text-base sm:text-xl font-black uppercase tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden truncate text-xs font-medium text-white/50 sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Global Live Search Bar */}
      <div className="relative hidden flex-1 max-w-md mx-4 md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Yönetim panelinde ara (maç, kulüp, oyuncu, saha)..."
          value={searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-white/10 bg-[#12141C] pl-10 pr-9 text-xs font-medium text-white placeholder:text-white/40 focus:border-[#8eff71]/50 focus:outline-none focus:ring-1 focus:ring-[#8eff71]/40 transition"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            title="Aramayı Temizle"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Bekleyen Öneriler ve Talepler"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#12141C] text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white transition"
          >
            <Bell className="h-4 w-4" />
            {totalPendingAlerts > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff7351] px-1 text-[9px] font-black text-white shadow-[0_0_10px_rgba(255,115,81,0.5)]">
                {totalPendingAlerts}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0E1017] p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 px-2">
                <span className="text-xs font-bold text-white">
                  Bekleyen Öneriler ({pendingProposalsCount})
                </span>
                <span className="text-[10px] text-[#8eff71] font-semibold">Kullanıcı Katkısı</span>
              </div>

              <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5">
                {pendingProposalsCount === 0 ? (
                  <div className="py-6 text-center text-xs text-white/40 flex flex-col items-center">
                    <CheckCircle className="h-6 w-6 text-[#8eff71]/40 mb-1.5" />
                    <span>Bekleyen yeni saha önerisi yok</span>
                  </div>
                ) : (
                  pendingProposals.slice(0, 5).map((prop) => (
                    <button
                      type="button"
                      key={prop.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (onNavigateToPitches) onNavigateToPitches();
                      }}
                      className="w-full cursor-pointer rounded-xl p-2.5 bg-white/[0.02] hover:bg-white/5 transition flex flex-col gap-1 text-left border border-white/5"
                    >
                      <div className="flex w-full items-center justify-between text-xs font-bold text-[#8eff71]">
                        <span className="truncate">{prop.pitchName || 'Saha Önerisi'}</span>
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black text-amber-400">
                          Bekliyor
                        </span>
                      </div>
                      <div className="text-[11px] text-white/60">
                        {prop.userName || 'Kullanıcı'} tarafından bilgiler güncellendi
                      </div>
                    </button>
                  ))
                )}
              </div>

              {pendingProposalsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onNavigateToPitches) onNavigateToPitches();
                  }}
                  className="mt-2.5 w-full rounded-xl bg-[#8eff71]/10 py-2 text-center text-xs font-bold text-[#8eff71] hover:bg-[#8eff71]/20 transition"
                >
                  Tüm Saha Önerilerini İncele →
                </button>
              )}

              {pendingDeletionsCount > 0 && onNavigateToDeletions && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigateToDeletions();
                  }}
                  className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#ff7351]/25 bg-[#ff7351]/10 px-3 py-2 text-xs font-bold text-[#ff7351] hover:bg-[#ff7351]/20 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <UserX className="h-3.5 w-3.5" />
                    Hesap Silme Talepleri
                  </span>
                  <span className="rounded bg-[#ff7351] px-1.5 py-0.5 text-[10px] font-black text-white">
                    {pendingDeletionsCount}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Return to Player App Button */}
        {onBackToPlayer && (
          <button
            type="button"
            onClick={onBackToPlayer}
            className="hidden sm:flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-bold text-white hover:bg-[#8eff71]/10 hover:text-[#8eff71] hover:border-[#8eff71]/30 transition"
          >
            <span>📱 Mobil Uygulama</span>
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Verileri Yenile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-[#12141C] text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white transition"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#8eff71]' : ''}`} />
          </button>
        )}

        {/* Quick Action Button */}
        {onQuickAction && (
          <button
            type="button"
            onClick={onQuickAction}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8eff71] to-[#60e040] px-3 sm:px-4 text-xs font-extrabold uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">{quickActionLabel || 'Yeni Ekle'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
