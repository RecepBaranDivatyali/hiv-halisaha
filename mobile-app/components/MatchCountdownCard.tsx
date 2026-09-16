import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

interface MatchCountdownCardProps {
  targetHours?: number;
  matchId?: string;
  arena?: string;
  dateTime?: string;
  mode?: string;
}

const TURKISH_MONTHS: Record<string, number> = {
  ocak: 0, subat: 1, şubat: 1, mart: 2, nisan: 3, mayis: 4, mayıs: 4,
  haziran: 5, temmuz: 6, agustos: 7, ağustos: 7, eylul: 8, eylül: 8,
  ekim: 9, kasim: 10, kasım: 10, aralik: 11, aralık: 11,
};

function parseTargetTimestamp(dateTime?: string, targetHours: number = 2): number {
  const defaultFuture = Date.now() + (targetHours * 3600 + 30 * 60) * 1000;
  if (!dateTime) return defaultFuture;

  const now = new Date();
  const lower = dateTime.toLowerCase().trim();

  // Try direct date parse if it's ISO or standard date format
  const directDate = new Date(dateTime);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2020) {
    return directDate.getTime();
  }

  // Extract HH:mm
  const timeMatch = dateTime.match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 21;
  const minute = timeMatch ? parseInt(timeMatch[2], 10) : 0;

  if (lower.includes('bugün') || lower.includes('bugun')) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  if (lower.includes('yarın') || lower.includes('yarin')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  // Match "15 Eylül 2026" or "15 Eylül"
  const dateMatch = lower.match(/(\d{1,2})\s+([a-zçğıöşü]+)(?:\s+(\d{4}))?/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLowerCase();
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();

    if (TURKISH_MONTHS[monthName] !== undefined) {
      const month = TURKISH_MONTHS[monthName];
      const d = new Date(year, month, day, hour, minute, 0, 0);
      if (!isNaN(d.getTime())) {
        return d.getTime();
      }
    }
  }

  // If only time was provided (e.g. "21:00")
  if (timeMatch) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() < now.getTime()) {
      d.setDate(d.getDate() + 1);
    }
    return d.getTime();
  }

  return defaultFuture;
}

export const MatchCountdownCard: React.FC<MatchCountdownCardProps> = ({ 
  targetHours = 2, 
  matchId,
  arena = 'Beşiktaş Arena',
  dateTime = '21:00',
  mode = '7v7'
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [timeLeft, setTimeLeft] = useState({ hours: targetHours, minutes: 0, seconds: 0, isLive: false, isPast: false });

  useEffect(() => {
    const targetTimestamp = parseTargetTimestamp(dateTime, targetHours);

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.floor((targetTimestamp - now) / 1000);

      if (diffSec <= 0) {
        if (diffSec >= -5400) {
          // Started within the last 90 minutes -> Match is actively playing!
          const elapsed = Math.min(90, Math.floor(Math.abs(diffSec) / 60));
          setTimeLeft({ hours: 0, minutes: elapsed, seconds: Math.abs(diffSec) % 60, isLive: true, isPast: false });
        } else {
          // Ended more than 90 minutes ago -> Match finished
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
        }
      } else {
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setTimeLeft({ hours, minutes, seconds, isLive: false, isPast: false });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetHours, dateTime]);

  const format2Digits = (num: number) => num.toString().padStart(2, '0');

  const displayTime = dateTime.includes(',') ? (dateTime.split(',').pop()?.trim() || dateTime) : dateTime;

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push(matchId ? { pathname: '/match-room', params: { matchId } } : '/match-room')}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, timeLeft.isLive && { backgroundColor: `${theme.secondary}26` }]}>
          <View style={[styles.pulseDot, timeLeft.isLive && { backgroundColor: theme.secondary }]} />
          <Text style={[styles.badgeText, timeLeft.isLive && { color: theme.secondary }]}>
            {timeLeft.isLive ? '🔴 CANLI MAÇ OYNANIYOR' : timeLeft.isPast ? 'MAÇ TAMAMLANDI' : 'YAKLAŞAN MAÇ GÜNÜ'}
          </Text>
        </View>
        <Text style={styles.venueText} numberOfLines={1}>{arena} • {displayTime}</Text>
      </View>

      {/* Countdown / Live Display Boxes */}
      {timeLeft.isLive ? (
        <View style={styles.timerRow}>
          <View style={styles.timeBox}>
            <Text style={[styles.timeVal, { color: theme.secondary }]}>{format2Digits(timeLeft.minutes)}'</Text>
            <Text style={styles.timeLabel}>DAKİKA</Text>
          </View>
          <Text style={[styles.colon, { color: theme.secondary }]}>:</Text>
          <View style={[styles.timeBox, { width: 90 }]}>
            <Text style={[styles.timeVal, { fontSize: 18, color: theme.secondary }]}>CANLI</Text>
            <Text style={styles.timeLabel}>DURUM</Text>
          </View>
          <Text style={[styles.colon, { color: theme.secondary }]}>:</Text>
          <View style={styles.timeBox}>
            <Text style={[styles.timeVal, { color: theme.secondary }]}>{format2Digits(timeLeft.seconds)}</Text>
            <Text style={styles.timeLabel}>SANİYE</Text>
          </View>
        </View>
      ) : (
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
      )}

      <View style={styles.bottomRow}>
        <Text style={styles.subHint}>
          {timeLeft.isLive 
            ? 'Maç oynanıyor • Skoru ve oyuncuları takip edin!' 
            : timeLeft.isPast 
            ? 'Maç sona erdi • Kaptan olarak skoru kaydedin' 
            : `${mode} Modu • Hazırlanmayı Unutmayın!`}
        </Text>
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
