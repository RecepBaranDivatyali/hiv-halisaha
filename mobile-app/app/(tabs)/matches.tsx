import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { CreateMatchModal } from '@/components/CreateMatchModal';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { isMatchPast, parseTargetTimestamp } from '@/services/dateUtils';
import { AppGuideModal } from '@/components/AppGuideModal';

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { matches, pastMatches, loading, reloadMatches } = useMatches();
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const actualActiveMatches = matches
    .filter(m => !isMatchPast(m.dateTime) && m.status !== 'completed' && m.status !== 'cancelled')
    .sort((a, b) => parseTargetTimestamp(a.dateTime) - parseTargetTimestamp(b.dateTime));

  const actualPastMatches = [
    ...pastMatches,
    ...matches.filter(m => isMatchPast(m.dateTime) || m.status === 'completed')
  ]
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
    .sort((a, b) => parseTargetTimestamp(b.dateTime) - parseTargetTimestamp(a.dateTime));

  const [activeTab, setActiveTab] = useState<'AKTİF MAÇLARIM' | 'GEÇMİŞ MAÇLAR'>('AKTİF MAÇLARIM');
  const [menuVisible, setMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadMatches();
    } catch (e) {
      console.error('Maçları yenileme hatası:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenNotifications={() => setNotifModalVisible(true)} 
        onOpenGuide={() => setGuideVisible(true)}
      />
      <AppGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
      <NotificationCenterModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)} />
      <CreateMatchModal 
        visible={createModalVisible} 
        onClose={() => setCreateModalVisible(false)}
        onSuccess={async (createdMatch: any) => {
          await reloadMatches();
          if (createdMatch?.id) {
            router.push({ pathname: '/match-room', params: { matchId: createdMatch.id } });
          } else {
            router.push('/match-room');
          }
        }}
      />

      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconBtnHover} 
          onPress={() => setMenuVisible(true)} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Menü" 
          accessibilityRole="button"
        >
          <MaterialIcons name="menu" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H.İ.V.</Text>
        <TouchableOpacity 
          style={styles.iconBtnHover} 
          onPress={() => setNotifModalVisible(true)} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Bildirimler" 
          accessibilityRole="button"
        >
          <MaterialIcons name="notifications" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Screen Header & Filters */}
        <View style={styles.screenHeaderBox}>
          <View style={styles.screenHeaderTop}>
            <Text style={styles.pageTitle}>MAÇLARIM</Text>
            <TouchableOpacity style={styles.filterBtn} onPress={onRefresh} accessibilityLabel="Yenile" accessibilityRole="button">
              <MaterialIcons name="refresh" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeTab === 'AKTİF MAÇLARIM' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('AKTİF MAÇLARIM')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'AKTİF MAÇLARIM' }}
            >
              <Text style={[styles.segmentText, activeTab === 'AKTİF MAÇLARIM' && styles.segmentTextActive]}>AKTİF MAÇLARIM</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeTab === 'GEÇMİŞ MAÇLAR' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('GEÇMİŞ MAÇLAR')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'GEÇMİŞ MAÇLAR' }}
            >
              <Text style={[styles.segmentText, activeTab === 'GEÇMİŞ MAÇLAR' && styles.segmentTextActive]}>GEÇMİŞ MAÇLAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Matches */}
        {activeTab === 'AKTİF MAÇLARIM' && (
          <View style={styles.matchesList}>
            {loading ? (
              [1, 2, 3].map((item) => (
                <View key={item} style={[styles.matchCard, { padding: 16, borderLeftColor: theme.surfaceContainerHigh }]}>
                  <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
                  <View style={[styles.matchCardBody, { backgroundColor: 'transparent', padding: 0 }]}>
                    <Skeleton width={50} height={50} borderRadius={12} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width="80%" height={16} />
                      <Skeleton width="50%" height={14} />
                    </View>
                  </View>
                </View>
              ))
            ) : actualActiveMatches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
                <MaterialIcons name="sports-soccer" size={64} color={theme.surfaceContainerHighest} />
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.textMuted, textAlign: 'center' }}>Henüz aktif maç yok</Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>{"Sağ alttaki + butonuna basarak\nilk maçını oluştur!"}</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 }}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={{ fontFamily: Fonts.headlineBold, color: theme.onPrimary, fontSize: 13 }}>İLK MAÇI OLUŞTUR</Text>
                </TouchableOpacity>
              </View>
            ) : actualActiveMatches.map((match, idx) => {
              const isOrganizer = (user?.uid && match.organizerId === user.uid) || match.organizer?.toLowerCase().includes('siz');
              const isCaptainB = Boolean(user?.uid && match.captainBId === user.uid);
              const isJoined = Boolean(user?.uid && match.slots && Object.values(match.slots).some(slot => slot?.uid === user.uid));
              
              const badgeColor = isOrganizer ? theme.primary : isCaptainB ? theme.secondary : isJoined ? theme.secondary : theme.textMuted;
              const badgeBg = isOrganizer ? `${theme.primary}25` : isCaptainB ? `${theme.secondary}25` : isJoined ? `${theme.secondary}25` : `${theme.border}33`;
              const badgeText = isOrganizer ? '👑 ORGANİZATÖR (SİZ)' : isCaptainB ? '⭐ B KAPTANI (SİZ)' : isJoined ? 'KADRODASINIZ' : 'KATILIMA AÇIK';
              const cardBorder = isOrganizer ? theme.primary : isCaptainB ? theme.secondary : isJoined ? theme.secondary : `${theme.border}66`;
              const iconColor = isOrganizer ? theme.primary : isCaptainB ? theme.secondary : isJoined ? theme.secondary : theme.textMuted;

              return (
                <Animated.View key={match.id || idx} entering={FadeInRight.delay(idx * 100).springify()}>
                  <View style={[styles.matchCard, { borderLeftColor: cardBorder }]}>
                    <View style={[styles.matchStatusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.matchStatusText, { color: badgeColor }]}>
                        {badgeText}
                      </Text>
                    </View>
                    <View style={styles.matchCardBody}>
                      <View style={styles.matchInfoRow}>
                        <View style={styles.matchIconWrap}>
                          <MaterialIcons name="sports-soccer" size={32} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.matchTitle}>{match.arena}</Text>
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
                          <Text style={styles.matchSubtitle}>{match.dateTime} • {match.mode}</Text>
                        </View>
                      </View>
                      <View style={styles.matchStatusRow}>
                        <View>
                          <Text style={styles.rosterStatus}>ÜCRET: {match.fee} ₺ / Kişi</Text>
                          <Text style={styles.timeTag}>Kadro: {match.joinedPlayersCount}/{match.totalRequiredPlayers} Oyuncu</Text>
                        </View>
                        <TouchableOpacity style={styles.detailBtn} onPress={() => router.push({ pathname: '/match-room', params: { matchId: match.id } })}>
                          <Text style={styles.detailBtnText}>MAÇ ODASI</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Past Matches */}
        {activeTab === 'GEÇMİŞ MAÇLAR' && (
          <View style={styles.matchesList}>
            {loading ? (
              [1, 2, 3].map((item) => (
                <View key={item} style={[styles.matchCard, { padding: 16, borderLeftColor: theme.surfaceContainerHigh }]}>
                  <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
                  <View style={[styles.matchCardBody, { backgroundColor: 'transparent', padding: 0 }]}>
                    <Skeleton width={50} height={50} borderRadius={12} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width="80%" height={16} />
                      <Skeleton width="50%" height={14} />
                    </View>
                  </View>
                </View>
              ))
            ) : actualPastMatches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
                <MaterialIcons name="history" size={64} color={theme.surfaceContainerHighest} />
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.textMuted, textAlign: 'center' }}>Henüz geçmiş maç yok</Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>Tamamlanan maçlar burada görünecek</Text>
              </View>
            ) : actualPastMatches.map((match, idx) => (
              <Animated.View key={match.id || idx} entering={FadeInRight.delay(idx * 100).springify()}>
                <View style={[styles.matchCard, { borderLeftColor: theme.secondary }]}>
                  <View style={[styles.matchStatusBadge, { backgroundColor: `${theme.secondary}22` }]}>
                    <Text style={[styles.matchStatusText, { color: theme.secondary }]}>TAMAMLANDI</Text>
                  </View>
                  <View style={styles.matchCardBody}>
                    <View style={styles.matchInfoRow}>
                      <View style={styles.matchIconWrap}>
                        <MaterialIcons name="sports-soccer" size={32} color={theme.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchTitle}>{match.arena}</Text>
                        <Text style={styles.matchSubtitle}>{match.dateTime} • {match.mode}</Text>
                      </View>
                    </View>
                    <View style={styles.matchStatusRow}>
                      <View>
                        <Text style={[styles.rosterStatus, { color: theme.primary }]}>{match.score || '-'}</Text>
                        <Text style={styles.timeTag}>Maç Skoru</Text>
                      </View>
                      <TouchableOpacity style={styles.detailBtn} onPress={() => router.push({ pathname: '/rate-match', params: { matchId: match.id } })}>
                        <Text style={styles.detailBtnText}>PUANLA</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* FAB: Create Match */}
      <TouchableOpacity 
        style={styles.fabBtn} 
        onPress={() => setCreateModalVisible(true)}
        accessibilityLabel="Yeni maç oluştur"
        accessibilityRole="button"
      >
        <MaterialIcons name="add" size={32} color={theme.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: `${theme.background}cc`,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    zIndex: 50
  },
  iconBtnHover: {
    padding: 8,
    borderRadius: 8
  },
  brandTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 24,
    color: theme.primary,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -1
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  screenHeaderBox: {
    gap: 24,
    marginBottom: 32
  },
  screenHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  pageTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 36,
    color: theme.text,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -1
  },
  filterBtn: {
    backgroundColor: theme.surfaceContainer,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 4,
    borderRadius: 8
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6
  },
  segmentBtnActive: {
    backgroundColor: theme.surfaceContainerHighest,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4
  },
  segmentText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.textMuted,
    letterSpacing: 1.5
  },
  segmentTextActive: {
    color: theme.primary
  },
  matchesList: {
    gap: 16
  },
  matchCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    position: 'relative',
    overflow: 'hidden'
  },
  matchStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  matchStatusText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  matchCardBody: {
    gap: 16
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8
  },
  matchIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center'
  },
  matchTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    textTransform: 'uppercase',
    lineHeight: 20
  },
  matchSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 2
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  rosterStatus: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.text,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -1
  },
  timeTag: {
    fontFamily: Fonts.label,
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2
  },
  detailBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  detailBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 2,
    borderColor: `${theme.primary}40`
  },
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
});
