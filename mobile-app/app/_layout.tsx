import React, { useEffect, useState } from 'react';
import { Platform, View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialIcons } from '@expo/vector-icons';
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
        /* Remove browser focus rings/outlines on ALL elements (buttons, icons, touchables, inputs, links) */
        *, *:focus, *:focus-visible, *:active {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        [role="button"], button, a, [tabindex], div, input, textarea, select {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        [role="button"]:focus, [role="button"]:focus-visible,
        button:focus, button:focus-visible,
        div:focus, div:focus-visible,
        a:focus, a:focus-visible,
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
        /* Constrain React Native Web Modals within the phone frame on desktop */
        body.desktop-framed-active [aria-modal="true"] {
          position: fixed !important;
          top: var(--phone-frame-top, 60px) !important;
          left: var(--phone-frame-left, calc(50% - 196px)) !important;
          width: var(--phone-frame-width, 393px) !important;
          height: var(--phone-frame-height, 852px) !important;
          right: auto !important;
          bottom: auto !important;
          border-radius: var(--phone-frame-radius, 42px) !important;
          overflow: hidden !important;
          z-index: 10000 !important;
          box-shadow: none !important;
        }

        /* Constrain React Native Web Modal Portal wrapper */
        body.desktop-framed-active div:has(> [aria-modal="true"]) {
          position: fixed !important;
          top: var(--phone-frame-top, 60px) !important;
          left: var(--phone-frame-left, calc(50% - 196px)) !important;
          width: var(--phone-frame-width, 393px) !important;
          height: var(--phone-frame-height, 852px) !important;
          right: auto !important;
          bottom: auto !important;
          border-radius: var(--phone-frame-radius, 42px) !important;
          overflow: hidden !important;
          pointer-events: auto !important;
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
  const { width, height } = useWindowDimensions();
  const [isFramed, setIsFramed] = useState(true);

  const isDesktopWeb = Platform.OS === 'web' && width > 520;

  // Update bounds for desktop framed modals
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const updateFrameBounds = () => {
      const screenEl = document.getElementById('mobile-screen-container');
      if (screenEl && isFramed && isDesktopWeb) {
        const rect = screenEl.getBoundingClientRect();
        document.documentElement.style.setProperty('--phone-frame-top', `${Math.round(rect.top)}px`);
        document.documentElement.style.setProperty('--phone-frame-left', `${Math.round(rect.left)}px`);
        document.documentElement.style.setProperty('--phone-frame-width', `${Math.round(rect.width)}px`);
        document.documentElement.style.setProperty('--phone-frame-height', `${Math.round(rect.height)}px`);
        document.documentElement.style.setProperty('--phone-frame-radius', '42px');
        document.body.classList.add('desktop-framed-active');
      } else {
        document.body.classList.remove('desktop-framed-active');
      }
    };

    updateFrameBounds();
    window.addEventListener('resize', updateFrameBounds);
    const interval = setInterval(updateFrameBounds, 500);
    return () => {
      window.removeEventListener('resize', updateFrameBounds);
      clearInterval(interval);
      document.body.classList.remove('desktop-framed-active');
    };
  }, [isFramed, isDesktopWeb, width, height]);

  // Authentic smartphone dimensions (standard 390px iPhone width, responsive height)
  const phoneWidth = Math.min(390, width - 24);
  const phoneHeight = Math.min(844, Math.max(620, height - 70));

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
      <View style={{ 
        flex: 1, 
        backgroundColor: '#090B10', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' as any,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top desktop floating control bar */}
        <View style={{
          position: 'absolute',
          top: 12,
          zIndex: 9999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'rgba(16, 18, 26, 0.95)',
          paddingVertical: 6,
          paddingHorizontal: 16,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
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
            <Text style={{ color: '#ccc', fontSize: 11, fontWeight: '600' }}>
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

        {/* Mobile Phone Chassis & Simulator */}
        {isFramed ? (
          <View style={{
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 38,
          }}>
            {/* Left hardware button silhouettes (Action button + Volume Up/Down) */}
            <View style={{ position: 'absolute', left: -4, top: 110, width: 4, height: 28, backgroundColor: '#2d3345', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />
            <View style={{ position: 'absolute', left: -4, top: 154, width: 4, height: 48, backgroundColor: '#2d3345', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />
            <View style={{ position: 'absolute', left: -4, top: 212, width: 4, height: 48, backgroundColor: '#2d3345', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />

            {/* Right hardware button silhouette (Power button) */}
            <View style={{ position: 'absolute', right: -4, top: 160, width: 4, height: 72, backgroundColor: '#2d3345', borderTopRightRadius: 3, borderBottomRightRadius: 3 }} />

            {/* Outer Titanium Phone Bezel */}
            <View style={{
              width: phoneWidth + 18,
              height: phoneHeight + 18,
              backgroundColor: '#181b24',
              borderRadius: 48,
              padding: 9,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.14)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.75,
              shadowRadius: 40,
              position: 'relative',
            }}>
              {/* Sleek Ear Speaker Grill on bezel (outside screen) */}
              <View style={{
                position: 'absolute',
                top: 4,
                left: '50%',
                marginLeft: -25,
                width: 50,
                height: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                zIndex: 10,
              }} />

              {/* Inner Phone Screen Display */}
              <View 
                nativeID="mobile-screen-container"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 40,
                  overflow: 'hidden',
                  backgroundColor: theme.background,
                  position: 'relative',
                }}
              >
                {/* Main App Navigation Stack */}
                {stackContent}

                {/* iOS Home Indicator Bar */}
                <View 
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    zIndex: 9998,
                  }}
                >
                  <View style={{
                    width: 125,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  }} />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: theme.background }}>
            {stackContent}
          </View>
        )}
      </View>
    );
  }

  return stackContent;
}
