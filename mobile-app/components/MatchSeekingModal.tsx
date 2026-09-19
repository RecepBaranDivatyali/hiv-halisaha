import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';

interface MatchSeekingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DATE_OPTIONS = ['Bugün', 'Yarın', 'Hafta Sonu', 'Bu Hafta'];

export const MatchSeekingModal: React.FC<MatchSeekingModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { user, saveUser } = useAuth();

  const [availableDate, setAvailableDate] = useState('Bugün');
  const [district, setDistrict] = useState(user?.district || user?.preferredDistrict || 'Çankaya');
  const [note, setNote] = useState(user?.availableNote || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setAvailableDate(user.availableDate || 'Bugün');
      setDistrict(user.preferredDistrict || user.district || 'Merkez');
      setNote(user.availableNote || '');
    }
  }, [visible, user]);

  const handleActivate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        isLookingForMatch: true,
        availableDate,
        preferredDistrict: district.trim(),
        availableNote: note.trim(),
      };
      await saveUser(updatedUser);

      if (user.uid) {
        await dbService.setUserLookingForMatch(user.uid, true, {
          availableDate,
          district: district.trim(),
          availableNote: note.trim(),
        });
      }

      Alert.alert(
        '🟢 Maç Arama Sinyali Açıldı!',
        `Durumunuz "${availableDate}" için aktif edildi. Maç ayarlayan kaptanlar ve rakipler sizi Oyuncu Arama listesinde en üstte görebilecek.`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Maç arama durumu güncelleme hatası:', e);
      Alert.alert('Hata', 'Durum güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        isLookingForMatch: false,
      };
      await saveUser(updatedUser);

      if (user.uid) {
        await dbService.setUserLookingForMatch(user.uid, false);
      }

      Alert.alert('Sinyal Kapatıldı', 'Maç arama durumunuz devre dışı bırakıldı.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Maç arama durumu kapatma hatası:', e);
      Alert.alert('Hata', 'Durum güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyActive = Boolean(user?.isLookingForMatch);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <MaterialIcons name="radar" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.headerTitle}>MAÇ ARAMA SİNYALİ</Text>
                <Text style={styles.headerSub}>Kaptanların ve takımların radarına girin</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Status Card */}
            <View style={[styles.statusCard, isCurrentlyActive ? styles.statusCardActive : styles.statusCardInactive]}>
              <MaterialIcons
                name={isCurrentlyActive ? 'wifi-tethering' : 'portable-wifi-off'}
                size={24}
                color={isCurrentlyActive ? '#22c55e' : theme.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusCardTitle, isCurrentlyActive && { color: '#22c55e' }]}>
                  {isCurrentlyActive ? 'SİNYALİNİZ AÇIK (YAYINDASINIZ)' : 'SİNYALİNİZ KAPALI'}
                </Text>
                <Text style={styles.statusCardDesc}>
                  {isCurrentlyActive
                    ? 'Kaptanlar ve maç organizatörleri sizi "🟢 Maç Arayanlar" listesinde en üstte görüyor.'
                    : 'Bugün veya yarın canınız maç mı çekti? Sinyalinizi açın, maç eksiği olan ekipler sizi anında kadroya alsın.'}
                </Text>
              </View>
            </View>

            {/* Tarih Seçimi */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>HANGİ GÜN OYNAMAK İSTİYORSUNUZ?</Text>
              <View style={styles.chipsRow}>
                {DATE_OPTIONS.map((opt) => {
                  const isSelected = availableDate === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      onPress={() => setAvailableDate(opt)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Semt / Bölge */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TERCİH EDİLEN BÖLGE / İLÇE</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="place" size={18} color={theme.primary} />
                <TextInput
                  style={styles.textInput}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Örn: Çankaya, Kadıköy, Nilüfer..."
                  placeholderTextColor="#adaaaa"
                />
              </View>
            </View>

            {/* İsteğe Bağlı Not */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KAPTANLARA NOTUNUZ (İSTEĞE BAĞLI)</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="chat-bubble-outline" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Örn: 20:00'dan sonra uyar, her mevkide oynarım"
                  placeholderTextColor="#adaaaa"
                  maxLength={70}
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.actionsRow}>
              {isCurrentlyActive && (
                <TouchableOpacity
                  style={[styles.deactivateBtn, loading && { opacity: 0.6 }]}
                  onPress={handleDeactivate}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="power-settings-new" size={18} color="#ef4444" />
                  <Text style={styles.deactivateBtnText}>SİNYALİ KAPAT</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.activateBtn, loading && { opacity: 0.6 }, !isCurrentlyActive && { flex: 1 }]}
                onPress={handleActivate}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                    <Text style={styles.activateBtnText}>
                      {isCurrentlyActive ? 'GÜNCELLE' : 'YAYINI BAŞLAT (MAÇ ARIYORUM)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderColor: theme.borderSubtle,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 16,
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceContainerHighest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 20,
      gap: 18,
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    statusCardActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderColor: '#22c55e',
    },
    statusCardInactive: {
      backgroundColor: theme.surfaceContainer,
      borderColor: theme.borderSubtle,
    },
    statusCardTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: theme.textMuted,
      letterSpacing: 0.5,
    },
    statusCardDesc: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
      lineHeight: 15,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      fontFamily: Fonts.headlineBold,
      fontSize: 11,
      color: theme.primary,
      letterSpacing: 0.5,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    dateChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceContainer,
      borderRadius: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    dateChipActive: {
      backgroundColor: '#22c55e',
      borderColor: '#22c55e',
    },
    dateChipText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: theme.text,
    },
    dateChipTextActive: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surfaceContainer,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    textInput: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: theme.text,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    deactivateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: '#ef4444',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    deactivateBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: '#ef4444',
    },
    activateBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#22c55e',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    activateBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: '#ffffff',
      letterSpacing: 0.3,
    },
  });
