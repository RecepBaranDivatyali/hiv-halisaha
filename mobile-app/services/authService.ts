import { auth, db } from './firebaseConfig';
import { dbService } from './dbService';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User
} from 'firebase/auth';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';

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
      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      return userCredential.user;
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      throw error;
    }
  },

  // Atomik Kayıt ve Firestore Profil Oluşturma (Rollback Güvenceli)
  registerAndCreateProfile: async (
    email: string,
    password: string,
    profileData: {
      name: string;
      city: string;
      position: string;
      level: string;
      avatar?: string;
      phone?: string;
      [key: string]: any;
    }
  ): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    let createdUser: User | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = userCredential.user;

      await dbService.createUserProfile(createdUser.uid, {
        name: profileData.name.trim(),
        email: cleanEmail,
        city: profileData.city,
        position: profileData.position,
        level: profileData.level,
        ...(profileData.avatar ? { avatar: profileData.avatar } : {}),
        ...(profileData.phone ? { phone: profileData.phone } : {}),
      });

      return createdUser;
    } catch (error) {
      console.error("Kayıt ve Profil Oluşturma Hatası:", error);
      // Rollback: Auth hesabı açıldı ancak Firestore dokümanı oluşturulamadıysa kullanıcıyı sil
      if (createdUser) {
        try {
          await firebaseDeleteUser(createdUser);
          console.warn("Rollback başarılı: Yetim Auth hesabı temizlendi:", createdUser.uid);
        } catch (rollbackError) {
          console.error("Rollback sırasında Auth hesabı silinemedi:", rollbackError);
        }
      }
      throw error;
    }
  },

  // Kullanıcı Girişi (Login)
  login: async (email: string, password: string): Promise<User> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
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
  deleteUserAccount: async (currentPassword?: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açmış kullanıcı bulunamadı.');

    // Şifre sağlandıysa önce yeniden kimlik doğrulaması yap;
    // doğrulama başarısız olursa cleanupUserData ÇALIŞTIRILMAZ.
    if (currentPassword) {
      if (!currentUser.email) {
        throw new Error('Kullanıcı e-posta bilgisi doğrulanamadı.');
      }
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    const userRef = doc(db, 'users', currentUser.uid);
    let backupData: any = null;

    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        backupData = snap.data();
      }

      // Kullanıcının maç, kulüp ve bildirim verilerini temizle
      await dbService.cleanupUserData(currentUser.uid).catch(e => console.warn('Cleanup warning:', e));

      await deleteDoc(userRef);
      await firebaseDeleteUser(currentUser);
    } catch (error: any) {
      console.error("Hesap Silme Hatası:", error);
      if (backupData) {
        try {
          await setDoc(userRef, backupData);
        } catch (rollbackErr) {
          console.error("Kullanıcı verisi geri yüklenirken hata:", rollbackErr);
        }
      }
      throw error;
    }
  }
};
