import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  User
} from 'firebase/auth';

export function getTurkishAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Geçersiz bir e-posta adresi girdiniz.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmıştır.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
    case 'auth/weak-password':
      return 'Şifreniz çok zayıf. Lütfen en az 6 karakterli güçlü bir şifre seçin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantınızı kontrol edin. Sunucuya ulaşılamadı.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
    case 'auth/requires-recent-login':
      return 'Bu işlem için lütfen çıkış yapıp tekrar giriş yapın.';
    default:
      return error?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

export const authService = {
  // Kullanıcı Kaydı (Register)
  register: async (email: string, password: string): Promise<User> => {
    try {
      const cleanEmail = email.trim();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      return userCredential.user;
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      throw error;
    }
  },

  // Kullanıcı Girişi (Login)
  login: async (email: string, password: string): Promise<User> => {
    try {
      const cleanEmail = email.trim();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return userCredential.user;
    } catch (error) {
      console.error("Giriş Hatası:", error);
      throw error;
    }
  },

  // Çıkış Yap (Logout)
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Çıkış Hatası:", error);
      throw error;
    }
  },

  // Şifre Sıfırlama
  resetPassword: async (email: string): Promise<void> => {
    try {
      const cleanEmail = email.trim();
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (error) {
      console.error("Şifre Sıfırlama Hatası:", error);
      throw error;
    }
  },

  // Şifre Değiştirme (Giriş Yapmış Kullanıcı İçin)
  changePassword: async (newPassword: string): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum açmış kullanıcı bulunamadı.');
      await firebaseUpdatePassword(currentUser, newPassword);
    } catch (error) {
      console.error("Şifre Değiştirme Hatası:", error);
      throw error;
    }
  },

  // Hesap Silme (Compliance)
  deleteUserAccount: async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum açmış kullanıcı bulunamadı.');
      await firebaseDeleteUser(currentUser);
    } catch (error) {
      console.error("Hesap Silme Hatası:", error);
      throw error;
    }
  }
};
