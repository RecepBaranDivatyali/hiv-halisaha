import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface MatchStoryModalProps {
  visible: boolean;
  matchTitle?: string;
  score?: string;
  mvpName?: string;
  mvpAvatar?: string;
  venue?: string;
  date?: string;
  onClose: () => void;
}

export const MatchStoryModal: React.FC<MatchStoryModalProps> = ({
  visible,
  matchTitle = 'FC SHARDS vs DARK KNIGHTS',
  score = '5 - 2',
  mvpName = 'KEREM AKTÜRKOĞLU',
  mvpAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zN4BMEVqYUF3QeCqfMmUKmw5cBXxBSRW3VsxvUV-KXfxcfUNy6Y82Uw5RqW42gjFGsQrYA81GzfjxHDInaql-eBPtBAeWIzYvIo5IstQNOYNqQ8g3WQjb_WA4gUlWI3jtxS0-dZvcC5Az1uvxxCDgdHFIH9RwA7ZsebYxmMiF16BfI2i_Ms9TkF9YUXKDArXyw9YMuFV1_yUlUT27aKrZhO--9EpUrIuSs9PmeIxM6YUFzjuQBP3bjtPS29-G09qbUuQ9_U0i825',
  venue = 'Beşiktaş Arena',
  date = 'Bugün 21:00',
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const handleShareStory = () => {
    Alert.alert(
      '📸 Instagram Story Hazır!',
      'Görsel panoya kopyalandı. Instagram Story açılıyor...',
      [{ text: 'Tamam', onPress: onClose }]
    );
  };

  const handleSaveImage = () => {
    Alert.alert('✅ Kaydedildi', 'Story kartı galerinize kaydedildi.', [{ text: 'Tamam' }]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="camera-alt" size={22} color={theme.primary} />
              <Text style={styles.headerTitle}>INSTAGRAM STORY MAÇ KARTI</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 9:16 Preview Card */}
          <View style={styles.storyCardWrapper}>
            <View style={styles.storyCard}>
              {/* Top Branding */}
              <View style={styles.storyTopBranding}>
                <Text style={styles.storyBrandName}>H.İ.V.</Text>
                <Text style={styles.storyBrandTag}>MATCH OF THE DAY</Text>
              </View>

              {/* Match Score & Title */}
              <View style={styles.storyMatchSection}>
                <Text style={styles.storyVenueText}>{venue.toUpperCase()} • {date.toUpperCase()}</Text>
                <Text style={styles.storyMatchTitle}>{matchTitle}</Text>
                <View style={styles.storyScoreBox}>
                  <Text style={styles.storyScoreText}>{score}</Text>
                </View>
              </View>

              {/* MVP Player Showcase Card */}
              <View style={styles.storyMvpCard}>
                <View style={styles.storyMvpBadge}>
                  <MaterialIcons name="emoji-events" size={14} color={theme.onPrimary} />
                  <Text style={styles.storyMvpBadgeText}>MAÇIN ADAMI (MVP)</Text>
                </View>
                <View style={styles.storyMvpAvatarBorder}>
                  <Image source={{ uri: mvpAvatar }} style={styles.storyMvpAvatar} />
                </View>
                <Text style={styles.storyMvpName}>{mvpName}</Text>
                <Text style={styles.storyMvpStats}>9.5 RATING • 3 GOL • 1 ASİST</Text>
              </View>

              {/* Bottom Footer */}
              <View style={styles.storyFooter}>
                <Text style={styles.storyFooterText}>HALISAHAYA İHTİYACIM VAR • HIVAPP</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85} onPress={handleShareStory}>
              <MaterialIcons name="share" size={20} color={theme.onPrimary} />
              <Text style={styles.shareBtnText}>{"INSTAGRAM STORY'DE PAYLAŞ"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveImage}>
              <MaterialIcons name="download" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 380, backgroundColor: theme.background, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.primary, fontStyle: 'italic', letterSpacing: 0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  storyCardWrapper: { width: '100%', aspectRatio: 9 / 14, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: theme.primary, marginBottom: 16 },
  storyCard: { flex: 1, backgroundColor: theme.surface, padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  storyTopBranding: { alignItems: 'center' },
  storyBrandName: { fontFamily: Fonts.headlineBold, fontSize: 24, color: theme.primary, fontStyle: 'italic', letterSpacing: -1 },
  storyBrandTag: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.textMuted, letterSpacing: 2, marginTop: 2 },
  storyMatchSection: { alignItems: 'center', width: '100%' },
  storyVenueText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.secondary, letterSpacing: 1.5, marginBottom: 4 },
  storyMatchTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, textAlign: 'center', marginBottom: 10 },
  storyScoreBox: { backgroundColor: `${theme.primary}26`, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.primary },
  storyScoreText: { fontFamily: Fonts.headlineBold, fontSize: 28, color: theme.primary, fontStyle: 'italic' },
  storyMvpCard: { backgroundColor: theme.surfaceContainer, width: '100%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  storyMvpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginBottom: 10 },
  storyMvpBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.onPrimary, fontWeight: '900' },
  storyMvpAvatarBorder: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.primary, padding: 2, marginBottom: 8 },
  storyMvpAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  storyMvpName: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  storyMvpStats: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  storyFooter: { alignItems: 'center' },
  storyFooterText: { fontFamily: Fonts.headlineBold, fontSize: 8, color: theme.textMuted, letterSpacing: 2 },
  actionRow: { width: '100%', flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, height: 50, backgroundColor: theme.primary, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.onPrimary, fontStyle: 'italic', letterSpacing: 0.5 },
  saveBtn: { width: 50, height: 50, backgroundColor: theme.surfaceContainerHighest, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
