import React from 'react';
import { User, Plus, Shield, Check, X } from 'lucide-react';

export function InteractivePitch({ 
  match, 
  currentUser, 
  onJoinSlot, 
  onLeaveSlot, 
  loadingSlot 
}) {
  const mode = match?.mode || '7v7';
  const slots = match?.slots || {};

  // Formations for 7v7 (Team A: 7, Team B: 7)
  // Team A (Home - Left / Top)
  const teamAPositions = [
    { key: 'slot_0', label: 'KL', fullLabel: 'Kaleci', team: 'A', x: '8%', y: '50%' },
    { key: 'slot_1', label: 'STP', fullLabel: 'Stoper', team: 'A', x: '22%', y: '50%' },
    { key: 'slot_2', label: 'SOL B', fullLabel: 'Sol Bek', team: 'A', x: '22%', y: '20%' },
    { key: 'slot_3', label: 'SAĞ B', fullLabel: 'Sağ Bek', team: 'A', x: '22%', y: '80%' },
    { key: 'slot_4', label: 'ORT', fullLabel: 'Orta Saha', team: 'A', x: '35%', y: '50%' },
    { key: 'slot_5', label: 'KANAT', fullLabel: 'Kanat', team: 'A', x: '42%', y: '25%' },
    { key: 'slot_6', label: 'FOR', fullLabel: 'Forvet', team: 'A', x: '44%', y: '75%' },
  ];

  // Team B (Away - Right / Bottom)
  const teamBPositions = [
    { key: 'slot_7', label: 'FOR', fullLabel: 'Forvet', team: 'B', x: '56%', y: '25%' },
    { key: 'slot_8', label: 'KANAT', fullLabel: 'Kanat', team: 'B', x: '58%', y: '75%' },
    { key: 'slot_9', label: 'ORT', fullLabel: 'Orta Saha', team: 'B', x: '65%', y: '50%' },
    { key: 'slot_10', label: 'SOL B', fullLabel: 'Sol Bek', team: 'B', x: '78%', y: '20%' },
    { key: 'slot_11', label: 'SAĞ B', fullLabel: 'Sağ Bek', team: 'B', x: '78%', y: '80%' },
    { key: 'slot_12', label: 'STP', fullLabel: 'Stoper', team: 'B', x: '78%', y: '50%' },
    { key: 'slot_13', label: 'KL', fullLabel: 'Kaleci', team: 'B', x: '92%', y: '50%' },
  ];

  const allPositions = [...teamAPositions, ...teamBPositions];

  // User's current slot in this match if any
  const userCurrentSlotKey = Object.keys(slots).find(
    k => slots[k] && slots[k].uid === currentUser.uid
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* ─── PITCH BOARD ─── */}
      <div className="relative h-[420px] sm:h-[480px] w-full max-w-[840px] overflow-hidden rounded-3xl border-4 border-[#1a3820] bg-gradient-to-b from-[#0d2a13] via-[#0f3417] to-[#0a2310] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_100px_rgba(0,0,0,0.5)] select-none">
        {/* Grass Stripes Pattern */}
        <div className="pointer-events-none absolute inset-0 flex opacity-15">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 ${i % 2 === 0 ? 'bg-black/25' : 'bg-white/10'}`} 
            />
          ))}
        </div>

        {/* Outer White Boundary Line */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-white/40" />

        {/* Center Halfway Line */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 top-3 w-0.5 -translate-x-1/2 bg-white/40" />

        {/* Center Circle */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />

        {/* Left Penalty Area (Team A) */}
        <div className="pointer-events-none absolute left-3 top-1/2 h-44 w-24 -translate-y-1/2 rounded-r-xl border-2 border-l-0 border-white/40" />
        <div className="pointer-events-none absolute left-3 top-1/2 h-20 w-10 -translate-y-1/2 rounded-r-md border-2 border-l-0 border-white/40" />

        {/* Right Penalty Area (Team B) */}
        <div className="pointer-events-none absolute right-3 top-1/2 h-44 w-24 -translate-y-1/2 rounded-l-xl border-2 border-r-0 border-white/40" />
        <div className="pointer-events-none absolute right-3 top-1/2 h-20 w-10 -translate-y-1/2 rounded-l-md border-2 border-r-0 border-white/40" />

        {/* Team Banners on Grass */}
        <div className="pointer-events-none absolute left-8 top-5 rounded-lg bg-black/40 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#8eff71]">
          Yeşil Takım (A)
        </div>
        <div className="pointer-events-none absolute right-8 top-5 rounded-lg bg-black/40 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#6e9bff]">
          Mavi Takım (B)
        </div>

        {/* ─── INTERACTIVE PLAYER SLOTS ─── */}
        {allPositions.map(pos => {
          const slotData = slots[pos.key];
          const isOccupied = !!slotData;
          const isMe = isOccupied && slotData.uid === currentUser.uid;
          const isTeamA = pos.team === 'A';
          const isLoading = loadingSlot === pos.key;

          return (
            <div
              key={pos.key}
              style={{ left: pos.x, top: pos.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
            >
              <button
                disabled={isLoading}
                onClick={() => {
                  if (isMe) {
                    onLeaveSlot(pos.key);
                  } else if (!isOccupied) {
                    onJoinSlot(pos.key, pos.fullLabel);
                  }
                }}
                className={`group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all ${
                  isOccupied
                    ? isMe
                      ? 'border-2 border-[#8eff71] bg-[#8eff71] text-[#064200] shadow-[0_0_25px_rgba(142,255,113,0.8)] scale-110 ring-4 ring-white/30'
                      : isTeamA
                        ? 'border-2 border-[#8eff71]/60 bg-[#122817] text-white shadow-lg'
                        : 'border-2 border-[#6e9bff]/60 bg-[#142236] text-white shadow-lg'
                    : 'border-2 border-dashed border-white/50 bg-black/40 text-white/70 hover:border-[#8eff71] hover:scale-110 hover:bg-[#8eff71]/20 hover:text-white'
                }`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : isOccupied ? (
                  slotData.avatar ? (
                    <img
                      src={slotData.avatar}
                      alt={slotData.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="font-montserrat text-xs font-black">
                      {(slotData.name || 'P')[0].toUpperCase()}
                    </span>
                  )
                ) : (
                  <Plus className="h-5 w-5 text-white/60 group-hover:text-[#8eff71] transition" />
                )}

                {/* Badge if it's the current user */}
                {isMe && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8eff71] text-[9px] font-black text-[#064200] ring-2 ring-black">
                    ✓
                  </span>
                )}
              </button>

              {/* Position / Player Name Label */}
              <div className="mt-1 flex flex-col items-center">
                <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-extrabold text-white/90 backdrop-blur-sm shadow">
                  {isOccupied ? slotData.name.split(' ')[0] : pos.label}
                </span>
                {isOccupied && (
                  <span className="text-[8px] font-bold text-[#8eff71]">
                    {pos.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── QUICK STATUS & ACTION BAR ─── */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#121520] p-4">
        <div>
          {userCurrentSlotKey ? (
            <div className="flex items-center gap-2 text-xs font-bold text-[#8eff71]">
              <Check className="h-4 w-4" />
              <span>{slots[userCurrentSlotKey]?.position || 'Mevkidesiniz'} — Kadrodasınız!</span>
            </div>
          ) : (
            <p className="text-xs font-bold text-white/70">
              Sahadaki boş bir <span className="text-[#8eff71]">+</span> simgesine tıklayarak mevki seçin.
            </p>
          )}
        </div>

        {userCurrentSlotKey && (
          <button
            onClick={() => onLeaveSlot(userCurrentSlotKey)}
            className="flex items-center gap-1.5 rounded-xl border border-[#ff7351]/30 bg-[#ff7351]/10 px-3 py-1.5 text-xs font-bold text-[#ff7351] hover:bg-[#ff7351] hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Mevkiden Ayrıl</span>
          </button>
        )}
      </div>
    </div>
  );
}
