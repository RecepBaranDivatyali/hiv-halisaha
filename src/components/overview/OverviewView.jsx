import React from 'react';
import { 
  Trophy, 
  Users, 
  Shield, 
  DollarSign, 
  ArrowUpRight, 
  MapPin, 
  Clock, 
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MetricCard } from '../layout/MetricCard';

export function OverviewView({ matches = [], users = [], clubs = [], pitches = [], onSelectMatch, onOpenCreateMatch }) {
  const activeMatches = matches.filter(m => m.status === 'open' || !m.status);
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalRevenue = matches.reduce((acc, m) => acc + (Number(m.totalFee) || Number(m.fee) * 14 || 2100), 0);
  const totalPlayersInMatches = matches.reduce((acc, m) => acc + (Number(m.joinedPlayersCount) || 1), 0);

  return (
    <div className="space-y-8 p-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-[#8eff71]/20 bg-gradient-to-r from-[#8eff71]/10 via-[#121620] to-[#0D1017] p-8 shadow-[0_0_50px_rgba(142,255,113,0.08)]">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8eff71]/30 bg-[#8eff71]/10 px-3 py-1 text-xs font-bold text-[#8eff71]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>H.İ.V. Halısaha Ekosistemi v2.4</span>
            </div>
            <h2 className="mt-3 font-montserrat text-3xl font-black tracking-tight text-white">
              Canlı Operasyon Kontrol Merkezi
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              Gerçek zamanlı maç organizasyonları, oyuncu güvenilirlik skorları ve kulüp lig sıralamasını tek panelden yönetin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateMatch}
              className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:scale-105 active:scale-95"
            >
              <Trophy className="h-4 w-4" />
              <span>Yeni Maç Aç</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Toplam Maç İlanı"
          value={matches.length || '0'}
          change={`${activeMatches.length} Aktif`}
          isPositive={true}
          icon={Trophy}
          subtitle="Açık ve tamamlanan maçlar"
          color="primary"
        />
        <MetricCard
          title="Kayıtlı Oyuncular"
          value={users.length || '0'}
          change="+12% bu hafta"
          isPositive={true}
          icon={Users}
          subtitle="Doğrulanmış sporcu profili"
          color="secondary"
        />
        <MetricCard
          title="Aktif Kulüpler"
          value={clubs.length || '0'}
          change="4 Lig Lideri"
          isPositive={true}
          icon={Shield}
          subtitle="Amatör ve elit takımlar"
          color="tertiary"
        />
        <MetricCard
          title="Tahmini Hacim"
          value={`₺${totalRevenue.toLocaleString('tr-TR')}`}
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
          subtitle="Toplam organize maç ücreti"
          color="warning"
        />
      </div>

      {/* Two Column Layout: Active Matches & Top Clubs */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Live & Upcoming Matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8eff71]/10 text-[#8eff71]">
                <Trophy className="h-4 w-4" />
              </div>
              <h3 className="font-montserrat text-lg font-black tracking-tight text-white">Canlı & Yaklaşan Maçlar</h3>
            </div>
            <span className="text-xs font-bold text-white/40">{matches.length} toplam maç</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Trophy className="h-12 w-12 text-white/20" />
                <p className="mt-3 text-sm font-bold text-white/60">Henüz yayınlanmış maç bulunmuyor</p>
                <p className="text-xs text-white/40">Firebase veritabanına yeni maçlar eklendiğinde burada listelenecektir.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {matches.slice(0, 5).map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch && onSelectMatch(match)}
                    className="flex cursor-pointer items-center justify-between p-5 transition hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#171A24] text-[#8eff71]">
                        <span className="font-montserrat text-sm font-black">{match.mode || '7v7'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{match.arena || 'Beşiktaş Arena'}</h4>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            match.status === 'completed'
                              ? 'bg-[#6e9bff]/20 text-[#6e9bff]'
                              : 'bg-[#8eff71]/20 text-[#8eff71]'
                          }`}>
                            {match.status === 'completed' ? 'Tamamlandı' : 'Kayıt Açık'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.city || 'İstanbul'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {match.dateTime || 'Bugün 21:00'}
                          </span>
                          <span className="font-semibold text-white/70">
                            {match.joinedPlayersCount || 1}/{match.totalRequiredPlayers || 14} Oyuncu
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-montserrat text-sm font-black text-[#8eff71]">₺{match.fee || 150}</div>
                        <div className="text-[10px] font-bold text-white/40">kişi başı</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-white/30" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Top Ranked Clubs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6e9bff]/10 text-[#6e9bff]">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="font-montserrat text-lg font-black tracking-tight text-white">Lig Sıralaması</h3>
            </div>
            <span className="text-xs font-bold text-[#6e9bff]">Top 4</span>
          </div>

          <div className="space-y-3">
            {clubs.slice(0, 4).map((club, idx) => (
              <div
                key={club.id || idx}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#12141C]/90 p-4 backdrop-blur-xl transition hover:border-white/10 hover:bg-[#161924]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-montserrat text-xs font-black ${
                    idx === 0
                      ? 'bg-[#8eff71]/20 text-[#8eff71] border border-[#8eff71]/30'
                      : idx === 1
                      ? 'bg-[#6e9bff]/20 text-[#6e9bff] border border-[#6e9bff]/30'
                      : 'bg-white/5 text-white/60'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{club.name}</h4>
                    <p className="text-[10px] text-white/40">{club.membersCount || 12} Üye • Seviye {club.level || 5}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-montserrat text-xs font-black text-[#8eff71]">{(club.points || 15000).toLocaleString('tr-TR')}</span>
                  <span className="block text-[9px] font-bold text-white/30">PUAN</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Pitch Status Box */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C]/90 p-5 backdrop-blur-xl">
            <h4 className="font-montserrat text-xs font-black uppercase tracking-wider text-white/70">Anlaşmalı Tesis Durumu</h4>
            <div className="mt-3 space-y-2">
              {pitches.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-white/80 font-medium">{p.name}</span>
                  <span className="font-bold text-[#8eff71]">★ {p.rating || 4.8}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
