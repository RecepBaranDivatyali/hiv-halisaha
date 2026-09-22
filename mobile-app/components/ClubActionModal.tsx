import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { Bouncable } from '@/components/Bouncable';
import { useTheme } from '@/context/ThemeContext';
import { useImagePicker } from '@/hooks/use-image-picker';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';

interface ClubActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'create' | 'join';
}

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Trabzon', 'Eskişehir'];

const PRESET_LOGOS = [
  { id: '1', name: 'Kaplan', uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&h=150&fit=crop' },
  { id: '2', name: 'Kartal', uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&h=150&fit=crop' },
  { id: '3', name: 'Şimşek', uri: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=150&h=150&fit=crop' },
  { id: '4', name: 'Aslan', uri: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=150&h=150&fit=crop' },
  { id: '5', name: 'Boğaziçi', uri: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=150&h=150&fit=crop' },
  { id: '6', name: 'Yıldız', uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&h=150&fit=crop' },
  { id: '7', name: 'Kuzey Gücü', uri: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=150&h=150&fit=crop' },
  { id: '8', name: 'Demir Spor', uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=150&h=150&fit=crop' },
  { id: '9', name: 'Ateş Spor', uri: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=150&h=150&fit=crop' },
  { id: '10', name: 'Kurtlar', uri: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=150&h=150&fit=crop' },
  { id: '11', name: 'Atlas FC', uri: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=150&h=150&fit=crop' },
  { id: '12', name: 'Zirve Spor', uri: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=150&h=150&fit=crop' },
];

export const ClubActionModal: React.FC<ClubActionModalProps> = ({ 
  visible, 
  onClose, 
  onSuccess,
  initialTab = 'create',
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { pickImage } = useImagePicker();
  const { user, saveUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialTab);
  
  // Create Club State
  const [clubName, setClubName] = useState('');
  const [nameError, setNameError] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [selectedCity, setSelectedCity] = useState(user?.city || 'İstanbul');
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string>(PRESET_LOGOS[0].uri);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join Club State
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      if (user?.city) setSelectedCity(user.city);
      setNameError('');
    }
  }, [visible, initialTab, user?.city]);

  const handleLogoSelect = async () => {
    try {
      const uri = await pickImage();
      if (uri) {
        setSelectedLogo(uri);
      }
    } catch {
      Alert.alert('Hata', 'Logo seçilirken bir sorun oluştu.');
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'create') {
      if (!clubName.trim()) {
        setNameError('Lütfen kulüp adını giriniz.');
        Alert.alert('Eksik Bilgi', 'Lütfen kulüp adını girin.');
        return;
      }
      setNameError('');
      setIsSubmitting(true);
      try {
        const newClub = await dbService.createClub({
          name: clubName.trim(),
          desc: clubDesc.trim() || 'Halısaha Takımı',
          city: selectedCity,
          logo: selectedLogo || PRESET_LOGOS[0].uri,
          captainId: user?.uid,
          captainName: user?.name || 'Kaptan',
          color: theme.primary,
          rank: 'YENİ',
          points: 100,
          membersCount: 1,
          maxMembers: 50,
          level: 1,
          members: user?.uid ? [user.uid] : [],
        });

        if (newClub?.id) {
          await saveUser({ 
            clubId: newClub.id, 
            clubName: newClub.name, 
            clubLogo: newClub.logo || selectedLogo || PRESET_LOGOS[0].uri 
          });
        }

        Alert.alert(
          'Tebrikler! 🏆',
          `"${clubName.trim()}" (${selectedCity}) kulübünüz başarıyla kuruldu!`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                setClubName('');
                setClubDesc('');
                setNameError('');
                setSelectedLogo(PRESET_LOGOS[0].uri);
                onClose();
                if (onSuccess) onSuccess();
              },
            },
          ]
        );
      } catch (err) {
        console.error('Kulüp kurma hatası:', err);
        Alert.alert('Hata', 'Kulüp kurulurken bir sorun oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!inviteCode.trim()) {
        Alert.alert('Eksik Bilgi', 'Lütfen davet kodunu girin.');
        return;
      }
      Alert.alert(
        'İstek İletildi ⚽',
        `"${inviteCode.trim().toUpperCase()}" kodlu kulübe katılım isteğiniz iletildi. Kaptan onayladığında bildirim alacaksınız.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>KULÜP İŞLEMLERİ</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>KULÜP KUR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'join' && styles.tabBtnActive]}
              onPress={() => setActiveTab('join')}
            >
              <Text style={[styles.tabText, activeTab === 'join' && styles.tabTextActive]}>KULÜBE KATIL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {activeTab === 'create' ? (
              <View style={styles.formContainer}>
                {/* Active Selected Logo Display */}
                <View style={styles.logoPickerContainer}>
                  <View style={styles.activeLogoWrap}>
                    <Image source={{ uri: selectedLogo }} style={styles.activeLogoImg} />
                    <TouchableOpacity style={styles.uploadBadgeBtn} onPress={handleLogoSelect} activeOpacity={0.8}>
                      <MaterialIcons name="photo-camera" size={14} color={theme.background} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.selectedLogoHint}>Kulüp Arması Seçin veya Fotoğraf Yükleyin</Text>
                </View>

                {/* Preset Logos Horizontal List */}
                <View style={styles.presetSection}>
                  <View style={styles.presetHeader}>
                    <Text style={styles.inputLabel}>HAZIR LOGOLAR (12 ÇEŞİT)</Text>
                    <TouchableOpacity onPress={handleLogoSelect} style={styles.uploadCustomBtn}>
                      <MaterialIcons name="upload" size={14} color={theme.primary} />
                      <Text style={styles.uploadCustomText}>Galeriden Yükle</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetList}>
                    {PRESET_LOGOS.map((p) => {
                      const isChosen = selectedLogo === p.uri;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.presetItem, isChosen && styles.presetItemActive]}
                          onPress={() => setSelectedLogo(p.uri)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: p.uri }} style={styles.presetThumb} />
                          {isChosen && (
                            <View style={styles.presetCheckBadge}>
                              <MaterialIcons name="check" size={10} color={theme.background} />
                            </View>
                          )}
                          <Text style={[styles.presetName, isChosen && { color: theme.primary, fontFamily: Fonts.headlineBold }]} numberOfLines={1}>
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Form Fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Takım Adı *</Text>
                  <TextInput
                    style={[styles.input, Boolean(nameError) && { borderColor: theme.error, borderWidth: 1 }]}
                    placeholder="Örn: Boğaziçi United"
                    placeholderTextColor={theme.textMuted}
                    value={clubName}
                    onChangeText={(t) => {
                      setClubName(t);
                      if (nameError) setNameError('');
                    }}
                  />
                  {Boolean(nameError) && (
                    <Text style={{ color: theme.error, fontSize: 11, fontFamily: Fonts.body, marginTop: 4 }}>
                      {nameError}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Açıklama & Slogan</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Hızlı forvetler ve sağlam savunma"
                    placeholderTextColor={theme.textMuted}
                    value={clubDesc}
                    onChangeText={setClubDesc}
                  />
                </View>

                {/* Şehir Seçici */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Şehir</Text>
                  <TouchableOpacity 
                    style={styles.citySelectorBtn} 
                    onPress={() => setCitySelectorOpen(!citySelectorOpen)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialIcons name="location-on" size={18} color={theme.primary} />
                      <Text style={styles.citySelectorText}>{selectedCity}</Text>
                    </View>
                    <MaterialIcons name={citySelectorOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={theme.primary} />
                  </TouchableOpacity>

                  {citySelectorOpen && (
                    <View style={styles.cityChipsGrid}>
                      {CITIES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
                          onPress={() => {
                            setSelectedCity(c);
                            setCitySelectorOpen(false);
                          }}
                        >
                          <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.inviteInfoBox}>
                  <MaterialIcons name="info-outline" size={24} color={theme.secondary} />
                  <Text style={styles.inviteInfoText}>
                    Bir kulübe katılmak için takım kaptanının size verdiği davet kodunu girin.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Davet Kodu</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: VNG-8472"
                    placeholderTextColor={theme.textMuted}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={theme.background} />
                  <Text style={styles.submitBtnText}>KURULUYOR...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <MaterialIcons name={activeTab === 'create' ? "add-circle" : "send"} size={20} color={theme.background} />
                  <Text style={styles.submitBtnText}>
                    {activeTab === 'create' ? 'KULÜBÜ KUR' : 'KATILMA İSTEĞİ GÖNDER'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.surfaceContainerHighest,
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.surfaceContainerHighest,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: theme.primary,
  },
  body: {
    flex: 1,
  },
  formContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  logoPickerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  logoPickerBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPickerText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.secondary,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  inputDisabled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderColor: theme.borderSubtle,
  },
  inviteInfoBox: {
    flexDirection: 'row',
    backgroundColor: `${theme.secondary}1A`,
    borderWidth: 1,
    borderColor: `${theme.secondary}4D`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  inviteInfoText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.secondary,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.surfaceContainerHighest,
    backgroundColor: theme.background,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.onPrimary,
    letterSpacing: 1,
  },

  activeLogoWrap: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: theme.primary,
    overflow: 'hidden',
  },
  activeLogoImg: {
    width: '100%',
    height: '100%',
  },
  uploadBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  selectedLogoHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  presetSection: {
    gap: 8,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadCustomText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
  },
  presetList: {
    gap: 12,
    paddingVertical: 4,
  },
  presetItem: {
    alignItems: 'center',
    width: 64,
    padding: 6,
    borderRadius: 12,
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetItemActive: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}1A`,
  },
  presetThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  presetCheckBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetName: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
    textAlign: 'center',
  },

  citySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  citySelectorText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
  },
  cityChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: theme.surfaceContainerHigh,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginTop: 6,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  cityChipActive: {
    backgroundColor: `${theme.primary}26`,
    borderColor: theme.primary,
  },
  cityChipText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
  },
  cityChipTextActive: {
    color: theme.primary,
    fontFamily: Fonts.headlineBold,
  },
});
