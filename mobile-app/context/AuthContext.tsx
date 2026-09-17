import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { authService } from '@/services/authService';
import { dbService } from '@/services/dbService';

export interface UserStats {
  goals?: number;
  assists?: number;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  mvpCount?: number;
  reliabilityScore?: number;
  cleanSheets?: number;
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
  role?: 'user' | 'admin';
  bio?: string;
  iban?: string;
  ibanName?: string;
  bankName?: string;
  stats?: UserStats;
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
  hasSeenOnboarding: false,
  clubId: null,
  clubName: null,
  role: 'user',
  stats: {
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    mvpCount: 0,
    reliabilityScore: 100,
    cleanSheets: 0,
  },
};

const USER_STORAGE_KEY = '@hiv_user_session';
const ONBOARDING_STORAGE_KEY = '@hiv_has_seen_onboarding';

export interface AuthContextType {
  user: UserSession;
  loading: boolean;
  saveUser: (updatedUser: Partial<UserSession>) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        setUser({
          ...parsed,
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await dbService.getUserProfile(firebaseUser.uid);
          const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
          const hasSeenOnboarding = savedOnboarding === 'true';

          const activeUser: UserSession = {
            ...INITIAL_USER,
            ...(profile || {}),
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: profile?.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Oyuncu'),
            isLoggedIn: true,
            hasSeenOnboarding: true,
          };

          setUser(activeUser);
          await Promise.all([
            AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(activeUser)),
            AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true'),
          ]);
        } catch (error) {
          console.error('Firebase profile fetch error:', error);
        }
      } else {
        const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        const hasSeenOnboarding = savedOnboarding === 'true';

        setUser({
          ...INITIAL_USER,
          hasSeenOnboarding,
          isLoggedIn: false,
        });
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadSession]);

  const saveUser = async (updatedUser: Partial<UserSession>) => {
    const oldUser = user;
    try {
      const newUser = { ...user, ...updatedUser, isLoggedIn: true };
      setUser(newUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      if (newUser.uid) {
        // Strip UI-only flags before updating Firestore
        const { isLoggedIn, hasSeenOnboarding, ...dbPayload } = updatedUser as any;
        if (Object.keys(dbPayload).length > 0) {
          await dbService.updateUserProfile(newUser.uid, dbPayload);
        }
      }
    } catch (e) {
      console.error('Error saving user profile:', e);
      setUser(oldUser);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setUser({
        ...INITIAL_USER,
        hasSeenOnboarding: savedOnboarding === 'true',
        isLoggedIn: false,
      });
    } catch (e) {
      console.error('Logout error:', e);
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
    if (!user.uid) return;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveUser,
        logout,
        completeOnboarding,
        refreshUser,
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
