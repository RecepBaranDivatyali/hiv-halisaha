import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { CustomInput } from '@/components/CustomInput';
import { useTheme } from '@/context/ThemeContext';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';
import { dbService } from '@/services/dbService';
import { appAlert } from '@/services/appAlert';

export default function LoginScreen() {
  const router = useRouter();
  const { saveUser, loginAsReviewerDemo } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const clean = text.trim();
    if (!clean) {
      setEmailError('E-posta boş bırakılamaz');
      return false;
    }
    if (!emailRegex.test(clean)) {
      setEmailError('Geçerli bir e-posta girin');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (text: string) => {
    if (!text) {
      setPasswordError('Şifre boş bırakılamaz');
      return false;
    }
    if (text.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    if (isLoading || isDemoLoading) return;
    setLoginError(null);
    const cleanEmail = email.trim();
    const emailValid = validateEmail(cleanEmail);
    const passwordValid = validatePassword(password);
    if (emailValid && passwordValid) {
      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        // 1. Firebase ile giriş yap
        const user = await authService.login(cleanEmail, password);
        
        if (user) {
          // 2. Veritabanından profil detaylarını getir (Reviewer / Eksik profiller için Self-Healing güvenceli)
          let profileData = await dbService.getUserProfile(user.uid);
          if (!profileData) {
            profileData = await dbService.ensureUserProfile(user.uid, {
              email: cleanEmail,
              name: user.displayName || cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
            });
          }
          
          // 3. Lokal state'i güncelle
          await saveUser({
            uid: user.uid,
            email: cleanEmail,
            name: profileData?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
            city: profileData?.city || 'İstanbul',
            position: profileData?.position || 'Orta Saha',
            level: profileData?.level || 'Eğlence',
            ...(profileData?.avatar ? { avatar: profileData.avatar } : {}),
            ...(profileData?.bio ? { bio: profileData.bio } : {}),
            ...(profileData?.foot ? { foot: profileData.foot } : {}),
            ...(profileData?.clubId ? { clubId: profileData.clubId } : {}),
            ...(profileData?.clubName ? { clubName: profileData.clubName } : {}),
            ...(profileData?.clubLogo ? { clubLogo: profileData.clubLogo } : {}),
            ...(profileData?.stats ? { stats: profileData.stats } : {}),
            ...(profileData?.rating !== undefined ? { rating: profileData.rating } : {}),
            ...(profileData?.iban ? { iban: profileData.iban } : {}),
            ...(profileData?.ibanName ? { ibanName: profileData.ibanName } : {}),
            ...(profileData?.bankName ? { bankName: profileData.bankName } : {}),
            ...(profileData?.isLookingForMatch !== undefined ? { isLookingForMatch: profileData.isLookingForMatch } : {}),
            ...(profileData?.dismissedReviews ? { dismissedReviews: profileData.dismissedReviews } : {}),
            role: profileData?.role,
            isLoggedIn: true,
          });
          
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        console.error('Giriş Hatası Detayı:', err);
        const errorMsg = getTurkishAuthErrorMessage(err);
        setLoginError(errorMsg);
        appAlert.alert('Giriş Başarısız', errorMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Google Play & Huawei AppGallery denetmenleri ve hızlı demo testi için garantili giriş akışı
  const handleReviewerQuickLogin = async () => {
    if (isLoading || isDemoLoading) return;
    setIsDemoLoading(true);
    setLoginError(null);
    try {
      let loggedInUser = null;
      try {
        loggedInUser = await authService.login('demo@hivapp.com', 'Halisaha123!');
      } catch {
        // Firebase üzerinde demo hesabı henüz açılmamışsa veya ağ gecikmesi varsa fallback devreye girer
      }

      if (loggedInUser) {
        const profileData = await dbService.getUserProfile(loggedInUser.uid);
        await saveUser({
          uid: loggedInUser.uid,
          email: 'demo@hivapp.com',
          name: profileData?.name || 'Mağaza Denetçisi',
          city: profileData?.city || 'İstanbul',
          position: profileData?.position || 'Orta Saha',
          level: profileData?.level || 'Rekabetçi',
          role: profileData?.role,
          isLoggedIn: true,
          hasSeenOnboarding: true,
        });
      } else {
        await loginAsReviewerDemo();
      }
      router.replace('/(tabs)');
    } catch {
      // Hata durumunda dahi denetmenin uygulamayı incelemesi için yerel oturumu aç
      try {
        await loginAsReviewerDemo();
        router.replace('/(tabs)');
      } catch {
        appAlert.alert('Hata', 'Demo girişi başlatılamadı.');
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('demo@hivapp.com');
    setPassword('Halisaha123!');
    setEmailError('');
    setPasswordError('');
    setLoginError(null);
  };

  return (
    <View style={styles.container}>
      {/* Background with abstract texture style */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4hbENQjPa5K4IPRbacjZSrUZHdHhNFKuHssqPfE4QQWMxCHmnb5UFSDiu5HImiXtKyoxGBVD0V6pIVjETW5LUqWy7-hdE9kl2uGTHdRMf6BTV-BgnU9KFkpQVpTT3o_FIxdHrL7MFtXDe4PkI4LXp74wyoE0IntiIJnxnoXaP0THmgCf483Q6Jgj-7_gj7_v3HvxBUsCjENNE_LrSUK0jNe02C_mjmjAzyulwh6Zc3XhD61ur2b3nR-MLrDe43Ak_N6tuURvhI0H-' }}
        style={StyleSheet.absoluteFillObject}
        imageStyle={{ opacity: 0.1, resizeMode: 'cover' }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.brandSection}>
                <View style={styles.logoBadge}>
                  <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
                </View>
                <Text style={styles.brandSub}>Halısahaya İhtiyacım Var</Text>
                <View style={styles.accentLine} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
                <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>

                <View style={styles.inputGroup}>
                  <CustomInput
                    icon="email"
                    label="E-POSTA"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChangeText={(text) => { setEmail(text); if (emailError) validateEmail(text); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    error={emailError}
                  />

                  <CustomInput
                    icon="lock"
                    label="ŞİFRE"
                    placeholder="Şifreniz"
                    value={password}
                    onChangeText={(text) => { setPassword(text); if (passwordError) validatePassword(text); }}
                    secureTextEntry
                    isPassword
                    textContentType="password"
                    error={passwordError}
                  />
                </View>

                <View style={styles.forgotPassRow}>
                  <TouchableOpacity 
                    onPress={() => router.push('/forgot-password')}
                    disabled={isLoading || isDemoLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Şifremi Unuttum"
                  >
                    <Text style={styles.forgotPassText}>Şifremi Unuttum</Text>
                  </TouchableOpacity>
                </View>

                {loginError && (
                  <View style={styles.errorBanner}>
                    <MaterialIcons name="error-outline" size={18} color={theme.error} style={{ marginRight: 6 }} />
                    <Text style={styles.errorBannerText}>
                      {loginError}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.loginBtn, (isLoading || isDemoLoading) && { opacity: 0.7 }]} 
                  onPress={handleLogin} 
                  activeOpacity={0.88} 
                  disabled={isLoading || isDemoLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Giriş Yap"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} style={{ marginRight: 8 }} />
                  ) : null}
                  <Text style={styles.loginBtnText}>
                    {isLoading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
                  </Text>
                  {!isLoading && <MaterialIcons name="arrow-forward" size={20} color={theme.onPrimary} />}
                </TouchableOpacity>

                {/* Google Play & Huawei Reviewer / Demo Test Bölümü — sadece mobil uygulamalarda gösterilir */}
                {Platform.OS !== 'web' && (
                  <View style={styles.reviewerSection}>
                    <View style={styles.reviewerHeader}>
                      <MaterialIcons name="verified-user" size={16} color={theme.secondary} />
                      <Text style={styles.reviewerLabel}>Mağaza Denetim & Test Girişi</Text>
                    </View>
                    <Text style={styles.reviewerSub}>
                      Google Play & AppGallery inceleme ekibi için tek tıkla test girişi.
                    </Text>
                    <View style={styles.reviewerBtnRow}>
                      <TouchableOpacity
                        style={styles.demoLoginBtn}
                        onPress={handleReviewerQuickLogin}
                        disabled={isLoading || isDemoLoading}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Demo İle Doğrudan Başla"
                      >
                        {isDemoLoading ? (
                          <ActivityIndicator size="small" color={theme.text} style={{ marginRight: 6 }} />
                        ) : (
                          <MaterialIcons name="play-circle-outline" size={18} color={theme.secondary} style={{ marginRight: 6 }} />
                        )}
                        <Text style={styles.demoLoginBtnText}>
                          {isDemoLoading ? 'GİRİLİYOR...' : 'Hızlı Demo Giriş'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.demoFillBtn}
                        onPress={handleFillDemoCredentials}
                        disabled={isLoading || isDemoLoading}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Formu Doldur"
                      >
                        <MaterialIcons name="edit-note" size={18} color={theme.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.demoFillBtnText}>Formu Doldur</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Hesabınız yok mu?</Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/register')}
                    disabled={isLoading || isDemoLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Kayıt Ol"
                  >
                    <Text style={styles.footerLink}> Kayıt Ol</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.background },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  
  brandSection: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 92,
    height: 92,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: `${theme.primary}40`,
    marginBottom: 12,
    backgroundColor: theme.surfaceContainerHigh,
  },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  brandTitle: { fontFamily: Fonts.headlineBold, fontSize: 64, color: theme.text, letterSpacing: -2 },
  brandSub: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  accentLine: { width: 40, height: 4, backgroundColor: theme.primary, borderRadius: 2, marginTop: 12 },

  formSection: { width: '100%' },
  welcomeText: { fontFamily: Fonts.headlineBold, fontSize: 26, color: theme.text, marginBottom: 6 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted, marginBottom: 24 },

  inputGroup: { gap: 6 },

  forgotPassRow: { alignItems: 'flex-end', marginTop: 12, marginBottom: 20 },
  forgotPassText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: theme.primary },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.error}15`,
    borderWidth: 1,
    borderColor: `${theme.error}40`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: theme.error,
    fontFamily: Fonts.body,
    fontSize: 13,
  },

  loginBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: { fontFamily: Fonts.headlineBold, fontSize: 15, color: theme.onPrimary, letterSpacing: 0.5 },

  reviewerSection: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  reviewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reviewerLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    letterSpacing: 0.5,
  },
  reviewerSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 15,
    marginBottom: 10,
  },
  reviewerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoLoginBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: `${theme.secondary}40`,
    paddingVertical: 10,
    borderRadius: 10,
  },
  demoLoginBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
  },
  demoFillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    paddingVertical: 10,
    borderRadius: 10,
  },
  demoFillBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: theme.textMuted,
  },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 4 },
  footerText: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted },
  footerLink: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.primary },
});
