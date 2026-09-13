import React, { useState } from 'react';
import { MapPin, Plus, Star, Trash2, DollarSign, Activity } from 'lucide-react';
import { CreatePitchModal } from './CreatePitchModal';
import { adminDbService } from '../../services/adminDbService';

export function PitchManager({ pitches = [], onRefresh }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeletePitch = async (pitchId) => {
    if (!window.confirm('Bu tesisi listeden silmek istediğinizden emin misiniz?')) return;
    setLoading(true);
    try {
      await adminDbService.deletePitch(pitchId);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Tesis silme hatası:', e);
      alert('Tesis silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">HALISAHALAR & TESİSLER</h2>
          <p className="text-xs text-white/50">Anlaşmalı spor tesislerini, saatlik kiralama ücretlerini ve zemin türlerini yönetin</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-5 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Tesis Ekle</span>
        </button>
      </div>

      {/* Pitches Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pitches.map((pitch) => (
          <div
            key={pitch.id}
            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#12141C]/90 p-6 backdrop-blur-xl transition hover:border-white/15 hover:bg-[#161924]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#171A24] text-[#8eff71]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-montserrat text-base font-bold text-white">{pitch.name}</h3>
                  <p className="text-xs text-white/40">{pitch.city} / {pitch.district}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#8eff71]/10 px-2 py-1 text-xs font-black text-[#8eff71]">
                <Star className="h-3.5 w-3.5 fill-[#8eff71]" />
                <span>{(pitch.rating || 4.8).toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Zemin Türü:</span>
                <span className="font-semibold text-white/80">{pitch.surface || 'Suni Çim'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Saatlik Ücret:</span>
                <span className="font-montserrat text-sm font-black text-[#8eff71]">₺{pitch.pricePerHour || 2000}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Yorum Sayısı:</span>
                <span className="font-semibold text-white/80">{pitch.reviewsCount || 0} Değerlendirme</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8eff71]">
                <span className="h-2 w-2 rounded-full bg-[#8eff71]"></span>
                Rezervasyona Açık
              </span>

              <button
                onClick={() => handleDeletePitch(pitch.id)}
                disabled={loading}
                title="Tesisi Kaldır"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7351]/10 text-[#ff7351] hover:bg-[#ff7351]/20 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreatePitchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
