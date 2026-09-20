import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { parseTargetTimestamp } from '@/services/dateUtils';

interface MatchCountdownCardProps {
  targetHours?: number;
  matchId?: string;
  arena?: string;
  dateTime?: string;
  mode?: string;
  isCompleted?: boolean;
  onDismiss?: () => void;
}

export const MatchCountdownCard: React.FC<MatchCountdownCardProps> = ({ 
  targetHours = 2, 
  matchId,
  arena = 'Beşiktaş Arena',
  dateTime = '21:00',
  mode = '7v7',
  isCompleted = false,
  onDismiss
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [timeLeft, setTimeLeft] = useState({ 
    days: 0,
    hours: isCompleted ? 0 : targetHours, 
    minutes: 0, 
    seconds: 0, 
    isLive: false, 
    isPast: Boolean(isCompleted) 
  });

  useEffect(() => {
    if (isCompleted) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
      return;
    }

    const targetTimestamp = parseTargetTimestamp(dateTime, targetHours);

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.floor((targetTimestamp - now) / 1000);

      if (diffSec <= 0) {
        if (diffSec >= -4500) {
          // İlk 75 dakika maç oynanıyor kabul edilir
          const elapsed = Math.min(75, Math.floor(Math.abs(diffSec) / 60));
          setTimeLeft({ days: 0, hours: 0, minutes: elapsed, seconds: Math.abs(diffSec) % 60, isLive: true, isPast: false });
        } else {
          // Maç bitti -> Değerlendirme durumuna geç
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true });
        }
      } else {
        const days = Math.floor(diffSec / 86400);
        const hours = Math.floor((diffSec % 86400) / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setTimeLeft({ days, hours, minutes, seconds, isLive: false, isPast: false });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetHours, dateTime, isCompleted]);

  const format2Digits = (num: number) => num.toString().padStart(2, '0');
  const displayTime = dateTime.includes(',') ? (dateTime.split(',').pop()?.trim() || dateTime) : dateTime;

  return (
    <View style={[styles.card, timeLeft.isPast && styles.cardPastReview]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={[
          styles.badge, 
          timeLeft.isLive && { backgroundColor: `${theme.secondary}26` },
          timeLeft.isPast && { backgroundColor: `${theme.primary}25` }
        ]}>
          <View style={[
            styles.pulseDot, 
            timeLeft.isLive && { backgroundColor: theme.secondary },
            timeLeft.isPast && { backgroundColor: theme.primary }
          ]} />
          <Text style={[
            styles.badgeText, 
            timeLeft.isLive && { color: theme.secondary },
            timeLeft.isPast && { color: theme.primary }
          ]}>
            {timeLeft.isLive ? '🔴 CANLI MAÇ OYNANIYOR' : timeLeft.isPast ? '⭐ DEĞERLENDİRME ZAMANI' : 'YAKLAŞAN MAÇ GÜNÜ'}
          </Text>
        </View>

        {timeLeft.isPast && onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Kapat">
            <MaterialIcons name="close" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Saha Adı */}
      <View style={styles.venueRow}>
        <MaterialIcons name="sports-soccer" size={15} color={theme.primary} />
        <Text style={styles.venueText} numberOfLines={1}>
          {arena}
        </Text>
      </View>

      {/* Sahanın 1 Alt Satırında Saat / Tarih Bilgisi */}
      {displayTime ? (
        <View style={styles.timeInfoRow}>
          <MaterialIcons name="schedule" size={13} color={theme.textMuted} />
          <Text style={styles.timeInfoText} numberOfLines={1}>
            {displayTime}
          </Text>
        </View>
      ) : null}

      {/* Conditional Content: Past Review (Yemek Siparişi Değerlendirme Modeli) VS Timer */}
      {timeLeft.isPast ? (
        <View style={styles.reviewContainer}>
          <View style={styles.reviewContentBox}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <MaterialIcons key={s} name="star" size={26} color={theme.primary} />
              ))}
            </View>
            <Text style={styles.reviewMainTitle}>MAÇIN NASILDI?</Text>
            <Text style={styles.reviewSubtitle}>
              Maç sona erdi! Takım arkadaşlarını, maçın MVP&apos;sini ve halısahayı şimdi değerlendir.
            </Text>
          </View>

          <View style={styles.reviewActionsRow}>
            <TouchableOpacity 
              style={styles.reviewPrimaryBtn} 
              activeOpacity={0.85}
              onPress={() => router.push(matchId ? { pathname: '/rate-match', params: { matchId } } : '/rate-match')}
            >
              <MaterialIcons name="grade" size={18} color={theme.background} />
              <Text style={styles.reviewPrimaryBtnText}>MAÇI DEĞERLENDİR</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.reviewSecondaryBtn} 
              activeOpacity={0.85}
              onPress={() => router.push(matchId ? { pathname: '/match-room', params: { matchId } } : '/match-room')}
            >
              <Text style={styles.reviewSecondaryBtnText}>Odaya Git</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : timeLeft.isLive ? (
        /* Live Playing State */
        <>
          <View style={styles.timerRow}>
            <View style={styles.timeBox}>
              <Text style={[styles.timeVal, { color: theme.secondary }]}>{format2Digits(timeLeft.minutes)}&apos;</Text>
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

          <View style={styles.bottomRow}>
            <Text style={styles.subHint}>Maç oynanıyor • Skoru ve oyuncuları takip edin!</Text>
            <TouchableOpacity 
              style={styles.goBtn}
              onPress={() => router.push(matchId ? { pathname: '/match-room', params: { matchId } } : '/match-room')}
            >
              <Text style={styles.goBtnText}>ODAYA GİT</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.background} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Upcoming Countdown State */
        <>
          <View style={styles.timerRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeVal}>{format2Digits(timeLeft.days)}</Text>
              <Text style={styles.timeLabel}>GÜN</Text>
            </View>
            <Text style={styles.colon}>:</Text>
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
            <Text style={styles.subHint}>{mode} Modu • Hazırlanmayı Unutmayın!</Text>
            <TouchableOpacity 
              style={styles.goBtn}
              onPress={() => router.push(matchId ? { pathname: '/match-room', params: { matchId } } : '/match-room')}
            >
              <Text style={styles.goBtnText}>ODAYA GİT</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.background} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
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
  cardPastReview: {
    borderColor: theme.primary,
    backgroundColor: theme.surfaceContainer,
  },
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: `${theme.primary}26`, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  pulseDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: theme.primary 
  },
  badgeText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 9, 
    color: theme.primary, 
    letterSpacing: 0.5 
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingLeft: 2,
  },
  venueText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 13, 
    color: theme.text,
    flex: 1,
    lineHeight: 17,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    paddingLeft: 3,
  },
  timeInfoText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 15,
  },
  timerRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 6, 
    marginVertical: 6 
  },
  timeBox: { 
    backgroundColor: theme.surfaceContainer, 
    width: 58, 
    height: 52, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: `${theme.border}4D` 
  },
  timeVal: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 21, 
    color: theme.text, 
    fontStyle: 'italic', 
    lineHeight: 25 
  },
  timeLabel: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 8, 
    color: theme.textMuted, 
    letterSpacing: 0.8, 
    marginTop: 2 
  },
  colon: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 18, 
    color: theme.primary, 
    marginTop: -8 
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: `${theme.border}33` 
  },
  subHint: { 
    fontFamily: Fonts.body, 
    fontSize: 10, 
    color: theme.textMuted 
  },
  goBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2, 
    backgroundColor: theme.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  goBtnText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 9, 
    color: theme.background 
  },

  // Yemeksepeti-style Değerlendir Kartı Stilleri
  reviewContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  reviewContentBox: {
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  reviewMainTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    letterSpacing: 0.5,
  },
  reviewSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  reviewPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reviewPrimaryBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
    letterSpacing: 0.5,
  },
  reviewSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.surfaceContainerHighest,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  reviewSecondaryBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
  },
});
