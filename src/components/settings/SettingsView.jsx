import React, { useState, useEffect } from 'react';
import { Shield, Database, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export function SettingsView() {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'platform');
        const docSnap = await getDoc(docRef);
        setDbConnected(true);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMaintenance(Boolean(data.maintenance));
          setMaintenanceMessage(data.maintenanceMessage || '');
        }
      } catch (e) {
        console.error('Settings fetch error:', e);
        setDbConnected(false);
        setError('Ayarlar okunurken bağlantı hatası oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'settings', 'platform'),
        {
          maintenance: Boolean(maintenance),
          maintenanceMessage: maintenanceMessage.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setDbConnected(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Settings save error:', e);
      setError(
        e?.message ||
          'Ayarlar kaydedilirken bir hata meydana geldi. Lütfen yetkilerinizi kontrol edin.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs font-bold text-white/60">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">
          SİSTEM AYARLARI
        </h2>
        <p className="text-xs text-white/50">
          H.İ.V. platform parametreleri, Firebase altyapısı ve bakım modu kontrolü
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#8eff71]/30 bg-[#8eff71]/10 p-4 text-xs font-bold text-[#8eff71]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Ayarlar başarıyla kaydedildi ve tüm istemcilerde güncellendi.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#ff7351]/30 bg-[#ff7351]/10 p-4 text-xs font-bold text-[#ff7351]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Firebase & Cloud Status */}
        <div className="rounded-3xl border border-white/5 bg-[#12141C]/90 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/10 text-[#8eff71]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-sm font-black text-white">
                FIREBASE BULUT BAĞLANTISI
              </h3>
              <p className="text-xs text-white/40">Firestore & Auth yapılandırma özeti</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Proje ID:</span>
              <span className="font-mono font-bold text-[#8eff71]">hivhalisaha</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Ayar Dokümanı:</span>
              <span className="font-mono font-semibold text-white">settings/platform</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Firestore Durumu:</span>
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  dbConnected ? 'text-[#8eff71]' : 'text-[#ff7351]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbConnected ? 'bg-[#8eff71]' : 'bg-[#ff7351]'
                  }`}
                />
                {dbConnected ? 'Bağlantı Doğrulandı' : 'Erişim Hatası'}
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance & Platform Controls */}
        <div className="rounded-3xl border border-white/5 bg-[#12141C]/90 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7351]/10 text-[#ff7351]">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-sm font-black text-white">
                BAKIM MODU & PLATFORM KONTROLÜ
              </h3>
              <p className="text-xs text-white/40">
                Mobil ve web uygulamasında anlık bakım ekranı yönetimi
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-xl bg-[#171A24] p-3.5 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Bakım Modu (Maintenance)</div>
                <div className="text-[10px] text-white/40">
                  Aktif edildiğinde oyuncular uygulamada bakım ekranı görür
                </div>
              </div>
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="h-4 w-4 accent-[#ff7351]"
              />
            </label>

            <div>
              <label
                htmlFor="maintenanceMessage"
                className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/60"
              >
                Bakım Ekranı Mesajı
              </label>
              <textarea
                id="maintenanceMessage"
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Örn: Kısa süreli altyapı bakımı yapıyoruz. En geç 30 dakika içinde tekrar sahalardayız!"
                className="w-full rounded-xl border border-white/5 bg-[#171A24] p-3 text-xs font-medium text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Shield className="h-3.5 w-3.5 text-[#6e9bff]" />
                <span>Gelişmiş Anti-Flaker & Push Bildirim kuralları</span>
              </div>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/50">
                Yakında
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#8eff71] px-6 py-3 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Yapılandırmayı Kaydet'}
        </button>
      </div>
    </div>
  );
}
