import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface ChallengeModalProps {
  visible: boolean;
  onClose: () => void;
}

const CLUBS = ['CYBER TITANS', 'INFERNO SQUAD', 'ICE BREAKERS', 'ZENITH UNITED'];
const VENUES = ['Beşiktaş Arena', 'Kadıköy Parkı', 'Santra Halı Saha'];
const DATES = ['Bu Cumartesi 20:00', 'Bu Pazar 21:00', 'Gelecek Cuma 20:00'];

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [selectedClub, setSelectedClub] = useState(CLUBS[0]);
  const [selectedVenue, setSelectedVenue] = useState(VENUES[0]);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);

  const handleSendChallenge = () => {
    Alert.alert(
      '⚔️ Meydan Okuma Gönderildi!',
      `${selectedClub} kulübüne maç teklifiniz iletildi.\nSaha: ${selectedVenue}\nTarih: ${selectedDate}`,
      [{ text: 'Tamam', onPress: onClose }]
    );
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
            {/* 1. Rakip Kulüp */}
            <View style={styles.section}>
              <Text style={styles.label}>RAKİP KULÜP SEÇİN</Text>
              <View style={styles.clubGrid}>
                {CLUBS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.clubCard, selectedClub === c && styles.clubCardActive]}
                    onPress={() => setSelectedClub(c)}
                  >
                    <MaterialIcons name="shield" size={20} color={selectedClub === c ? theme.error : theme.textMuted} />
                    <Text style={[styles.clubCardText, selectedClub === c && styles.clubCardTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Saha */}
            <View style={styles.section}>
              <Text style={styles.label}>TARAFTAR SOHBETİ & SAHA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {VENUES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, selectedVenue === v && styles.chipActive]}
                    onPress={() => setSelectedVenue(v)}
                  >
                    <MaterialIcons name="stadium" size={16} color={selectedVenue === v ? theme.onPrimary : theme.textMuted} />
                    <Text style={[styles.chipText, selectedVenue === v && styles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Tarih */}
            <View style={styles.section}>
              <Text style={styles.label}>MAÇ TARİHİ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {DATES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, selectedDate === d && styles.chipActive]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <MaterialIcons name="event" size={16} color={selectedDate === d ? theme.onPrimary : theme.textMuted} />
                    <Text style={[styles.chipText, selectedDate === d && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.9} onPress={handleSendChallenge}>
              <Text style={styles.submitBtnText}>MEYDAN OKUMAYI GÖNDER</Text>
              <MaterialIcons name="send" size={20} color={theme.text} />
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
  clubGrid: { gap: 10 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surfaceContainer, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  clubCardActive: { backgroundColor: `${theme.error}26`, borderColor: theme.error },
  clubCardText: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  clubCardTextActive: { color: theme.error },
  chipRow: { gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.surfaceContainer, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontFamily: Fonts.body, fontSize: 13, color: theme.text, fontWeight: '600' },
  chipTextActive: { color: theme.onPrimary, fontWeight: 'bold' },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  submitBtn: { backgroundColor: theme.error, height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, fontStyle: 'italic', letterSpacing: 1 },
});
