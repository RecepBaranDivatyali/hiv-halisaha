import React, { useState, useEffect } from 'react';
import { Settings, Shield, Server, Database, Bell, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminDbService } from '../../services/adminDbService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export function SettingsView() {
  const [maintenance, setMaintenance] = useState(false);
  const [antiFlakerStrict, setAntiFlakerStrict] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'platform');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMaintenance(data.maintenance || false);
          setAntiFlakerStrict(data.antiFlakerStrict !== undefined ? data.antiFlakerStrict : true);
          setPushNotifs(data.pushNotifs !== undefined ? data.pushNotifs : true);
        }
      } catch (e) {
        console.error('Settings fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        maintenance,
        antiFlakerStrict,
        pushNotifs
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">SİSTEM AYARLARI</h2>
        <p className="text-xs text-white/50">H.İ.V. platform parametreleri, Firebase altyapısı ve güvenlik modülleri</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#8eff71]/30 bg-[#8eff71]/10 p-4 text-xs font-bold text-[#8eff71]">
          <CheckCircle2 className="h-4 w-4" />
          <span>Ayarlar başarıyla kaydedildi ve tüm istemcilerde güncellendi.</span>
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
              <h3 className="font-montserrat text-sm font-black text-white">FIREBASE BULUT BAĞLANTISI</h3>
              <p className="text-xs text-white/40">Canlı Firestore & Auth altyapısı</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Proje ID:</span>
              <span className="font-mono font-bold text-[#8eff71]">hivhalisaha</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Bölge:</span>
              <span className="font-bold text-white">europe-west3 (Frankfurt)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <span className="text-white/60">Firestore Durumu:</span>
              <span className="font-bold text-[#8eff71] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8eff71]"></span>
                Bağlı (0ms Gecikme)
              </span>
            </div>
          </div>
        </div>

        {/* Security & Anti-Flaker Rules */}
        <div className="rounded-3xl border border-white/5 bg-[#12141C]/90 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6e9bff]/10 text-[#6e9bff]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-montserrat text-sm font-black text-white">GÜVENLİK & ANTİ-FLAKER</h3>
              <p className="text-xs text-white/40">Maça gelmeyenleri ve sahte hesapları engelleme</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <div>
                <div className="text-xs font-bold text-white">Sıkı Anti-Flaker Filtresi</div>
                <div className="text-[10px] text-white/40">Güvenilirlik skoru %80 altındaki oyunculara uyarı göster</div>
              </div>
              <input
                type="checkbox"
                checked={antiFlakerStrict}
                onChange={(e) => setAntiFlakerStrict(e.target.checked)}
                className="h-4 w-4 accent-[#8eff71]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#171A24] p-3">
              <div>
                <div className="text-xs font-bold text-white">Bakım Modu (Maintenance)</div>
                <div className="text-[10px] text-white/40">Mobil uygulamayı geçici olarak bakıma al</div>
              </div>
              <input
                type="checkbox"
                checked={maintenance}
                onChange={(e) => setMaintenance(e.target.checked)}
                className="h-4 w-4 accent-[#ff7351]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="rounded-xl bg-[#8eff71] px-6 py-3 text-xs font-black uppercase text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.3)] transition hover:brightness-105"
        >
          Yapılandırmayı Kaydet
        </button>
      </div>
    </div>
  );
}
