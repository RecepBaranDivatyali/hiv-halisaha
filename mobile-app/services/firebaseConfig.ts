import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
