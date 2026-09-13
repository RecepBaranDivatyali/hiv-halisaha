import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

interface MatchCountdownCardProps {
  targetHours?: number;
  matchId?: string;
}

export const MatchCountdownCard: React.FC<MatchCountdownCardProps> = ({ targetHours = 2, matchId }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [timeLeft, setTimeLeft] = useState({ hours: targetHours, minutes: 45, seconds: 30 });

  useEffect(() => {
    const targetTimestamp = Date.now() + (targetHours * 3600 + 45 * 60 + 30) * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetHours]);

  const format2Digits = (num: number) => num.toString().padStart(2, '0');

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push(matchId ? { pathname: '/match-room', params: { matchId } } : '/match-room')}
    >
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>YAKLAŞAN MAÇ GÜNÜ</Text>
        </View>
        <Text style={styles.venueText}>Beşiktaş Arena • 21:00</Text>
      </View>

      {/* Countdown Timer Boxes */}
      <View style={styles.timerRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeVal}>{format2Digits(timeLeft.hours)}</Text>
          <Text style={styles.timeLabel}>SAAT</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <View style={styles.timeBox}>
          <Text style={styles.timeVal}>{format2Digits(timeLeft.minutes)}</Text>
          <Text style={styles.timeLabel}>DAKİKA</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <View style={styles.timeBox}>
          <Text style={[styles.timeVal, { color: theme.primary }]}>{format2Digits(timeLeft.seconds)}</Text>
          <Text style={styles.timeLabel}>SANİYE</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.subHint}>7v7 Süper Lig Modu • Hazırlanmayı Unutmayın!</Text>
        <View style={styles.goBtn}>
          <Text style={styles.goBtnText}>ODAYA GİT</Text>
          <MaterialIcons name="chevron-right" size={16} color={theme.background} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: `${theme.primary}66`,
    marginBottom: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.primary}26`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary },
  badgeText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.primary, letterSpacing: 0.5 },
  venueText: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted },
  timerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginVertical: 8 },
  timeBox: { backgroundColor: theme.surfaceContainer, width: 64, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${theme.border}4D` },
  timeVal: { fontFamily: Fonts.headlineBold, fontSize: 24, color: theme.text, fontStyle: 'italic', lineHeight: 28 },
  timeLabel: { fontFamily: Fonts.headlineBold, fontSize: 8, color: theme.textMuted, letterSpacing: 1, marginTop: 2 },
  colon: { fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.primary, marginTop: -12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: `${theme.border}33` },
  subHint: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  goBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  goBtnText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.background },
});
