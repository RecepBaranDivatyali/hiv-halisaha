import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts, THEMES, ThemeType } from '@/constants/theme';
import { Bouncable } from '@/components/Bouncable';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';
import Constants from 'expo-constants';

const NOTIFS_STORAGE_KEY = '@hiv_notifications_enabled';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, currentTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const styles = useStyles(theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFS_STORAGE_KEY).then((val) => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    }).catch(() => {});
  }, []);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    try {
      await AsyncStorage.setItem(NOTIFS_STORAGE_KEY, String(val));
    } catch (e) {
      console.warn('Bildirim tercihi kaydedilemedi:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm maç verileriniz silinir.",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Hesabımı Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.deleteUserAccount();
              await logout();
              Alert.alert("Hesap Silindi", "Hesabınız başarıyla silinmiştir.");
              router.replace('/login');
            } catch (err: any) {
              Alert.alert("Hata", getTurkishAuthErrorMessage(err));
            }
          }
        }
      ]
    );
  };

  const renderSettingRow = (icon: any, title: string, subtitle?: string, action?: () => void, rightElement?: React.ReactNode) => (
    <Bouncable style={styles.settingRow} onPress={action} disabled={!action}>
      <View style={styles.settingIconBox}>
        <MaterialIcons name={icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.settingTextCol}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        action ? <MaterialIcons name="chevron-right" size={24} color={theme.secondary} /> : null
      )}
    </Bouncable>
  );

  const themeOptions = Object.keys(THEMES) as ThemeType[];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AYARLAR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>HESAP</Text>
        <View style={styles.sectionCard}>
          {renderSettingRow('person', 'Profili Düzenle', 'Kişisel bilgilerini güncelle', () => router.push('/edit-profile'))}
          <View style={styles.divider} />
          {renderSettingRow('lock', 'Şifre Değiştir', 'Hesap güvenliğini sağla', () => {
            if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
              Alert.prompt(
                'Şifre Değiştir',
                'Lütfen yeni şifrenizi girin (en az 6 karakter):',
                async (newPass) => {
                  if (!newPass || newPass.length < 6) {
                    Alert.alert('Geçersiz Şifre', 'Şifre en az 6 karakter olmalıdır.');
                    return;
                  }
                  try {
                    await authService.changePassword(newPass);
                    Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.');
                  } catch (err: any) {
                    Alert.alert('Hata', getTurkishAuthErrorMessage(err));
                  }
                },
                'secure-text'
              );
            } else {
              router.push('/forgot-password');
            }
          })}
        </View>

        <Text style={styles.sectionTitle}>TERCİHLER</Text>
        <View style={styles.sectionCard}>
          {renderSettingRow(
            'notifications', 
            'Uygulama Bildirimleri', 
            'Maç davetleri ve mesajlar', 
            undefined,
            <Switch 
              value={notificationsEnabled} 
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.surfaceContainerHighest, true: `${theme.primary}66` }}
              thumbColor={notificationsEnabled ? theme.primary : theme.textMuted}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>TEMA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, paddingHorizontal: 16, marginHorizontal: -16 }}>
          <View style={{ flexDirection: 'row', gap: 12, paddingRight: 32 }}>
            {themeOptions.map((t) => (
              <TouchableOpacity 
                key={t}
                style={[styles.themeOption, currentTheme === t && styles.themeOptionActive]}
                onPress={() => setTheme(t)}
              >
                <View style={[styles.themePreview, { backgroundColor: THEMES[t].background }]}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: THEMES[t].primary }} />
                </View>
                <Text style={[styles.themeName, currentTheme === t && { color: theme.primary }]}>
                  {t.replace('-', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>UYGULAMA</Text>
        <View style={styles.sectionCard}>
          {renderSettingRow(
            isInstalled ? 'check-circle' : 'get-app',
            isInstalled ? 'Uygulama Yüklendi' : 'Uygulamayı Cihaza Yükle',
            isInstalled ? 'Cihazınızda bağımsız uygulama olarak yüklü' : 'Ana ekrana ekleyip tam ekran deneyimi yaşayın',
            !isInstalled ? () => promptInstall() : undefined
          )}
        </View>

        <Text style={styles.sectionTitle}>DİĞER</Text>
        <View style={styles.sectionCard}>
          {renderSettingRow('privacy-tip', 'Gizlilik Politikası', '', () => Alert.alert('Gizlilik Politikası', 'Kullanıcı verileriniz KVKK standartlarına uygun olarak korunmaktadır.'))}
          <View style={styles.divider} />
          {renderSettingRow('description', 'Kullanım Koşulları', '', () => Alert.alert('Kullanım Koşulları', 'H.İ.V. halısaha topluluk kuralları ve fair-play prensipleri geçerlidir.'))}
          <View style={styles.divider} />
          {renderSettingRow('help-outline', 'Yardım ve Destek', '', () => Alert.alert('Yardım ve Destek', 'Destek için: destek@hivhalisaha.com'))}
        </View>

        <Bouncable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={theme.error} />
          <Text style={styles.logoutText}>ÇIKIŞ YAP</Text>
        </Bouncable>

        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Hesabımı Kalıcı Olarak Sil</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>H.İ.V. v{Constants.expoConfig?.version || '1.0.0'}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.secondary,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: Fonts.headline,
    fontSize: 15,
    color: theme.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 60,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.error}15`,
    borderWidth: 1,
    borderColor: `${theme.error}40`,
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
    gap: 8,
  },
  logoutText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.error,
    letterSpacing: 1,
  },
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteAccountText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    textDecorationLine: 'underline',
  },
  versionText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  themeOption: {
    width: 90,
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}10`,
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
    textAlign: 'center',
  },
});
