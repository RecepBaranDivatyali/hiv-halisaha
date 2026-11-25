import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { appAlert } from '@/services/appAlert';

const MAX_BASE64_LENGTH = 400000;

/**
 * Web ortamında görseli 240x240 piksele yeniden boyutlandırıp
 * 0.6 kalitede kompakt JPEG Base64'e dönüştürür (~15-25 KB).
 * Geçici blob: URI'lerin veya >400KB base64 verilerin Firestore'a yazılmasını önler.
 */
function resizeImageOnWeb(uri: string, maxDim = 240, quality = 0.6): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(null);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (!width || !height) {
          appAlert.alert('Hata', 'Seçilen görsel okunamadı.');
          return resolve(null);
        }

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          appAlert.alert('Hata', 'Görsel işlenemedi.');
          return resolve(null);
        }
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (!dataUrl || dataUrl === 'data:,' || !dataUrl.startsWith('data:image/')) {
          appAlert.alert('Hata', 'Görsel dönüştürülemedi.');
          return resolve(null);
        }
        if (dataUrl.length > MAX_BASE64_LENGTH) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.4);
        }
        if (dataUrl.length > MAX_BASE64_LENGTH) {
          appAlert.alert('Görsel Çok Büyük', 'Lütfen daha küçük boyutlu bir fotoğraf seçin.');
          return resolve(null);
        }
        resolve(dataUrl);
      } catch (err) {
        console.warn('Web canvas resize failed:', err);
        appAlert.alert('Hata', 'Görsel işlenirken bir hata oluştu.');
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.warn('Web image load failed for resize:', err);
      appAlert.alert('Hata', 'Görsel yüklenemedi.');
      resolve(null);
    };
    img.src = uri;
  });
}

export function useImagePicker() {
  const pickImage = async (): Promise<string | null> => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          appAlert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermelisiniz.');
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== 'web',
        aspect: [1, 1],
        quality: Platform.OS === 'web' ? 0.6 : 0.25,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Web ortamı: Canvas ile 240x240 boyutunda kompakt Base64 üret (asla blob: veya 5MB base64 döndürme)
        if (Platform.OS === 'web') {
          const sourceUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          return await resizeImageOnWeb(sourceUri, 240, 0.6);
        }

        // Native ortam: Firestore 1MB doc sınırı koruması ve yerel file:// sızıntı engeli
        if (asset.base64) {
          if (asset.base64.length > MAX_BASE64_LENGTH) {
            appAlert.alert('Görsel Çok Büyük', 'Lütfen daha küçük boyutlu bir fotoğraf seçin veya kırpın.');
            return null;
          }
          return `data:image/jpeg;base64,${asset.base64}`;
        }

        appAlert.alert('Hata', 'Görsel verisi okunamadı. Lütfen başka bir fotoğraf seçin.');
        return null;
      }
      return null;
    } catch (e) {
      console.log('Image picker error:', e);
      appAlert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
      return null;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return pickImage();
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        appAlert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisiniz.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          if (asset.base64.length > MAX_BASE64_LENGTH) {
            appAlert.alert('Görsel Çok Büyük', 'Lütfen daha küçük boyutlu bir fotoğraf seçin veya kırpın.');
            return null;
          }
          return `data:image/jpeg;base64,${asset.base64}`;
        }
        appAlert.alert('Hata', 'Fotoğraf verisi okunamadı. Lütfen tekrar deneyin.');
        return null;
      }
      return null;
    } catch (e) {
      console.log('Camera error:', e);
      appAlert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
      return null;
    }
  };

  const promptPicker = (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return pickImage();
    }

    return new Promise((resolve) => {
      appAlert.alert(
        'Profil Fotoğrafı Seç',
        'Fotoğraf yüklemek için yöntem seçin:',
        [
          {
            text: 'Galeriden Seç',
            onPress: async () => {
              const uri = await pickImage();
              resolve(uri);
            },
          },
          {
            text: 'Kamera İle Çek',
            onPress: async () => {
              const uri = await takePhoto();
              resolve(uri);
            },
          },
          {
            text: 'İptal',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(null),
        }
      );
    });
  };

  return { pickImage, takePhoto, promptPicker };
}
