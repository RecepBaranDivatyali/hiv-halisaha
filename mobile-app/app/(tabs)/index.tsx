import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { CreateMatchModal } from '@/components/CreateMatchModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { ToastNotification, ToastMessage } from '@/components/ToastNotification';
import { MatchCountdownCard } from '@/components/MatchCountdownCard';
import { AppGuideModal } from '@/components/AppGuideModal';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { Bouncable } from '@/components/Bouncable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { matches, reloadMatches } = useMatches();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [createMatchVisible, setCreateMatchVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadMatches();
    } catch (e) {
      console.error('Ana sayfa maçları yenileme hatası:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Kullanıcının kendi oluşturduğu maçlar (organizatör)
  const myMatches = matches.filter(m => 
    m.organizer?.toLowerCase().includes('siz') || (user?.uid && m.organizerId === user.uid)
  );
  // Tüm aktif maçlar (yaklaşan)
  const upcomingMatches = matches.slice(0, 3);

  // Kullanıcı istatistikleri — Firestore'dan çekilen gerçek değerler
  const weeklyGoals = user?.stats?.goals ?? 0;
  const winRate = (user?.stats?.matchesPlayed ?? 0) > 0
    ? Math.round(((user?.stats?.wins ?? 0) / (user?.stats?.matchesPlayed ?? 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onOpenGuide={() => setGuideVisible(true)} />
      <NotificationCenterModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)} />
      <AppGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      <CreateMatchModal
        visible={createMatchVisible}
        onClose={() => setCreateMatchVisible(false)}
        onSuccess={async (createdMatch: any) => {
          await reloadMatches();
          setToast({
            id: Date.now().toString(),
            type: 'match',
            title: 'MAÇ İLANI YAYINLANDI ⚽',
            message: 'İlanınız başarıyla kaydedildi. Oyuncular katılabilir.',
          });
          if (createdMatch?.id) {
            router.push({ pathname: '/match-room', params: { matchId: createdMatch.id } });
          } else {
            router.push('/match-room');
          }
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Menü"
          accessibilityRole="button"
        >
          <MaterialIcons name="menu" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.brandText}>H.İ.V.</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => router.push('/conversations')}
            activeOpacity={0.7}
            accessibilityLabel="Mesajlar"
            accessibilityRole="button"
          >
            <MaterialIcons name="chat" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => setNotifModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Bildirimler"
            accessibilityRole="button"
          >
            <MaterialIcons name="notifications" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Live Match Countdown Card */}
        {myMatches.length > 0 && <MatchCountdownCard targetHours={2} matchId={myMatches[0].id} />}

        {/* Quick App Guide Banner */}
        <TouchableOpacity style={styles.guideBanner} activeOpacity={0.85} onPress={() => setGuideVisible(true)}>
          <View style={styles.guideBannerLeft}>
            <MaterialIcons name="help-outline" size={20} color={theme.primary} />
            <Text style={styles.guideBannerText}>H.İ.V. NASIL KULLANILIR? (REHBER)</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>

        {/* HIZLI İŞLEMLER */}
        <View style={styles.sectionHeaderBox}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>HIZLI İŞLEMLER</Text>
        </View>

        <Bouncable style={styles.createMatchBtn} onPress={() => setCreateMatchVisible(true)}>
          <View>
            <Text style={styles.createMatchTitle}>MAÇ OLUŞTUR</Text>
            <Text style={styles.createMatchSub}>KENDİ EKİBİNİ KUR, SAHAYA İN</Text>
          </View>
          <View style={styles.createMatchIconBox}>
            <MaterialIcons name="add" size={24} color={theme.primary} />
          </View>
        </Bouncable>

        <View style={styles.quickActionsGrid}>
          <Bouncable style={styles.quickActionBox} onPress={() => router.push({ pathname: '/(tabs)/search', params: { tab: 'Maç' } })}>
            <MaterialIcons name="search" size={24} color={theme.secondary} />
            <Text style={styles.quickActionText}>MAÇ BUL</Text>
          </Bouncable>
          <Bouncable style={styles.quickActionBox} onPress={() => router.push({ pathname: '/(tabs)/search', params: { tab: 'Oyuncu' } })}>
            <MaterialIcons name="person-search" size={24} color={theme.secondary} />
            <Text style={styles.quickActionText}>OYUNCU BUL</Text>
          </Bouncable>
          <Bouncable style={styles.quickActionBox} onPress={() => router.push({ pathname: '/(tabs)/search', params: { tab: 'Rakip' } })}>
            <MaterialIcons name="sports-mma" size={24} color={theme.secondary} />
            <Text style={styles.quickActionText}>RAKİP BUL</Text>
          </Bouncable>
        </View>

        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionTitle}>YAKLAŞAN MAÇLAR</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/matches')}>
            <Text style={styles.seeAllText}>TÜMÜ</Text>
          </TouchableOpacity>
        </View>

        {upcomingMatches.length === 0 ? (
          <View style={styles.emptyMatchCard}>
            <MaterialIcons name="sports-soccer" size={36} color={theme.surfaceContainerHighest} />
            <Text style={styles.emptyMatchText}>Henüz aktif maçın yok</Text>
            <TouchableOpacity style={styles.emptyMatchBtn} onPress={() => setCreateMatchVisible(true)}>
              <Text style={styles.emptyMatchBtnText}>İlk Maçı Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesScroll}>
            {upcomingMatches.map((match, index) => (
              <Animated.View key={match.id} entering={FadeInDown.delay(index * 100).springify()}>
                <Bouncable
                  style={styles.upcomingMatchCard}
                  onPress={() => router.push({ pathname: '/match-room', params: { matchId: match.id } })}
                >
                    <View style={styles.matchCardTop}>
                      <View style={styles.matchDateTime}>
                        <MaterialIcons name="event" size={14} color={theme.primary} />
                        <Text style={styles.matchDateText}>{match.dateTime}</Text>
                      </View>
                      <View style={[styles.matchBadge, { backgroundColor: match.organizer?.toLowerCase().includes('siz') ? `${theme.primary}20` : `${theme.secondary}20` }]}>
                        <Text style={[styles.matchBadgeText, { color: match.organizer?.toLowerCase().includes('siz') ? theme.primary : theme.secondary }]}>
                          {match.organizer?.toLowerCase().includes('siz') ? 'ORGANİZATÖR' : 'KATILIYORUM'}
                        </Text>
                      </View>
                    </View>
                  <Text style={styles.upcomingArena} numberOfLines={1}>{match.arena}</Text>
                  <View style={styles.upcomingMeta}>
                    <Text style={styles.upcomingMetaText}>{match.mode}</Text>
                    <Text style={styles.upcomingMetaDot}>•</Text>
                    <Text style={styles.upcomingMetaText}>{match.fee} ₺/kişi</Text>
                    <Text style={styles.upcomingMetaDot}>•</Text>
                    <Text style={styles.upcomingMetaText}>{match.joinedPlayersCount}/{match.totalRequiredPlayers} Oyuncu</Text>
                  </View>
                </Bouncable>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionTitle}>HAFTALIK ETKİ</Text>
        </View>

        <View style={styles.impactCard}>
          {matches.length === 0 ? (
            <View style={styles.impactEmptyBox}>
              <MaterialIcons name="bar-chart" size={32} color={theme.surfaceContainerHighest} />
              <Text style={styles.impactEmptyText}>İlk maçını oluşturunca istatistiklerin burada görünecek</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <View style={styles.statCard}>
                  <MaterialIcons name="sports-soccer" size={24} color={theme.primary} />
                  <View style={styles.statInfo}>
                    <Text style={styles.statVal}>{myMatches.length}</Text>
                    <Text style={styles.statLabel}>ORGANİZATÖR</Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="sports-score" size={24} color={theme.secondary} />
                  <View style={styles.statInfo}>
                    <Text style={styles.statVal}>{weeklyGoals}</Text>
                    <Text style={styles.statLabel}>HAFTALIK GOL</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statCardFull}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="emoji-events" size={24} color={theme.tertiary} />
                  <View>
                    <Text style={styles.statVal}>%{winRate}</Text>
                    <Text style={styles.statLabel}>KAZANMA ORANI</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.border} />
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${winRate}%` }]} />
              </View>
              <View style={styles.impactFooter}>
                <Text style={styles.impactScoreText}>
                  {myMatches.length > 0 ? `${myMatches.length} Maç Organizatörlüğü` : 'Henüz maç yok'}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: theme.background,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  brandText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 24,
    color: theme.text,
    letterSpacing: -1,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },

  sectionHeaderBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 16 },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: -0.5,
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
  },
  createMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 16,
  },
  createMatchTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    marginBottom: 4,
  },
  createMatchSub: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  createMatchIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickActionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickActionBox: { flex: 1, backgroundColor: theme.surface, paddingVertical: 20, borderRadius: 12, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  quickActionText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.secondary, letterSpacing: 0.5 },

  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${theme.primary}15`,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
  },
  guideBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideBannerText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
  },

  emptyMatchCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 32, alignItems: 'center', gap: 12, marginBottom: 24, borderWidth: 1, borderColor: theme.borderSubtle },
  emptyMatchText: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  emptyMatchBtn: { backgroundColor: `${theme.primary}15`, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: theme.primary },
  emptyMatchBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.primary },

  matchesScroll: { gap: 16, paddingRight: 20, marginBottom: 8 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.surfaceContainer,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  statCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginTop: 12,
  },
  statInfo: { gap: 4 },
  statVal: { fontFamily: Fonts.headlineBold, fontSize: 20, color: theme.text },
  statLabel: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.textMuted },
  upcomingMatchCard: {
    width: 280,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  upcomingArena: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.text },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  upcomingMetaText: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted },
  upcomingMetaDot: { fontFamily: Fonts.body, fontSize: 11, color: theme.border },
  
  impactCard: { backgroundColor: theme.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, marginBottom: 20 },
  impactEmptyBox: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  impactEmptyText: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  matchCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  matchDateTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchDateText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: theme.text },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  matchBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 10 },
  progressBarBg: { height: 8, backgroundColor: theme.surfaceContainerHighest, borderRadius: 4, marginBottom: 16, overflow: 'hidden', marginTop: 16 },
  progressBarFill: { height: '100%', backgroundColor: theme.secondary, borderRadius: 4 },
  impactFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  impactScoreText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  impactLeagueText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.primary, letterSpacing: 1 },
});
