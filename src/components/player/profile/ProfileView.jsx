import React, { useState } from 'react';
import { 
  User, 
  Award, 
  Trophy, 
  Shield, 
  Activity, 
  Check, 
  Edit3, 
  Smartphone, 
  Flame, 
  Zap,
  Target
} from 'lucide-react';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function ProfileView() {
  const { currentUser, updateProfile, switchPlayer, availableDemoPlayers } = usePlayerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [position, setPosition] = useState(currentUser.position);
  const [district, setDistrict] = useState(currentUser.district || 'Beşiktaş');

  const winRate = currentUser.matchesPlayed > 0 
    ? Math.round((currentUser.wins / currentUser.matchesPlayed) * 100) 
    : 75;

  const badges = [
    { title: 'Hat-Trick Avcısı', desc: 'Bir maçta 3 ve üzeri gol', icon: '⚽', earned: true, progress: 100 },
    { title: 'Güvenilir Kaptan', desc: 'Güven skoru %95 üzerinde', icon: '🛡️', earned: true, progress: 100 },
    { title: 'Maçın Adamı (MVP)', desc: '5 kez maçın oyuncusu seçilme', icon: '⭐', earned: true, progress: 100 },
    { title: 'Gece Kuşu', desc: '22:00 sonrası 10 gece maçı', icon: '🌙', earned: false, progress: 60 },
    { title: 'Sadık Kulüpçü', desc: 'Aynı kulüpte 25+ maça çıkma', icon: '🔥', earned: false, progress: 40 },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name, position, district });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* ─── MAIN PLAYER CARD ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#121624] via-[#0E111A] to-[#0A0D15] p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#8eff71]/[0.04] blur-3xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover ring-2 ring-[#8eff71]/40 shadow-2xl"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-[#8eff71] font-montserrat text-xs font-black text-[#064200]">
                Lv{currentUser.level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-montserrat text-2xl font-black text-white">{currentUser.name}</h1>
                <span className="rounded-md bg-[#8eff71]/20 px-2 py-0.5 text-[10px] font-black uppercase text-[#8eff71]">
                  {currentUser.position}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                {currentUser.clubName} • {currentUser.city}, {currentUser.district}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/70">
                  ★ {currentUser.rating} Puan
                </span>
                <span className="rounded-xl border border-[#8eff71]/30 bg-[#8eff71]/10 px-2.5 py-1 text-[11px] font-black text-[#8eff71]">
                  %{currentUser.trustScore} Güvenilirlik
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            <Edit3 className="h-4 w-4" />
            <span>{isEditing ? 'Kapat' : 'Profili Düzenle'}</span>
          </button>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Mevki</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">İlçe</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#8eff71] px-4 text-xs font-bold text-[#064200]"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ─── CAREER STATS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-5 text-center">
          <span className="text-[10px] font-bold text-white/40 uppercase block">Toplam Maç</span>
          <span className="font-montserrat text-2xl font-black text-white mt-1 block">
            {currentUser.matchesPlayed}
          </span>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-5 text-center">
          <span className="text-[10px] font-bold text-white/40 uppercase block">Galibiyet</span>
          <span className="font-montserrat text-2xl font-black text-[#8eff71] mt-1 block">
            {currentUser.wins}
          </span>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-5 text-center">
          <span className="text-[10px] font-bold text-white/40 uppercase block">Gol Sayısı</span>
          <span className="font-montserrat text-2xl font-black text-[#6e9bff] mt-1 block">
            {currentUser.goals}
          </span>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-5 text-center">
          <span className="text-[10px] font-bold text-white/40 uppercase block">Kazanma Oranı</span>
          <span className="font-montserrat text-2xl font-black text-[#ffd166] mt-1 block">
            %{winRate}
          </span>
        </div>
      </div>

      {/* ─── ACHIEVEMENTS & BADGES ─── */}
      <div className="rounded-3xl border border-white/5 bg-[#0E1119] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#8eff71]" />
            <h3 className="font-montserrat text-sm font-black text-white">Rozetler ve Başarımlar</h3>
          </div>
          <span className="text-xs text-white/40 font-semibold">3/5 Tamamlandı</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 transition ${
                b.earned 
                  ? 'border-[#8eff71]/20 bg-[#8eff71]/5' 
                  : 'border-white/5 bg-[#131622] opacity-60'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                {b.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-montserrat text-xs font-black text-white">{b.title}</h4>
                  {b.earned && (
                    <span className="rounded-md bg-[#8eff71]/20 px-1.5 py-0.2 text-[9px] font-black text-[#8eff71]">
                      KAZANILDI
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">{b.desc}</p>
                {!b.earned && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#8eff71] rounded-full" 
                      style={{ width: `${b.progress}%` }} 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── QUICK DEMO PROFILE SWITCHER FOR DEVELOPER/TESTER ─── */}
      <div className="rounded-3xl border border-white/5 bg-[#0A0D15] p-6">
        <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-2">
          Hızlı Test: Oyuncu Değiştir
        </h4>
        <p className="text-xs text-white/50 mb-4">
          Farklı oyuncu profilleriyle maçlara katılabilir, kadro doluluk durumlarını deneyebilirsiniz.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {availableDemoPlayers.map((p, idx) => (
            <button
              key={p.uid}
              onClick={() => switchPlayer(idx)}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                currentUser.uid === p.uid
                  ? 'border-[#8eff71] bg-[#8eff71]/15 text-white ring-1 ring-[#8eff71]'
                  : 'border-white/5 bg-[#121622] text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <img src={p.avatar} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
              <div>
                <div className="font-bold text-xs">{p.name}</div>
                <div className="text-[10px] text-[#8eff71]">{p.position}</div>
                <div className="text-[9px] text-white/40">{p.clubName}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
