import React, { useState } from 'react';
import { X, Trophy, MapPin, Calendar, Clock, DollarSign, Users, Check } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

export function CreateMatchModal({ isOpen, onClose, onSuccess, pitches = [] }) {
  const [arena, setArena] = useState(pitches[0]?.name || 'Beşiktaş Arena');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Beşiktaş');
  const [date, setDate] = useState('Bugün');
  const [time, setTime] = useState('21:00');
  const [mode, setMode] = useState('7v7');
  const [fee, setFee] = useState(150);
  const [totalFee, setTotalFee] = useState(2100);
  const [isGkFree, setIsGkFree] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminDbService.createMatch({
        arena,
        city,
        district,
        dateTime: `${date}, ${time}`,
        mode,
        fee: Number(fee),
        totalFee: Number(totalFee),
        isGkFree,
        isSubscription,
        organizer: 'Admin (Yönetici Paneli)',
        organizerId: 'admin',
        joinedPlayersCount: 1,
        totalRequiredPlayers: mode === '5v5' ? 10 : mode === '6v6' ? 12 : mode === '7v7' ? 14 : 16,
        slots: {
          slot_0: {
            name: 'Admin',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            position: 'Orta Saha (Kaptan)',
            uid: 'admin'
          }
        }
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Maç oluşturma hatası:', err);
      alert('Maç oluşturulurken bir hata meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/10 text-[#8eff71]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-lg font-black text-white">YENİ MAÇ OLUŞTUR</h3>
              <p className="text-xs text-white/50">Halısaha maç ilanını sisteme ekleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Arena Name & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Halısaha / Arena</label>
              <input
                type="text"
                value={arena}
                onChange={(e) => setArena(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                placeholder="Örn: Beşiktaş Arena"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Şehir / İlçe</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-1/2 rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                  placeholder="İstanbul"
                />
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-1/2 rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                  placeholder="Beşiktaş"
                />
              </div>
            </div>
          </div>

          {/* Date, Time & Mode */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Tarih</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                placeholder="Bugün / Yarın"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Saat</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                placeholder="21:00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Format</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="5v5">5v5 (10 Kişi)</option>
                <option value="6v6">6v6 (12 Kişi)</option>
                <option value="7v7">7v7 (14 Kişi)</option>
                <option value="8v8">8v8 (16 Kişi)</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Kişi Başı Ücret (₺)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Toplam Saha Ücreti (₺)</label>
              <input
                type="number"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3">
            <span className="text-xs font-bold text-white/80">Kaleciye Ücretsiz Katılım</span>
            <input
              type="checkbox"
              checked={isGkFree}
              onChange={(e) => setIsGkFree(e.target.checked)}
              className="h-4 w-4 accent-[#8eff71]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-white/60 hover:bg-white/5 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#8eff71] px-6 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
            >
              {loading ? 'Ekleniyor...' : 'Maçı Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
