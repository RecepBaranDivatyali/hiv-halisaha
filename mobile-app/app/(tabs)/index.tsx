import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/theme';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { isMatchPast, parseTargetTimestamp } from '@/services/dateUtils';
import { auth } from '@/services/firebaseConfig';

const GUIDE_STORAGE_KEY = '@hiv_guide_viewed';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ matchCreated?: string }>();
  const { matches, pastMatches, reloadMatches } = useMatches();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [createMatchVisible, setCreateMatchVisible] = useState(false);
  const [createdMatchSuccessVisible, setCreatedMatchSuccessVisible] = useState(false);
  const [matchSeekingVisible, setMatchSeekingVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [isGuideDismissed, setIsGuideDismissed] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [ratedMatches, setRatedMatches] = useState<string[]>([]);

  const showMatchCreatedFeedback = useCallback(() => {
    setCreatedMatchSuccessVisible(true);
    const timer = setTimeout(() => {
      setCreatedMatchSuccessVisible(false);
    }, 1800);
    return timer;
  }, []);

  useEffect(() => {
    if (params.matchCreated) {
      reloadMatches();
      const timer = showMatchCreatedFeedback();
      router.setParams({ matchCreated: undefined });
      return () => clearTimeout(timer);
    }
  }, [params.matchCreated, reloadMatches, showMatchCreatedFeedback, router]);

  useEffect(() => {
    AsyncStorage.getItem(GUIDE_STORAGE_KEY).then(val => {
      if (val === 'true') {
        setIsGuideDismissed(true);
      }
    }).catch(() => {});

    AsyncStorage.getItem('@hiv_rated_matches').then(val => {
      if (val) {
        setRatedMatches(JSON.parse(val));
      }
    }).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@hiv_rated_matches').then(val => {
        if (val) {
          setRatedMatches(JSON.parse(val));
        }
      }).catch(() => {});
    }, [])
  );

  const handleOpenGuide = () => {
    setGuideVisible(true);
  };

  const handleDismissGuide = async () => {
    try {
      setIsGuideDismissed(true);
      await AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    } catch (e) {
      console.log('Dismiss guide error:', e);
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

  // Helper: Kullanıcı bu maçta yer alıyor mu? (Organizatör, kaptan, kadro, yedek kulübesi)
  const isUserInMatch = useCallback((m: any): boolean => {
    if (!user) return false;
    const uid = user.uid || auth.currentUser?.uid;
    const name = user.name || auth.currentUser?.displayName;
    const nameClean = name?.trim().toLowerCase();

    // 1. Organizatör kontrolü
    if (m.organizer?.toLowerCase().includes('siz')) return true;
    if (uid && m.organizerId === uid) return true;
    if (nameClean && nameClean.length >= 2 && m.organizer?.toLowerCase() === nameClean) return true;

    // 2. Kaptan kontrolü
    if (uid && (m.captainAId === uid || m.captainBId === uid)) return true;
    if (nameClean && nameClean.length >= 2) {
      if (m.captainAName?.toLowerCase() === nameClean || m.captainBName?.toLowerCase() === nameClean) return true;
    }

    // 3. Kadro slotları kontrolü
    if (m.slots && typeof m.slots === 'object') {
      const slotValues = Object.values(m.slots) as any[];
      const inSlot = slotValues.some((s: any) => {
        if (!s) return false;
        if (uid && s.uid === uid) return true;
        if (nameClean && nameClean.length >= 2 && s.name?.trim().toLowerCase() === nameClean) return true;
        return false;
      });
      if (inSlot) return true;
    }

    // 4. Yedek kulübesi (Bench & Reserves) kontrolü
    const checkBench = (arr: any[]) => {
      if (!Array.isArray(arr)) return false;
      return arr.some((b: any) => {
        if (!b) return false;
        if (uid && b.uid === uid) return true;
        if (nameClean && nameClean.length >= 2 && b.name?.trim().toLowerCase() === nameClean) return true;
        return false;
      });
    };

    if (checkBench(m.benchA) || checkBench(m.benchB) || checkBench(m.reserves)) {
      return true;
    }

    return false;
  }, [user]);

  // Kullanıcının kendi oluşturduğu maçlar (organizatör)
  const myMatches = matches.filter(m => 
    m.organizer?.toLowerCase().includes('siz') || (user?.uid && m.organizerId === user.uid)
  );

  // 1. Bitmiş ama kullanıcı tarafından HENÜZ değerlendirilmemiş maçlar (YALNIZCA kullanıcının bizzat dahil olduğu maçlar)
  const userFinishedMatches = [
    ...matches.filter(m => isUserInMatch(m) && (isMatchPast(m.dateTime) || m.status === 'completed')),
    ...pastMatches.filter(isUserInMatch),
  ];
  const seenMatchIds = new Set<string>();
  const unratedFinishedMatches = userFinishedMatches.filter(m => {
    if (!m.id || seenMatchIds.has(m.id)) return false;
    seenMatchIds.add(m.id);
    return !ratedMatches.includes(m.id);
  });

  // 2. Kullanıcının gerçekten yaklaşan (gelecek) aktif maçları - Kronolojik en yakından uzağa sıralı
  const userActiveMatchesSeen = new Set<string>();
  const userActiveUpcomingMatches = matches
    .filter(m => {
      if (!m.id || userActiveMatchesSeen.has(m.id)) return false;
      userActiveMatchesSeen.add(m.id);
      return (
        isUserInMatch(m) &&
        !isMatchPast(m.dateTime) &&
        m.status !== 'completed' &&
        m.status !== 'cancelled'
      );
    })
    .sort((a, b) => parseTargetTimestamp(a.dateTime) - parseTargetTimestamp(b.dateTime));

  // En yakın aktif maç (YALNIZCA kullanıcının kendi yaklaşan maçı)
  const countdownMatch = userActiveUpcomingMatches[0] || null;

  // Kullanıcının 2., 3. vb. diğer yaklaşan aktif maçları (geri sayım kartının altında tek satır gösterilir)
  const otherUserUpcomingMatches = userActiveUpcomingMatches.slice(1);

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
        onSuccess={async () => {
          await reloadMatches();
          showMatchCreatedFeedback();
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
        {/* 1. Yaklaşan Maçlar Alanı (Kullanıcının maçı varsa sayaç + diğer maçları, yoksa boş durum kartı DAİMA EN ÜSTTE) */}
        {countdownMatch && (!unratedFinishedMatches.some(m => m.id === countdownMatch.id)) ? (
          <>
            <MatchCountdownCard 
              key={`upcoming-${countdownMatch.id}`}
              matchId={countdownMatch.id} 
              arena={countdownMatch.arena}
              dateTime={countdownMatch.dateTime}
              mode={countdownMatch.mode}
              onMatchPast={() => reloadMatches()}
            />

            {/* Diğer Yaklaşan Kullanıcı Maçları (2., 3. vb. aktif maçlar değerlendirme satırı gibi tek satır) */}
            {otherUserUpcomingMatches.map((m) => (
              <View key={`upcoming-row-${m.id}`} style={styles.compactUpcomingBanner}>
                <TouchableOpacity 
                  style={styles.compactUpcomingBannerLeft}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/match-room', params: { matchId: m.id } })}
                >
                  <View style={styles.compactUpcomingIconBadge}>
                    <MaterialIcons name="sports-soccer" size={16} color={theme.secondary} />
                  </View>
                  <View style={styles.compactUpcomingTextGroup}>
                    <Text style={styles.compactUpcomingTitle} numberOfLines={1}>
                      {m.arena}
                    </Text>
                    <Text style={styles.compactUpcomingSub} numberOfLines={1}>
                      {m.dateTime?.split(' • ')[0] || m.dateTime}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.compactUpcomingRight}>
                  <TouchableOpacity 
                    style={styles.compactUpcomingBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/match-room', params: { matchId: m.id } })}
                  >
                    <Text style={styles.compactUpcomingBtnText}>ODAYA GİT</Text>
                    <MaterialIcons name="chevron-right" size={14} color={theme.background} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyUpcomingTopCard}>
            <View style={styles.emptyUpcomingTopLeft}>
              <View style={styles.emptyUpcomingIconCircle}>
                <MaterialIcons name="event-available" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyUpcomingTopTitle}>YAKLAŞAN MAÇIN YOK</Text>
                <Text style={styles.emptyUpcomingTopSub} numberOfLines={2}>
                  Henüz planlanmış bir maçın bulunmuyor. Yeni bir maç oluştur veya maç ara.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.emptyUpcomingTopBtn} 
              activeOpacity={0.85} 
              onPress={() => setCreateMatchVisible(true)}
            >
              <MaterialIcons name="add" size={16} color={theme.background} />
              <Text style={styles.emptyUpcomingTopBtnText}>MAÇ KUR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Kompakt Maç Değerlendirme Teşvikleri (Tüm değerlendirilmemiş biten maçlar listelenir) */}
        {unratedFinishedMatches.map((m) => (
          <View key={`review-${m.id}`} style={styles.compactReviewBanner}>
            <TouchableOpacity 
              style={styles.compactReviewBannerLeft}
              activeOpacity={0.8}
              onPress={() => {
                handleDismissReview(m.id);
                router.push(m.id ? { pathname: '/rate-match', params: { matchId: m.id } } : '/rate-match');
              }}
            >
              <View style={styles.compactReviewIconBadge}>
                <MaterialIcons name="grade" size={16} color="#FFD700" />
              </View>
              <View style={styles.compactReviewTextGroup}>
                <Text style={styles.compactReviewTitle} numberOfLines={1}>
                  Maç nasıldı?
                </Text>
                <Text style={styles.compactReviewArena} numberOfLines={1}>
                  {m.arena}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.compactReviewRight}>
              <TouchableOpacity 
                style={styles.compactReviewBtn}
                activeOpacity={0.85}
                onPress={() => {
                  handleDismissReview(m.id);
                  router.push(m.id ? { pathname: '/rate-match', params: { matchId: m.id } } : '/rate-match');
                }}
              >
                <MaterialIcons name="star" size={12} color={theme.background} />
                <Text style={styles.compactReviewBtnText}>DEĞERLENDİR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.compactReviewDismissBtn}
                onPress={() => handleDismissReview(m.id)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                accessibilityLabel="Kapat"
              >
                <MaterialIcons name="close" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* H.İ.V. NASIL KULLANILIR? REHBER KARTI */}
        {!isGuideDismissed && (
          <View style={styles.guideBannerCard}>
            <TouchableOpacity 
              style={styles.guideBannerLeft} 
              activeOpacity={0.85} 
              onPress={handleOpenGuide}
            >
              <View style={styles.guideBannerIconBox}>
                <MaterialIcons name="menu-book" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.guideBannerTitle}>H.İ.V. NASIL KULLANILIR?</Text>
                  <View style={styles.guideBannerBadge}>
                    <Text style={styles.guideBannerBadgeText}>REHBER</Text>
                  </View>
                </View>
                <Text style={styles.guideBannerSub} numberOfLines={1}>
                  Maç oluşturma, rezervasyon, mevkiler ve ödeme rehberi
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.guideBannerDismissBtn}
              onPress={handleDismissGuide}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              accessibilityLabel="Rehberi Gizle"
            >
              <MaterialIcons name="close" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
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

      {createdMatchSuccessVisible && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(250)} 
          style={styles.successOverlay}
          pointerEvents="box-none"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.successBackdrop} 
            onPress={() => setCreatedMatchSuccessVisible(false)}
          >
            <Animated.View 
              entering={ZoomIn.duration(280)} 
              exiting={ZoomOut.duration(200)} 
              style={styles.successCard}
            >
              <View style={styles.successIconCircle}>
                <MaterialIcons name="check" size={48} color={theme.onPrimary} />
              </View>
              <Text style={styles.successTitle}>MAÇ OLUŞTURULDU!</Text>
              <Text style={styles.successSub}>
                İlanınız başarıyla kaydedildi.
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      )}
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

  guideBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${theme.primary}35`,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 6,
  },
  guideBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  guideBannerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  guideBannerBadge: {
    backgroundColor: `${theme.primary}25`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  guideBannerBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  guideBannerSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  guideBannerDismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  emptyUpcomingTopCard: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyUpcomingTopLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyUpcomingIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${theme.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
  },
  emptyUpcomingTopTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
    letterSpacing: 0.5,
  },
  emptyUpcomingTopSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  emptyUpcomingTopBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyUpcomingTopBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.background,
    letterSpacing: 0.5,
  },
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

  
  impactCard: { backgroundColor: theme.surface, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle, marginBottom: 20 },
  impactEmptyBox: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  impactEmptyText: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },

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
    marginBottom: 10,
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

  // Compact Upcoming Active Match Row (2., 3. vb. yaklaşan aktif maçlar tek satır)
  compactUpcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderWidth: 1,
    borderColor: `${theme.secondary}40`,
    borderLeftWidth: 3,
    borderLeftColor: theme.secondary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  compactUpcomingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  compactUpcomingIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${theme.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactUpcomingTextGroup: {
    flex: 1,
  },
  compactUpcomingTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    lineHeight: 16,
  },
  compactUpcomingSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    lineHeight: 14,
    marginTop: 1,
  },
  compactUpcomingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactUpcomingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactUpcomingBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.background,
    letterSpacing: 0.3,
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

  // Maç Oluşturuldu Başarı Bildirimi (Ana Ekran Üstü Katman)
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBackdrop: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 22,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${theme.primary}50`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    width: '100%',
    maxWidth: 320,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.text,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
  },
});
