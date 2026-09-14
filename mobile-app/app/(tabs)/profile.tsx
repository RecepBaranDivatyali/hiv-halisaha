import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { useAuth } from '@/hooks/use-auth';
import { useImagePicker } from '@/hooks/use-image-picker';
import { BadgeDetailModal, BadgeData } from '@/components/BadgeDetailModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { useMatches } from '@/hooks/use-matches';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const { matches, reloadMatches } = useMatches();
  const { user, saveUser, refreshUser } = useAuth();
  const { promptPicker } = useImagePicker();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), reloadMatches()]);
    setRefreshing(false);
  };

  const BADGES: BadgeData[] = [
    { id: '1', title: 'Gol Makinesi', subtitle: '10+ Gol Attı', icon: 'bolt', color: theme.primary, earned: true, progress: 100, reqCount: '10 Gol', unlockedAt: '14 Mayıs 2026' },
    { id: '2', title: 'Sadık Organizatör', subtitle: '100 Maç Ayarlama', icon: 'calendar-today', color: theme.secondary, earned: true, progress: 100, reqCount: '100 Maç', unlockedAt: '28 Haziran 2026' },
    { id: '3', title: 'MVP Koleksiyoncusu', subtitle: '5 Maçın Adamı Seçildi', icon: 'emoji-events', color: theme.warning, earned: true, progress: 100, reqCount: '5 MVP', unlockedAt: '12 Temmuz 2026' },
    { id: '4', title: 'Geçilmez Duvar', subtitle: '3 Maç Gol Yemedi', icon: 'security', color: theme.error, earned: false, progress: 66, reqCount: '3 Maç' },
    { id: '5', title: 'Fair Play Lideri', subtitle: '%95+ Centilmenlik Skoru', icon: 'verified', color: theme.tertiary, earned: true, progress: 100, reqCount: '%95', unlockedAt: '01 Ağustos 2026' },
  ];

  const handleAvatarChange = async () => {
    try {
      const newUri = await promptPicker();
      if (newUri) {
        await saveUser({ avatar: newUri });
      }
    } catch {
      Alert.alert('Hata', 'Profil fotoğrafı güncellenirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenNotifications={() => setNotifModalVisible(true)} 
      />
      <BadgeDetailModal badge={selectedBadge} visible={!!selectedBadge} onClose={() => setSelectedBadge(null)} />
      <NotificationCenterModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)} />
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtnHover} onPress={() => setMenuVisible(true)} accessibilityLabel="Menü" accessibilityRole="button">
            <MaterialIcons name="menu" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>H.İ.V.</Text>
        </View>
        <TouchableOpacity style={styles.iconBtnHover} onPress={() => setNotifModalVisible(true)} accessibilityLabel="Bildirimler" accessibilityRole="button">
          <MaterialIcons name="notifications" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        
        {/* Player Info: Hero Section */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4hbENQjPa5K4IPRbacjZSrUZHdHhNFKuHssqPfE4QQWMxCHmnb5UFSDiu5HImiXtKyoxGBVD0V6pIVjETW5LUqWy7-hdE9kl2uGTHdRMf6BTV-BgnU9KFkpQVpTT3o_FIxdHrL7MFtXDe4PkI4LXp74wyoE0IntiIJnxnoXaP0THmgCf483Q6Jgj-7_gj7_v3HvxBUsCjENNE_LrSUK0jNe02C_mjmjAzyulwh6Zc3XhD61ur2b3nR-MLrDe43Ak_N6tuURvhI0H-' }} 
            style={styles.heroBgImg} 
          />
          <View style={styles.heroGradient} />

          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.85} onPress={handleAvatarChange} accessibilityLabel="Fotoğraf Değiştir" accessibilityRole="button">
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} 
                  style={styles.avatarImg} 
                />
                <View style={styles.cameraIconWrap}>
                  <MaterialIcons name="photo-camera" size={16} color={theme.textMuted} />
                </View>
              </View>
              <View style={styles.lvlBadge}>
                <Text style={styles.lvlBadgeText}>{user?.level || 'Eğlence'}</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.positionText}>{user?.position || 'FORVET'}</Text>
            <Text style={styles.playerName}>{user?.name || 'Oyuncu'}</Text>

            <View style={styles.tagsRow}>
              <View style={styles.tagItem}>
                <MaterialIcons name="location-on" size={14} color={theme.secondary} />
                <Text style={styles.tagText}>{user?.city || 'İSTANBUL'}</Text>
              </View>
              <View style={styles.tagItem}>
                <MaterialIcons name="verified" size={14} color={theme.primary} />
                <Text style={styles.tagText}>DOĞRULANMIŞ</Text>
              </View>
            </View>

            {/* Genel Puan Section */}
            <View style={styles.ratingBox}>
              <View style={styles.ratingHeader}>
                <View>
                  <Text style={styles.ratingSubtitle}>GENEL PUAN</Text>
                  <View style={styles.ratingValueRow}>
                    <Text style={styles.ratingValue}>{(user?.rating ?? 5.0).toFixed(1)}</Text>
                    <Text style={styles.ratingValueMax}>/10</Text>
                  </View>
                </View>
                <View style={styles.starIconWrap}>
                  <MaterialIcons name="star" size={24} color={theme.primary} />
                </View>
              </View>
              <View style={styles.barGraphRow}>
                <View style={[styles.barGraphItem, { backgroundColor: `${theme.primary}33`, height: '40%' }]} />
                <View style={[styles.barGraphItem, { backgroundColor: `${theme.primary}66`, height: '60%' }]} />
                <View style={[styles.barGraphItem, { backgroundColor: `${theme.primary}99`, height: '80%' }]} />
                <View style={[styles.barGraphItem, { backgroundColor: `${theme.primary}cc`, height: '90%' }]} />
                <View style={[styles.barGraphItem, { backgroundColor: theme.primary, height: '100%' }]} />
              </View>
            </View>

          </View>
        </View>

        {/* Güvenilirlik Uyarısı — Yalnızca puanı 90'ın altına düşen kullanıcılarda görünür */}
        {(user?.stats?.reliabilityScore ?? 100) < 90 && (
          <View style={styles.alertBox}>
            <MaterialIcons name="warning" size={24} color={theme.error} style={styles.alertIcon} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>GÜVENİLİRLİK UYARISI</Text>
              <Text style={styles.alertDesc}>
                {`Güvenilirlik puanınız %${user?.stats?.reliabilityScore ?? 88}'e geriledi. Zamanında katılım göstererek puanınızı artırabilirsiniz.`}
              </Text>
            </View>
          </View>
        )}

        {/* Sezon İstatistikleri */}
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderBarPrimary} />
            <Text style={styles.sectionTitle}>SEZON İSTATİSTİKLERİ</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="sports-soccer" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>MAÇLAR</Text>
              <Text style={[styles.statCardValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{user?.stats?.matchesPlayed ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="bolt" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>GOL</Text>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>{user?.stats?.goals ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="sports-score" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>ASİST</Text>
              <Text style={[styles.statCardValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>{user?.stats?.assists ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="military-tech" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>MVP</Text>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>{user?.stats?.mvpCount ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="shield" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>GÜVENİLİRLİK</Text>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>%{user?.stats?.reliabilityScore ?? 100}</Text>
            </View>
          </View>
        </View>

        {/* Başarılar & Rozetler (Izgara Düzeni — Yatay Kaydırma Yerine Tüm Rozetler Net) */}
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderBarSecondary} />
            <Text style={styles.sectionTitle}>BAŞARILAR & ROZETLER</Text>
          </View>
          <View style={styles.badgesGrid}>
            {BADGES.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.achievementBadgeCard, !b.earned && { opacity: 0.55 }]}
                activeOpacity={0.8}
                onPress={() => setSelectedBadge(b)}
              >
                <View style={[styles.achievementIconWrap, { backgroundColor: b.earned ? `${b.color}26` : theme.surfaceContainerHighest }]}>
                  <MaterialIcons name={b.icon as any} size={18} color={b.earned ? b.color : theme.textMuted} />
                </View>
                <View style={styles.achievementTextWrap}>
                  <Text style={styles.achievementTitle} numberOfLines={1}>{b.title}</Text>
                  <Text style={styles.achievementDesc} numberOfLines={1}>{b.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Son Maçlar */}
        <View style={styles.sectionMargin}>
          <View style={[styles.sectionHeader, { justifyContent: 'space-between', paddingRight: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.sectionHeaderBarWhite} />
              <Text style={styles.sectionTitle}>SON MAÇLAR</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
              <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.matchList}>
            {matches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <MaterialIcons name="sports-soccer" size={36} color={theme.surfaceContainerHighest} />
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
                  Henüz maç geçmişin yok
                </Text>
              </View>
            ) : matches.slice(0, 3).map((match) => {
              const isOrganizer = match.organizer?.toLowerCase().includes('siz');
              const barColor = isOrganizer ? theme.primary : theme.secondary;
              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchItem}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/match-room', params: { matchId: match.id } })}
                >
                  <View style={[styles.matchColorBar, { backgroundColor: barColor }]} />
                  <View style={styles.matchItemDetail}>
                    <View style={styles.matchItemLeft}>
                      <Text style={styles.matchItemDate} numberOfLines={1}>
                        {match.dateTime?.toUpperCase()} • {match.city?.toUpperCase()}
                      </Text>
                      <Text style={styles.matchItemTitle} numberOfLines={1}>{match.arena}</Text>
                    </View>
                    <View style={styles.matchItemRight}>
                      <View style={styles.matchItemScoreWrap}>
                        <Text style={styles.matchItemScoreLabel}>{match.mode}</Text>
                        <Text style={[styles.matchItemScoreVal, { color: barColor }]}>
                          {match.joinedPlayersCount}/{match.totalRequiredPlayers}
                        </Text>
                      </View>
                      <View style={styles.matchItemThumb}>
                        <MaterialIcons
                          name={isOrganizer ? 'stars' : 'people'}
                          size={14}
                          color={barColor}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background},
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: `${theme.background}cc`,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    zIndex: 50},
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16},
  brandTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 24,
    color: theme.primary,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -1},
  iconBtnHover: {
    padding: 8},
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40},
  heroSection: {
    position: 'relative',
    backgroundColor: theme.surface,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 400,
    marginBottom: 24},
  heroBgImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2, // grayscale handled naturally by design
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200},
  heroContent: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    zIndex: 10},
  avatarContainer: {
    position: 'relative',
    marginBottom: 24},
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: theme.primary,
    padding: 4,
    backgroundColor: theme.background},
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 64},
  cameraIconWrap: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background},
  lvlBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16},
  lvlBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.background,
    fontStyle: 'italic',
    fontWeight: '900'},
  positionText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4},
  playerName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 36,
    color: theme.text,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: 'center'},
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32},
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8},
  tagText: {
    fontFamily: Fonts.label,
    fontSize: 12,
    color: theme.text,
    textTransform: 'uppercase'},
  ratingBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: `${theme.surfaceContainer}80`,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    borderRadius: 12,
    padding: 20},
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8},
  ratingSubtitle: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4},
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4},
  ratingValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 60,
    lineHeight: 60,
    color: theme.text,
    fontWeight: '900'},

  trustCardBox: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${theme.primary}4d`,
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  trustTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text, letterSpacing: 0.5 },
  trustBadgeGood: { backgroundColor: `${theme.primary}26`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  trustBadgeGoodText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.primary },
  trustMetricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  trustMetricItem: { alignItems: 'center' },
  trustMetricVal: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.text },
  trustMetricLabel: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  trustDivider: { width: 1, height: 28, backgroundColor: `${theme.border}4d` },
  ratingValueMax: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    fontWeight: 'bold'},
  starIconWrap: {
    backgroundColor: `${theme.primary}33`,
    padding: 8,
    borderRadius: 8},
  barGraphRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 6,
    marginTop: 8},
  barGraphItem: {
    flex: 1,
    borderRadius: 2},
  alertBox: {
    backgroundColor: `${theme.error}15`,
    borderWidth: 1,
    borderColor: `${theme.error}33`,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32},
  alertIcon: {
    marginTop: 4},
  alertInfo: {
    flex: 1},
  alertTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.error,
    textTransform: 'uppercase',
    letterSpacing: 1},
  alertDesc: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
    lineHeight: 20},
  sectionMargin: {
    marginBottom: 32},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16},
  sectionHeaderBarPrimary: {
    width: 4,
    height: 24,
    backgroundColor: theme.primary,
    borderRadius: 2},
  sectionHeaderBarSecondary: {
    width: 4,
    height: 24,
    backgroundColor: theme.secondary,
    borderRadius: 2},
  sectionHeaderBarWhite: {
    width: 4,
    height: 24,
    backgroundColor: theme.text,
    borderRadius: 2},
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.text,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.5},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12},
  statCard: {
    width: '48%',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    height: 122,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border},
  statCardBgIcon: {
    position: 'absolute',
    right: -12,
    bottom: -12},
  statCardLabel: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1},
  statCardValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 34,
    lineHeight: 38,
    fontStyle: 'italic'},
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementBadgeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  achievementIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTextWrap: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.text,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  achievementDesc: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },
  seeAllText: {
    fontFamily: Fonts.label,
    fontSize: 12,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.primary}4d`},
  matchList: {
    gap: 12},
  matchItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden'},
  matchColorBar: {
    width: 4},
  matchItemDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16},
  matchItemLeft: {
    flex: 1},
  matchItemDate: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4},
  matchItemTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text},
  matchItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16},
  matchItemScoreWrap: {
    alignItems: 'center'},
  matchItemScoreLabel: {
    fontFamily: Fonts.label,
    fontSize: 12,
    color: theme.textMuted},
  matchItemScoreVal: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    fontStyle: 'italic'},
  matchItemThumb: {
    backgroundColor: theme.surfaceContainerHighest,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'}});
