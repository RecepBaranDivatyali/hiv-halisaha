import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useImagePicker } from '@/hooks/use-image-picker';
import { CustomInput } from '@/components/CustomInput';
import { useTheme } from '@/context/ThemeContext';
import { authService, getTurkishAuthErrorMessage } from '@/services/authService';
import { dbService } from '@/services/dbService';

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
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

export default function RegisterScreen() {
  const router = useRouter();
  const { saveUser } = useAuth();
  const { promptPicker } = useImagePicker();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    position: '',
    level: '',
    avatar: ''
  });
  const [errors, setErrors] = useState({ name: '', email: '', password: '', city: '', kvkk: '' });
  const [citySearch, setCitySearch] = useState('');
  const [showCityList, setShowCityList] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const positions = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];
  const levels = ['Eğlence', 'Orta', 'Rekabetçi', 'Profesyonel'];

  const filteredCities = TURKISH_CITIES.filter(c =>
    c.toLocaleLowerCase('tr').includes(citySearch.toLocaleLowerCase('tr'))
  );

  const validateStep1 = () => {
    const newErrors = { name: '', email: '', password: '', city: '', kvkk: '' };
    let valid = true;
    if (!formData.name.trim()) {
      newErrors.name = 'Ad soyad zorunludur';
      valid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
      valid = false;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Geçerli bir e-posta girin';
      valid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Şifre zorunludur';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
      valid = false;
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Şehir seçimi zorunludur';
      valid = false;
    }
    if (!acceptedKvkk) {
      newErrors.kvkk = 'Kullanım koşullarını kabul etmelisiniz';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!formData.position) {
        Alert.alert('Pozisyon Seçin', 'Lütfen bir pozisyon seçin.');
        return;
      }
      setStep(3);
    } else {
      if (!formData.level) {
        Alert.alert('Seviye Seçin', 'Lütfen oyun seviyenizi seçin.');
        return;
      }
      if (isLoading) return;
      setIsLoading(true);
      try {
        const cleanEmail = formData.email.trim();
        // 1. Firebase Auth ile kullanıcı oluştur
        const user = await authService.register(cleanEmail, formData.password);
        
        if (user) {
          // 2. Firestore'a kullanıcı detaylarını kaydet
          await dbService.createUserProfile(user.uid, {
            name: formData.name.trim(),
            email: cleanEmail,
            city: formData.city,
            position: formData.position,
            level: formData.level,
            ...(formData.avatar ? { avatar: formData.avatar } : {})
          });

          // 3. Lokal oturum state'ini güncelle
          await saveUser({
            name: formData.name.trim(),
            email: cleanEmail,
            city: formData.city,
            position: formData.position,
            level: formData.level,
            ...(formData.avatar ? { avatar: formData.avatar } : {}),
            isLoggedIn: true
          });
          
          router.replace('/(tabs)');
        }
      } catch (error: any) {
        Alert.alert('Kayıt Hatası', getTurkishAuthErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
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
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} accessibilityLabel="Geri" accessibilityRole="button">
                <MaterialIcons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.stepIndicator}>
                {[1, 2, 3].map((s) => (
                  <View 
                    key={s} 
                    style={[
                      styles.stepDot, 
                      { backgroundColor: s <= step ? theme.primary : theme.surfaceContainerHighest }
                    ]} 
                  />
                ))}
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.appName}>H.İ.V.</Text>
              <Text style={styles.title}>
                {step === 1 ? 'Hesap Oluştur' : step === 2 ? 'Pozisyon Seç' : 'Oyun Seviyesi'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 ? 'H.İ.V. topluluğuna katılın' : step === 2 ? 'En iyi performans sergilediğin mevki' : 'Seni en iyi tanımlayan seviye'}
              </Text>
            </View>

            {/* Step 1: Basic Info + City + Photo */}
            {step === 1 && (
              <View style={styles.form}>
                {/* Photo Picker */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{ position: 'relative', width: 90, height: 90 }}
                    onPress={async () => {
                      const uri = await promptPicker();
                      if (uri) setFormData({ ...formData, avatar: uri });
                    }}
                    accessibilityLabel="Fotoğraf Seç"
                    accessibilityRole="button"
                  >
                    <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: theme.primary, padding: 2, backgroundColor: theme.surface, overflow: 'hidden' }}>
                      <Image
                        source={{ uri: formData.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }}
                        style={{ width: '100%', height: '100%', borderRadius: 43 }}
                      />
                    </View>
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.background }}>
                      <MaterialIcons name="add-a-photo" size={14} color={theme.onPrimary} />
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, marginTop: 8 }}>Profil Fotoğrafı Ekle</Text>
                </View>

                <CustomInput
                  icon="person"
                  placeholder="Ad Soyad"
                  value={formData.name}
                  onChangeText={(val) => setFormData({...formData, name: val})}
                  error={errors.name}
                />
                <CustomInput
                  icon="email"
                  placeholder="E-posta"
                  value={formData.email}
                  onChangeText={(val) => setFormData({...formData, email: val})}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errors.email}
                />
                <CustomInput
                  icon="lock"
                  placeholder="Şifre"
                  value={formData.password}
                  onChangeText={(val) => setFormData({...formData, password: val})}
                  secureTextEntry
                  isPassword
                  error={errors.password}
                />

                <View>
                  <TouchableOpacity
                    style={[styles.inputContainer, errors.city ? styles.inputError : null]}
                    onPress={() => { setShowCityList(!showCityList); setCitySearch(''); }}
                  >
                    <MaterialIcons name="location-on" size={18} color={errors.city ? theme.error : theme.textMuted} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: formData.city ? theme.text : theme.textMuted }]}>
                      {formData.city || 'Şehir Seçin'}
                    </Text>
                    <MaterialIcons name={showCityList ? 'expand-less' : 'expand-more'} size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                  {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

                  {showCityList && (
                    <View style={styles.cityDropdown}>
                      <View style={styles.citySearchBox}>
                        <MaterialIcons name="search" size={16} color={theme.textMuted} />
                        <TextInput
                          placeholder="Şehir ara..."
                          placeholderTextColor={theme.textMuted}
                          style={styles.citySearchInput}
                          value={citySearch}
                          onChangeText={setCitySearch}
                          autoFocus
                        />
                      </View>
                      <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                        {filteredCities.map((city) => (
                          <TouchableOpacity
                            key={city}
                            style={styles.cityItem}
                            onPress={() => {
                              setFormData({...formData, city});
                              setShowCityList(false);
                              setErrors({...errors, city: ''});
                            }}
                          >
                            <Text style={styles.cityItemText}>{city}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* KVKK Checkbox */}
                <TouchableOpacity 
                  style={styles.kvkkRow} 
                  activeOpacity={0.8}
                  onPress={() => setAcceptedKvkk(!acceptedKvkk)}
                >
                  <MaterialIcons 
                    name={acceptedKvkk ? 'check-box' : 'check-box-outline-blank'} 
                    size={20} 
                    color={acceptedKvkk ? theme.primary : theme.textMuted} 
                  />
                  <Text style={styles.kvkkText}>
                    Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metnini okudum, onaylıyorum.
                  </Text>
                </TouchableOpacity>
                {errors.kvkk ? <Text style={styles.errorText}>{errors.kvkk}</Text> : null}
              </View>
            )}

            {step === 2 && (
              <View style={{ gap: 12 }}>
                {positions.map((pos) => (
                  <TouchableOpacity 
                    key={pos}
                    style={[styles.levelCard, formData.position === pos && styles.levelCardActive]}
                    onPress={() => setFormData({...formData, position: pos})}
                  >
                    <View style={styles.levelHeader}>
                      <Text style={[styles.levelTitle, formData.position === pos && styles.levelTitleActive]}>{pos}</Text>
                      {formData.position === pos && <MaterialIcons name="check-circle" size={20} color={theme.primary} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: 12 }}>
                {levels.map((lvl) => (
                  <TouchableOpacity 
                    key={lvl}
                    style={[styles.levelCard, formData.level === lvl && styles.levelCardActive]}
                    onPress={() => setFormData({...formData, level: lvl})}
                  >
                    <View style={styles.levelHeader}>
                      <Text style={[styles.levelTitle, formData.level === lvl && styles.levelTitleActive]}>{lvl}</Text>
                      {formData.level === lvl && <MaterialIcons name="check-circle" size={20} color={theme.primary} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.nextBtn, isLoading && { opacity: 0.6 }]} 
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <Text style={{ fontFamily: Fonts.headlineBold, color: theme.onPrimary, fontSize: 15 }}>
                {isLoading ? 'KAYDEDİLİYOR...' : step < 3 ? 'DEVAM ET' : 'KAYDI TAMAMLA'}
              </Text>
              <MaterialIcons name={step === 3 ? "done" : "arrow-forward"} size={20} color={theme.onPrimary} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
              <Text style={{ color: theme.textMuted, fontFamily: Fonts.body }}>Zaten üye misiniz? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={{ color: theme.primary, fontFamily: Fonts.headlineBold }}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40, flexGrow: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingTop: 16 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: { width: 32, height: 4, borderRadius: 2 },

  titleSection: { marginBottom: 32 },
  appName: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.primary, letterSpacing: 2, marginBottom: 8, fontStyle: 'italic' },
  title: { fontFamily: Fonts.headlineBold, fontSize: 32, color: theme.text, letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted },

  form: { gap: 16, flex: 1 },
  
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56, 
    borderRadius: 12, 
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputError: {
    borderColor: theme.error,
    backgroundColor: `${theme.error}10`,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: theme.text },
  errorText: { fontFamily: Fonts.body, fontSize: 12, color: theme.error, marginTop: 4, marginLeft: 4 },

  cityDropdown: { backgroundColor: theme.surfaceContainer, borderRadius: 12, marginTop: 8, maxHeight: 200, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  citySearchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface },
  citySearchInput: { flex: 1, marginLeft: 8, fontFamily: Fonts.body, fontSize: 14, color: theme.text },
  cityItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  cityItemText: { fontFamily: Fonts.body, fontSize: 14, color: theme.text },

  kvkkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  kvkkText: { flex: 1, fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, lineHeight: 16 },

  nextBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  levelCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  levelCardActive: {
    backgroundColor: `${theme.primary}15`,
    borderColor: theme.primary,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  levelTitle: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.text },
  levelTitleActive: { color: theme.primary },
});
