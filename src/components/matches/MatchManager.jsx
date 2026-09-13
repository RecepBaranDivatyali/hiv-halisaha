import React, { useState } from 'react';
import { Trophy, Plus, MapPin, Clock, Users, ArrowUpRight, Search, Filter } from 'lucide-react';
import { CreateMatchModal } from './CreateMatchModal';
import { MatchDetailModal } from './MatchDetailModal';

export function MatchManager({ matches = [], onRefresh, pitches = [] }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredMatches = matches.filter((m) => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'open' && (m.status === 'open' || !m.status)) ||
      (filterStatus === 'completed' && m.status === 'completed') ||
      (filterStatus === 'cancelled' && m.status === 'cancelled');

    const matchesSearch =
      !search ||
      m.arena?.toLowerCase().includes(search.toLowerCase()) ||
      m.city?.toLowerCase().includes(search.toLowerCase()) ||
      m.organizer?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 p-8">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">MAÇ YÖNETİMİ</h2>
          <p className="text-xs text-white/50">Halısaha maç ilanlarını inceleyin, oluşturun veya düzenleyin</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-5 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Maç Oluştur</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#12141C] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'open', label: 'Kayıt Açık' },
            { id: 'completed', label: 'Tamamlanan' },
            { id: 'cancelled', label: 'İptal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filterStatus === tab.id
                  ? 'bg-[#8eff71] text-[#064200]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Saha veya şehir ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full sm:w-64 rounded-xl border border-white/5 bg-[#171A24] pl-10 pr-4 text-xs font-medium text-white placeholder:text-white/40 focus:border-[#8eff71]/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Matches Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
        {filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="h-12 w-12 text-white/20" />
            <p className="mt-3 text-sm font-bold text-white/60">Kriterlere uygun maç bulunamadı</p>
            <p className="text-xs text-white/40">Filtreleri değiştirebilir veya yeni bir maç oluşturabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-6 py-4">Halısaha & Format</th>
                  <th className="px-6 py-4">Tarih / Saat</th>
                  <th className="px-6 py-4">Şehir / İlçe</th>
                  <th className="px-6 py-4">Doluluk</th>
                  <th className="px-6 py-4">Ücret</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İncele</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMatches.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className="cursor-pointer transition hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{m.arena || 'Beşiktaş Arena'}</div>
                      <div className="text-[10px] text-[#8eff71] font-semibold">{m.mode || '7v7'}</div>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-white/40" />
                        {m.dateTime || 'Bugün 21:00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-white/40" />
                        {m.city || 'İstanbul'} / {m.district || 'Beşiktaş'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {m.joinedPlayersCount || 1}/{m.totalRequiredPlayers || 14}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#8eff71]"
                            style={{
                              width: `${Math.min(
                                100,
                                ((m.joinedPlayersCount || 1) / (m.totalRequiredPlayers || 14)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#8eff71]">₺{m.fee || 150}</div>
                      <div className="text-[10px] text-white/40">Kişi başı</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          m.status === 'completed'
                            ? 'bg-[#6e9bff]/20 text-[#6e9bff]'
                            : m.status === 'cancelled'
                            ? 'bg-[#ff7351]/20 text-[#ff7351]'
                            : 'bg-[#8eff71]/20 text-[#8eff71]'
                        }`}
                      >
                        {m.status === 'completed'
                          ? 'Tamamlandı'
                          : m.status === 'cancelled'
                          ? 'İptal'
                          : 'Kayıt Açık'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onRefresh}
        pitches={pitches}
      />

      <MatchDetailModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onUpdate={onRefresh}
      />
    </div>
  );
}
