import React, { useState } from 'react';
import { X, Trophy, MapPin, Clock, Calendar, Users, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

export function MatchDetailModal({ match, isOpen, onClose, onUpdate }) {
  const [status, setStatus] = useState(match?.status || 'open');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !match) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await adminDbService.updateMatch(match.id, { status: newStatus });
      setStatus(newStatus);
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Durum güncelleme hatası:', e);
      alert('Maç durumu güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu maçı tamamen silmek istediğinizden emin misiniz?')) return;
    setLoading(true);
    try {
      await adminDbService.deleteMatch(match.id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (e) {
      console.error('Maç silme hatası:', e);
      alert('Maç silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const slots = match.slots || {};
  const slotKeys = Object.keys(slots);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/10 text-[#8eff71]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-lg font-black text-white">{match.arena}</h3>
              <p className="text-xs text-white/50">{match.dateTime} • {match.mode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Status Switcher */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#171A24] p-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/50">Mevcut Durum</div>
              <div className="mt-1 font-montserrat text-sm font-black uppercase text-[#8eff71]">
                {status === 'completed' ? 'Tamamlandı' : status === 'cancelled' ? 'İptal Edildi' : 'Kayıt Açık'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('open')}
                disabled={loading || status === 'open'}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  status === 'open'
                    ? 'bg-[#8eff71] text-[#064200]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Açık
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                disabled={loading || status === 'completed'}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  status === 'completed'
                    ? 'bg-[#6e9bff] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Tamamlandı
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading || status === 'cancelled'}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  status === 'cancelled'
                    ? 'bg-[#ff7351] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                İptal Et
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Şehir / İlçe</div>
              <div className="mt-1 text-sm font-bold text-white">{match.city || 'İstanbul'} / {match.district || 'Merkez'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Organizatör</div>
              <div className="mt-1 text-sm font-bold text-white">{match.organizer || 'Admin'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Kişi Başı Ücret</div>
              <div className="mt-1 text-sm font-bold text-[#8eff71]">₺{match.fee || 150}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Toplam Saha Ücreti</div>
              <div className="mt-1 text-sm font-bold text-white">₺{match.totalFee || 2100}</div>
            </div>
          </div>

          {/* Kadro / Roster List */}
          <div>
            <h4 className="font-montserrat text-xs font-black uppercase tracking-wider text-white/60 mb-3">
              Katılan Oyuncular ({slotKeys.length > 0 ? slotKeys.length : match.joinedPlayersCount || 1} / {match.totalRequiredPlayers || 14})
            </h4>
            <div className="space-y-2">
              {slotKeys.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-[#171A24] p-3 text-xs text-white/50">
                  Kadro slot bilgisi bulunmuyor veya varsayılan organizatör atanmış.
                </div>
              ) : (
                slotKeys.map((k) => {
                  const p = slots[k];
                  return (
                    <div key={k} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                        <div>
                          <div className="text-xs font-bold text-white">{p.name || 'Oyuncu'}</div>
                          <div className="text-[10px] text-white/40">{p.position || 'Mevki Belirtilmedi'}</div>
                        </div>
                      </div>
                      <span className="rounded bg-[#8eff71]/10 px-2 py-0.5 text-[10px] font-bold text-[#8eff71]">Kadroda</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#ff7351]/30 bg-[#ff7351]/10 px-4 py-2.5 text-xs font-bold text-[#ff7351] hover:bg-[#ff7351]/20 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Maçı Sil</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
