import React, { useState } from 'react';
import { X, Shield, Plus } from 'lucide-react';
import { playerDbService } from '../../../services/playerDbService';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function PlayerCreateClubModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = usePlayerAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [color, setColor] = useState('#8eff71');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const colors = ['#8eff71', '#6e9bff', '#ff7351', '#88f6ff', '#ffd166', '#a06cd5'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Kulüp adı boş bırakılamaz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await playerDbService.createClub({
        name: name.trim(),
        desc: desc.trim(),
        city: city,
        color: color,
        points: 1000,
        level: 1,
        maxMembers: 50
      }, currentUser);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Kulüp oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E1119] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8eff71]/15 text-[#8eff71]">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-montserrat text-base font-black text-white">Yeni Kulüp Kur</h3>
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
              Kulüp Adı *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: KADIKÖY KARTALLARI"
              className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1.5">
              Kulüp Açıklaması / Slogan
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Örn: Hızlı pas, disiplinli savunma."
              className="w-full rounded-xl border border-white/5 bg-[#171B26] p-3 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

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
              Takım Rengi
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8eff71] py-3.5 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 disabled:opacity-50 transition"
          >
            {loading ? 'Kulüp Kuruluyor...' : 'Kulübü Oluştur (1.000 Başlangıç Puanı)'}
          </button>
        </form>
      </div>
    </div>
  );
}
