import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Star, Trash2, Edit3, Check, X, Clock, 
  DollarSign, Activity, AlertTriangle, ShieldCheck, Phone, CheckCircle, MessageSquare
} from 'lucide-react';
import { CreatePitchModal } from './CreatePitchModal';
import { EditPitchModal } from './EditPitchModal';
import { adminDbService } from '../../services/adminDbService';

export function PitchManager({ pitches = [], onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('pitches'); // 'pitches' | 'proposals'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState(null);
  const [loading, setLoading] = useState(false);

  // Proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalFilter, setProposalFilter] = useState('pending'); // 'pending' | 'all'

  useEffect(() => {
    const unsub = adminDbService.subscribePitchProposals((list) => {
      setProposals(list || []);
    });
    return () => unsub();
  }, []);

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const displayedProposals = proposalFilter === 'pending'
    ? proposals.filter(p => p.status === 'pending')
    : proposals;

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

  const handleApproveProposal = async (proposal) => {
    if (!window.confirm(`"${proposal.pitchName}" için önerilen bilgileri onaylayıp sahayı güncellemek istiyor musunuz?`)) return;
    setLoading(true);
    try {
      await adminDbService.approvePitchProposal(proposal.id, proposal.pitchId, proposal.proposedData);
      alert('✓ Öneri onaylandı ve saha bilgileri güncellendi!');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Öneri onaylama hatası:', e);
      alert('Öneri onaylanırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!window.confirm('Bu öneriyi reddetmek istediğinizden emin misiniz?')) return;
    setLoading(true);
    try {
      await adminDbService.rejectPitchProposal(proposalId);
      alert('Öneri reddedildi.');
    } catch (e) {
      console.error('Öneri reddetme hatası:', e);
      alert('Öneri reddedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">HALISAHALAR & TESİS YÖNETİMİ</h2>
          <p className="text-xs text-white/50">Tesis bilgilerini, saatlik ücretleri, saat sınırlarını ve kullanıcı önerilerini yönetin</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub Tab Switcher */}
          <div className="flex rounded-xl bg-[#12141C] p-1 border border-white/5">
            <button
              onClick={() => setActiveSubTab('pitches')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'pitches'
                  ? 'bg-[#8eff71] text-[#064200]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Tesisler ({pitches.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('proposals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition relative ${
                activeSubTab === 'proposals'
                  ? 'bg-[#8eff71] text-[#064200]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Kullanıcı Önerileri</span>
              {pendingProposals.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'proposals' ? 'bg-[#064200] text-[#8eff71]' : 'bg-[#ff7351] text-white'
                }`}>
                  {pendingProposals.length}
                </span>
              )}
            </button>
          </div>

          {activeSubTab === 'pitches' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-5 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Yeni Tesis Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB 1: TESİSLER LİSTESİ ─── */}
      {activeSubTab === 'pitches' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => (
            <div
              key={pitch.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-[#12141C]/90 p-6 backdrop-blur-xl transition hover:border-white/15 hover:bg-[#161924]"
            >
              <div>
                {/* Header */}
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

                {/* Info Fields */}
                <div className="mt-5 space-y-2.5 border-t border-white/5 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Saatlik Tek Maç:</span>
                    <span className="font-montserrat font-black text-[#8eff71]">
                      ₺{pitch.hourlyFee || pitch.pricePerHour || 780}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Abone Ücreti:</span>
                    <span className="font-semibold text-white/80">
                      {pitch.subscriberFee ? `₺${pitch.subscriberFee}` : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Çalışma Saatleri:</span>
                    <span className="font-semibold text-white/80">
                      {pitch.openingTime || '09:00'} - {pitch.closingTime || '22:00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Alt Saha Sayısı:</span>
                    <span className="font-semibold text-white/80">
                      {pitch.subFields?.length || 1} Saha
                    </span>
                  </div>

                  {/* Formatlar */}
                  <div className="pt-1">
                    <span className="text-white/40 block mb-1">Oynanabilen Formatlar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(pitch.optimalModes || ['7v7']).map(m => (
                        <span key={m} className="px-2 py-0.5 rounded bg-[#8eff71]/15 text-[#8eff71] text-[10px] font-bold">
                          {m} (İdeal)
                        </span>
                      ))}
                      {(pitch.tightModes || ['8v8']).map(m => (
                        <span key={m} className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-400 text-[10px] font-bold">
                          {m} (Sıkışık)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ekipman Özeti */}
                  <div className="flex items-center gap-3 pt-2 text-[11px] text-white/60">
                    <span className={pitch.equipmentRental?.bootsRental ? 'text-[#8eff71]' : 'text-white/30'}>
                      👟 Krampon: {pitch.equipmentRental?.bootsRental ? `${pitch.equipmentRental.bootsFee || 50}₺` : 'Yok'}
                    </span>
                    <span className={pitch.equipmentRental?.glovesRental ? 'text-[#8eff71]' : 'text-white/30'}>
                      🧤 Eldiven: {pitch.equipmentRental?.glovesRental ? `${pitch.equipmentRental.glovesFee || 30}₺` : 'Yok'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8eff71]">
                  <span className="h-2 w-2 rounded-full bg-[#8eff71]"></span>
                  Aktif Tesis
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPitch(pitch)}
                    title="Bilgileri Düzenle"
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-[#8eff71]/10 hover:text-[#8eff71] transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Düzenle</span>
                  </button>

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
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: KULLANICI ÖNERİLERİ & KIYASLAMA EKRANI ─── */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-4">
          {/* Sub filter bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setProposalFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  proposalFilter === 'pending'
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                İncelenmeyi Bekleyenler ({pendingProposals.length})
              </button>
              <button
                onClick={() => setProposalFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  proposalFilter === 'all'
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Tümü ({proposals.length})
              </button>
            </div>
          </div>

          {displayedProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#12141C] p-12 text-center">
              <CheckCircle className="h-12 w-12 text-[#8eff71]/40 mb-3" />
              <h3 className="font-montserrat text-base font-bold text-white">Bekleyen Öneri Yok</h3>
              <p className="text-xs text-white/50 max-w-sm mt-1">
                Kullanıcılar mobil uygulamadaki tesis detayından bilgi önerisinde bulunduğunda burada kıyaslamalı olarak listelenecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedProposals.map((proposal) => {
                const isPending = proposal.status === 'pending';
                const orig = proposal.originalData || {};
                const prop = proposal.proposedData || {};

                return (
                  <div
                    key={proposal.id}
                    className={`overflow-hidden rounded-3xl border bg-[#12141C] p-6 transition ${
                      isPending ? 'border-[#8eff71]/30 bg-[#12141C]' : 'border-white/5 opacity-70'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#8eff71]">{proposal.pitchName}</span>
                          <span className="text-xs text-white/40">• {proposal.district || ''} / {proposal.city || ''}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            proposal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-400/20 text-amber-400'
                          }`}>
                            {proposal.status === 'approved' ? '✓ Onaylandı' :
                             proposal.status === 'rejected' ? '✕ Reddedildi' :
                             'Bekliyor'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          Öneren: <b className="text-white">{proposal.userName}</b> • ID: {proposal.pitchId}
                        </p>
                      </div>

                      {/* Action buttons if pending */}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectProposal(proposal.id)}
                            disabled={loading}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reddet</span>
                          </button>

                          <button
                            onClick={() => handleApproveProposal(proposal)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8eff71] text-[#064200] font-black text-xs uppercase shadow-[0_0_15px_rgba(142,255,113,0.3)] hover:brightness-105 transition"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Onayla & Sahayı Güncelle</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* User Note if available */}
                    {proposal.notes && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/5 p-3 text-xs text-white/80">
                        <MessageSquare className="h-4 w-4 text-[#8eff71] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white">Kullanıcı Notu:</span> {proposal.notes}
                        </div>
                      </div>
                    )}

                    {/* ─── SIDE-BY-SIDE KIYASLAMA TABLOSU ─── */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-white/40">
                            <th className="pb-2 font-bold uppercase w-1/4">Özellik</th>
                            <th className="pb-2 font-bold uppercase w-3/8 text-white/60">Mevcut (Onaylı) Veri</th>
                            <th className="pb-2 font-bold uppercase w-3/8 text-[#8eff71]">Kullanıcının Önerdiği Veri</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {/* Saatlik Ücret */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Tek Maç Ücreti</td>
                            <td className="py-2.5 text-white/50">{orig.hourlyFee ? `₺${orig.hourlyFee}` : 'Belirtilmemiş'}</td>
                            <td className={`py-2.5 font-bold ${prop.hourlyFee !== orig.hourlyFee ? 'text-[#8eff71]' : 'text-white/80'}`}>
                              {prop.hourlyFee ? `₺${prop.hourlyFee}` : '-'}
                              {prop.hourlyFee && prop.hourlyFee !== orig.hourlyFee && ' (Yeni)'}
                            </td>
                          </tr>

                          {/* Abone Ücreti */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Abone Ücreti</td>
                            <td className="py-2.5 text-white/50">{orig.subscriberFee ? `₺${orig.subscriberFee}` : 'Belirtilmemiş'}</td>
                            <td className={`py-2.5 font-bold ${prop.subscriberFee !== orig.subscriberFee ? 'text-[#8eff71]' : 'text-white/80'}`}>
                              {prop.subscriberFee ? `₺${prop.subscriberFee}` : '-'}
                              {prop.subscriberFee && prop.subscriberFee !== orig.subscriberFee && ' (Yeni)'}
                            </td>
                          </tr>

                          {/* Çalışma Saatleri */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Çalışma Saatleri</td>
                            <td className="py-2.5 text-white/50">{orig.openingTime || '09:00'} - {orig.closingTime || '22:00'}</td>
                            <td className={`py-2.5 font-bold ${
                              (prop.openingTime !== orig.openingTime || prop.closingTime !== orig.closingTime) ? 'text-[#8eff71]' : 'text-white/80'
                            }`}>
                              {prop.openingTime || '09:00'} - {prop.closingTime || '22:00'}
                            </td>
                          </tr>

                          {/* Formatlar */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Formatlar (İdeal / Sıkışık)</td>
                            <td className="py-2.5 text-white/50">
                              İdeal: {(orig.optimalModes || []).join(', ') || '-'} • Sıkışık: {(orig.tightModes || []).join(', ') || '-'}
                            </td>
                            <td className="py-2.5 text-[#8eff71] font-bold">
                              İdeal: {(prop.optimalModes || []).join(', ') || '-'} • Sıkışık: {(prop.tightModes || []).join(', ') || '-'}
                            </td>
                          </tr>

                          {/* Krampon Kiralama */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Krampon Kiralama</td>
                            <td className="py-2.5 text-white/50">
                              {orig.equipmentRental?.bootsRental ? `Var (₺${orig.equipmentRental.bootsFee || 50})` : 'Yok / Belirtilmemiş'}
                            </td>
                            <td className={`py-2.5 font-bold ${
                              prop.equipmentRental?.bootsRental !== orig.equipmentRental?.bootsRental ? 'text-[#8eff71]' : 'text-white/80'
                            }`}>
                              {prop.equipmentRental?.bootsRental ? `Var (₺${prop.equipmentRental.bootsFee || 50})` : 'Yok'}
                            </td>
                          </tr>

                          {/* Eldiven Kiralama */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Eldiven Kiralama</td>
                            <td className="py-2.5 text-white/50">
                              {orig.equipmentRental?.glovesRental ? `Var (₺${orig.equipmentRental.glovesFee || 30})` : 'Yok / Belirtilmemiş'}
                            </td>
                            <td className={`py-2.5 font-bold ${
                              prop.equipmentRental?.glovesRental !== orig.equipmentRental?.glovesRental ? 'text-[#8eff71]' : 'text-white/80'
                            }`}>
                              {prop.equipmentRental?.glovesRental ? `Var (₺${prop.equipmentRental.glovesFee || 30})` : 'Yok'}
                            </td>
                          </tr>

                          {/* Telefon */}
                          <tr>
                            <td className="py-2.5 font-semibold text-white/70">Telefon</td>
                            <td className="py-2.5 text-white/50">{orig.phone || 'Yok'}</td>
                            <td className={`py-2.5 font-bold ${prop.phone !== orig.phone ? 'text-[#8eff71]' : 'text-white/80'}`}>
                              {prop.phone || 'Yok'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreatePitchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onRefresh}
      />

      {editingPitch && (
        <EditPitchModal
          isOpen={Boolean(editingPitch)}
          pitch={editingPitch}
          onClose={() => setEditingPitch(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
