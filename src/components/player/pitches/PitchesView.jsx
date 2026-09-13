import React, { useState, useEffect } from 'react';
import { MapPin, Star, Plus, Shield, Check, DollarSign, Award, ExternalLink } from 'lucide-react';
import { playerDbService } from '../../../services/playerDbService';

export function PitchesView({ onOpenCreateMatch }) {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerDbService.getPitches().then(data => {
      setPitches(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-xl sm:text-2xl font-black text-white">
            Halısahalar & Tesisler
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Anlaşmalı spor tesisleri, saatlik ücretler, zemin kaliteleri ve konumlar
          </p>
        </div>

        <button
          onClick={() => onOpenCreateMatch()}
          className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-4 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Maç Aç</span>
        </button>
      </div>

      {/* Grid of Pitches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {pitches.map((pitch) => (
          <div
            key={pitch.id}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-[#10131E] p-5 sm:p-6 hover:border-[#8eff71]/40 transition-all shadow-xl"
          >
            <div>
              {/* Header: Name & Rating */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#8eff71]">
                    {pitch.surface || 'Suni Çim'}
                  </span>
                  <h3 className="font-montserrat text-lg font-black text-white mt-1.5 group-hover:text-[#8eff71] transition">
                    {pitch.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-white/30" />
                    <span>{pitch.district ? `${pitch.district}, ${pitch.city}` : pitch.city}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-[#ffd166]/15 px-2.5 py-1 text-xs font-black text-[#ffd166]">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{pitch.rating || 4.8}</span>
                </div>
              </div>

              {/* Price & Features */}
              <div className="mt-5 rounded-2xl border border-white/5 bg-[#151926] p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Saatlik Kira</span>
                  <span className="font-montserrat text-base font-black text-[#8eff71]">
                    {pitch.pricePerHour?.toLocaleString('tr-TR') || 2200} ₺
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Oyuncu Başı</span>
                  <span className="font-montserrat text-sm font-bold text-white/80">
                    ~{Math.round((pitch.pricePerHour || 2100) / 14)} ₺
                  </span>
                </div>
              </div>

              {/* Facility Feature Badges */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(pitch.features || ['Otopark', 'Duş & Soyunma', 'Kamera Kaydı']).map((f, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Book / Create Match at this pitch */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pitch.name} ${pitch.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition"
              >
                <span>Harita</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={() => onOpenCreateMatch(pitch)}
                className="flex items-center gap-1.5 rounded-xl bg-[#8eff71]/15 px-3.5 py-2 text-xs font-black uppercase text-[#8eff71] hover:bg-[#8eff71] hover:text-[#064200] transition"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Burada Maç Aç</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
