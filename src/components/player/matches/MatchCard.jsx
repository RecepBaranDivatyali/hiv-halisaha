import React from 'react';
import { MapPin, Clock, Users, ChevronRight, Shield, Zap } from 'lucide-react';

export function MatchCard({ match, onSelectMatch }) {
  const mode = match.mode || '7v7';
  const joinedCount = match.joinedPlayersCount || 0;
  const totalRequired = match.totalRequiredPlayers || 14;
  const isFull = joinedCount >= totalRequired;
  const fillPercentage = Math.min(100, Math.round((joinedCount / totalRequired) * 100));

  // Extract slots preview avatars
  const slotsList = Object.values(match.slots || {}).filter(Boolean);

  return (
    <div 
      onClick={() => onSelectMatch(match)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-[#10131C] p-4 sm:p-5 hover:border-[#8eff71]/40 hover:bg-[#141824] transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(142,255,113,0.05)]"
    >
      {/* Top Details */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#8eff71]/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#8eff71]">
              {mode}
            </span>
            {match.isSubscription && (
              <span className="rounded-md bg-[#6e9bff]/15 px-2 py-0.5 text-[10px] font-bold text-[#6e9bff]">
                Abonelik
              </span>
            )}
            <span className="text-xs font-semibold text-white/50">{match.dateTime || 'Bugün, 21:00'}</span>
          </div>
          <h3 className="mt-2 font-montserrat text-base font-black text-white group-hover:text-[#8eff71] transition">
            {match.arena || 'Halısaha Maçı'}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
            <MapPin className="h-3.5 w-3.5 text-white/30" />
            <span>{match.district ? `${match.district}, ${match.city}` : (match.city || 'İstanbul')}</span>
          </div>
        </div>

        {/* Fee Pill */}
        <div className="rounded-xl border border-white/10 bg-[#191F2D] px-3 py-1.5 text-right">
          <span className="text-[10px] font-bold text-white/40 block">Kişi Başı</span>
          <span className="font-montserrat text-sm font-black text-[#8eff71]">{match.fee || 150} ₺</span>
        </div>
      </div>

      {/* Slots Capacity Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-white/70">
            <Users className="h-3.5 w-3.5 text-[#8eff71]" />
            <span className="font-bold">{joinedCount} / {totalRequired} Oyuncu</span>
          </div>
          <span className={`text-[10px] font-extrabold ${isFull ? 'text-[#ff7351]' : 'text-[#8eff71]'}`}>
            {isFull ? 'KADRO DOLU' : `${totalRequired - joinedCount} BOŞ MEVKİ`}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isFull ? 'bg-[#ff7351]' : 'bg-[#8eff71]'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer: Avatars preview + CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        {/* Avatars row */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {slotsList.slice(0, 4).map((slot, i) => (
            <img
              key={i}
              src={slot.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={slot.name || 'Oyuncu'}
              className="h-6 w-6 rounded-full object-cover ring-2 ring-[#10131C]"
            />
          ))}
          {slotsList.length > 4 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e2330] text-[9px] font-bold text-white/70 ring-2 ring-[#10131C]">
              +{slotsList.length - 4}
            </div>
          )}
          {slotsList.length === 0 && (
            <span className="text-[11px] text-white/30 italic">Kadro bekleniyor...</span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1 text-xs font-black uppercase text-[#8eff71] group-hover:translate-x-1 transition-transform">
          <span>Kadroya Gir</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
