import React, { useState } from 'react';
import { X, Shield, Plus, Trophy, Award } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

export function CreateClubModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState(15000);
  const [maxMembers, setMaxMembers] = useState(50);
  const [level, setLevel] = useState(5);
  const [color, setColor] = useState('#8eff71');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await adminDbService.createClub({
        name: name.trim(),
        desc: desc.trim(),
        points: Number(points),
        maxMembers: Number(maxMembers),
        membersCount: 1,
        level: Number(level),
        color
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Kulüp ekleme hatası:', err);
      alert('Kulüp eklenirken bir hata meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6e9bff]/10 text-[#6e9bff]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-lg font-black text-white">YENİ KULÜP KUR</h3>
              <p className="text-xs text-white/50">Lig sıralamasına yeni bir takım ekleyin</p>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Kulüp İsmi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Örn: CYBER TITANS"
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Açıklama / Slogan</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Hız ve veri odaklı elit futbol topluluğu."
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Başlangıç Puanı</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Kulüp Seviyesi</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
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
              className="rounded-xl bg-[#6e9bff] px-6 py-2.5 text-xs font-black uppercase text-white shadow-[0_0_20px_rgba(110,155,255,0.3)] transition hover:brightness-105"
            >
              {loading ? 'Ekleniyor...' : 'Kulübü Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
