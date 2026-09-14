import React, { useEffect, useState } from 'react';
import { Platform, View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
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
import 'react-native-reanimated';
import { useAuth } from '@/hooks/use-auth';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user.hasSeenOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (!user.isLoggedIn && !inAuthGroup && !inOnboarding) {
      router.replace('/login');
      return;
    }

    if (user.isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user.isLoggedIn, user.hasSeenOnboarding, loading, segments, router]);

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
        input, textarea, select {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        input:focus, textarea:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
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
      `;
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppThemeProvider>
  );
}

function AppContent() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [isFramed, setIsFramed] = useState(true);

  const isDesktopWeb = Platform.OS === 'web' && width > 520;

  const stackContent = (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="results" />
        <Stack.Screen name="my-club" />
        <Stack.Screen name="match-room" />
        <Stack.Screen name="rate-match" />
        <Stack.Screen name="conversations" />
        <Stack.Screen name="chat-detail" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.background} />
    </ThemeProvider>
  );

  if (isDesktopWeb) {
    return (
      <View style={{ flex: 1, backgroundColor: '#070A10', alignItems: 'center', justifyContent: 'center', height: '100vh' as any }}>
        {/* Top desktop floating bar */}
        <View style={{
          position: 'absolute',
          top: 14,
          zIndex: 9999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'rgba(18, 20, 28, 0.92)',
          paddingVertical: 7,
          paddingHorizontal: 16,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8eff71' }} />
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
            H.İ.V. Halısaha <Text style={{ color: '#8eff71' }}>Mobil Görünüm</Text>
          </Text>

          <TouchableOpacity
            onPress={() => setIsFramed(!isFramed)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#aaa', fontSize: 11, fontWeight: '600' }}>
              {isFramed ? '⛶ Tam Ekran' : '📱 Mobil Çerçeve'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (typeof window !== 'undefined') window.location.href = '/admin';
            }}
            style={{
              backgroundColor: '#8eff71',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#064200', fontSize: 11, fontWeight: '800' }}>
              🛡️ Admin Paneli →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mobile Device Frame */}
        <View style={isFramed ? {
          width: '100%',
          maxWidth: 440,
          height: '92vh' as any,
          maxHeight: 880,
          borderRadius: 36,
          overflow: 'hidden',
          backgroundColor: theme.background,
          borderWidth: 3,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.6,
          shadowRadius: 36,
          marginTop: 40,
        } : {
          width: '100%',
          height: '100%',
          backgroundColor: theme.background,
        }}>
          {stackContent}
        </View>
      </View>
    );
  }

  return stackContent;
}
