import React, { useState, useEffect } from 'react';
import { Shield, Plus, Users, Trash2, Edit3, Search, X } from 'lucide-react';
import { CreateClubModal } from './CreateClubModal';
import { adminDbService } from '../../services/adminDbService';

export function ClubManager({
  clubs = [],
  onRefresh,
  searchQuery = '',
  onSearchChange,
  onClearSearch,
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveSearch = (localSearch || searchQuery || '').toLowerCase().trim();

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
    if (onClearSearch) onClearSearch();
  };

  const sortedClubs = [...clubs].sort(
    (a, b) => Number(b.points ?? 0) - Number(a.points ?? 0)
  );

  const filteredClubs = sortedClubs.filter((c) => {
    if (!effectiveSearch) return true;
    const descText = c.desc ?? c.description ?? '';
    return (
      c.name?.toLowerCase().includes(effectiveSearch) ||
      c.city?.toLowerCase().includes(effectiveSearch) ||
      c.district?.toLowerCase().includes(effectiveSearch) ||
      c.captainName?.toLowerCase().includes(effectiveSearch) ||
      c.inviteCode?.toLowerCase().includes(effectiveSearch) ||
      descText.toLowerCase().includes(effectiveSearch)
    );
  });

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

  const liveEditingClub = editingClub
    ? clubs.find((c) => c.id === editingClub.id) || editingClub
    : null;

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">
            KULÜPLER & LİG TABLOSU
          </h2>
          <p className="text-xs text-white/50">
            Halısaha takımlarını, kadro kapasitelerini ve lig puan durumunu yönetin
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#6e9bff] px-5 py-2.5 text-xs font-black uppercase text-white shadow-[0_0_20px_rgba(110,155,255,0.3)] transition hover:brightness-105"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Kulüp Ekle</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#12141C] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white/60">
          <Shield className="h-4 w-4 text-[#6e9bff]" />
          <span>
            Toplam {clubs.length} Kulüp {effectiveSearch && `(Filtrelenen: ${filteredClubs.length})`}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Kulüp adı, şehir veya kaptan..."
            value={localSearch || searchQuery}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (searchQuery && onSearchChange) onSearchChange(e.target.value);
            }}
            className="h-10 w-full sm:w-72 rounded-xl border border-white/5 bg-[#171A24] pl-10 pr-9 text-xs font-medium text-white placeholder:text-white/40 focus:border-[#6e9bff]/50 focus:outline-none"
          />
          {(localSearch || searchQuery) && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Aramayı Temizle"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md bg-white/10 text-white/60 hover:text-white transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Clubs Grid / Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
        {filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-white/20" />
            <p className="mt-3 text-sm font-bold text-white/60">Kayıtlı kulüp bulunamadı</p>
            <p className="text-xs text-white/40">
              {effectiveSearch
                ? 'Arama kriterlerinizi değiştirebilirsiniz.'
                : 'Yeni bir kulüp oluşturarak başlayabilirsiniz.'}
            </p>
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
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClubs.map((club, index) => {
                  const clubPoints = Number(club.points ?? 0);
                  const memberCount =
                    club.membersCount !== undefined
                      ? Number(club.membersCount)
                      : Array.isArray(club.members)
                      ? club.members.length
                      : 0;
                  const clubDesc = club.desc || club.description || 'Açıklama belirtilmedi';

                  return (
                    <tr key={club.id || index} className="transition hover:bg-white/5">
                      <td className="px-6 py-4">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg font-montserrat text-xs font-black ${
                            index === 0
                              ? 'bg-[#8eff71]/20 text-[#8eff71] border border-[#8eff71]/30'
                              : index === 1
                              ? 'bg-[#6e9bff]/20 text-[#6e9bff] border border-[#6e9bff]/30'
                              : index === 2
                              ? 'bg-[#88f6ff]/20 text-[#88f6ff] border border-[#88f6ff]/30'
                              : 'bg-white/5 text-white/40'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#171A24]"
                            style={{ color: club.color || '#6e9bff' }}
                          >
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{club.name}</span>
                              {club.inviteCode && (
                                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                                  {club.inviteCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/40">
                              {clubDesc}
                              {club.city && (
                                <span className="ml-2 text-white/60">
                                  • {club.city}
                                  {club.district ? ` / ${club.district}` : ''}
                                </span>
                              )}
                              {club.captainName && (
                                <span className="ml-2 text-white/50">
                                  • Kaptan: {club.captainName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-montserrat text-sm font-black text-[#8eff71]">
                          {clubPoints.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[9px] font-bold text-white/30 uppercase">
                          {club.rank || 'LİG SIRALAMASI'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-white/40" />
                          <span className="font-bold text-white">{memberCount}</span>
                          <span className="text-white/40">/ {club.maxMembers || 50} Üye</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-[#6e9bff]/10 px-2.5 py-1 text-[11px] font-bold text-[#6e9bff]">
                          Seviye {club.level || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingClub(club)}
                            disabled={loading}
                            title="Kulübü Düzenle"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6e9bff]/10 text-[#6e9bff] hover:bg-[#6e9bff]/20 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClub(club.id)}
                            disabled={loading}
                            title="Kulübü Sil"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7351]/10 text-[#ff7351] hover:bg-[#ff7351]/20 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <EditClubModal
        club={liveEditingClub}
        isOpen={Boolean(liveEditingClub)}
        onClose={() => setEditingClub(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}

function EditClubModal({ club, isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [maxMembers, setMaxMembers] = useState(50);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('open');
  const [captainName, setCaptainName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (club) {
      setName(club.name || '');
      setDesc(club.desc ?? club.description ?? '');
      setPoints(club.points ?? 0);
      setLevel(club.level ?? 1);
      setMaxMembers(club.maxMembers ?? 50);
      setCity(club.city || '');
      setDistrict(club.district || '');
      setJoinPolicy(club.joinPolicy || 'open');
      setCaptainName(club.captainName || '');
    }
  }, [club]);

  if (!isOpen || !club) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const cleanedDesc = desc.trim();
      await adminDbService.updateClub(club.id, {
        name: name.trim(),
        desc: cleanedDesc,
        description: cleanedDesc,
        points: Number(points ?? 0),
        level: Number(level) || 1,
        maxMembers: Number(maxMembers) || 50,
        city: city.trim(),
        district: district.trim(),
        joinPolicy: joinPolicy || 'open',
        captainName: captainName.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Kulüp güncelleme hatası:', err);
      alert('Kulüp güncellenirken bir hata meydana geldi: ' + (err.message || ''));
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
              <h3 className="font-montserrat text-lg font-black text-white">KULÜBÜ DÜZENLE</h3>
              <p className="text-xs text-white/50">{club.name} takım parametrelerini güncelleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Kulüp İsmi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Açıklama / Slogan
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Lig Puanı
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Kulüp Seviyesi
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Şehir
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Örn: İstanbul"
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                İlçe
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Örn: Beşiktaş"
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Maksimum Üye Limiti
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Katılım Politikası
              </label>
              <select
                value={joinPolicy}
                onChange={(e) => setJoinPolicy(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
              >
                <option value="open">Herkese Açık</option>
                <option value="approval">Onaylı (İstekle)</option>
                <option value="invite">Sadece Davetle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Kaptan / Yönetici Adı
            </label>
            <input
              type="text"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Örn: Baran Divat"
              className="w-full rounded-xl border border-white/5 bg-[#171A24] px-4 py-2.5 text-xs font-medium text-white focus:border-[#6e9bff]/50 focus:outline-none"
            />
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
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
