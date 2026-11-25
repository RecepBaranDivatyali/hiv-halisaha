import React, { useState, useEffect } from 'react';
import { X, Trophy, Trash2, UserMinus } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';

function parseBenchEntries(benchData, benchKey, teamLabel) {
  if (!benchData) return [];
  if (Array.isArray(benchData)) {
    return benchData
      .map((item, idx) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return {
            id: item,
            uid: item,
            name: item,
            benchKey,
            benchIndex: idx,
            teamLabel,
          };
        }
        if (typeof item === 'object') {
          return {
            ...item,
            id: item.uid || item.id || `bench-${benchKey}-${idx}`,
            benchKey,
            benchIndex: idx,
            teamLabel,
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof benchData === 'object') {
    return Object.entries(benchData)
      .filter(([, val]) => val !== null && val !== undefined)
      .map(([key, val]) => {
        if (typeof val === 'object') {
          return {
            id: key,
            ...val,
            benchKey,
            objectKey: key,
            teamLabel,
          };
        }
        return {
          id: key,
          uid: key,
          name: String(val),
          benchKey,
          objectKey: key,
          teamLabel,
        };
      });
  }
  return [];
}

function removeEntryFromBench(benchData, entry) {
  if (!benchData) return [];
  const targetId = entry.uid || entry.id;
  if (Array.isArray(benchData)) {
    return benchData.filter((item, idx) => {
      if (!item) return false;
      if (entry.benchIndex !== undefined && idx === entry.benchIndex) return false;
      if (typeof item === 'string') return item !== targetId;
      return (item.uid || item.id) !== targetId;
    });
  }
  if (typeof benchData === 'object') {
    const next = { ...benchData };
    if (entry.objectKey && Object.prototype.hasOwnProperty.call(next, entry.objectKey)) {
      delete next[entry.objectKey];
      return next;
    }
    for (const [k, v] of Object.entries(next)) {
      if (k === targetId || (v && typeof v === 'object' && (v.uid === targetId || v.id === targetId))) {
        delete next[k];
      }
    }
    return next;
  }
  return benchData;
}

export function MatchDetailModal({ match, isOpen, onClose, onUpdate }) {
  const [status, setStatus] = useState(match?.status || 'active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setStatus(match.status || 'active');
    }
  }, [match]);

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

  const handleRemovePlayer = async (slotKey, playerName) => {
    if (!window.confirm(`"${playerName || 'Bu oyuncuyu'}" kadrodan çıkarmak istediğinizden emin misiniz?`)) return;
    setLoading(true);
    try {
      const updatedSlots = { ...(match.slots || {}) };
      delete updatedSlots[slotKey];

      const validRemainingCount = Object.keys(updatedSlots).filter(
        (k) => updatedSlots[k] && typeof updatedSlots[k] === 'object'
      ).length;

      await adminDbService.updateMatch(match.id, {
        slots: updatedSlots,
        joinedPlayersCount: validRemainingCount,
      });

      alert('✓ Oyuncu kadrodan çıkarıldı.');
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Oyuncu çıkarma hatası:', e);
      alert('Oyuncu çıkarılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBenchPlayer = async (benchEntry) => {
    if (
      !window.confirm(
        `"${benchEntry.name || 'Bu yedek oyuncuyu'}" yedek kulübesinden çıkarmak istediğinizden emin misiniz?`
      )
    )
      return;
    setLoading(true);
    try {
      const benchKey = benchEntry.benchKey;
      const updatedBench = removeEntryFromBench(match[benchKey], benchEntry);

      await adminDbService.updateMatch(match.id, {
        [benchKey]: updatedBench,
      });

      alert('✓ Oyuncu yedek kulübesinden çıkarıldı.');
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Yedek oyuncu çıkarma hatası:', e);
      alert('Yedek oyuncu çıkarılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const slots = match.slots || {};
  const slotKeys = Object.keys(slots).filter((k) => slots[k] && typeof slots[k] === 'object');

  const benchAList = parseBenchEntries(match.benchA, 'benchA', 'A Takımı Yedeği');
  const benchBList = parseBenchEntries(match.benchB, 'benchB', 'B Takımı Yedeği');
  const reservesList = parseBenchEntries(match.reserves, 'reserves', 'Genel Yedek');
  const allBenchPlayers = [...benchAList, ...benchBList, ...reservesList];

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
              <p className="text-xs text-white/50">
                {match.dateTime} • {match.mode}
              </p>
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
                {status === 'completed'
                  ? 'Tamamlandı'
                  : status === 'cancelled'
                  ? 'İptal Edildi'
                  : 'Kayıt Açık'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                disabled={loading || status === 'active'}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  status === 'active'
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
              <div className="mt-1 text-sm font-bold text-white">
                {match.city || 'İstanbul'} / {match.district || 'Merkez'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Organizatör</div>
              <div className="mt-1 text-sm font-bold text-white">{match.organizer || 'Admin'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Kişi Başı Ücret</div>
              <div className="mt-1 text-sm font-bold text-[#8eff71]">₺{match.fee ?? 150}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Toplam Saha Ücreti</div>
              <div className="mt-1 text-sm font-bold text-white">₺{match.totalFee ?? 2100}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Format & Kaleci</div>
              <div className="mt-1 text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {match.matchFormatType === 'two_captains' ? 'İki Kaptanlı' : 'Tek Organizatör'}
                </span>
                {match.isRotatingGk ? (
                  <span className="rounded bg-[#f59e0b]/15 px-2 py-0.5 text-[10px] font-bold text-[#f59e0b]">
                    🔄 Kale Dönmeli
                  </span>
                ) : match.isGkFree ? (
                  <span className="rounded bg-[#8eff71]/15 px-2 py-0.5 text-[10px] font-bold text-[#8eff71]">
                    🧤 Ücretsiz GK
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4">
              <div className="text-xs font-bold uppercase text-white/40">Saha Durumu</div>
              <div className="mt-1 text-sm font-bold text-white">
                {match.hasReservation ? (
                  <span className="text-[#8eff71]">✓ Sahası Hazır</span>
                ) : match.isPitchFlexible ? (
                  <span className="text-[#f59e0b]">🔍 Saha Aranıyor</span>
                ) : (
                  <span className="text-white/60">Standart</span>
                )}
              </div>
            </div>
          </div>

          {/* İki Kaptan ve Katılım Şartları */}
          {(match.matchFormatType === 'two_captains' ||
            match.captainBId ||
            match.teamAJoinTerms !== undefined ||
            match.teamBJoinTerms !== undefined) && (
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4 space-y-3">
              <div className="text-xs font-bold uppercase text-white/40">
                Takım Kaptanları & Katılım Şartları
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5">
                  <div className="font-bold text-[#8eff71]">A TAKIMI (Kaptan A)</div>
                  <div className="text-white font-medium mt-1">
                    {match.captainAName || match.organizer || 'Organizatör'}
                  </div>
                  <div className="text-white/40 text-[11px] mt-1">
                    Şart:{' '}
                    {
                      ['Herkese Açık', 'İstekle Katılma', 'Davetle Katılma', 'Katılma Kapalı'][
                        match.teamAJoinTerms ?? match.joinTerms ?? 0
                      ]
                    }
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5">
                  <div className="font-bold text-[#6e9bff]">B TAKIMI (Kaptan B)</div>
                  <div className="text-white font-medium mt-1">
                    {match.captainBName || (match.captainBId ? 'B Kaptanı' : 'Henüz Atanmadı')}
                  </div>
                  <div className="text-white/40 text-[11px] mt-1">
                    Şart:{' '}
                    {
                      ['Herkese Açık', 'İstekle Katılma', 'Davetle Katılma', 'Katılma Kapalı'][
                        match.teamBJoinTerms ?? 0
                      ]
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kadro / Roster List */}
          <div>
            <h4 className="font-montserrat text-xs font-black uppercase tracking-wider text-white/60 mb-3">
              Katılan Oyuncular (
              {slotKeys.length > 0 ? slotKeys.length : match.joinedPlayersCount ?? 0} /{' '}
              {match.totalRequiredPlayers || 14})
            </h4>
            <div className="space-y-2">
              {slotKeys.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-[#171A24] p-3 text-xs text-white/50">
                  Kadro slot bilgisi bulunmuyor veya henüz oyuncu katılmamış.
                </div>
              ) : (
                slotKeys.map((k) => {
                  const p = slots[k];
                  return (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3 transition hover:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                          }
                          alt={p.name || 'Oyuncu'}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{p.name || 'Oyuncu'}</div>
                          <div className="text-[10px] text-white/40">
                            {p.position || 'Mevki Belirtilmedi'} • Slot: {k}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#8eff71]/10 px-2 py-0.5 text-[10px] font-bold text-[#8eff71]">
                          Kadroda
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(k, p.name)}
                          disabled={loading}
                          title="Oyuncuyu Kadrodan Çıkar"
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span>Kadrodan Çıkar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Yedek Kulübesi (Bench) */}
          {allBenchPlayers.length > 0 && (
            <div>
              <h4 className="font-montserrat text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <span>Yedek Kulübesi ({allBenchPlayers.length})</span>
              </h4>
              <div className="space-y-2">
                {allBenchPlayers.map((bp, idx) => (
                  <div
                    key={`${bp.benchKey}-${bp.id || idx}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171A24] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          bp.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                        }
                        alt={bp.name || 'Yedek Oyuncu'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {bp.name || 'Yedek Oyuncu'}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {bp.position || 'Mevki Belirtilmedi'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        {bp.teamLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenchPlayer(bp)}
                        disabled={loading}
                        title="Yedek Kulübesinden Çıkar"
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>Yedekten Çıkar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
