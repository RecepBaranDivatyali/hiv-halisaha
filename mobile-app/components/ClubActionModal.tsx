import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { Bouncable } from '@/components/Bouncable';
import { useTheme } from '@/context/ThemeContext';
import { useImagePicker } from '@/hooks/use-image-picker';

interface ClubActionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ClubActionModal: React.FC<ClubActionModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { pickImage } = useImagePicker();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create Club State
  const [clubName, setClubName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  // Join Club State
  const [inviteCode, setInviteCode] = useState('');

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

  const handleSubmit = () => {
    if (activeTab === 'create' && !clubName) {
      Alert.alert('Hata', 'Lütfen takım adını girin.');
      return;
    }
    if (activeTab === 'join' && !inviteCode) {
      Alert.alert('Hata', 'Lütfen davet kodunu girin.');
      return;
    }
    
    // Fake success
    Alert.alert(
      "Başarılı!", 
      activeTab === 'create' ? "Kulübün başarıyla kuruldu!" : "Kulübe katılım isteği gönderildi!",
      [{ text: "Tamam", onPress: onClose }]
    );
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
                {/* Logo Picker */}
                <View style={styles.logoPickerContainer}>
                  <TouchableOpacity style={styles.logoPickerBtn} onPress={handleLogoSelect}>
                    {selectedLogo ? (
                      <Image source={{ uri: selectedLogo }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <MaterialIcons name="add-photo-alternate" size={32} color={theme.secondary} />
                        <Text style={styles.logoPickerText}>Logo Seç</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Takım Adı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Vanguard FC"
                    placeholderTextColor={theme.textMuted}
                    value={clubName}
                    onChangeText={setClubName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Şehir (Yakında)</Text>
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={{ color: theme.textMuted }}>Tüm Şehirler</Text>
                    <MaterialIcons name="lock" size={16} color={theme.textMuted} />
                  </View>
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
            <Bouncable style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                {activeTab === 'create' ? 'KULÜBÜ KUR' : 'KATILMA İSTEĞİ GÖNDER'}
              </Text>
            </Bouncable>
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
});
