import React, { useState, useEffect } from 'react';
import { X, Shield, Ban, ShieldAlert } from 'lucide-react';
import { auth } from '../../services/firebase';
import { adminDbService } from '../../services/adminDbService';

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  currentAdminUid,
}) {
  const [rating, setRating] = useState(user?.rating ?? 5.0);
  const [trustScore, setTrustScore] = useState(user?.trustScore ?? 98);
  const [position, setPosition] = useState(user?.position || 'Orta Saha');
  const [role, setRole] = useState(user?.role === 'admin' ? 'admin' : 'user');
  const [isBanned, setIsBanned] = useState(Boolean(user?.isBanned));
  const [banReason, setBanReason] = useState(user?.banReason || '');
  const [loading, setLoading] = useState(false);

  const effectiveAdminUid = currentAdminUid || auth.currentUser?.uid || '';
  const targetUid = user?.id || user?.uid || '';
  const isSelf = Boolean(effectiveAdminUid && targetUid && effectiveAdminUid === targetUid);

  useEffect(() => {
    if (user) {
      setRating(user.rating ?? 5.0);
      setTrustScore(user.stats?.reliabilityScore ?? user.trustScore ?? 100);
      setPosition(user.position || 'Orta Saha');
      setRole(user.role === 'admin' ? 'admin' : 'user');
      setIsBanned(Boolean(user.isBanned));
      setBanReason(user.banReason || '');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleRoleChange = async (nextRole) => {
    if (isSelf && nextRole !== 'admin') {
      alert('Güvenlik uyarısı: Kendi yönetici hesabınızın rolünü düşüremezsiniz.');
      return;
    }
    if (nextRole === role) return;

    setLoading(true);
    try {
      await adminDbService.updateUserRole(targetUid, nextRole);
      setRole(nextRole);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Rol güncelleme hatası:', err);
      alert('Kullanıcı rolü güncellenirken hata oluştu: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSelf && role !== 'admin') {
      alert('Güvenlik uyarısı: Kendi yönetici hesabınızın rolünü düşüremezsiniz.');
      return;
    }
    setLoading(true);
    try {
      const currentDocRole = user.role === 'admin' ? 'admin' : 'user';
      if (role !== currentDocRole) {
        await adminDbService.updateUserRole(targetUid, role);
      }

      await adminDbService.updateUser(targetUid, {
        rating: Number(rating),
        trustScore: Number(trustScore),
        'stats.reliabilityScore': Number(trustScore),
        position,
        role: isSelf ? 'admin' : role,
        isBanned: isSelf ? false : Boolean(isBanned),
        banReason: !isSelf && isBanned ? banReason.trim() : '',
      });
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('Kullanıcı güncelleme hatası:', err);
      alert('Kullanıcı güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async () => {
    if (isSelf && !isBanned) {
      alert('Güvenlik uyarısı: Kendi yönetici hesabınızı engelleyemezsiniz.');
      return;
    }
    setLoading(true);
    try {
      const nextBanned = !isBanned;
      await adminDbService.toggleUserBan(targetUid, isBanned, banReason);
      setIsBanned(nextBanned);
      if (!nextBanned) {
        setBanReason('');
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Ban durumu değiştirme hatası:', err);
      alert('İşlem gerçekleştirilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const stats = user.stats || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0E1017] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={
                user.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
              }
              alt={user.name}
              className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-montserrat text-lg font-black text-white">
                  {user.name || 'İsimsiz Sporcu'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase ${
                    role === 'admin'
                      ? 'bg-[#6e9bff]/20 text-[#6e9bff]'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  <Shield className="h-2.5 w-2.5" />
                  {role === 'admin' ? 'Admin' : 'User'}
                </span>
                {isBanned && (
                  <span className="rounded bg-[#ff7351]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#ff7351]">
                    Engelli
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50">
                {user.email || 'E-posta kayıtlı değil'} • {user.city || 'İstanbul'}
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Stats Badges Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-3 text-center">
              <span className="text-[10px] font-bold text-white/40 uppercase">Maç</span>
              <div className="mt-1 font-montserrat text-lg font-black text-white">
                {stats.matchesPlayed || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-3 text-center">
              <span className="text-[10px] font-bold text-white/40 uppercase">Gol</span>
              <div className="mt-1 font-montserrat text-lg font-black text-[#8eff71]">
                {stats.goals || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-3 text-center">
              <span className="text-[10px] font-bold text-white/40 uppercase">Asist</span>
              <div className="mt-1 font-montserrat text-lg font-black text-[#6e9bff]">
                {stats.assists || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#171A24] p-3 text-center">
              <span className="text-[10px] font-bold text-white/40 uppercase">MVP</span>
              <div className="mt-1 font-montserrat text-lg font-black text-[#ffb703]">
                {stats.mvpCount || 0}
              </div>
            </div>
          </div>

          {/* Role Management Box */}
          <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Sistem Yetki Rolü</div>
                <p className="text-[10px] text-white/40">
                  Yönetici paneline erişim yetkisini (`admin` / `user`) belirleyin
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || isSelf}
                  onClick={() => handleRoleChange('user')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    role === 'user'
                      ? 'bg-white text-[#0E1017]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  } ${isSelf ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  Oyuncu (user)
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRoleChange('admin')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    role === 'admin'
                      ? 'bg-[#6e9bff] text-white shadow-[0_0_15px_rgba(110,155,255,0.3)]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Yönetici (admin)
                </button>
              </div>
            </div>
            {isSelf && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Bu sizin aktif yönetici hesabınızdır; kendi rolünüzü düşüremezsiniz.</span>
              </div>
            )}
          </div>

          {/* Edit Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Mevki
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              >
                <option value="Kaleci">Kaleci</option>
                <option value="Defans">Defans</option>
                <option value="Orta Saha">Orta Saha</option>
                <option value="Forvet">Forvet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Puan / Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Güvenilirlik (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={trustScore}
                onChange={(e) => setTrustScore(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#171A24] px-3 py-2.5 text-xs font-medium text-white focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Account Status / Ban Toggle & Ban Reason */}
          <div className="rounded-2xl border border-white/5 bg-[#171A24] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Hesap Durumu & Erişim</div>
                <p className="text-[10px] text-white/40">
                  Kullanıcının maçlara katılmasını ve sohbeti kısıtlayın
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleBan}
                disabled={loading || (isSelf && !isBanned)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isBanned
                    ? 'bg-[#8eff71]/20 text-[#8eff71] hover:bg-[#8eff71]/30'
                    : 'bg-[#ff7351]/20 text-[#ff7351] hover:bg-[#ff7351]/30'
                } ${isSelf && !isBanned ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isBanned ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/60 mb-1.5">
                Engelleme Nedeni (Ban Reason)
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Örn: Maça mazeretsiz katılmama veya sportmenlik dışı davranış..."
                className="w-full rounded-xl border border-white/5 bg-[#12141C] px-3.5 py-2 text-xs font-medium text-white placeholder:text-white/30 focus:border-[#ff7351]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-white/60 hover:bg-white/5 transition"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#8eff71] px-6 py-2.5 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
            >
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
