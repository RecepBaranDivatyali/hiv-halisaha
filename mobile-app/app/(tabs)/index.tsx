import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { CreateMatchModal } from '@/components/CreateMatchModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { ToastNotification, ToastMessage } from '@/components/ToastNotification';
import { MatchCountdownCard } from '@/components/MatchCountdownCard';
import { AppGuideModal } from '@/components/AppGuideModal';
import { MatchSeekingModal } from '@/components/MatchSeekingModal';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { Bouncable } from '@/components/Bouncable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { isMatchPast } from '@/services/dateUtils';

const GUIDE_STORAGE_KEY = '@hiv_guide_viewed';

export default function HomeScreen() {
  const router = useRouter();
  const { matches, pastMatches, reloadMatches } = useMatches();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [createMatchVisible, setCreateMatchVisible] = useState(false);
  const [matchSeekingVisible, setMatchSeekingVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [hasViewedGuide, setHasViewedGuide] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [ratedMatches, setRatedMatches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(GUIDE_STORAGE_KEY).then(val => {
      if (val === 'true') {
        setHasViewedGuide(true);
      }
    }).catch(() => {});

    AsyncStorage.getItem('@hiv_rated_matches').then(val => {
      if (val) {
        setRatedMatches(JSON.parse(val));
      }
    }).catch(() => {});
  }, []);

  const handleOpenGuide = () => {
    setGuideVisible(true);
    if (!hasViewedGuide) {
      setHasViewedGuide(true);
      AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true').catch(() => {});
    }
  };

  const handleDismissReview = async (matchId: string) => {
    try {
      const updated = [...ratedMatches, matchId];
      setRatedMatches(updated);
      await AsyncStorage.setItem('@hiv_rated_matches', JSON.stringify(updated));
    } catch (e) {
      console.log('Dismiss review error:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadMatches();
      const val = await AsyncStorage.getItem('@hiv_rated_matches');
      if (val) setRatedMatches(JSON.parse(val));
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

  // Kullanıcının oynadığı / organize ettiği tüm maçlar
  const userAllMatches = [
    ...matches,
    ...pastMatches
  ].filter(m => 
    m.organizer?.toLowerCase().includes('siz') || 
    (user?.uid && m.organizerId === user.uid) ||
    (user?.uid && m.slots && Object.values(m.slots).some(s => s?.uid === user.uid))
  );

  // 1. Bitmiş ama kullanıcı tarafından HENÜZ değerlendirilmemiş maç (Yemeksepeti / Getir modeli)
  const unratedFinishedMatch = [
    ...userAllMatches,
    ...pastMatches
  ].find(m => 
    (isMatchPast(m.dateTime) || m.status === 'completed') && !ratedMatches.includes(m.id)
  );

  // 2. Kullanıcının gerçekten yaklaşan (gelecek) aktif maçı
  const upcomingUserMatch = userAllMatches.find(m => !isMatchPast(m.dateTime) && m.status !== 'completed');

  // 3. Genel yaklaşan aktif maç (kullanıcı maçı yoksa vitrin)
  const upcomingGeneralMatch = matches.find(m => !isMatchPast(m.dateTime) && m.status !== 'completed');

  // Geri sayım maçı (Yaklaşan kullanıcı maçı veya genel aktif maç)
  const countdownMatch = upcomingUserMatch || upcomingGeneralMatch;

  // Diğer yaklaşan maçlar (Üstteki geri sayım maçı hariç tutularak çiftleme önlenir)
  const otherUpcomingMatches = matches.filter(m => 
    !isMatchPast(m.dateTime) && (!countdownMatch || m.id !== countdownMatch.id)
  ).slice(0, 5);

  // Kullanıcı istatistikleri — Firestore'dan çekilen gerçek değerler
  const weeklyGoals = user?.stats?.goals ?? 0;
  const winRate = (user?.stats?.matchesPlayed ?? 0) > 0
    ? Math.round(((user?.stats?.wins ?? 0) / (user?.stats?.matchesPlayed ?? 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenGuide={handleOpenGuide} 
        onOpenNotifications={() => setNotifModalVisible(true)}
      />
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
      <MatchSeekingModal
        visible={matchSeekingVisible}
        onClose={() => setMatchSeekingVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Menü"
          accessibilityRole="button"
        >
          <MaterialIcons name="menu" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.brandText}>H.İ.V.</Text>
        <View style={styles.headerRight}>
          {hasViewedGuide && (
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={handleOpenGuide}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Kullanım Rehberi"
              accessibilityRole="button"
            >
              <MaterialIcons name="help-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => router.push('/conversations')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Mesajlar"
            accessibilityRole="button"
          >
            <MaterialIcons name="chat" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => setNotifModalVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
        {/* 1. Live Match Countdown for Upcoming Active Match (Aktif maç her zaman en üstte) */}
        {countdownMatch && (!unratedFinishedMatch || countdownMatch.id !== unratedFinishedMatch.id) && (
          <MatchCountdownCard 
            key={`upcoming-${countdownMatch.id}`}
            matchId={countdownMatch.id} 
            arena={countdownMatch.arena}
            dateTime={countdownMatch.dateTime}
            mode={countdownMatch.mode}
          />
        )}

        {/* 2. Tek Satırlık Kompakt Maç Değerlendirme Teşviki (Aktif maçın altında) */}
        {unratedFinishedMatch && (
          <View style={styles.compactReviewBanner}>
            <TouchableOpacity 
              style={styles.compactReviewBannerLeft}
              activeOpacity={0.8}
              onPress={() => router.push(unratedFinishedMatch.id ? { pathname: '/rate-match', params: { matchId: unratedFinishedMatch.id } } : '/rate-match')}
            >
              <View style={styles.compactReviewIconBadge}>
                <MaterialIcons name="grade" size={16} color="#FFD700" />
              </View>
              <View style={styles.compactReviewTextGroup}>
                <Text style={styles.compactReviewTitle} numberOfLines={1}>
                  Maç nasıldı?
                </Text>
                <Text style={styles.compactReviewArena} numberOfLines={1}>
                  {unratedFinishedMatch.arena}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.compactReviewRight}>
              <TouchableOpacity 
                style={styles.compactReviewBtn}
                activeOpacity={0.85}
                onPress={() => router.push(unratedFinishedMatch.id ? { pathname: '/rate-match', params: { matchId: unratedFinishedMatch.id } } : '/rate-match')}
              >
                <MaterialIcons name="star" size={12} color={theme.background} />
                <Text style={styles.compactReviewBtnText}>DEĞERLENDİR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.compactReviewDismissBtn}
                onPress={() => handleDismissReview(unratedFinishedMatch.id)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                accessibilityLabel="Kapat"
              >
                <MaterialIcons name="close" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick App Guide Banner (Only shown until viewed) */}
        {!hasViewedGuide && (
          <TouchableOpacity style={styles.guideBanner} activeOpacity={0.85} onPress={handleOpenGuide}>
            <View style={styles.guideBannerLeft}>
              <MaterialIcons name="help-outline" size={20} color={theme.primary} />
              <Text style={styles.guideBannerText}>H.İ.V. NASIL KULLANILIR? (REHBER)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}

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

        {/* ── PLAYER MATCH SEEKING BEACON (OYUNCU MAÇ ARIYORUM SİNYALİ) ── */}
        {user?.isLookingForMatch ? (
          <Bouncable 
            style={styles.seekingBeaconActiveCard} 
            onPress={() => setMatchSeekingVisible(true)}
          >
            <View style={styles.beaconActiveLeft}>
              <View style={styles.beaconPulseIcon}>
                <View style={styles.beaconDotInner} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.beaconActiveTitle}>MAÇ ARIYORSUNUZ</Text>
                  <View style={styles.beaconDateTag}>
                    <Text style={styles.beaconDateTagText}>{user.availableDate || 'Bugün'}</Text>
                  </View>
                </View>
                <Text style={styles.beaconActiveSub} numberOfLines={1}>
                  {user.availableNote ? `💬 "${user.availableNote}"` : 'Kaptanlar seni oyuncu arama listesinde en üstte görüyor!'}
                </Text>
              </View>
            </View>
            <View style={styles.beaconEditBadge}>
              <Text style={styles.beaconEditBadgeText}>Düzenle</Text>
              <MaterialIcons name="chevron-right" size={16} color="#22c55e" />
            </View>
          </Bouncable>
        ) : (
          <Bouncable 
            style={styles.seekingBeaconInactiveCard} 
            onPress={() => setMatchSeekingVisible(true)}
          >
            <View style={styles.beaconInactiveIconBox}>
              <MaterialIcons name="radar" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.beaconInactiveTitle}>BUGÜN VEYA YARIN MAÇ MI ARIYORSUN?</Text>
              <Text style={styles.beaconInactiveSub}>
                Sinyalini aç, eksik oyuncusu olan kaptanlar seni hemen kadroya alsın.
              </Text>
            </View>
            <View style={styles.beaconActionBtn}>
              <MaterialIcons name="add-alert" size={14} color={theme.onPrimary} />
              <Text style={styles.beaconActionBtnText}>İlan Ver</Text>
            </View>
          </Bouncable>
        )}

        {/* ── DİĞER YAKLAŞAN MAÇLAR (Üstteki geri sayım maçı haricindeki diğer maçlar) ── */}
        {otherUpcomingMatches.length > 0 && (
          <>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionTitle}>
                {upcomingUserMatch ? 'DİĞER YAKLAŞAN MAÇLAR' : 'KATILABİLECEĞİN MAÇLAR'}
              </Text>
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/matches')}>
                <Text style={styles.seeAllText}>TÜMÜ</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesScroll}>
              {otherUpcomingMatches.map((match, index) => {
                const isMatchOrg = match.organizer?.toLowerCase().includes('siz') || (user?.uid && match.organizerId === user.uid);
                const isMatchCapB = Boolean(user?.uid && match.captainBId === user.uid);
                const isUserJoined = Boolean(user?.uid && match.slots && Object.values(match.slots).some(s => s?.uid === user.uid));
                const badgeText = isMatchOrg ? '👑 ORGANİZATÖR' : isMatchCapB ? '⭐ B KAPTANI' : isUserJoined ? 'KATILIYORUM' : 'KATILIMA AÇIK';
                const badgeColor = isMatchOrg ? theme.primary : isMatchCapB ? theme.secondary : isUserJoined ? theme.secondary : theme.textMuted;
                const badgeBg = isMatchOrg ? `${theme.primary}20` : isMatchCapB ? `${theme.secondary}20` : isUserJoined ? `${theme.secondary}20` : `${theme.border}33`;

                return (
                  <Animated.View key={match.id} entering={FadeInDown.delay(index * 100).springify()}>
                    <Bouncable
                      style={styles.upcomingMatchCard}
                      onPress={() => router.push({ pathname: '/match-room', params: { matchId: match.id } })}
                    >
                      {/* Üst Satır: Rozetler */}
                      <View style={styles.matchCardTop}>
                        <View style={[styles.matchBadge, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.matchBadgeText, { color: badgeColor }]}>
                            {badgeText}
                          </Text>
                        </View>
                        {match.hasReservation ? (
                          <View style={styles.resMiniBadge}>
                            <MaterialIcons name="verified" size={11} color="#22c55e" />
                            <Text style={styles.resMiniBadgeText}>Sahası Hazır</Text>
                          </View>
                        ) : match.isPitchFlexible ? (
                          <View style={styles.flexMiniBadge}>
                            <MaterialIcons name="location-searching" size={11} color="#f59e0b" />
                            <Text style={styles.flexMiniBadgeText}>Saha Aranıyor</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Halısaha Adı (2 satıra kadar tam gösterilir) */}
                      <Text style={styles.upcomingArena} numberOfLines={2}>
                        {match.arena}
                      </Text>

                      {/* Maç Tarihi & Saati */}
                      <View style={styles.matchDateTime}>
                        <MaterialIcons name="event" size={14} color={theme.primary} />
                        <Text style={styles.matchDateText}>{match.dateTime}</Text>
                      </View>

                      {/* Meta Bilgileri */}
                      <View style={styles.upcomingMeta}>
                        <Text style={styles.upcomingMetaText}>{match.mode}</Text>
                        <Text style={styles.upcomingMetaDot}>•</Text>
                        <Text style={styles.upcomingMetaText}>{match.fee} ₺/kişi</Text>
                        <Text style={styles.upcomingMetaDot}>•</Text>
                        <Text style={styles.upcomingMetaText}>{match.joinedPlayersCount}/{match.totalRequiredPlayers} Oyuncu</Text>
                      </View>
                    </Bouncable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Hiçbir maç yoksa (ne üstte geri sayım ne de açık maç) */}
        {!countdownMatch && otherUpcomingMatches.length === 0 && (
          <>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionTitle}>YAKLAŞAN MAÇLAR</Text>
            </View>
            <View style={styles.emptyMatchCard}>
              <MaterialIcons name="sports-soccer" size={36} color={theme.surfaceContainerHighest} />
              <Text style={styles.emptyMatchText}>Henüz aktif maçın yok</Text>
              <TouchableOpacity style={styles.emptyMatchBtn} onPress={() => setCreateMatchVisible(true)}>
                <Text style={styles.emptyMatchBtnText}>İlk Maçı Oluştur</Text>
              </TouchableOpacity>
            </View>
          </>
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
    width: 320,
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  upcomingArena: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, lineHeight: 22 },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  upcomingMetaText: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted },
  upcomingMetaDot: { fontFamily: Fonts.body, fontSize: 11, color: theme.border },
  
  impactCard: { backgroundColor: theme.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, marginBottom: 20 },
  impactEmptyBox: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  impactEmptyText: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  matchCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  matchDateTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  matchDateText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: theme.text },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  matchBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 10 },
  resMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resMiniBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: '#22c55e',
  },
  flexMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flexMiniBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: '#f59e0b',
  },
  progressBarBg: { height: 8, backgroundColor: theme.surfaceContainerHighest, borderRadius: 4, marginBottom: 16, overflow: 'hidden', marginTop: 16 },
  progressBarFill: { height: '100%', backgroundColor: theme.secondary, borderRadius: 4 },
  impactFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  impactScoreText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  impactLeagueText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.primary, letterSpacing: 1 },

  compactReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  compactReviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  compactReviewIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${theme.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactReviewTextGroup: {
    flex: 1,
  },
  compactReviewTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    lineHeight: 15,
  },
  compactReviewArena: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    lineHeight: 13,
  },
  compactReviewRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactReviewBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.background,
    letterSpacing: 0.3,
  },
  compactReviewDismissBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.surfaceContainerHighest,
  },

  // Match Seeking Beacon
  seekingBeaconActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#22c55e',
    marginBottom: 12,
  },
  beaconActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  beaconPulseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  beaconActiveTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: '#22c55e',
    letterSpacing: 0.3,
  },
  beaconDateTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  beaconDateTagText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#22c55e',
  },
  beaconActiveSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  beaconEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  beaconEditBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: '#22c55e',
  },
  seekingBeaconInactiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
    marginBottom: 12,
  },
  beaconInactiveIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInactiveTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    letterSpacing: 0.2,
  },
  beaconInactiveSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  beaconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  beaconActionBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.background,
  },
});
