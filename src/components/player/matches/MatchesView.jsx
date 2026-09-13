import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Calendar, MapPin, Trophy, Users, X } from 'lucide-react';
import { MatchCard } from './MatchCard';

export function MatchesView({ matches = [], onSelectMatch, onOpenCreateMatch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tümü');
  const [selectedMode, setSelectedMode] = useState('Tümü');
  const [onlyOpen, setOnlyOpen] = useState(true);

  const cities = ['Tümü', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
  const modes = ['Tümü', '6v6', '7v7', '8v8'];

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchText = `${m.arena} ${m.city} ${m.district} ${m.organizer}`.toLowerCase();
      if (query && !matchText.includes(query)) return false;

      // City filter
      if (selectedCity !== 'Tümü' && m.city !== selectedCity) return false;

      // Mode filter
      if (selectedMode !== 'Tümü' && m.mode !== selectedMode) return false;

      // Only open (empty slots available)
      if (onlyOpen) {
        const isFull = (m.joinedPlayersCount || 0) >= (m.totalRequiredPlayers || 14);
        if (isFull) return false;
      }

      return true;
    });
  }, [matches, searchQuery, selectedCity, selectedMode, onlyOpen]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── HEADER & SEARCH BAR ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-xl sm:text-2xl font-black text-white">
            Halısaha Maçları
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Açık maç ilanlarını incele, eksik mevkiye tıkla ve kadroya katıl
          </p>
        </div>

        <button
          onClick={onOpenCreateMatch}
          className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-4 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Maç Oluştur</span>
        </button>
      </div>

      {/* ─── FILTERS & SEARCH CONTROLS ─── */}
      <div className="rounded-2xl border border-white/5 bg-[#0E1119] p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Saha adı, ilçe veya organizatör ara..."
            className="w-full rounded-xl border border-white/5 bg-[#161A26] py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* City Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[10px] font-bold text-white/40 uppercase mr-1">Şehir:</span>
            {cities.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  selectedCity === c
                    ? 'bg-[#8eff71] text-[#064200]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Mode Selector + Open Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-white/40 uppercase mr-1">Format:</span>
              {modes.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                    selectedMode === m
                      ? 'bg-white/20 text-[#8eff71] border border-[#8eff71]/30'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white/70">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => setOnlyOpen(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-[#8eff71]"
              />
              <span>Sadece Boş Kadrolar</span>
            </label>
          </div>
        </div>
      </div>

      {/* ─── MATCHES LIST GRID ─── */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-white/50">
          <span>{filteredMatches.length} maç listeleniyor</span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-montserrat text-base font-bold text-white">Eşleşen Maç Bulunamadı</h3>
            <p className="text-xs text-white/40 mt-1">Arama kriterlerinize uygun açık bir maç ilanı yok.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('Tümü');
                  setSelectedMode('Tümü');
                  setOnlyOpen(false);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
              >
                Filtreleri Sıfırla
              </button>
              <button
                onClick={onOpenCreateMatch}
                className="rounded-xl bg-[#8eff71] px-4 py-2 text-xs font-black uppercase text-[#064200]"
              >
                Sen Maç Aç
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map(m => (
              <MatchCard 
                key={m.id} 
                match={m} 
                onSelectMatch={onSelectMatch} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
