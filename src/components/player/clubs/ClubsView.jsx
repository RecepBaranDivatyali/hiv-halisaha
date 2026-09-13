import React, { useState } from 'react';
import { Shield, Plus, Users, Trophy, Flame, Check, ArrowUpRight } from 'lucide-react';
import { PlayerCreateClubModal } from './PlayerCreateClubModal';
import { playerDbService } from '../../../services/playerDbService';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function ClubsView({ clubs = [], onRefresh }) {
  const { currentUser, updateProfile } = usePlayerAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState(null);
  const [message, setMessage] = useState('');

  // Sort by points descending
  const sortedClubs = [...clubs].sort((a, b) => (b.points || 0) - (a.points || 0));

  const handleJoin = async (club) => {
    setJoiningClubId(club.id);
    setMessage('');
    try {
      await playerDbService.joinClub(club.id, currentUser);
      updateProfile({ clubId: club.id, clubName: club.name });
      setMessage(`Tebrikler! ${club.name} kulübüne başarıyla katıldınız.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMessage(err.message || 'Kulübe katılırken bir hata oluştu.');
    } finally {
      setJoiningClubId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-xl sm:text-2xl font-black text-white">
            Kulüpler & H.İ.V. Ligi
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Halısaha takımları puan tablosu, haftalık lig mücadeleleri ve kadrolar
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#8eff71] px-4 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Kulüp Kur</span>
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-[#8eff71]/30 bg-[#8eff71]/10 p-3 text-xs font-bold text-[#8eff71] text-center">
          {message}
        </div>
      )}

      {/* ─── LEAGUE LEADERBOARD TABLE ─── */}
      <div className="rounded-3xl border border-white/5 bg-[#0E1119] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#121622]">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#ffd166]" />
            <h2 className="font-montserrat text-sm font-black text-white">Genel Lig Sıralaması</h2>
          </div>
          <span className="text-xs text-white/40 font-semibold">2026 Sezonu • Aktif Lig</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-white/40">
                <th className="py-3 px-6">Sıra</th>
                <th className="py-3 px-6">Kulüp</th>
                <th className="py-3 px-6">Şehir</th>
                <th className="py-3 px-6">Seviye</th>
                <th className="py-3 px-6">Kadro</th>
                <th className="py-3 px-6 text-right">Puan</th>
                <th className="py-3 px-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-white/80">
              {sortedClubs.map((club, index) => {
                const isMember = currentUser.clubId === club.id;
                const isFull = (club.membersCount || 0) >= (club.maxMembers || 50);

                return (
                  <tr key={club.id} className="hover:bg-white/[0.02] transition">
                    {/* Rank */}
                    <td className="py-4 px-6">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-montserrat text-xs font-black ${
                        index === 0
                          ? 'bg-[#8eff71] text-[#064200]'
                          : index === 1
                            ? 'bg-white/20 text-white'
                            : index === 2
                              ? 'bg-[#ff7351]/20 text-[#ff7351]'
                              : 'bg-white/5 text-white/50'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>

                    {/* Club Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md"
                          style={{ backgroundColor: `${club.color || '#8eff71'}25`, color: club.color || '#8eff71' }}
                        >
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-montserrat font-bold text-white leading-snug">{club.name}</div>
                          <div className="text-[10px] text-white/40">{club.desc || 'H.İ.V. Resmi Takımı'}</div>
                        </div>
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-4 px-6 text-white/60">{club.city || 'İstanbul'}</td>

                    {/* Level */}
                    <td className="py-4 px-6">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black text-[#8eff71]">
                        Lv {club.level || 1}
                      </span>
                    </td>

                    {/* Members */}
                    <td className="py-4 px-6">
                      <span className="font-bold">{club.membersCount || 1}</span>
                      <span className="text-white/40">/{club.maxMembers || 50}</span>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-6 text-right">
                      <span className="font-montserrat font-black text-sm text-[#8eff71]">
                        {(club.points || 1000).toLocaleString('tr-TR')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      {isMember ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#8eff71]/20 px-2.5 py-1 text-[11px] font-bold text-[#8eff71]">
                          <Check className="h-3 w-3" /> Üyesisiniz
                        </span>
                      ) : (
                        <button
                          disabled={isFull || joiningClubId === club.id}
                          onClick={() => handleJoin(club)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white hover:bg-[#8eff71] hover:text-[#064200] hover:border-[#8eff71] disabled:opacity-40 transition"
                        >
                          {isFull ? 'Dolu' : joiningClubId === club.id ? 'Katılınıyor...' : 'Katıl'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PlayerCreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
