import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Bouncable } from '@/components/Bouncable';
import { useAuth } from '@/hooks/use-auth';
import { useImagePicker } from '@/hooks/use-image-picker';
import { ToastMessage, ToastNotification } from '@/components/ToastNotification';
import { CustomInput } from '@/components/CustomInput';
import { AppModal } from '@/components/AppModal';

const TURKISH_BANKS = [
  'Ziraat Bankası',
  'Türkiye İş Bankası',
  'Garanti BBVA',
  'Yapı Kredi',
  'Akbank',
  'QNB Finansbank',
  'VakıfBank',
  'Halkbank',
  'Enpara.com',
  'Papara',
  'DenizBank',
  'TEB (Türk Ekonomi Bankası)',
  'Kuveyt Türk',
  'Fibabanka',
  'ING Bank',
  'Şekerbank',
  'Albaraka Türk',
  'Türkiye Finans',
  'Odeabank',
  'Diğer',
];

const formatTurkishIban = (raw: string): string => {
  let clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length > 0 && !clean.startsWith('TR')) {
    if (/^\d/.test(clean)) {
      clean = 'TR' + clean;
    }
  }
  clean = clean.slice(0, 26);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
};

const isValidTurkishIban = (formattedIban: string): boolean => {
  const clean = formattedIban.replace(/\s+/g, '').toUpperCase();
  if (!clean) return true;
  return /^TR\d{24}$/.test(clean);
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { user, saveUser } = useAuth();
  const { promptPicker } = useImagePicker();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || 'Orta Saha');
  const [city, setCity] = useState(user?.city || 'İSTANBUL');
  const [bio, setBio] = useState(user?.bio || 'Futbol tutkunu, takım oyuncusu.');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [iban, setIban] = useState(formatTurkishIban(user?.iban || ''));
  const [ibanName, setIbanName] = useState(user?.ibanName || user?.name || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePickAvatar = async () => {
    const uri = await promptPicker();
    if (uri) {
      setAvatar(uri);
    }
  };

  const handleSave = async () => {
    const cleanIban = iban.trim();
    if (cleanIban) {
      if (!isValidTurkishIban(cleanIban)) {
        Alert.alert(
          'Geçersiz IBAN',
          'IBAN "TR" ile başlamalı ve toplam 26 karakter (TR + 24 rakam) olmalıdır.\nÖrn: TR00 0000 0000 0000 0000 0000 00'
        );
        return;
      }
      if (!bankName.trim()) {
        Alert.alert('Banka Seçimi Gerekli', 'Lütfen IBAN hesabınızın ait olduğu bankayı listeden seçin.');
        return;
      }
      if (!ibanName.trim()) {
        Alert.alert('Hesap Sahibi Gerekli', 'Lütfen IBAN hesabının ait olduğu ad ve soyadı girin.');
        return;
      }
    }

    setSaving(true);
    try {
      await saveUser({
        name,
        position,
        city,
        bio,
        avatar,
        iban: cleanIban,
        ibanName,
        bankName,
      });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'BAŞARILI',
        message: 'Profil bilgileriniz kaydedildi.',
      });
      timeoutRef.current = setTimeout(() => {
        router.back();
      }, 1000);
    } catch (e) {
      console.log('Profil kaydetme hatası:', e);
      Alert.alert('Hata', 'Profil güncellenirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: avatar || user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickAvatar} accessibilityLabel="Fotoğraf Seç" accessibilityRole="button">
              <MaterialIcons name="photo-camera" size={20} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>KULLANICI ADI</Text>
          <CustomInput
            icon="person"
            value={name}
            onChangeText={setName}
            placeholder="Adınız Soyadınız"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>MEVKİ</Text>
          <CustomInput
            icon="sports-soccer"
            value={position}
            onChangeText={setPosition}
            placeholder="Mevkiniz (Örn: Forvet, Kaleci)"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ŞEHİR</Text>
          <CustomInput
            icon="location-on"
            value={city}
            onChangeText={setCity}
            placeholder="Bulunduğunuz Şehir"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>HAKKINDA (BIO)</Text>
          <CustomInput
            icon="info-outline"
            value={bio}
            onChangeText={setBio}
            placeholder="Kısa biyografi..."
            multiline
          />
        </View>

        {/* Kaptan Banka & IBAN Bilgileri (Opsiyonel) */}
        <View style={{ marginTop: 16, padding: 16, backgroundColor: `${theme.primary}0D`, borderRadius: 16, borderWidth: 1, borderColor: `${theme.primary}25`, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="account-balance" size={20} color={theme.primary} />
            <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text }}>
              KAPTAN IBAN BİLGİLERİ (OPSİYONEL)
            </Text>
          </View>
          <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, lineHeight: 15 }}>
            Maç kurduğunuzda oyuncuların FAST ile maç ücretini gönderebilmesi için IBAN bilgilerinizi kaydedebilirsiniz.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>BANKA ADI</Text>
            <TouchableOpacity 
              style={styles.selectorBtn} 
              onPress={() => {
                setBankSearch('');
                setBankModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <MaterialIcons name="account-balance" size={20} color={bankName ? theme.primary : theme.textMuted} />
                <Text style={[styles.selectorBtnText, !bankName && { color: theme.textMuted }]} numberOfLines={1}>
                  {bankName || 'Banka Seçiniz...'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>HESAP SAHİBİ (AD SOYAD)</Text>
            <CustomInput
              icon="badge"
              value={ibanName}
              onChangeText={setIbanName}
              placeholder="Örn: Ahmet Yılmaz"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>IBAN NUMARASI</Text>
            <CustomInput
              icon="credit-card"
              value={iban}
              onChangeText={(t) => setIban(formatTurkishIban(t))}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              autoCapitalize="characters"
              maxLength={32}
            />
            {Boolean(iban.trim()) && !isValidTurkishIban(iban) && (
              <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.error, marginTop: 2 }}>
                ⚠️ IBAN 26 hane olmalıdır ({iban.replace(/\s+/g, '').length}/26)
              </Text>
            )}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Bouncable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Text>
        </Bouncable>
      </View>

      {/* Banka Seçim Modalı */}
      <AppModal
        visible={bankModalVisible}
        onRequestClose={() => setBankModalVisible(false)}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="account-balance" size={22} color={theme.primary} />
                <Text style={styles.modalTitle}>BANKA SEÇİNİZ</Text>
              </View>
              <TouchableOpacity onPress={() => setBankModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Banka ara..."
                placeholderTextColor={theme.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
              />
              {Boolean(bankSearch) && (
                <TouchableOpacity onPress={() => setBankSearch('')}>
                  <MaterialIcons name="close" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {TURKISH_BANKS
                .filter(b => b.toLowerCase().includes(bankSearch.toLowerCase().trim()))
                .map((bank) => {
                  const isSelected = bankName === bank;
                  return (
                    <TouchableOpacity
                      key={bank}
                      style={[styles.bankItem, isSelected && styles.bankItemActive]}
                      onPress={() => {
                        setBankName(bank);
                        setBankModalVisible(false);
                      }}
                    >
                      <MaterialIcons 
                        name="account-balance" 
                        size={18} 
                        color={isSelected ? theme.primary : theme.textMuted} 
                      />
                      <Text style={[styles.bankItemText, isSelected && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                        {bank}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </AppModal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
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
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
  },
  content: {
    padding: 20,
    gap: 16
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.primary,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  formGroup: {
    gap: 6
  },
  label: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    backgroundColor: theme.background,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.onPrimary,
    letterSpacing: 1,
  },
  selectorBtn: {
    height: 52,
    backgroundColor: theme.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  selectorBtnText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surfaceContainer,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  modalTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.borderSubtle}40`,
  },
  bankItemActive: {
    backgroundColor: `${theme.primary}15`,
  },
  bankItemText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text,
  },
});
