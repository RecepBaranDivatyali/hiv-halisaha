import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, Check, Clock, DollarSign, Phone, ShieldCheck } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

const ALL_MODES = ['5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11'];

export function EditPitchModal({ isOpen, pitch, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Ankara');
  const [district, setDistrict] = useState('Çankaya');
  const [hourlyFee, setHourlyFee] = useState('');
  const [subscriberFee, setSubscriberFee] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Equipment & Amenities
  const [bootsRental, setBootsRental] = useState(false);
  const [bootsFee, setBootsFee] = useState('');
  const [glovesRental, setGlovesRental] = useState(false);
  const [glovesFee, setGlovesFee] = useState('');
  const [vestsProvided, setVestsProvided] = useState(true);
  const [showerAvailable, setShowerAvailable] = useState(true);
  const [parkingAvailable, setParkingAvailable] = useState(true);

  // Modes
  const [optimalModes, setOptimalModes] = useState(['7v7']);
  const [tightModes, setTightModes] = useState(['8v8']);

  // Subfields
  const [subFields, setSubFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pitch) {
      setName(pitch.name || '');
      setCity(pitch.city || 'Ankara');
      setDistrict(pitch.district || 'Çankaya');
      setHourlyFee(pitch.hourlyFee ? String(pitch.hourlyFee) : (pitch.pricePerHour ? String(pitch.pricePerHour) : ''));
      setSubscriberFee(pitch.subscriberFee ? String(pitch.subscriberFee) : '');
      setOpeningTime(pitch.openingTime || '09:00');
      setClosingTime(pitch.closingTime || '22:00');
      setPhone(pitch.phone || '');
      setAddress(pitch.address || '');
      setBootsRental(pitch.equipmentRental?.bootsRental ?? false);
      setBootsFee(pitch.equipmentRental?.bootsFee ? String(pitch.equipmentRental.bootsFee) : '');
      setGlovesRental(pitch.equipmentRental?.glovesRental ?? false);
      setGlovesFee(pitch.equipmentRental?.glovesFee ? String(pitch.equipmentRental.glovesFee) : '');
      setVestsProvided(pitch.equipmentRental?.vestsProvided ?? true);
      setShowerAvailable(pitch.equipmentRental?.showerAvailable ?? true);
      setParkingAvailable(pitch.equipmentRental?.parkingAvailable ?? true);
      setOptimalModes(pitch.optimalModes || ['7v7']);
      setTightModes(pitch.tightModes || ['8v8']);
      setSubFields(pitch.subFields && pitch.subFields.length > 0 ? [...pitch.subFields] : [
        { id: 'sf-1', name: 'Halı Saha 1', surface: 'Suni Çim', slotType: 'full', lastSlot: '21:00-22:00' }
      ]);
    }
  }, [pitch, isOpen]);

  if (!isOpen || !pitch) return null;

  const handleToggleOptimal = (m) => {
    if (optimalModes.includes(m)) {
      setOptimalModes(optimalModes.filter(item => item !== m));
    } else {
      setOptimalModes([...optimalModes, m]);
      setTightModes(tightModes.filter(item => item !== m));
    }
  };

  const handleToggleTight = (m) => {
    if (tightModes.includes(m)) {
      setTightModes(tightModes.filter(item => item !== m));
    } else {
      setTightModes([...tightModes, m]);
      setOptimalModes(optimalModes.filter(item => item !== m));
    }
  };

  const handleAddSubField = () => {
    const nextNum = subFields.length + 1;
    setSubFields([
      ...subFields,
      {
        id: `sf-${Date.now()}`,
        name: `Halı Saha ${nextNum}`,
        surface: 'Suni Çim',
        slotType: 'full',
        lastSlot: `${closingTime ? Number(closingTime.split(':')[0]) - 1 : 21}:00-${closingTime || '22:00'}`
      }
    ]);
  };

  const handleRemoveSubField = (index) => {
    setSubFields(subFields.filter((_, idx) => idx !== index));
  };

  const handleSubFieldChange = (index, field, value) => {
    const updated = [...subFields];
    updated[index] = { ...updated[index], [field]: value };
    setSubFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      await adminDbService.updatePitch(pitch.id, {
        name: name.trim(),
        city: city.trim(),
        district: district.trim(),
        hourlyFee: hourlyFee ? Number(hourlyFee) : undefined,
        pricePerHour: hourlyFee ? Number(hourlyFee) : (pitch.pricePerHour || 2000),
        subscriberFee: subscriberFee ? Number(subscriberFee) : undefined,
        openingTime,
        closingTime,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        optimalModes,
        tightModes,
        equipmentRental: {
          bootsRental,
          bootsFee: bootsFee ? Number(bootsFee) : undefined,
          glovesRental,
          glovesFee: glovesFee ? Number(glovesFee) : undefined,
          vestsProvided,
          showerAvailable,
          parkingAvailable,
        },
        subFields,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Tesis güncelleme hatası:', err);
      alert('Tesis güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/10 text-[#8eff71]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-lg font-black text-white">TESİS BİLGİLERİNİ DÜZENLE</h3>
              <p className="text-xs text-white/50">{pitch.name} • Canlı verileri güncelleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Temel Bilgiler */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Tesis / Saha Adı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">İlçe</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Ücretler */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C] p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#8eff71]">Ücret Bilgileri (₺)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">Tek Maç Saatlik Ücret (₺)</label>
                <input
                  type="number"
                  value={hourlyFee}
                  onChange={(e) => setHourlyFee(e.target.value)}
                  placeholder="Örn: 780"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">Abone Saatlik Ücret (₺)</label>
                <input
                  type="number"
                  value={subscriberFee}
                  onChange={(e) => setSubscriberFee(e.target.value)}
                  placeholder="Örn: 700"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Çalışma Saatleri */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C] p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#8eff71]">Çalışma Saatleri</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">İlk Maç Saati (Açılış)</label>
                <input
                  type="text"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  placeholder="09:00"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">Son Maç Bitişi (Kapanış)</label>
                <input
                  type="text"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  placeholder="22:00"
                  className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Desteklenen Formatlar (Kaça Kaç) */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C] p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#8eff71]">Format Uygunluğu (Kaça Kaç)</h4>
            <div>
              <p className="text-[11px] font-bold text-white/70 mb-2">İdeal Formatlar (Yeşil - Uyarısız):</p>
              <div className="flex flex-wrap gap-2">
                {ALL_MODES.map(m => (
                  <button
                    type="button"
                    key={`opt-${m}`}
                    onClick={() => handleToggleOptimal(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      optimalModes.includes(m)
                        ? 'bg-[#8eff71] text-[#064200]'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-white/70 mb-2">Sıkışık / Dar Oynanabilenler (Sarı Uyarı Gösterilir):</p>
              <div className="flex flex-wrap gap-2">
                {ALL_MODES.map(m => (
                  <button
                    type="button"
                    key={`tight-${m}`}
                    onClick={() => handleToggleTight(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      tightModes.includes(m)
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/40">
              * Bu formatların üzerindeki oyuncu sayıları (örn. 9v9) için kullanıcıya <b>Kırmızı Uyarı</b> verilecektir.
            </p>
          </div>

          {/* Alt Sahalar (Parçalar) */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#8eff71]">Mevcut Alt Sahalar ({subFields.length})</h4>
              <button
                type="button"
                onClick={handleAddSubField}
                className="flex items-center gap-1 text-[11px] font-black text-[#8eff71] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Saha Ekle
              </button>
            </div>

            <div className="space-y-2">
              {subFields.map((sub, idx) => (
                <div key={sub.id || idx} className="flex items-center gap-2 rounded-xl bg-[#171A24] p-2.5 border border-white/5">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubFieldChange(idx, 'name', e.target.value)}
                    placeholder="Saha Adı"
                    className="flex-1 rounded-lg bg-black/40 px-2.5 py-1.5 text-xs text-white border border-white/5"
                  />
                  <select
                    value={sub.slotType || 'full'}
                    onChange={(e) => handleSubFieldChange(idx, 'slotType', e.target.value)}
                    className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-white border border-white/5"
                  >
                    <option value="full">Tam Saat (20:00)</option>
                    <option value="half">Yarım Saat (20:30)</option>
                  </select>
                  <input
                    type="text"
                    value={sub.lastSlot || ''}
                    onChange={(e) => handleSubFieldChange(idx, 'lastSlot', e.target.value)}
                    placeholder="Son Slot (21:00-22:00)"
                    className="w-36 rounded-lg bg-black/40 px-2.5 py-1.5 text-xs text-white border border-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubField(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ekipman & Olanaklar */}
          <div className="rounded-2xl border border-white/5 bg-[#12141C] p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#8eff71]">Ekipman Kiralama & Olanaklar</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bootsRental}
                  onChange={(e) => setBootsRental(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Krampon Kiralama
              </label>
              {bootsRental && (
                <input
                  type="number"
                  placeholder="Krampon Ücreti (₺)"
                  value={bootsFee}
                  onChange={(e) => setBootsFee(e.target.value)}
                  className="rounded-lg bg-[#171A24] px-2 py-1 text-xs text-white border border-white/5"
                />
              )}

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={glovesRental}
                  onChange={(e) => setGlovesRental(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Eldiven Kiralama
              </label>
              {glovesRental && (
                <input
                  type="number"
                  placeholder="Eldiven Ücreti (₺)"
                  value={glovesFee}
                  onChange={(e) => setGlovesFee(e.target.value)}
                  className="rounded-lg bg-[#171A24] px-2 py-1 text-xs text-white border border-white/5"
                />
              )}

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vestsProvided}
                  onChange={(e) => setVestsProvided(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Yelek Temini
              </label>

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showerAvailable}
                  onChange={(e) => setShowerAvailable(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Sıcak Duş / Soyunma
              </label>

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parkingAvailable}
                  onChange={(e) => setParkingAvailable(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Otopark
              </label>
            </div>
          </div>

          {/* İletişim / Tel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0312 ... veya 0532 ..."
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Açık Adres</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Mahalle, Cadde No..."
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
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
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
