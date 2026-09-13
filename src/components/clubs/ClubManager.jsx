import React, { useState } from 'react';
import { Shield, Plus, Trophy, Users, Award, Trash2, ArrowUpRight } from 'lucide-react';
import { CreateClubModal } from './CreateClubModal';
import { adminDbService } from '../../services/adminDbService';

export function ClubManager({ clubs = [], onRefresh }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sortedClubs = [...clubs].sort((a, b) => (b.points || 0) - (a.points || 0));

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Bu kulübü silmek istediğinizden emin misiniz?')) return;
    setLoading(true);
    try {
      await adminDbService.deleteClub(clubId);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Kulüp silme hatası:', e);
      alert('Kulüp silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">KULÜPLER & LİG TABLOSU</h2>
          <p className="text-xs text-white/50">Halısaha takımlarını, kadro kapasitelerini ve lig puan durumunu yönetin</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#6e9bff] px-5 py-2.5 text-xs font-black uppercase text-white shadow-[0_0_20px_rgba(110,155,255,0.3)] transition hover:brightness-105"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Kulüp Ekle</span>
        </button>
      </div>

      {/* Clubs Grid / Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
        {sortedClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-white/20" />
            <p className="mt-3 text-sm font-bold text-white/60">Kayıtlı kulüp bulunamadı</p>
            <p className="text-xs text-white/40">Yeni bir kulüp oluşturarak başlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-6 py-4">Sıra</th>
                  <th className="px-6 py-4">Kulüp & Slogan</th>
                  <th className="px-6 py-4">Lig Puanı</th>
                  <th className="px-6 py-4">Kadro Durumu</th>
                  <th className="px-6 py-4">Seviye</th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedClubs.map((club, index) => (
                  <tr key={club.id || index} className="transition hover:bg-white/5">
                    <td className="px-6 py-4">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-montserrat text-xs font-black ${
                        index === 0
                          ? 'bg-[#8eff71]/20 text-[#8eff71] border border-[#8eff71]/30'
                          : index === 1
                          ? 'bg-[#6e9bff]/20 text-[#6e9bff] border border-[#6e9bff]/30'
                          : index === 2
                          ? 'bg-[#88f6ff]/20 text-[#88f6ff] border border-[#88f6ff]/30'
                          : 'bg-white/5 text-white/40'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#171A24] text-[#6e9bff]">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{club.name}</div>
                          <div className="text-[11px] text-white/40">{club.desc || 'Açıklama belirtilmedi'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-montserrat text-sm font-black text-[#8eff71]">
                        {(club.points || 15000).toLocaleString('tr-TR')}
                      </div>
                      <div className="text-[9px] font-bold text-white/30 uppercase">{club.rank || 'LİG SIRALAMASI'}</div>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-white/40" />
                        <span className="font-bold text-white">{club.membersCount || 1}</span>
                        <span className="text-white/40">/ {club.maxMembers || 50} Üye</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-[#6e9bff]/10 px-2.5 py-1 text-[11px] font-bold text-[#6e9bff]">
                        Seviye {club.level || 5}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteClub(club.id)}
                        disabled={loading}
                        title="Kulübü Sil"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7351]/10 text-[#ff7351] hover:bg-[#ff7351]/20 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
