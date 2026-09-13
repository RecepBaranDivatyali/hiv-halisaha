import React, { useState } from 'react';
import { X, MapPin, Star, Plus } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

export function CreatePitchModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Beşiktaş');
  const [surface, setSurface] = useState('Suni Çim (Hibrit)');
  const [pricePerHour, setPricePerHour] = useState(2000);
  const [rating, setRating] = useState(4.8);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await adminDbService.createPitch({
        name: name.trim(),
        city: city.trim(),
        district: district.trim(),
        surface,
        pricePerHour: Number(pricePerHour),
        rating: Number(rating),
        reviewsCount: 0,
        active: true
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Tesis ekleme hatası:', err);
      alert('Tesis eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/10 text-[#8eff71]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-lg font-black text-white">YENİ TESİS / HALISAHA EKLE</h3>
              <p className="text-xs text-white/50">Anlaşmalı halısaha ve tesis kaydı oluşturun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Tesis / Saha Adı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Örn: Levent Spor Arena"
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Şehir</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="İstanbul"
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">İlçe</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Beşiktaş"
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Zemin Türü</label>
              <select
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="Suni Çim (Hibrit)">Suni Çim (Hibrit)</option>
                <option value="Kapalı Suni Çim">Kapalı Suni Çim</option>
                <option value="Açık Saha">Açık Saha</option>
                <option value="Doğal Çim">Doğal Çim</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Saatlik Ücret (₺)</label>
              <input
                type="number"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

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
              {loading ? 'Ekleniyor...' : 'Tesisi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
