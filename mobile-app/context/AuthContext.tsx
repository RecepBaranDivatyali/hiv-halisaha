import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/services/firebaseConfig';
import { authService } from '@/services/authService';
import { dbService } from '@/services/dbService';
import { appAlert } from '@/services/appAlert';
import { clearSharedMatchesCache } from '@/hooks/use-matches';

export interface UserStats {
  goals?: number;
  assists?: number;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  mvpCount?: number;
  reliabilityScore?: number;
  cleanSheets?: number;
  ratingSum?: number;
  ratingsCount?: number;
}

export interface UserSession {
  uid?: string;
  name: string;
  email: string;
  position: string;
  level: string;
  city: string;
  district?: string;
  rating: number;
  avatar: string;
  isLoggedIn: boolean;
  hasSeenOnboarding?: boolean;
  clubId?: string | null;
  clubName?: string | null;
  clubLogo?: string | null;
  role?: 'user' | 'admin';
  isBanned?: boolean;
  banReason?: string;
  bio?: string;
  iban?: string;
  ibanName?: string;
  bankName?: string;
  stats?: UserStats;
  isLookingForMatch?: boolean;
  availableDate?: string;
  availableUntil?: number;
  availableDateUpdatedAt?: number;
  preferredDistrict?: string;
  availableNote?: string;
  dismissedReviews?: string[];
}

export const INITIAL_USER: UserSession = {
  uid: undefined,
  name: '',
  email: '',
  position: 'FORVET',
  level: 'Eğlence',
  city: 'İSTANBUL',
  rating: 5.0,
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG',
  isLoggedIn: false,
  isLookingForMatch: false,
  availableDate: '',
  preferredDistrict: '',
  availableNote: '',
  hasSeenOnboarding: false,
  clubId: null,
  clubName: null,
  clubLogo: null,
  role: 'user',
  isBanned: false,
  stats: {
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    mvpCount: 0,
    reliabilityScore: 100,
    cleanSheets: 0,
  },
};

export const REVIEWER_DEMO_USER: UserSession = {
  uid: 'store_reviewer_demo_user',
  name: 'Mağaza Denetçisi',
  email: 'demo@hivhalisaha.com',
  position: 'Orta Saha',
  level: 'Rekabetçi',
  city: 'İstanbul',
  district: 'Kadıköy',
  rating: 4.9,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  isLoggedIn: true,
  hasSeenOnboarding: true,
  clubId: null,
  clubName: null,
  clubLogo: null,
  role: 'user',
  isBanned: false,
  isLookingForMatch: true,
  availableDate: 'Yarın 20:00 - 23:00',
  preferredDistrict: 'Kadıköy / Ataşehir',
  availableNote: 'Mağaza inceleme test hesabı. Tüm fonksiyonlar aktiftir.',
  stats: {
    goals: 14,
    assists: 9,
    matchesPlayed: 18,
    wins: 12,
    losses: 4,
    draws: 2,
    mvpCount: 5,
    reliabilityScore: 98,
    cleanSheets: 3,
  },
};

export const ADMIN_EMAILS = [
  'baranimoley@gmail.com',
  'barandivatyali@gmail.com',
];

export const checkIsAdmin = (email?: string, role?: string): boolean => {
  if (role === 'admin') return true;
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

const USER_STORAGE_KEY = '@hiv_user_session';
const ONBOARDING_STORAGE_KEY = '@hiv_has_seen_onboarding';
const DEMO_SESSION_KEY = '@hiv_is_demo_session';

export interface AuthContextType {
  user: UserSession;
  loading: boolean;
  saveUser: (updatedUser: Partial<UserSession>) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginAsReviewerDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(INITIAL_USER);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const [savedSession, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
      ]);

      const hasSeenOnboarding = savedOnboarding === 'true';

      if (savedSession) {
        const parsed: UserSession = JSON.parse(savedSession);
        const isAdminUser = checkIsAdmin(parsed.email, parsed.role);
        setUser({
          ...parsed,
          role: isAdminUser ? 'admin' : (parsed.role || 'user'),
          hasSeenOnboarding: hasSeenOnboarding || parsed.hasSeenOnboarding || false,
        });
      } else {
        setUser((prev) => ({
          ...prev,
          hasSeenOnboarding,
        }));
      }
    } catch (e) {
      console.warn('Error reading local auth session:', e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadSession();

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up any existing Firestore snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        await AsyncStorage.removeItem(DEMO_SESSION_KEY).catch(() => {});

        let profile: any = null;
        try {
          profile = await dbService.getUserProfile(firebaseUser.uid);
          if (!profile && active) {
            await new Promise((r) => setTimeout(r, 600));
            profile = await dbService.getUserProfile(firebaseUser.uid);
          }
          if (!profile && active) {
            profile = await dbService.ensureUserProfile(firebaseUser.uid, {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || undefined,
            });
          }
        } catch (fetchError) {
          console.warn('Firebase profile fetch network warning (session preserved):', fetchError);
        }

        if (!active) return;

        try {
          const userEmail = (firebaseUser.email || profile?.email || '').toLowerCase().trim();
          const isAdminUser = checkIsAdmin(userEmail, profile?.role);

          setUser((prev) => {
            const basePrev = prev.uid === firebaseUser.uid ? prev : INITIAL_USER;
            const activeUser: UserSession = {
              ...INITIAL_USER,
              ...basePrev,
              ...(profile || {}),
              uid: firebaseUser.uid,
              email: firebaseUser.email || profile?.email || basePrev.email || '',
              name:
                profile?.name ||
                basePrev.name ||
                firebaseUser.displayName ||
                (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Oyuncu'),
              role: isAdminUser ? 'admin' : (profile?.role || basePrev.role || 'user'),
              isBanned: profile?.isBanned === true,
              isLoggedIn: true,
              hasSeenOnboarding: true,
            };

            AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(activeUser)).catch(() => {});
            AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').catch(() => {});
            return activeUser;
          });

          // Live Firestore real-time profile sync
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsub = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (!active) return;
              if (docSnap.exists()) {
                const liveData = docSnap.data();
                const liveEmail = (firebaseUser.email || liveData.email || '').toLowerCase().trim();
                const isLiveAdmin = checkIsAdmin(liveEmail, liveData.role);

                setUser((prev) => {
                  if (prev.uid && prev.uid !== firebaseUser.uid) return prev;

                  const updated: UserSession = {
                    ...prev,
                    ...liveData,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || liveData.email || prev.email,
                    name: liveData.name || prev.name || 'Oyuncu',
                    role: isLiveAdmin ? 'admin' : (liveData.role || prev.role || 'user'),
                    isBanned: liveData.isBanned === true,
                    banReason: liveData.banReason ?? undefined,
                    rating: typeof liveData.rating === 'number' ? liveData.rating : (prev.rating ?? 5.0),
                    clubId: liveData.clubId !== undefined ? liveData.clubId : prev.clubId,
                    clubName: liveData.clubName !== undefined ? liveData.clubName : prev.clubName,
                    clubLogo: liveData.clubLogo !== undefined ? liveData.clubLogo : prev.clubLogo,
                    stats: liveData.stats ? { ...prev.stats, ...liveData.stats } : prev.stats,
                    isLoggedIn: true,
                    hasSeenOnboarding: true,
                  };

                  AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch((err) => {
                    console.warn('AsyncStorage live sync error:', err);
                  });

                  return updated;
                });
              }
            },
            (snapError) => {
              console.warn('User live sync snapshot listener error:', snapError);
            }
          );

          if (!active) {
            unsub();
          } else {
            unsubscribeSnapshot = unsub;
          }
        } catch (error) {
          console.error('Firebase session initialization error:', error);
        }
      } else {
        try {
          const [savedSession, savedOnboarding, isDemoFlag] = await Promise.all([
            AsyncStorage.getItem(USER_STORAGE_KEY),
            AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
            AsyncStorage.getItem(DEMO_SESSION_KEY),
          ]);
          if (!active) return;

          let parsedSession: UserSession | null = null;
          if (savedSession) {
            try {
              parsedSession = JSON.parse(savedSession);
            } catch {
              parsedSession = null;
            }
          }

          if (isDemoFlag === 'true' || parsedSession?.uid === REVIEWER_DEMO_USER.uid) {
            const demoSession: UserSession = {
              ...REVIEWER_DEMO_USER,
              ...(parsedSession || {}),
              uid: REVIEWER_DEMO_USER.uid,
              isLoggedIn: true,
              hasSeenOnboarding: true,
            };
            setUser(demoSession);
          } else {
            const hasSeenOnboarding = savedOnboarding === 'true';
            setUser({
              ...INITIAL_USER,
              hasSeenOnboarding,
              isLoggedIn: false,
            });
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
          }
        } catch (err) {
          console.warn('Error handling signed-out auth state:', err);
        }
      }

      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      unsubscribeAuth();
    };
  }, [loadSession]);

  const saveUser = async (updatedUser: Partial<UserSession>) => {
    const oldUser = user;
    try {
      const newUser = { ...user, ...updatedUser, isLoggedIn: true };
      setUser(newUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      const isDemoFlag = await AsyncStorage.getItem(DEMO_SESSION_KEY).catch(() => null);
      const isDemoUser = newUser.uid === REVIEWER_DEMO_USER.uid || isDemoFlag === 'true';

      if (newUser.uid && !isDemoUser) {
        // Strip UI-only and security-sensitive flags before updating Firestore
        const {
          isLoggedIn,
          hasSeenOnboarding,
          role,
          isBanned,
          banReason,
          uid,
          ...dbPayload
        } = updatedUser as any;
        if (Object.keys(dbPayload).length > 0) {
          await dbService.updateUserProfile(newUser.uid, dbPayload);
        }
      }
    } catch (e) {
      console.error('Error saving user profile:', e);
      setUser(oldUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(oldUser)).catch(() => {});
      appAlert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearSharedMatchesCache();
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEY,
        DEMO_SESSION_KEY,
        '@hiv_matches_cache',
        '@hiv_search_prefs',
      ]).catch((err) => console.warn('Logout storage cleanup warning:', err));
      const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).catch(() => null);
      setUser({
        ...INITIAL_USER,
        hasSeenOnboarding: savedOnboarding === 'true',
        isLoggedIn: false,
      });
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setUser((prev) => {
        const updated = { ...prev, hasSeenOnboarding: true };
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (e) {
      console.error('Error saving onboarding flag:', e);
    }
  };

  const refreshUser = async () => {
    if (!user.uid || user.uid === REVIEWER_DEMO_USER.uid) return;
    try {
      const profile = await dbService.getUserProfile(user.uid);
      if (profile) {
        const refreshed = { ...user, ...profile };
        setUser(refreshed);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(refreshed));
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  const loginAsReviewerDemo = async () => {
    try {
      setUser(REVIEWER_DEMO_USER);
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(REVIEWER_DEMO_USER)),
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true'),
        AsyncStorage.setItem(DEMO_SESSION_KEY, 'true'),
      ]);
    } catch (e) {
      console.error('Error logging in as reviewer demo:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveUser,
        logout,
        completeOnboarding,
        refreshUser,
        loginAsReviewerDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
