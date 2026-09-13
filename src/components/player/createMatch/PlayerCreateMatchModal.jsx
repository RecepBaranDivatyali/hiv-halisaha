import React, { useState } from 'react';
import { X, Trophy, Plus, Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { playerDbService } from '../../../services/playerDbService';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function PlayerCreateMatchModal({ isOpen, onClose, onSuccess, initialPitch }) {
  const { currentUser } = usePlayerAuth();
  const [arena, setArena] = useState(initialPitch?.name || 'Beşiktaş Arena');
  const [city, setCity] = useState(initialPitch?.city || 'İstanbul');
  const [district, setDistrict] = useState(initialPitch?.district || 'Beşiktaş');
  const [date, setDate] = useState('Yarın');
  const [time, setTime] = useState('21:00');
  const [mode, setMode] = useState('7v7');
  const [fee, setFee] = useState(150);
  const [isSubscription, setIsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const modeNum = parseInt(mode.split('v')[0], 10) || 7;
  const totalPlayers = modeNum * 2;
  const totalFee = fee * totalPlayers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!arena.trim()) {
      setError('Lütfen halısaha adını girin.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await playerDbService.createMatch({
        arena: arena.trim(),
        city: city,
        district: district,
        dateTime: `${date}, ${time}`,
        mode: mode,
        fee: Number(fee),
        totalFee: totalFee,
        isSubscription: isSubscription
      }, currentUser);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Maç oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0E1119] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8eff71]/15 text-[#8eff71]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-base font-black text-white">Yeni Maç İlanı Aç</h3>
              <p className="text-[11px] text-white/40">Kadronu oluştur, eksik mevkileri oyunculara aç</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-[#ff7351]/10 border border-[#ff7351]/20 p-2.5 text-xs text-[#ff7351] font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
              Halısaha Adı *
            </label>
            <input
              type="text"
              required
              value={arena}
              onChange={(e) => setArena(e.target.value)}
              placeholder="Örn: Beşiktaş Arena Halısaha"
              className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                Şehir
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Bursa">Bursa</option>
                <option value="Antalya">Antalya</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                İlçe
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Örn: Beşiktaş"
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                Tarih
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Bugün / Yarın / 15 Eylül"
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                Saat Slotu
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="19:00">19:00 - 20:00</option>
                <option value="20:00">20:00 - 21:00</option>
                <option value="21:00">21:00 - 22:00</option>
                <option value="22:00">22:00 - 23:00</option>
                <option value="23:00">23:00 - 00:00</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                Maç Formatı
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="6v6">6v6 (12 Oyuncu)</option>
                <option value="7v7">7v7 (14 Oyuncu)</option>
                <option value="8v8">8v8 (16 Oyuncu)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
                Kişi Başı Ücret (₺)
              </label>
              <input
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Total Fee & Subscription Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#141824] p-3.5">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase block">Toplam Saha Ücreti</span>
              <span className="font-montserrat text-sm font-black text-[#8eff71]">{totalFee} ₺</span>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-[#8eff71]"
              />
              <span>Haftalık Sabit Maç</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8eff71] py-3.5 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 disabled:opacity-50 transition"
          >
            {loading ? 'İlan Oluşturuluyor...' : 'Maçı Yayınla (Kadroya Otomatik Katıl)'}
          </button>
        </form>
      </div>
    </div>
  );
}
