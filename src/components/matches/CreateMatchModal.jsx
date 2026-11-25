import React, { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { auth } from '../../services/firebase';
import { adminDbService } from '../../services/adminDbService';

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatConcreteTurkishDateTime(isoDate, timeStr = '21:00') {
  const [yStr, mStr, dStr] = String(isoDate || getTodayIsoDate()).split('-');
  const year = parseInt(yStr, 10) || new Date().getFullYear();
  const monthIdx = (parseInt(mStr, 10) || 1) - 1;
  const day = parseInt(dStr, 10) || 1;

  const dateObj = new Date(year, monthIdx, day);
  const dayName = TR_DAYS[dateObj.getDay()] || 'Cumartesi';
  const monthName = TR_MONTHS[dateObj.getMonth()] || 'Kasım';

  const [hStr, minStr] = String(timeStr || '21:00').split(':');
  const startH = Number.isNaN(parseInt(hStr, 10)) ? 21 : parseInt(hStr, 10);
  const startMin = (minStr || '00').padStart(2, '0');
  const endH = (startH + 1) % 24;

  const startFormatted = `${String(startH).padStart(2, '0')}:${startMin}`;
  const endFormatted = `${String(endH).padStart(2, '0')}:${startMin}`;

  return `${dayName}, ${day} ${monthName} ${year}, ${startFormatted} - ${endFormatted}`;
}

function getPlayersCountForMode(mode) {
  switch (mode) {
    case '5v5':
      return 10;
    case '6v6':
      return 12;
    case '7v7':
      return 14;
    case '8v8':
      return 16;
    case '9v9':
      return 18;
    case '10v10':
      return 20;
    case '11v11':
      return 22;
    default:
      return 14;
  }
}

function getDefaultFormationForMode(mode) {
  switch (mode) {
    case '5v5':
      return '2-1-1';
    case '6v6':
      return '2-2-1';
    case '7v7':
      return '2-3-1';
    case '8v8':
      return '3-3-1';
    default:
      return '2-3-1';
  }
}

function computePerPlayerFee(totalFeeVal, modeVal, isGkFreeVal) {
  const total = Number(totalFeeVal) || 0;
  const totalPlayers = getPlayersCountForMode(modeVal);
  const payingPlayers = isGkFreeVal ? Math.max(1, totalPlayers - 2) : totalPlayers;
  return Math.ceil(total / payingPlayers);
}

export function CreateMatchModal({ isOpen, onClose, onSuccess, pitches = [] }) {
  const [selectedPitchId, setSelectedPitchId] = useState('');
  const [arena, setArena] = useState(pitches[0]?.name || 'Beşiktaş Arena');
  const [city, setCity] = useState(pitches[0]?.city || 'İstanbul');
  const [district, setDistrict] = useState(pitches[0]?.district || 'Beşiktaş');
  const [date, setDate] = useState(getTodayIsoDate);
  const [time, setTime] = useState('21:00');
  const [mode, setMode] = useState('7v7');
  const [matchFormatType, setMatchFormatType] = useState('single_organizer');
  const [hasReservation, setHasReservation] = useState(true);
  const [totalFee, setTotalFee] = useState(2100);
  const [fee, setFee] = useState(150);
  const [isGkFree, setIsGkFree] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && pitches.length > 0 && !selectedPitchId) {
      const first = pitches[0];
      const pitchFee =
        first.hourlyFee ?? first.price ?? first.hourlyRateNormal ?? first.pricePerHour ?? 2100;
      setSelectedPitchId(first.id);
      setArena(first.name || 'Beşiktaş Arena');
      setCity(first.city || 'İstanbul');
      setDistrict(first.district || 'Beşiktaş');
      setTotalFee(Number(pitchFee));
      setFee(computePerPlayerFee(pitchFee, mode, isGkFree));
    }
  }, [isOpen, pitches]);

  if (!isOpen) return null;

  const handleSelectPitch = (pitchIdValue) => {
    setSelectedPitchId(pitchIdValue);
    if (!pitchIdValue || pitchIdValue === 'custom') return;
    const found = pitches.find((p) => p.id === pitchIdValue);
    if (found) {
      const resolvedTotal =
        found.hourlyFee ?? found.price ?? found.hourlyRateNormal ?? found.pricePerHour ?? 2100;
      setArena(found.name || '');
      setCity(found.city || 'İstanbul');
      setDistrict(found.district || '');
      setTotalFee(Number(resolvedTotal));
      setFee(computePerPlayerFee(resolvedTotal, mode, isGkFree));
    }
  };

  const handleTotalFeeChange = (val) => {
    setTotalFee(val);
    setFee(computePerPlayerFee(val, mode, isGkFree));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setFee(computePerPlayerFee(totalFee, nextMode, isGkFree));
  };

  const handleGkFreeChange = (checked) => {
    setIsGkFree(checked);
    setFee(computePerPlayerFee(totalFee, mode, checked));
  };

  const previewDateTime = formatConcreteTurkishDateTime(date, time);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentUid = auth.currentUser?.uid || 'system_admin';
      const currentName =
        auth.currentUser?.displayName ||
        (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : '') ||
        'Admin (Yönetici Paneli)';
      const currentAvatar =
        auth.currentUser?.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

      const defaultFormation = getDefaultFormationForMode(mode);
      const totalRequiredPlayers = getPlayersCountForMode(mode);

      await adminDbService.createMatch({
        arena: arena.trim(),
        pitchId: selectedPitchId && selectedPitchId !== 'custom' ? selectedPitchId : '',
        city: city.trim(),
        district: district.trim(),
        date,
        time,
        dateTime: previewDateTime,
        mode,
        matchFormatType,
        hasReservation: Boolean(hasReservation),
        status: 'active',
        fee: Number(fee) || 0,
        totalFee: Number(totalFee) || 0,
        isGkFree: Boolean(isGkFree),
        isSubscription: Boolean(isSubscription),
        organizer: currentName,
        organizerId: currentUid,
        captainAId: currentUid,
        captainAName: currentName,
        teamAFormation: defaultFormation,
        teamBFormation: defaultFormation,
        joinedPlayersCount: 1,
        totalRequiredPlayers,
        slots: {
          A_OS_ORTA: {
            name: currentName,
            avatar: currentAvatar,
            position: 'Orta Saha (Kaptan)',
            uid: currentUid,
          },
        },
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
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Kayıtlı Tesis Seçici */}
          {pitches.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Kayıtlı Tesis Seçin
              </label>
              <select
                value={selectedPitchId}
                onChange={(e) => handleSelectPitch(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3.5 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                {pitches.map((p) => {
                  const pFee =
                    p.hourlyFee ?? p.price ?? p.hourlyRateNormal ?? p.pricePerHour ?? 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city} / {p.district} • ₺{pFee})
                    </option>
                  );
                })}
                <option value="custom">+ Manuel Saha Bilgisi Gir</option>
              </select>
            </div>
          )}

          {/* Arena Name & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Halısaha / Arena
              </label>
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
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Şehir / İlçe
              </label>
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
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Tarih
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Saat
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Format
              </label>
              <select
                value={mode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="5v5">5v5 (10 Kişi)</option>
                <option value="6v6">6v6 (12 Kişi)</option>
                <option value="7v7">7v7 (14 Kişi)</option>
                <option value="8v8">8v8 (16 Kişi)</option>
              </select>
            </div>
          </div>

          {/* Önizleme: Somut Türkçe Tarih + Yıl */}
          <div className="rounded-xl border border-[#8eff71]/20 bg-[#8eff71]/5 px-3.5 py-2 text-[11px] font-bold text-[#8eff71]">
            📅 Maç Zamanı: {previewDateTime}
          </div>

          {/* Kaptan Formatı & Rezervasyon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Organizasyon Türü
              </label>
              <select
                value={matchFormatType}
                onChange={(e) => setMatchFormatType(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="single_organizer">Tek Organizatör</option>
                <option value="two_captains">İki Kaptanlı Maç</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Saha Rezervasyonu
              </label>
              <select
                value={hasReservation ? 'yes' : 'no'}
                onChange={(e) => setHasReservation(e.target.value === 'yes')}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="yes">✓ Sahası Hazır / Rezerve</option>
                <option value="no">🔍 Saha Aranıyor</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Toplam Saha Ücreti (₺)
              </label>
              <input
                type="number"
                value={totalFee}
                onChange={(e) => handleTotalFeeChange(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Kişi Başı Ücret (₺) — Otomatik
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-[#8eff71] focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3 cursor-pointer">
              <span className="text-xs font-bold text-white/80">Kaleciye Ücretsiz Katılım</span>
              <input
                type="checkbox"
                checked={isGkFree}
                onChange={(e) => handleGkFreeChange(e.target.checked)}
                className="h-4 w-4 accent-[#8eff71]"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3 cursor-pointer">
              <span className="text-xs font-bold text-white/80">Abone Maçı</span>
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="h-4 w-4 accent-[#8eff71]"
              />
            </label>
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
