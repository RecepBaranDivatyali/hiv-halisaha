import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface BadgeData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number; // 0 to 100
  reqCount: string;
  unlockedAt?: string;
}

interface BadgeDetailModalProps {
  badge: BadgeData | null;
  visible: boolean;
  onClose: () => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ badge, visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  if (!badge) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={20} color={theme.text} />
          </TouchableOpacity>

          {/* Badge Glow & Icon */}
          <View style={[styles.iconBox, { backgroundColor: badge.color, shadowColor: badge.color }]}>
            <MaterialIcons name={badge.icon as any} size={40} color={theme.background} />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.subtitle}>{badge.subtitle}</Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: badge.earned ? `${theme.primary}26` : `${theme.error}26` }]}>
            <MaterialIcons 
              name={badge.earned ? 'check-circle' : 'lock'} 
              size={14} 
              color={badge.earned ? theme.primary : theme.error} 
            />
            <Text style={[styles.statusText, { color: badge.earned ? theme.primary : theme.error }]}>
              {badge.earned ? 'KAZANILDI' : 'KİLİTLİ'}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>İLERLEME</Text>
              <Text style={styles.progressVal}>%{badge.progress}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${badge.progress}%`, backgroundColor: badge.color }]} />
            </View>
            <Text style={styles.reqText}>Hedef: {badge.reqCount}</Text>
          </View>

          {badge.earned && badge.unlockedAt && (
            <Text style={styles.dateText}>Kazanılma Tarihi: {badge.unlockedAt}</Text>
          )}

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: badge.earned ? theme.primary : theme.surfaceContainerHighest }]} onPress={onClose}>
            <Text style={[styles.actionBtnText, { color: badge.earned ? theme.onPrimary : theme.text }]}>
              {badge.earned ? 'HARİKA!' : 'DEVAM ET'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: theme.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.border, position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  title: { fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
  statusText: { fontFamily: Fonts.headlineBold, fontSize: 11, letterSpacing: 1 },
  progressSection: { width: '100%', marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.textMuted, letterSpacing: 1 },
  progressVal: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.primary },
  progressBg: { height: 8, backgroundColor: theme.surfaceContainerHighest, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  reqText: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, textAlign: 'right' },
  dateText: { fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontStyle: 'italic', marginBottom: 16 },
  actionBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontFamily: Fonts.headlineBold, fontSize: 14, letterSpacing: 1 },
});
