import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService, ClubModel } from '@/services/dbService';
import { PITCH_DATABASE } from '@/config/pitches';

interface ChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  targetClub?: ClubModel | null;
  clubsList?: ClubModel[];
}

const DEFAULT_DATES = [
  'Bu Akşam 21:00',
  'Yarın 20:00',
  'Bu Cumartesi 20:00',
  'Bu Pazar 21:00',
  'Gelecek Hafta İçi 21:00',
];

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ 
  visible, 
  onClose,
  targetClub,
  clubsList = []
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);

  const [selectedClubName, setSelectedClubName] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available pitches based on target club or user city
  const city = targetClub?.city || user?.city || 'İstanbul';
  const cityPitches = PITCH_DATABASE.filter(p => p.city === city);
  const pitches = cityPitches.length > 0 ? cityPitches : PITCH_DATABASE;
  const venueList: string[] = pitches.map(p => p.name);

  useEffect(() => {
    if (targetClub?.name) {
      setSelectedClubName(targetClub.name);
    } else if (clubsList.length > 0) {
      const other = clubsList.find(c => c.id !== user?.clubId) || clubsList[0];
      setSelectedClubName(other.name);
    } else {
      setSelectedClubName('Rakip Kulüp');
    }

    if (venueList.length > 0) {
      setSelectedVenue(venueList[0]);
    }
  }, [targetClub, clubsList, city]);

  const handleSendChallenge = async () => {
    if (!user?.clubId && !user?.clubName) {
      Alert.alert('Kulübünüz Yok', 'Başka bir kulübe meydan okumak için önce kendi kulübünüzü kurmalı veya bir kulübe katılmalısınız.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dbService.sendClubChallenge({
        fromClubId: user.clubId || undefined,
        fromClubName: user.clubName || 'Kulübüm',
        toClubId: targetClub?.id,
        toClubName: selectedClubName,
        venue: selectedVenue || 'Halısaha',
        date: selectedDate,
        senderId: user.uid || 'anon',
        senderName: user.name || 'Kaptan',
      });

      Alert.alert(
        '⚔️ Meydan Okuma Gönderildi!',
        `"${selectedClubName}" kulübüne maç teklifiniz iletildi.\n\n• Saha: ${selectedVenue}\n• Tarih: ${selectedDate}\n\nRakip kaptan onayladığında maç odası açılacaktır.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    } catch (e) {
      Alert.alert('Hata', 'Meydan okuma gönderilirken bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="sports-mma" size={24} color={theme.error} />
              <Text style={styles.headerTitle}>KULÜBE MEYDAN OKU</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Hedef Kulüp Kartı */}
            <View style={styles.section}>
              <Text style={styles.label}>RAKİP KULÜP</Text>
              {targetClub ? (
                <View style={styles.targetClubCard}>
                  <View style={styles.targetClubLogoBox}>
                    {targetClub.logo ? (
                      <Image source={{ uri: targetClub.logo }} style={styles.targetClubLogo} resizeMode="contain" />
                    ) : (
                      <MaterialIcons name="shield" size={32} color={theme.error} />
                    )}
                  </View>
                  <View style={styles.targetClubInfo}>
                    <Text style={styles.targetClubName}>{targetClub.name}</Text>
                    <Text style={styles.targetClubMeta}>{targetClub.city || 'İstanbul'} • {targetClub.points || 100} PK • {targetClub.rank || 'LİG TAKIMI'}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.clubGrid}>
                  {clubsList.filter(c => c.id !== user?.clubId).slice(0, 4).map((c) => (
                    <TouchableOpacity
                      key={c.id || c.name}
                      style={[styles.clubCard, selectedClubName === c.name && styles.clubCardActive]}
                      onPress={() => setSelectedClubName(c.name)}
                    >
                      <MaterialIcons name="shield" size={20} color={selectedClubName === c.name ? theme.error : theme.textMuted} />
                      <Text style={[styles.clubCardText, selectedClubName === c.name && styles.clubCardTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 2. Saha Seçimi */}
            <View style={styles.section}>
              <Text style={styles.label}>HALISAHA TESİSİ ({city.toUpperCase()})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {venueList.map((v: string) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, selectedVenue === v && styles.chipActive]}
                    onPress={() => setSelectedVenue(v)}
                  >
                    <MaterialIcons name="stadium" size={16} color={selectedVenue === v ? theme.background : theme.textMuted} />
                    <Text style={[styles.chipText, selectedVenue === v && styles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Tarih */}
            <View style={styles.section}>
              <Text style={styles.label}>MAÇ ZAMANI</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {DEFAULT_DATES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, selectedDate === d && styles.chipActive]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <MaterialIcons name="event" size={16} color={selectedDate === d ? theme.background : theme.textMuted} />
                    <Text style={[styles.chipText, selectedDate === d && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]} 
              activeOpacity={0.9} 
              onPress={handleSendChallenge}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>{isSubmitting ? 'GÖNDERİLİYOR...' : 'MEYDAN OKUMAYI GÖNDER'}</Text>
              <MaterialIcons name="send" size={20} color={theme.background} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.error, fontStyle: 'italic', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, gap: 24 },
  section: { gap: 12 },
  label: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.error, letterSpacing: 1.5 },
  targetClubCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.surfaceContainer, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: `${theme.error}66` },
  targetClubLogoBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: `${theme.error}1A`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  targetClubLogo: { width: '100%', height: '100%' },
  targetClubInfo: { flex: 1, gap: 4 },
  targetClubName: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text },
  targetClubMeta: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted },
  clubGrid: { gap: 10 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surfaceContainer, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  clubCardActive: { backgroundColor: `${theme.error}26`, borderColor: theme.error },
  clubCardText: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  clubCardTextActive: { color: theme.error },
  chipRow: { gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.surfaceContainer, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontFamily: Fonts.body, fontSize: 13, color: theme.text, fontWeight: '600' },
  chipTextActive: { color: theme.background, fontWeight: 'bold' },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  submitBtn: { backgroundColor: theme.error, height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.background, fontStyle: 'italic', letterSpacing: 1 },
});
