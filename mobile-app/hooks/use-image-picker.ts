import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export function useImagePicker() {
  const pickImage = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermelisiniz.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (e) {
      console.log('Image picker error:', e);
      Alert.alert('Hata', 'Görsel seçilirken bir hata oluştu.');
      return null;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisiniz.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (e) {
      console.log('Camera error:', e);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
      return null;
    }
  };

  const promptPicker = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
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
        ]
      );
    });
  };

  return { pickImage, takePhoto, promptPicker };
}
