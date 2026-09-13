import React from 'react';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Zap, 
  Plus, 
  Flame, 
  Star, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { MatchCountdownCard } from './MatchCountdownCard';
import { MatchCard } from '../matches/MatchCard';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function HomeView({ 
  matches = [], 
  clubs = [], 
  pitches = [], 
  onSelectMatch, 
  onOpenCreateMatch,
  setActiveTab 
}) {
  const { currentUser } = usePlayerAuth();

  // Find nearest upcoming match for countdown
  const upcomingMatch = matches[0] || null;
  const activeMatches = matches.slice(0, 4);
  const topClubs = clubs.slice(0, 3);

  const winRate = currentUser.matchesPlayed > 0 
    ? Math.round((currentUser.wins / currentUser.matchesPlayed) * 100) 
    : 75;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── HERO PLAYER PROFILE SUMMARY BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0E111A] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#8eff71]/40 shadow-[0_0_20px_rgba(142,255,113,0.2)]"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-[#8eff71] text-[10px] font-black text-[#064200]">
                Lv{currentUser.level}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-montserrat text-xl sm:text-2xl font-black text-white">
                  Hoş Geldin, {currentUser.name}
                </h1>
                <span className="rounded-md bg-[#8eff71]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#8eff71]">
                  {currentUser.position}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                {currentUser.clubName} • {currentUser.city}, {currentUser.district}
              </p>
            </div>
          </div>

          {/* Player Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <div className="rounded-2xl border border-white/5 bg-[#141824] px-3.5 py-2 text-center">
              <span className="text-[10px] font-bold text-white/40 block">GÜVEN SKORU</span>
              <span className="font-montserrat text-sm sm:text-base font-black text-[#8eff71]">
                %{currentUser.trustScore}
              </span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#141824] px-3.5 py-2 text-center">
              <span className="text-[10px] font-bold text-white/40 block">PUAN</span>
              <span className="font-montserrat text-sm sm:text-base font-black text-[#6e9bff]">
                ★ {currentUser.rating}
              </span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#141824] px-3.5 py-2 text-center">
              <span className="text-[10px] font-bold text-white/40 block">GALİBİYET</span>
              <span className="font-montserrat text-sm sm:text-base font-black text-white">
                %{winRate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── UPCOMING LIVE MATCH COUNTDOWN ─── */}
      <MatchCountdownCard 
        match={upcomingMatch} 
        onOpenMatchRoom={(m) => onSelectMatch(m)} 
      />

      {/* ─── QUICK ACTION SHORTCUTS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenCreateMatch}
          className="group flex flex-col items-start rounded-2xl border border-[#8eff71]/20 bg-[#8eff71]/10 p-4 text-left transition hover:bg-[#8eff71]/15 hover:border-[#8eff71]/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71] text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] mb-3">
            <Plus className="h-5 w-5 stroke-[3]" />
          </div>
          <span className="font-montserrat text-xs font-black text-white">YENİ MAÇ AÇ</span>
          <span className="text-[10px] text-white/50 mt-0.5">Kendi maçını kur, kadronu topla</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className="group flex flex-col items-start rounded-2xl border border-white/5 bg-[#121520] p-4 text-left transition hover:border-white/20 hover:bg-[#161a28]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6e9bff]/15 text-[#6e9bff] mb-3">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="font-montserrat text-xs font-black text-white">MAÇLARA KATIL</span>
          <span className="text-[10px] text-white/50 mt-0.5">{matches.length} aktif maç seni bekliyor</span>
        </button>

        <button
          onClick={() => setActiveTab('clubs')}
          className="group flex flex-col items-start rounded-2xl border border-white/5 bg-[#121520] p-4 text-left transition hover:border-white/20 hover:bg-[#161a28]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7351]/15 text-[#ff7351] mb-3">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-montserrat text-xs font-black text-white">KULÜPLER & LİG</span>
          <span className="text-[10px] text-white/50 mt-0.5">Takım kur, lig sıralamasında yüksel</span>
        </button>

        <button
          onClick={() => setActiveTab('pitches')}
          className="group flex flex-col items-start rounded-2xl border border-white/5 bg-[#121520] p-4 text-left transition hover:border-white/20 hover:bg-[#161a28]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#88f6ff]/15 text-[#88f6ff] mb-3">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="font-montserrat text-xs font-black text-white">HALISAHA BUL</span>
          <span className="text-[10px] text-white/50 mt-0.5">Şehrindeki en iyi sahaları incele</span>
        </button>
      </div>

      {/* ─── ACTIVE MATCHES FEED ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-montserrat text-lg font-black text-white">Canlı Halısaha Maçları</h2>
            <p className="text-xs text-white/40">Eksik mevkisi olan güncel maç ilanları</p>
          </div>
          <button
            onClick={() => setActiveTab('matches')}
            className="flex items-center gap-1 text-xs font-bold text-[#8eff71] hover:underline"
          >
            <span>Tümünü Gör ({matches.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeMatches.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#121520] p-8 text-center">
            <p className="text-sm font-bold text-white/70">Henüz açık maç ilanı bulunmuyor.</p>
            <p className="text-xs text-white/40 mt-1">İlk maçı sen açarak arkadaşlarını davet et!</p>
            <button
              onClick={onOpenCreateMatch}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#8eff71] px-4 py-2 text-xs font-black uppercase text-[#064200]"
            >
              <Plus className="h-4 w-4" />
              <span>Maç Oluştur</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMatches.map(m => (
              <MatchCard 
                key={m.id} 
                match={m} 
                onSelectMatch={onSelectMatch} 
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── TOP CLUBS PREVIEW ─── */}
      {topClubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-montserrat text-base font-black text-white">Zirvedeki Kulüpler</h2>
              <p className="text-xs text-white/40">Bu ayın en yüksek puanlı takımları</p>
            </div>
            <button
              onClick={() => setActiveTab('clubs')}
              className="flex items-center gap-1 text-xs font-bold text-white/60 hover:text-white"
            >
              <span>Lig Tablosu</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topClubs.map((club, idx) => (
              <div 
                key={club.id} 
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#10131C] p-3.5 hover:border-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-montserrat text-xs font-black ${
                    idx === 0 ? 'bg-[#8eff71] text-[#064200]' : 'bg-white/10 text-white'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-montserrat text-xs font-bold text-white leading-tight">{club.name}</h4>
                    <span className="text-[10px] text-white/40">{club.membersCount || 1} Üye • Lv{club.level || 1}</span>
                  </div>
                </div>
                <span className="font-montserrat text-xs font-black text-[#8eff71]">
                  {club.points || 1000} P
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
