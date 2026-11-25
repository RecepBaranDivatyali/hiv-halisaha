import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
import { db } from '@/services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { appAlert } from '@/services/appAlert';
import { safeBack } from '@/utils/navigation';

const normalizeTr = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\u0307/g, '');

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın',
  'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı',
  'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul',
  'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
  'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
  'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
  'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan',
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
];

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
  const [city, setCity] = useState(() => {
    const raw = (user?.city || 'İstanbul').trim();
    const norm = normalizeTr(raw);
    const matched = TURKISH_CITIES.find(c => normalizeTr(c) === norm);
    return matched || raw;
  });
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
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
    try {
      const uri = await promptPicker();
      if (uri) {
        setAvatar(uri);
      }
    } catch {
      appAlert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu.');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const trimmedName = name.trim();
    const trimmedCity = city.trim() || 'İstanbul';
    const trimmedBio = bio.trim();
    const trimmedIbanName = ibanName.trim();
    const trimmedBankName = bankName.trim();

    if (!trimmedName) {
      appAlert.alert('İsim Gerekli', 'Lütfen ad ve soyadınızı girin.');
      return;
    }
    const cleanIban = iban.trim();
    if (cleanIban) {
      if (!isValidTurkishIban(cleanIban)) {
        appAlert.alert(
          'Geçersiz IBAN',
          'IBAN "TR" ile başlamalı ve toplam 26 karakter (TR + 24 rakam) olmalıdır.\nÖrn: TR00 0000 0000 0000 0000 0000 00'
        );
        return;
      }
      if (!trimmedBankName) {
        appAlert.alert('Banka Seçimi Gerekli', 'Lütfen IBAN hesabınızın ait olduğu bankayı listeden seçin.');
        return;
      }
      if (!trimmedIbanName) {
        appAlert.alert('Hesap Sahibi Gerekli', 'Lütfen IBAN hesabının ait olduğu ad ve soyadı girin.');
        return;
      }
    }

    setSaving(true);
    try {
      await saveUser({
        name: trimmedName,
        position,
        city: trimmedCity,
        bio: trimmedBio,
        avatar,
        iban: cleanIban,
        ibanName: trimmedIbanName,
        bankName: trimmedBankName,
      });

      // Eğer kullanıcının adı veya IBAN bilgisi değişmişse ve kullanıcı bir kulübün kaptanıysa kulüpteki captainName bilgisini de senkronize et
      const effectiveUid = user?.uid;
      const targetClubId = user?.clubId;
      const hasNameChanged = trimmedName !== (user?.name || '');
      const hasIbanChanged = cleanIban !== (user?.iban || '') || trimmedIbanName !== (user?.ibanName || '');

      if (targetClubId && effectiveUid && (hasNameChanged || hasIbanChanged)) {
        try {
          const clubDocRef = doc(db, 'clubs', targetClubId);
          const clubSnap = await getDoc(clubDocRef);
          if (clubSnap.exists()) {
            const clubData = clubSnap.data();
            const isCap = clubData.captainId === effectiveUid || clubData.captainName === user?.name;
            if (isCap) {
              const clubUpdates: any = {};
              if (hasNameChanged && trimmedName) {
                clubUpdates.captainName = trimmedName;
              }
              if (cleanIban) {
                clubUpdates.captainIban = cleanIban;
              }
              if (trimmedIbanName) {
                clubUpdates.captainIbanName = trimmedIbanName;
              }
              if (trimmedBankName) {
                clubUpdates.captainBankName = trimmedBankName;
              }
              if (Object.keys(clubUpdates).length > 0) {
                await updateDoc(clubDocRef, clubUpdates);
              }
            }
          }
        } catch (syncErr) {
          console.warn('Kulüp kaptan bilgisi senkronizasyon hatası:', syncErr);
        }
      }

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'BAŞARILI',
        message: 'Profil bilgileriniz kaydedildi.',
      });
      timeoutRef.current = setTimeout(() => {
        safeBack(router, '/(tabs)/profile');
      }, 1000);
    } catch (e) {
      console.log('Profil kaydetme hatası:', e);
      appAlert.alert('Hata', 'Profil güncellenirken bir sorun oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => safeBack(router, '/(tabs)/profile')} accessibilityLabel="Geri" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      >
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Kaleci', 'Defans', 'Orta Saha', 'Forvet'].map((pos) => {
              const isSelected = normalizeTr(position) === normalizeTr(pos);
              return (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setPosition(pos)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isSelected ? theme.primary : theme.surfaceContainerHigh,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.headlineBold,
                      fontSize: 12,
                      color: isSelected ? theme.onPrimary : theme.text,
                    }}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ŞEHİR</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => {
              setCitySearch('');
              setCityModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <MaterialIcons name="location-city" size={20} color={city ? theme.primary : theme.textMuted} />
              <Text style={[styles.selectorBtnText, !city && { color: theme.textMuted }]} numberOfLines={1}>
                {city || 'Şehir Seçiniz (81 İl)...'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.textMuted} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'].map((c) => {
              const isSelected = normalizeTr(city) === normalizeTr(c);
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCity(c)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: isSelected ? theme.primary : theme.surfaceContainerHigh,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.headlineBold,
                      fontSize: 11,
                      color: isSelected ? theme.onPrimary : theme.text,
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
      </KeyboardAvoidingView>

      {/* Şehir Seçim Modalı */}
      <AppModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        onRequestClose={() => setCityModalVisible(false)}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="location-city" size={22} color={theme.primary} />
                <Text style={styles.modalTitle}>ŞEHİR SEÇİNİZ (81 İL)</Text>
              </View>
              <TouchableOpacity onPress={() => setCityModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Şehir ara..."
                placeholderTextColor={theme.textMuted}
                value={citySearch}
                onChangeText={setCitySearch}
              />
              {Boolean(citySearch) && (
                <TouchableOpacity onPress={() => setCitySearch('')}>
                  <MaterialIcons name="close" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {TURKISH_CITIES
                .filter(c => normalizeTr(c).includes(normalizeTr(citySearch.trim())))
                .map((c) => {
                  const isSelected = normalizeTr(city) === normalizeTr(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.bankItem, isSelected && styles.bankItemActive]}
                      onPress={() => {
                        setCity(c);
                        setCityModalVisible(false);
                      }}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={18}
                        color={isSelected ? theme.primary : theme.textMuted}
                      />
                      <Text style={[styles.bankItemText, isSelected && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                        {c}
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

      {/* Banka Seçim Modalı */}
      <AppModal
        visible={bankModalVisible}
        onClose={() => setBankModalVisible(false)}
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
                .filter(b => normalizeTr(b).includes(normalizeTr(bankSearch.trim())))
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
