import React, { useEffect, useState, useCallback } from 'react';
import { Platform, View, TouchableOpacity, Text, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Lexend_700Bold,
  Lexend_900Black
} from '@expo-google-fonts/lexend';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { MaterialIcons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useAuth } from '@/hooks/use-auth';
import { AuthProvider, checkIsAdmin } from '@/context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AppAlertHost } from '@/components/AppAlertHost';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AuthGuard({
  isMaintenanceActive,
  showAdminLogin,
}: {
  isMaintenanceActive?: boolean;
  showAdminLogin?: boolean;
} = {}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const isBanned = Boolean((user as any)?.isBanned);

  useEffect(() => {
    if (loading) return;
    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'login' || firstSegment === 'register';
    const inForgotPassword = firstSegment === 'forgot-password';
    const inOnboarding = firstSegment === 'onboarding';
    const inPrivacy = firstSegment === 'privacy';
    const inNotFound =
      firstSegment === '+not-found' ||
      firstSegment === '[...missing]' ||
      firstSegment === '[...unmatched]';

    if (inPrivacy || inNotFound) return;

    if (isBanned) {
      logout().catch(() => {});
      router.replace('/login');
      return;
    }

    // Bakım modu aktif ve yönetici girişi isteniyorsa: onboarding veya register'a gitmesin, login'de kalsın
    if (isMaintenanceActive && showAdminLogin) {
      if (firstSegment !== 'login') {
        router.replace('/login');
      }
      return;
    }

    if (!user.hasSeenOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (!user.isLoggedIn && !inAuthGroup && !inForgotPassword && !inOnboarding) {
      router.replace('/login');
      return;
    }

    if (user.isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user.isLoggedIn, user.hasSeenOnboarding, isBanned, loading, segments, router, logout, isMaintenanceActive, showAdminLogin]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend: Lexend_900Black,
    LexendBold: Lexend_700Bold,
    Manrope: Manrope_400Regular,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'rn-input-no-outline';
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        /* Remove mouse/touch tap highlights while keeping keyboard focus-visible accessibility */
        *, *:active {
          -webkit-tap-highlight-color: transparent !important;
        }
        *:focus:not(:focus-visible) {
          outline: none !important;
          box-shadow: none !important;
        }
        *:focus-visible {
          outline: 2px solid #8eff71 !important;
          outline-offset: 2px !important;
        }
        /* Chrome / Edge autofill background override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #131313 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          color: #ffffff !important;
          border-radius: 8px !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        /* Native mobile style scrollbars (hidden scrollbars on desktop) */
        ::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        /* Mobile touch text selection ergonomics */
        body {
          user-select: none;
          -webkit-user-select: none;
        }
        input, textarea {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
      `;
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function MaintenanceScreen({
  message,
  user,
  onLogout,
  onAdminLogin,
  onRefresh,
}: {
  message?: string | null;
  user: any;
  onLogout: () => Promise<void>;
  onAdminLogin: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#080A0F',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      position: 'relative',
    }}>
      {/* Background kinetic glow */}
      <View style={{
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(142, 255, 113, 0.06)',
        top: '22%',
      }} />

      {/* Kinetic Icon Shield */}
      <View style={{
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(142, 255, 113, 0.12)',
        borderWidth: 2,
        borderColor: '#8eff71',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#8eff71',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      }}>
        <MaterialIcons name="build" size={44} color="#8eff71" />
      </View>

      {/* Status Live Pill */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(142, 255, 113, 0.35)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 16,
      }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8eff71' }} />
        <Text style={{
          color: '#8eff71',
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}>
          BAKIM ÇALIŞMASI AKTİF
        </Text>
      </View>

      {/* Main Title */}
      <Text style={{
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        fontStyle: 'italic',
        letterSpacing: -0.5,
        marginBottom: 12,
      }}>
        SİSTEM BAKIMDA
      </Text>

      {/* Subtitle / Description */}
      <Text style={{
        color: '#A0AEC0',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        maxWidth: 320,
      }}>
        {message || 'Saha çizgileri yenileniyor ve sunucularımız güçlendiriliyor. Kısa süre sonra tekrar sahadayız!'}
      </Text>

      {/* Action Buttons */}
      <View style={{ width: '100%', maxWidth: 300, gap: 12 }}>
        {user?.isLoggedIn ? (
          <>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
              <MaterialIcons name="person" size={20} color="#8eff71" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                  {user.name || 'Oyuncu'}
                </Text>
                <Text style={{ color: '#718096', fontSize: 11 }} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onLogout()}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1,
                borderColor: '#ef4444',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => onAdminLogin()}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#8eff71',
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#8eff71',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
            }}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#064200" />
            <Text style={{ color: '#064200', fontWeight: '800', fontSize: 13 }}>
              YÖNETİCİ GİRİŞİ
            </Text>
          </TouchableOpacity>
        )}

        {/* Refresh check */}
        <TouchableOpacity
          onPress={handleCheckAgain}
          disabled={checking}
          activeOpacity={0.8}
          style={{
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: checking ? 0.6 : 1,
          }}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#8eff71" />
          ) : (
            <MaterialIcons name="refresh" size={16} color="#718096" />
          )}
          <Text style={{ color: '#718096', fontSize: 12, fontWeight: '600' }}>
            {checking ? 'Kontrol ediliyor...' : 'Yeniden Kontrol Et'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, loading, logout } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Live maintenance mode from Firestore settings/platform
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenance(data?.maintenance === true);
        setMaintenanceMessage(data?.maintenanceMessage || null);
      } else {
        setMaintenance(false);
        setMaintenanceMessage(null);
      }
    }, (err) => {
      console.warn('Maintenance listener error:', err);
    });

    return () => unsub();
  }, []);

  const refreshMaintenanceStatus = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'platform'));
      if (snap.exists()) {
        const data = snap.data();
        setMaintenance(data?.maintenance === true);
        setMaintenanceMessage(data?.maintenanceMessage || null);
      } else {
        setMaintenance(false);
        setMaintenanceMessage(null);
      }
    } catch (err) {
      console.warn('Maintenance refresh error:', err);
    }
  }, []);

  const isAdmin = checkIsAdmin(user?.email, user?.role);
  const isMaintenanceActive = maintenance && !isAdmin;

  useEffect(() => {
    if (user.isLoggedIn && !isAdmin) {
      setShowAdminLogin(false);
    }
  }, [user.isLoggedIn, isAdmin]);

  const isDesktopWeb = Platform.OS === 'web' && width > 520;

  const stackContent = (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {loading ? (
        <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      ) : isMaintenanceActive && !showAdminLogin ? (
        <>
          <MaintenanceScreen
            message={maintenanceMessage}
            user={user}
            onLogout={logout}
            onRefresh={refreshMaintenanceStatus}
            onAdminLogin={() => {
              setShowAdminLogin(true);
              router.replace('/login');
            }}
          />
          <StatusBar style="light" />
        </>
      ) : (
        <>
          {showAdminLogin && isMaintenanceActive && (
            <View style={{
              backgroundColor: '#121620',
              borderBottomWidth: 1,
              borderBottomColor: '#8eff71',
              paddingTop: Math.max(10, insets.top + 6),
              paddingBottom: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 9999,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
                <MaterialIcons name="security" size={16} color="#8eff71" />
                <Text style={{ color: '#8eff71', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                  Bakım Modu Aktif — Sadece Yönetici Girişi
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAdminLogin(false)}
                style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MaterialIcons name="arrow-back" size={14} color="#ccc" />
                <Text style={{ color: '#ccc', fontSize: 11, fontWeight: '600' }}>
                  Bakım Ekranı
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <AuthGuard isMaintenanceActive={isMaintenanceActive} showAdminLogin={showAdminLogin} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="results" />
            <Stack.Screen name="my-club" />
            <Stack.Screen name="match-room" />
            <Stack.Screen name="rate-match" />
            <Stack.Screen name="conversations" />
            <Stack.Screen name="chat-detail" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </>
      )}
      <AppAlertHost />
    </ThemeProvider>
  );

  if (isDesktopWeb) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: isDark ? '#07090D' : '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh' as any,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle Admin Quick-Access Pill — visible ONLY when logged in as an admin */}
        {isAdmin && (
          <TouchableOpacity
            onPress={() => {
              if (typeof window !== 'undefined') window.location.href = '/admin';
            }}
            activeOpacity={0.85}
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              zIndex: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(16, 18, 26, 0.92)',
              borderWidth: 1,
              borderColor: 'rgba(142, 255, 113, 0.45)',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <MaterialIcons name="admin-panel-settings" size={16} color="#8eff71" />
            <Text style={{ color: '#8eff71', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>
              Admin Paneli →
            </Text>
          </TouchableOpacity>
        )}

        {/* Centered Modern Web App Container */}
        <View
          nativeID="mobile-screen-container"
          style={{
            width: '100%',
            maxWidth: 480,
            height: '100%',
            backgroundColor: theme.background,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isDark ? 0.65 : 0.15,
            shadowRadius: 48,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {stackContent}
        </View>
      </View>
    );
  }

  return stackContent;
}
