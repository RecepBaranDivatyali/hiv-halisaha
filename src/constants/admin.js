import { getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const ADMIN_EMAILS = [
  'baranimoley@gmail.com',
  'barandivatyali@gmail.com',
];

/**
 * Verifies whether a signed-in Firebase user has admin privileges.
 * Checks in order:
 * 1. Firebase Auth custom claim (`token.claims.admin === true`)
 * 2. Verified email included in `ADMIN_EMAILS`
 * 3. Existence of `admins/{uid}` document
 * 4. `users/{uid}` document having `role === 'admin'`
 */
export async function verifyAdminUser(firebaseUser, db) {
  if (!firebaseUser) return false;

  // 1. Custom claims check
  try {
    const tokenResult = await getIdTokenResult(firebaseUser);
    if (tokenResult?.claims?.admin === true) {
      return true;
    }
  } catch (err) {
    console.warn('Admin token claim kontrolü başarısız:', err);
  }

  // 2. Verified allowlist email check
  const email = (firebaseUser.email || '').toLowerCase().trim();
  if (firebaseUser.emailVerified === true && ADMIN_EMAILS.includes(email)) {
    return true;
  }

  if (!db) return false;

  // 3. Dedicated admins/{uid} collection check
  try {
    const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
    if (adminDoc.exists()) {
      return true;
    }
  } catch (err) {
    // Non-admin users may receive permission-denied on admins/{uid}; continue to users/{uid}
    if (err?.code !== 'permission-denied') {
      console.warn('admins koleksiyon kontrolü hatası:', err);
    }
  }

  // 4. users/{uid} role === 'admin' check
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists() && userDoc.data()?.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('users rol kontrolü hatası:', err);
  }

  return false;
}
