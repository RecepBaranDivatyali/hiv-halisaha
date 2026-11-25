import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  // @ts-ignore
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Buradaki bilgiler Firebase Console'dan (Proje Ayarları) alınacak.
// Firebase projesini oluşturduktan sonra bu değerleri güncelleyeceğiz.
const firebaseConfig = {
  apiKey: "AIzaSyDm-yg7xiB0yp7ZwlZBP62g9WlTsc8l8eA",
  authDomain: "hivhalisaha.firebaseapp.com",
  projectId: "hivhalisaha",
  storageBucket: "hivhalisaha.firebasestorage.app",
  messagingSenderId: "812540838980",
  appId: "1:812540838980:web:c91941ba45c7331d39e811",
  measurementId: "G-P5HY0DHGTL"
};

// Uygulama zaten başlatılmışsa tekrar başlatmayı önle (Expo hot-reload için önemli)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React Native mobilde oturum kalıcılığı (Persistence):
// AsyncStorage entegrasyonu ile uygulamanın kapatılıp açılmasında oturumun düşmesi engellenir.
let authInstance: any;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // initializeAuth zaten çağrılmışsa (hot-reload durumunda) mevcut auth instance'ı al
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
export default app;
