import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { CustomInput } from '@/components/CustomInput';
import { useTheme } from '@/context/ThemeContext';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';
import { dbService } from '@/services/dbService';

export default function LoginScreen() {
  const router = useRouter();
  const { saveUser } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (isLoading) return;
    const cleanEmail = email.trim();
    const emailValid = validateEmail(cleanEmail);
    const passwordValid = validatePassword(password);
    if (emailValid && passwordValid) {
      setIsLoading(true);
      try {
        // 1. Firebase ile giriş yap
        const user = await authService.login(cleanEmail, password);
        
        if (user) {
          // 2. Veritabanından profil detaylarını getir
          const profileData = await dbService.getUserProfile(user.uid);
          
          // 3. Lokal state'i güncelle
          await saveUser({
            email: cleanEmail,
            name: profileData?.name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
            city: profileData?.city || 'İSTANBUL',
            position: profileData?.position || 'FORVET',
            level: profileData?.level || 'Eğlence',
            ...(profileData?.avatar ? { avatar: profileData.avatar } : {}),
            isLoggedIn: true,
          });
          
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        Alert.alert('Giriş Başarısız', getTurkishAuthErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex}>
          <View style={styles.content}>
            <View style={styles.brandSection}>
              <Text style={styles.brandTitle}>H.İ.V.</Text>
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
                  keyboardType="email-address"
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
                  error={passwordError}
                />
              </View>

              <View style={styles.forgotPassRow}>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotPassText}>Şifremi Unuttum</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.loginBtn, isLoading && { opacity: 0.6 }]} onPress={handleLogin} activeOpacity={0.9} disabled={isLoading}>
                <Text style={styles.loginBtnText}>{isLoading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color={theme.onPrimary} />
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Hesabınız yok mu?</Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.footerLink}> Kayıt Ol</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  
  brandSection: { alignItems: 'center', marginBottom: 48 },
  brandTitle: { fontFamily: Fonts.headlineBold, fontSize: 64, color: theme.text, letterSpacing: -2 },
  brandSub: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  accentLine: { width: 40, height: 4, backgroundColor: theme.primary, borderRadius: 2, marginTop: 16 },

  formSection: { width: '100%' },
  welcomeText: { fontFamily: Fonts.headlineBold, fontSize: 28, color: theme.text, marginBottom: 8 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted, marginBottom: 32 },

  inputGroup: { gap: 8 },

  forgotPassRow: { alignItems: 'flex-end', marginTop: 16, marginBottom: 32 },
  forgotPassText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: theme.primary },

  loginBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnText: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.onPrimary, letterSpacing: 1 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, gap: 4 },
  footerText: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted },
  footerLink: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.primary },
});
