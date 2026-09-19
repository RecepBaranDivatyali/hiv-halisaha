import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

let deferredPrompt: any = null;
const listeners = new Set<() => void>();

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach(fn => fn());
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach(fn => fn());
  });
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredPrompt));
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setIsInstalled(true);

    const update = () => {
      setCanInstall(Boolean(deferredPrompt));
    };

    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return false;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          deferredPrompt = null;
          setCanInstall(false);
          setIsInstalled(true);
          return true;
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
      return false;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      Alert.alert(
        'Uygulamayı Ana Ekrana Ekle',
        'Safari alt çubuğundaki "Paylaş" simgesine dokunun, ardından "Ana Ekrana Ekle" seçeneğini seçin.',
        [{ text: 'Anladım' }]
      );
    } else {
      Alert.alert(
        'Uygulamayı Yükle',
        'Tarayıcınızın sağ üst köşesindeki üç nokta (⋮) menüsüne dokunun ve "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğini seçin.',
        [{ text: 'Tamam' }]
      );
    }

    return false;
  };

  return { canInstall, isInstalled, promptInstall };
}
