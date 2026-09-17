import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
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
  const [iban, setIban] = useState(user?.iban || '');
  const [ibanName, setIbanName] = useState(user?.ibanName || user?.name || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
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
    setSaving(true);
    try {
      await saveUser({
        name,
        position,
        city,
        bio,
        avatar,
        iban,
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
            <CustomInput
              icon="account-balance"
              value={bankName}
              onChangeText={setBankName}
              placeholder="Örn: Ziraat Bankası, Garanti BBVA"
            />
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
              onChangeText={(t) => setIban(t.toUpperCase())}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              autoCapitalize="characters"
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Bouncable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Text>
        </Bouncable>
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
});
