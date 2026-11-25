import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Star,
  Shield,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Trash2,
  X,
  UserX,
  Check,
  Clock,
  Mail,
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { UserDetailModal } from './UserDetailModal';
import { adminDbService } from '../../services/adminDbService';

function formatRequestDate(ts) {
  if (!ts) return 'Belirtilmedi';
  try {
    let millis = 0;
    if (typeof ts === 'number') millis = ts;
    else if (typeof ts === 'string') millis = Date.parse(ts);
    else if (typeof ts?.toMillis === 'function') millis = ts.toMillis();
    else if (typeof ts?.seconds === 'number') millis = ts.seconds * 1000;
    if (!millis || Number.isNaN(millis)) return String(ts);
    return new Date(millis).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Belirtilmedi';
  }
}

export function UserManager({
  users = [],
  deletionRequests: externalDeletionRequests,
  currentAdminUid,
  activeSubTab: controlledSubTab,
  initialSubTab,
  onSubTabChange,
  onRefresh,
  searchQuery = '',
  onSearchChange,
  onClearSearch,
}) {
  const [internalSubTab, setInternalSubTab] = useState(
    controlledSubTab || initialSubTab || 'users'
  );
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);

  // Deletion requests state (uses external prop if passed, otherwise subscribes directly)
  const [internalDeletionRequests, setInternalDeletionRequests] = useState([]);
  const [deletionFilter, setDeletionFilter] = useState('pending'); // 'pending' | 'all'

  useEffect(() => {
    if (controlledSubTab) {
      setInternalSubTab(controlledSubTab);
    }
  }, [controlledSubTab]);

  useEffect(() => {
    if (initialSubTab) {
      setInternalSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (Array.isArray(externalDeletionRequests)) return undefined;
    const unsub = adminDbService.subscribeDeletionRequests((list) => {
      setInternalDeletionRequests(list || []);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [externalDeletionRequests]);

  const activeSubTab = controlledSubTab || internalSubTab;
  const handleSubTabChange = (nextTab) => {
    setInternalSubTab(nextTab);
    if (onSubTabChange) onSubTabChange(nextTab);
  };

  const effectiveAdminUid = currentAdminUid || auth.currentUser?.uid || '';
  const deletionRequests = Array.isArray(externalDeletionRequests)
    ? externalDeletionRequests
    : internalDeletionRequests;

  const pendingDeletions = deletionRequests.filter(
    (r) => !r.status || r.status === 'pending'
  );
  const displayedDeletions =
    deletionFilter === 'pending' ? pendingDeletions : deletionRequests;

  const effectiveSearch = (search || searchQuery || '').toLocaleLowerCase('tr-TR').trim();

  const handleClearSearch = () => {
    setSearch('');
    if (onSearchChange) onSearchChange('');
    if (onClearSearch) onClearSearch();
  };

  const selectedUser = selectedUserId
    ? users.find((u) => (u.id || u.uid) === selectedUserId) || null
    : null;

  const filteredUsers = users.filter((u) => {
    const userPosNorm = String(u.position || '')
      .toLocaleLowerCase('tr-TR')
      .trim();
    const filterPosNorm = posFilter.toLocaleLowerCase('tr-TR').trim();

    const matchesPos =
      posFilter === 'all' ||
      userPosNorm === filterPosNorm ||
      userPosNorm.includes(filterPosNorm);

    const matchesSearch =
      !effectiveSearch ||
      String(u.name || '')
        .toLocaleLowerCase('tr-TR')
        .includes(effectiveSearch) ||
      String(u.email || '')
        .toLocaleLowerCase('tr-TR')
        .includes(effectiveSearch) ||
      String(u.city || '')
        .toLocaleLowerCase('tr-TR')
        .includes(effectiveSearch) ||
      String(u.id || u.uid || '')
        .toLocaleLowerCase('tr-TR')
        .includes(effectiveSearch);

    return matchesPos && matchesSearch;
  });

  const handleToggleRoleQuick = async (u) => {
    const targetUid = u.id || u.uid;
    if (!targetUid) return;

    const currentRole = u.role === 'admin' ? 'admin' : 'user';
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';

    if (effectiveAdminUid && targetUid === effectiveAdminUid && nextRole !== 'admin') {
      alert('Güvenlik uyarısı: Kendi yönetici hesabınızın rolünü düşüremezsiniz.');
      return;
    }

    const confirmMsg =
      nextRole === 'admin'
        ? `"${u.name || u.email || targetUid}" kullanıcısına YÖNETİCİ (admin) yetkisi vermek istediğinizden emin misiniz?`
        : `"${u.name || u.email || targetUid}" kullanıcısının yönetici yetkisini kaldırıp standart oyuncu (user) yapmak istediğinizden emin misiniz?`;

    if (!window.confirm(confirmMsg)) return;

    setLoadingId(targetUid);
    try {
      await adminDbService.updateUserRole(targetUid, nextRole);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Rol değiştirme hatası:', err);
      alert('Rol değiştirilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!userId) return;
    if (effectiveAdminUid && userId === effectiveAdminUid) {
      alert('Güvenlik uyarısı: Kendi aktif yönetici hesabınızı silemezsiniz.');
      return;
    }

    const confirmed = window.confirm(
      `"${userName || 'Bu kullanıcıyı'}" sistemden ve Firestore veritabanından kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz (Google Play Hesap Silme Talebi / GDPR).`
    );
    if (!confirmed) return;

    setLoadingId(userId);
    try {
      await adminDbService.deleteUser(userId);
      alert('Kullanıcı hesabı veritabanından başarıyla silindi.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Kullanıcı silme hatası:', err);
      alert('Kullanıcı silinirken bir hata meydana geldi: ' + (err.message || ''));
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveAndExecuteDeletion = async (req) => {
    const reqEmail = String(req.email || '').toLowerCase().trim();
    const matchedUser = users.find((u) => {
      const uid = u.id || u.uid;
      if ((req.uid || req.userId) && uid === (req.uid || req.userId)) return true;
      if (reqEmail && String(u.email || '').toLowerCase().trim() === reqEmail) return true;
      return false;
    });

    const targetUid = req.uid || req.userId || matchedUser?.id || matchedUser?.uid || '';
    if (effectiveAdminUid && targetUid && targetUid === effectiveAdminUid) {
      alert('Güvenlik uyarısı: Kendi aktif yönetici hesabınızı silemezsiniz.');
      return;
    }

    const confirmText = targetUid
      ? `"${req.email || req.name || targetUid}" için hesap silme talebini onaylayıp kullanıcı verilerini silmek istediğinizden emin misiniz?`
      : `"${req.email || req.name || req.id}" ile eşleşen aktif bir kullanıcı profili bulunamadı. Talebi "Tamamlandı" olarak işaretlemek istiyor musunuz?`;

    if (!window.confirm(confirmText)) return;

    setLoadingId(req.id);
    try {
      if (targetUid) {
        await adminDbService.deleteUser(targetUid);
      }
      await adminDbService.resolveDeletionRequest(
        req.id,
        'completed',
        targetUid ? `Hesap silindi (UID: ${targetUid})` : 'Eşleşen kayıt silindi / talep tamamlandı'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Silme talebi işleme hatası:', err);
      alert('Silme talebi işlenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setLoadingId(null);
    }
  };

  const handleResolveDeletionStatus = async (req, nextStatus) => {
    const label = nextStatus === 'rejected' ? 'reddetmek' : 'tamamlandı olarak işaretlemek';
    if (!window.confirm(`Bu silme talebini ${label} istediğinizden emin misiniz?`)) return;

    setLoadingId(req.id);
    try {
      await adminDbService.resolveDeletionRequest(req.id, nextStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Talep durumu güncelleme hatası:', err);
      alert('Talep durumu güncellenemedi.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">
            OYUNCULAR & KULLANICILAR
          </h2>
          <p className="text-xs text-white/50">
            Kayıtlı futbolcu profillerini, yetki rollerini, güvenilirlik puanlarını ve hesap silme taleplerini yönetin
          </p>
        </div>

        <div className="flex rounded-xl bg-[#12141C] p-1 border border-white/5">
          <button
            type="button"
            onClick={() => handleSubTabChange('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'users'
                ? 'bg-[#8eff71] text-[#064200]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>
              Oyuncular ({filteredUsers.length}
              {filteredUsers.length !== users.length ? ` / ${users.length}` : ''})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('deletions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition relative ${
              activeSubTab === 'deletions'
                ? 'bg-[#ff7351] text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Silme Talepleri</span>
            {pendingDeletions.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'deletions'
                    ? 'bg-black/30 text-white'
                    : 'bg-[#ff7351] text-white'
                }`}
              >
                {pendingDeletions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── SUB-TAB 1: OYUNCULAR LİSTESİ ─── */}
      {activeSubTab === 'users' && (
        <>
          {/* Filter and Search */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#12141C] p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Position Tabs */}
            <div className="flex flex-wrap gap-2">
              {['all', 'Kaleci', 'Defans', 'Orta Saha', 'Forvet'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    posFilter === pos
                      ? 'bg-[#8eff71] text-[#064200]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {pos === 'all' ? 'Tüm Mevkiler' : pos}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="İsim, e-posta veya şehir..."
                value={search || searchQuery}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (searchQuery && onSearchChange) onSearchChange(e.target.value);
                }}
                className="h-10 w-full sm:w-64 rounded-xl border border-white/5 bg-[#171A24] pl-10 pr-9 text-xs font-medium text-white placeholder:text-white/40 focus:border-[#8eff71]/40 focus:outline-none"
              />
              {(search || searchQuery) && (
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

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-12 w-12 text-white/20" />
                <p className="mt-3 text-sm font-bold text-white/60">Kullanıcı bulunamadı</p>
                <p className="text-xs text-white/40">Arama kriterlerinizi değiştirebilirsiniz.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                    <tr>
                      <th className="px-6 py-4">Oyuncu</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4">Mevki</th>
                      <th className="px-6 py-4">Şehir</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Güvenilirlik</th>
                      <th className="px-6 py-4">Durum</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => {
                      const uid = u.id || u.uid;
                      const isUserAdmin = u.role === 'admin';
                      const isSelf = Boolean(effectiveAdminUid && uid === effectiveAdminUid);

                      return (
                        <tr
                          key={uid}
                          onClick={() => setSelectedUserId(uid)}
                          className="cursor-pointer transition hover:bg-white/5"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  u.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                                }
                                alt={u.name}
                                className="h-9 w-9 rounded-xl border border-white/10 object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span>{u.name || 'İsimsiz Sporcu'}</span>
                                  {isSelf && (
                                    <span className="rounded bg-[#8eff71]/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#8eff71]">
                                      Siz
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-white/40">
                                  {u.email || 'E-posta yok'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleRoleQuick(u)}
                              disabled={loadingId === uid || (isSelf && isUserAdmin)}
                              title={
                                isSelf && isUserAdmin
                                  ? 'Kendi yönetici rolünüzü düşüremezsiniz'
                                  : 'Rolü Değiştirmek İçin Tıklayın (admin / user)'
                              }
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase transition ${
                                isUserAdmin
                                  ? 'bg-[#6e9bff]/20 text-[#6e9bff] border border-[#6e9bff]/30 hover:bg-[#6e9bff]/30'
                                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                              } ${isSelf && isUserAdmin ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <Shield className="h-3 w-3" />
                              <span>{isUserAdmin ? 'admin' : 'user'}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                              {u.position || 'Orta Saha'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/70 font-medium">
                            {u.city || 'İstanbul'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 font-bold text-[#8eff71]">
                              <Star className="h-3.5 w-3.5 fill-[#8eff71]" />
                              <span>{Number(u.rating || 5).toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const relScore = u.stats?.reliabilityScore ?? u.trustScore ?? 100;
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">%{relScore}</span>
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full bg-[#8eff71]"
                                      style={{ width: `${relScore}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {u.isBanned ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#ff7351]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#ff7351]">
                                  <Ban className="h-3 w-3" />
                                  Engelli
                                </span>
                                {u.banReason && (
                                  <div
                                    className="mt-0.5 max-w-[160px] truncate text-[10px] text-[#ff7351]/80"
                                    title={u.banReason}
                                  >
                                    {u.banReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#8eff71]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#8eff71]">
                                <CheckCircle2 className="h-3 w-3" />
                                Aktif
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setSelectedUserId(uid)}
                                title="Profili İncele & Düzenle"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(uid, u.name || u.email)}
                                disabled={loadingId === uid || isSelf}
                                title={
                                  isSelf
                                    ? 'Kendi yönetici hesabınızı silemezsiniz'
                                    : 'Kullanıcıyı Kalıcı Olarak Sil (Google Play Talebi)'
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7351]/10 text-[#ff7351] hover:bg-[#ff7351]/20 transition disabled:opacity-30"
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
        </>
      )}

      {/* ─── SUB-TAB 2: HESAP SİLME TALEPLERİ (DELETION REQUESTS) ─── */}
      {activeSubTab === 'deletions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletionFilter('pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  deletionFilter === 'pending'
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Bekleyen Talepler ({pendingDeletions.length})
              </button>
              <button
                type="button"
                onClick={() => setDeletionFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  deletionFilter === 'all'
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Tümü ({deletionRequests.length})
              </button>
            </div>
          </div>

          {displayedDeletions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#12141C] p-14 text-center">
              <UserX className="h-12 w-12 text-white/20 mb-3" />
              <h3 className="font-montserrat text-base font-bold text-white">
                Bekleyen Hesap Silme Talebi Yok
              </h3>
              <p className="text-xs text-white/50 max-w-md mt-1">
                Kullanıcılar web hesap silme sayfasından (`/delete-account.html`) veya uygulama içinden silme talebi gönderdiğinde burada listelenir.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedDeletions.map((req) => {
                const isPending = !req.status || req.status === 'pending';
                const reqEmail = String(req.email || '').toLowerCase().trim();
                const matchedUser = users.find((u) => {
                  const uid = u.id || u.uid;
                  if ((req.uid || req.userId) && uid === (req.uid || req.userId)) return true;
                  if (reqEmail && String(u.email || '').toLowerCase().trim() === reqEmail)
                    return true;
                  return false;
                });

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border bg-[#12141C] p-5 transition ${
                      isPending ? 'border-[#ff7351]/30' : 'border-white/5 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 font-bold text-white text-sm">
                            <Mail className="h-4 w-4 text-[#ff7351]" />
                            {req.email || req.name || req.userName || 'Bilgisi Yok'}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                              req.status === 'completed' || req.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : req.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-400/20 text-amber-400'
                            }`}
                          >
                            {req.status === 'completed' || req.status === 'approved'
                              ? '✓ Tamamlandı'
                              : req.status === 'rejected'
                              ? '✕ Reddedildi'
                              : 'Bekliyor'}
                          </span>
                          {matchedUser && (
                            <span className="rounded bg-[#6e9bff]/15 px-2 py-0.5 text-[10px] font-bold text-[#6e9bff]">
                              Eşleşen Kullanıcı: {matchedUser.name || matchedUser.id}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRequestDate(req.createdAt)}
                          </span>
                          {(req.uid || req.userId || matchedUser?.id) && (
                            <span>
                              UID:{' '}
                              <code className="text-white/70">
                                {req.uid || req.userId || matchedUser?.id}
                              </code>
                            </span>
                          )}
                          {req.phone && <span>Tel: {req.phone}</span>}
                        </div>

                        {(req.reason || req.note || req.details) && (
                          <div className="mt-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-white/70 border border-white/5">
                            <span className="font-bold text-white/90">Silme Nedeni: </span>
                            {req.reason || req.note || req.details}
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={loadingId === req.id}
                            onClick={() => handleResolveDeletionStatus(req, 'rejected')}
                            className="flex items-center gap-1 rounded-xl bg-white/5 px-3.5 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reddet</span>
                          </button>

                          <button
                            type="button"
                            disabled={loadingId === req.id}
                            onClick={() => handleResolveDeletionStatus(req, 'completed')}
                            className="flex items-center gap-1 rounded-xl bg-[#8eff71]/15 px-3.5 py-2 text-xs font-bold text-[#8eff71] hover:bg-[#8eff71]/25 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Tamamlandı İşaretle</span>
                          </button>

                          <button
                            type="button"
                            disabled={loadingId === req.id}
                            onClick={() => handleApproveAndExecuteDeletion(req)}
                            className="flex items-center gap-1.5 rounded-xl bg-[#ff7351] px-4 py-2 text-xs font-black uppercase text-white shadow-[0_0_15px_rgba(255,115,81,0.3)] hover:brightness-110 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hesabı Sil & Onayla</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUserId(null)}
        onUpdate={onRefresh}
        currentAdminUid={effectiveAdminUid}
      />
    </div>
  );
}
