import React, { useState, useEffect } from 'react';
import { Clock, MapPin, ChevronRight, Activity, Zap } from 'lucide-react';

export function MatchCountdownCard({ match, onOpenMatchRoom }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    // 2 hours 45 min target timestamp for realistic simulation
    const targetTimestamp = Date.now() + (2 * 3600 + 45 * 60 + 30) * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const format2Digits = (num) => num.toString().padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#8eff71]/20 bg-gradient-to-br from-[#121820] via-[#0E1219] to-[#0A0C13] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_30px_rgba(142,255,113,0.06)]">
      {/* Background neon pitch markings subtle glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[#8eff71]/[0.05] blur-3xl" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full border border-[#8eff71]/30 bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black uppercase text-[#8eff71]">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#8eff71]" />
          <span>YAKLAŞAN MAÇ GÜNÜ</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-white/50">
          <MapPin className="h-3.5 w-3.5 text-[#8eff71]" />
          <span>{match?.arena || 'Beşiktaş Arena'} • 21:00</span>
        </div>
      </div>

      {/* Countdown Timer Row */}
      <div className="my-5 flex items-center justify-center gap-2 sm:gap-4">
        {/* Hours */}
        <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#171C26] px-4 py-3 sm:px-6 sm:py-4 shadow-inner">
          <span className="font-montserrat text-2xl sm:text-3xl font-black text-white tracking-tight">
            {format2Digits(timeLeft.hours)}
          </span>
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-white/40">SAAT</span>
        </div>

        <span className="font-montserrat text-2xl sm:text-3xl font-black text-[#8eff71] animate-pulse">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#171C26] px-4 py-3 sm:px-6 sm:py-4 shadow-inner">
          <span className="font-montserrat text-2xl sm:text-3xl font-black text-white tracking-tight">
            {format2Digits(timeLeft.minutes)}
          </span>
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-white/40">DAKİKA</span>
        </div>

        <span className="font-montserrat text-2xl sm:text-3xl font-black text-[#8eff71] animate-pulse">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#171C26] px-4 py-3 sm:px-6 sm:py-4 shadow-inner">
          <span className="font-montserrat text-2xl sm:text-3xl font-black text-[#8eff71] tracking-tight">
            {format2Digits(timeLeft.seconds)}
          </span>
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-white/40">SANİYE</span>
        </div>
      </div>

      {/* Footer Info & Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-4">
        <div className="text-center sm:text-left">
          <p className="text-xs font-extrabold text-white">7v7 Taktiksel Maç Kadrosu</p>
          <p className="text-[11px] text-white/40">12/14 Oyuncu Hazır • Kaptan Sahada</p>
        </div>

        <button
          onClick={() => onOpenMatchRoom(match || { id: 'demo_1' })}
          className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#8eff71] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_25px_rgba(142,255,113,0.3)] hover:brightness-110 transition"
        >
          <span>Maç Odasına Git</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
