import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Bouncable } from '@/components/Bouncable';
import { CustomInput } from '@/components/CustomInput';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
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
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Hata', getTurkishAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconContainer}>
          <MaterialIcons name="lock-reset" size={64} color={theme.primary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={styles.title}>Şifremi Unuttum</Text>
          <Text style={styles.subtitle}>
            {submitted 
              ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
              : 'Endişelenmeyin! E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.'}
          </Text>
        </Animated.View>

        {!submitted ? (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
            <CustomInput
              icon="email"
              placeholder="E-posta Adresiniz"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(''); }}
              error={emailError}
            />

            <Bouncable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'GÖNDERİLİYOR...' : 'BAĞLANTI GÖNDER'}</Text>
            </Bouncable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
            <Bouncable style={styles.submitBtn} onPress={() => router.back()}>
              <Text style={styles.submitBtnText}>GİRİŞ EKRANINA DÖN</Text>
            </Bouncable>
          </Animated.View>
        )}
      </View>
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
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 12,
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
