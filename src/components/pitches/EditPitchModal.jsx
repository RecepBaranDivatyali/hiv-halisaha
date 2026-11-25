import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2 } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

const ALL_MODES = ['5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11'];

function computeLastSlot(closingTime = '22:00') {
  const raw = String(closingTime || '22:00').trim();
  const [hStr, mStr] = raw.split(':');
  const parsedH = parseInt(hStr, 10);
  const h = Number.isNaN(parsedH) ? 22 : parsedH;
  const m = (mStr || '00').padStart(2, '0');
  const prevH = String((h + 23) % 24).padStart(2, '0');
  const endH = String(((h % 24) + 24) % 24).padStart(2, '0');
  return `${prevH}:${m}-${endH}:${m}`;
}

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
  const [surface, setSurface] = useState('Suni Çim');

  // Equipment & Amenities
  const [bootsRental, setBootsRental] = useState(false);
  const [bootsFee, setBootsFee] = useState('');
  const [glovesRental, setGlovesRental] = useState(false);
  const [glovesFee, setGlovesFee] = useState('');
  const [vestsProvided, setVestsProvided] = useState(true);
  const [showerAvailable, setShowerAvailable] = useState(true);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [cafeteriaAvailable, setCafeteriaAvailable] = useState(true);
  const [wifiAvailable, setWifiAvailable] = useState(true);

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

      const resolvedFee =
        pitch.hourlyFee ??
        pitch.price ??
        pitch.hourlyRateNormal ??
        pitch.pricePerHour ??
        '';
      setHourlyFee(resolvedFee !== '' && resolvedFee !== null ? String(resolvedFee) : '');

      const resolvedSubFee =
        pitch.subscriberFee ??
        pitch.hourlyRateSubscriber ??
        '';
      setSubscriberFee(resolvedSubFee !== '' && resolvedSubFee !== null ? String(resolvedSubFee) : '');

      setOpeningTime(pitch.openingTime || pitch.openTime || '09:00');
      setClosingTime(pitch.closingTime || pitch.closeTime || '22:00');
      setPhone(pitch.phone || '');
      setAddress(pitch.address || '');
      setSurface(pitch.surface || pitch.surfaceType || 'Suni Çim');

      const existingAmenities = Array.isArray(pitch.amenities) ? pitch.amenities : [];
      setBootsRental(pitch.equipmentRental?.bootsRental ?? existingAmenities.includes('Krampon Kiralama'));
      setBootsFee(
        pitch.equipmentRental?.bootsFee !== undefined && pitch.equipmentRental?.bootsFee !== null
          ? String(pitch.equipmentRental.bootsFee)
          : ''
      );
      setGlovesRental(pitch.equipmentRental?.glovesRental ?? existingAmenities.includes('Eldiven Kiralama'));
      setGlovesFee(
        pitch.equipmentRental?.glovesFee !== undefined && pitch.equipmentRental?.glovesFee !== null
          ? String(pitch.equipmentRental.glovesFee)
          : ''
      );
      setVestsProvided(pitch.equipmentRental?.vestsProvided ?? true);
      setShowerAvailable(pitch.equipmentRental?.showerAvailable ?? existingAmenities.includes('Duş'));
      setParkingAvailable(pitch.equipmentRental?.parkingAvailable ?? existingAmenities.includes('Otopark'));
      setCafeteriaAvailable(
        pitch.equipmentRental?.cafeteriaAvailable ??
          (existingAmenities.length === 0 || existingAmenities.includes('Kafeterya'))
      );
      setWifiAvailable(
        pitch.equipmentRental?.wifiAvailable ??
          (existingAmenities.length === 0 || existingAmenities.includes('Wi-Fi'))
      );

      setOptimalModes(Array.isArray(pitch.optimalModes) && pitch.optimalModes.length > 0 ? pitch.optimalModes : ['7v7']);
      setTightModes(Array.isArray(pitch.tightModes) ? pitch.tightModes : ['8v8']);
      setSubFields(
        Array.isArray(pitch.subFields) && pitch.subFields.length > 0
          ? [...pitch.subFields]
          : [
              {
                id: 'sf-1',
                name: 'Halı Saha 1',
                surface: pitch.surface || 'Suni Çim',
                slotType: 'full',
                lastSlot: computeLastSlot(pitch.closingTime || '22:00'),
              },
            ]
      );
    }
  }, [pitch, isOpen]);

  if (!isOpen || !pitch) return null;

  const handleToggleOptimal = (m) => {
    if (optimalModes.includes(m)) {
      setOptimalModes(optimalModes.filter((item) => item !== m));
    } else {
      setOptimalModes([...optimalModes, m]);
      setTightModes(tightModes.filter((item) => item !== m));
    }
  };

  const handleToggleTight = (m) => {
    if (tightModes.includes(m)) {
      setTightModes(tightModes.filter((item) => item !== m));
    } else {
      setTightModes([...tightModes, m]);
      setOptimalModes(optimalModes.filter((item) => item !== m));
    }
  };

  const handleAddSubField = () => {
    const nextNum = subFields.length + 1;
    setSubFields([
      ...subFields,
      {
        id: `sf-${Date.now()}`,
        name: `Halı Saha ${nextNum}`,
        surface: surface || 'Suni Çim',
        slotType: 'full',
        lastSlot: computeLastSlot(closingTime),
      },
    ]);
  };

  const handleRemoveSubField = (index) => {
    if (subFields.length <= 1) return;
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
      const fallbackFee =
        pitch.hourlyFee ?? pitch.price ?? pitch.hourlyRateNormal ?? pitch.pricePerHour ?? 1400;
      const priceNum =
        hourlyFee !== '' && !Number.isNaN(Number(hourlyFee))
          ? Number(hourlyFee)
          : Number(fallbackFee) || 1400;

      const hasSubFee = subscriberFee !== '' && !Number.isNaN(Number(subscriberFee));
      const subPriceNum = hasSubFee
        ? Number(subscriberFee)
        : Number(pitch.subscriberFee ?? pitch.hourlyRateSubscriber ?? 0);

      const dynamicAmenities = [
        parkingAvailable && 'Otopark',
        showerAvailable && 'Duş',
        cafeteriaAvailable && 'Kafeterya',
        wifiAvailable && 'Wi-Fi',
        vestsProvided && 'Yelek',
        bootsRental && 'Krampon Kiralama',
        glovesRental && 'Eldiven Kiralama',
      ].filter(Boolean);

      const equipmentRentalPayload = {
        bootsRental: Boolean(bootsRental),
        bootsFee: bootsRental && bootsFee !== '' ? Number(bootsFee) : 0,
        glovesRental: Boolean(glovesRental),
        glovesFee: glovesRental && glovesFee !== '' ? Number(glovesFee) : 0,
        vestsProvided: Boolean(vestsProvided),
        showerAvailable: Boolean(showerAvailable),
        parkingAvailable: Boolean(parkingAvailable),
        cafeteriaAvailable: Boolean(cafeteriaAvailable),
        wifiAvailable: Boolean(wifiAvailable),
      };

      const cleanedSubFields = subFields.map((sf, idx) => ({
        id: sf.id || `sf-${idx + 1}`,
        name: (sf.name || `Halı Saha ${idx + 1}`).trim(),
        surface: sf.surface || surface || 'Suni Çim',
        slotType: sf.slotType || 'full',
        lastSlot: sf.lastSlot || computeLastSlot(closingTime),
      }));

      const updatePayload = {
        name: name.trim(),
        city: city.trim(),
        district: district.trim(),
        surface: (surface || 'Suni Çim').trim(),
        surfaceType: (surface || 'Suni Çim').trim(),
        hourlyFee: priceNum,
        price: priceNum,
        hourlyRateNormal: priceNum,
        pricePerHour: priceNum,
        ...(subPriceNum > 0
          ? {
              subscriberFee: subPriceNum,
              hourlyRateSubscriber: subPriceNum,
            }
          : {
              subscriberFee: 0,
              hourlyRateSubscriber: 0,
            }),
        openingTime: openingTime || '09:00',
        closingTime: closingTime || '22:00',
        openTime: openingTime || '09:00',
        closeTime: closingTime || '22:00',
        phone: phone.trim(),
        address: address.trim(),
        optimalModes,
        tightModes,
        formats: optimalModes.length > 0 ? optimalModes : ['7v7'],
        amenities: dynamicAmenities,
        equipmentRental: equipmentRentalPayload,
        subFields: cleanedSubFields,
      };

      await adminDbService.updatePitch(pitch.id, updatePayload);

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Tesis / Saha Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Zemin Türü</label>
              <input
                type="text"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
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
                  min={0}
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
                  min={0}
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
                  placeholder="22:00 veya 00:00"
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
                {ALL_MODES.map((m) => (
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
                {ALL_MODES.map((m) => (
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
                  {subFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubField(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
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

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cafeteriaAvailable}
                  onChange={(e) => setCafeteriaAvailable(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Kafeterya
              </label>

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifiAvailable}
                  onChange={(e) => setWifiAvailable(e.target.checked)}
                  className="rounded border-white/20 bg-[#171A24] text-[#8eff71] focus:ring-0"
                />
                Wi-Fi
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
