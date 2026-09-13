import React from 'react';
import { Search, Bell, Plus, RefreshCw } from 'lucide-react';

export function Header({ title, subtitle, onRefresh, isRefreshing, onQuickAction, quickActionLabel, searchQuery, setSearchQuery, onBackToPlayer }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-[#070A10]/90 px-8 backdrop-blur-xl">
      <div>
        <h1 className="font-montserrat text-xl font-black uppercase tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs font-medium text-white/50">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Return to Player App Button */}
        {onBackToPlayer && (
          <button
            onClick={onBackToPlayer}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-bold text-white hover:bg-[#8eff71]/10 hover:text-[#8eff71] hover:border-[#8eff71]/30 transition"
          >
            <span>← Oyuncu Portalı</span>
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
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
            onClick={onQuickAction}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8eff71] to-[#60e040] px-4 text-xs font-extrabold uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>{quickActionLabel || 'Yeni Ekle'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
