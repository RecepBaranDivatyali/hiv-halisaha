import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { Bouncable } from '@/components/Bouncable';
import { CustomInput } from '@/components/CustomInput';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';
import { appAlert } from '@/services/appAlert';
import { safeBack } from '@/utils/navigation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const [email, setEmail] = useState(user?.isLoggedIn && user?.email ? user.email : '');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleGoBack = () => {
    if (user.isLoggedIn) {
      safeBack(router, '/settings');
    } else {
      router.replace('/login');
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setRequestError(null);
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      setEmailError('E-posta adresi boş bırakılamaz.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await authService.resetPassword(cleanEmail);
      setSentEmail(cleanEmail);
      setSubmitted(true);
    } catch (e: any) {
      const errMsg = getTurkishAuthErrorMessage(e);
      setRequestError(errMsg);
      appAlert.alert('Hata', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={handleGoBack} 
              accessibilityLabel={user.isLoggedIn ? 'Geri Dön' : 'Girişe Dön'} 
              accessibilityRole="button"
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.iconContainer, submitted && { borderColor: `${theme.primary}50` }]}>
              <MaterialIcons 
                name={submitted ? "mark-email-read" : "lock-reset"} 
                size={64} 
                color={theme.primary} 
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.title}>
                {submitted ? 'E-posta Gönderildi' : 'Şifremi Unuttum'}
              </Text>
              <Text style={styles.subtitle}>
                {submitted 
                  ? `${sentEmail} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.`
                  : 'Endişelenmeyin! E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.'}
              </Text>
            </Animated.View>

            {requestError && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color={theme.error} style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{requestError}</Text>
              </View>
            )}

            {!submitted ? (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
                <CustomInput
                  icon="email"
                  placeholder="E-posta Adresiniz"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={(text) => { 
                    setEmail(text); 
                    if (emailError) setEmailError(''); 
                    if (requestError) setRequestError(null);
                  }}
                  error={emailError}
                />

                <Bouncable 
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                  onPress={handleSubmit} 
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Bağlantı Gönder"
                >
                  {loading && (
                    <ActivityIndicator size="small" color={theme.onPrimary} style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.submitBtnText}>{loading ? 'GÖNDERİLİYOR...' : 'BAĞLANTI GÖNDER'}</Text>
                </Bouncable>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
                <Bouncable 
                  style={styles.submitBtn} 
                  onPress={handleGoBack}
                  accessibilityRole="button"
                  accessibilityLabel={user.isLoggedIn ? 'Ayarlara Dön' : 'Giriş Ekranına Dön'}
                >
                  <Text style={styles.submitBtnText}>
                    {user.isLoggedIn ? 'AYARLARA DÖN' : 'GİRİŞ EKRANINA DÖN'}
                  </Text>
                </Bouncable>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  title: {
    fontFamily: Fonts.headlineBold,
    fontSize: 28,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.error}15`,
    borderWidth: 1,
    borderColor: `${theme.error}40`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    flex: 1,
    color: theme.error,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  form: {
    gap: 20,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.onPrimary,
    letterSpacing: 1,
  },
});
