import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { ChallengeModal } from '@/components/ChallengeModal';
import { InvitePlayerModal } from '@/components/InvitePlayerModal';
import { ClubActionModal } from '@/components/ClubActionModal';
import { useTheme } from '@/context/ThemeContext';
import { dbService, ClubModel } from '@/services/dbService';

export default function MyClubScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ clubId?: string }>();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [clubActionModalVisible, setClubActionModalVisible] = useState(false);
  const [clubData, setClubData] = useState<ClubModel | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const targetClubId = params.clubId || user?.clubId;
  const hasClub = !!targetClubId || !!clubData;

  const loadClub = React.useCallback(async () => {
    if (targetClubId) {
      try {
        const data = await dbService.getClubById(targetClubId);
        if (data) setClubData(data);
      } catch (e) {
        console.error('Kulüp getirme hatası:', e);
        Alert.alert('Hata', 'Kulüp bilgileri yüklenemedi. Lütfen bağlantınızı kontrol edin.');
      }
    }
  }, [targetClubId]);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadClub();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <ChallengeModal visible={challengeModalVisible} onClose={() => setChallengeModalVisible(false)} />
      <InvitePlayerModal visible={inviteModalVisible} onClose={() => setInviteModalVisible(false)} />
      <ClubActionModal visible={clubActionModalVisible} onClose={() => setClubActionModalVisible(false)} />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>KULÜBÜM</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Profil" accessibilityRole="button">
          <Image 
            source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} 
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {hasClub ? (
          <>
            {/* Hero Section: Kulübüm */}
            <View style={styles.heroSection}>
              <View style={styles.heroBgIcon}>
                <MaterialIcons name="shield" size={140} color={`${theme.primary}15`} />
              </View>
              <View style={styles.heroContent}>
                <View style={styles.clubLogoBox}>
                  <MaterialIcons name="sports-soccer" size={48} color={theme.primary} />
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{clubData?.name || user?.clubName || 'Vanguard FC'}</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.badgeDark}>
                      <MaterialIcons name="group" size={14} color={theme.secondary} />
                      <Text style={styles.badgeDarkText}>ÜYE: {clubData?.membersCount || 1}/50</Text>
                    </View>
                    <View style={styles.badgePrimary}>
                      <MaterialIcons name="military-tech" size={14} color={theme.primary} />
                      <Text style={styles.badgePrimaryText}>SEVİYE {clubData?.level || 1}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Stats Grid: Kulüp İstatistikleri */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>KULÜP İSTATİSTİKLERİ</Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBoxHalf}>
                <Text style={styles.statLabel}>GALİBİYET ORANI</Text>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>%80</Text>
                  <MaterialIcons name="trending-up" size={16} color={theme.primary} />
                </View>
              </View>
              <View style={styles.statBoxHalf}>
                 <Text style={styles.statLabel}>KULÜP PUANI</Text>
                 <View style={styles.statValueRow}>
                   <Text style={[styles.statValue, { color: theme.secondary }]}>{clubData?.points || 120} PK</Text>
                   <MaterialIcons name="emoji-events" size={16} color={theme.secondary} />
                 </View>
              </View>
              <View style={styles.statBoxFull}>
                <Text style={styles.statLabel}>LİG DURUMU</Text>
                <View style={styles.statValueRowSpaced}>
                  <Text style={[styles.statValue, { color: theme.text }]}>AKTİF</Text>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>BÖLGESEL LİG</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Club Quick Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: `${theme.error}26`, borderWidth: 1, borderColor: theme.error, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                activeOpacity={0.8}
                onPress={() => setChallengeModalVisible(true)}
              >
                <MaterialIcons name="sports-mma" size={18} color={theme.error} />
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.error, letterSpacing: 0.5 }}>MEYDAN OKU</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: `${theme.secondary}26`, borderWidth: 1, borderColor: theme.secondary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                activeOpacity={0.8}
                onPress={() => setInviteModalVisible(true)}
              >
                <MaterialIcons name="person-add" size={18} color={theme.secondary} />
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.secondary, letterSpacing: 0.5 }}>OYUNCU DAVET ET</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Empty State: Kulübü Olmayan Kullanıcı */
          <View style={styles.emptyClubContainer}>
            <View style={styles.emptyShieldWrap}>
              <MaterialIcons name="shield" size={80} color={theme.surfaceContainerHighest} />
              <MaterialIcons name="lock" size={28} color={theme.primary} style={styles.emptyLockIcon} />
            </View>
            <Text style={styles.emptyTitle}>HENÜZ BİR KULÜBE ÜYE DEĞİLSİNİZ</Text>
            <Text style={styles.emptyDesc}>
              Halı saha turnuvalarına katılmak, kadro kurup maçlara meydan okumak için bir kulübe katılın veya kendi kulübünüzü kurun.
            </Text>

            <View style={styles.emptyBtnGroup}>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => router.push('/(tabs)/clubs')} accessibilityLabel="Kulüpleri Keşfet" accessibilityRole="button">
                <MaterialIcons name="explore" size={20} color={theme.onPrimary} />
                <Text style={styles.primaryActionBtnText}>KULÜPLERİ KEŞFET</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setClubActionModalVisible(true)} accessibilityLabel="Kulüp Kur" accessibilityRole="button">
                <MaterialIcons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={styles.secondaryActionBtnText}>KENDİ KULÜBÜNÜ KUR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  brandTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    letterSpacing: -0.5
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.primary
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60
  },
  heroSection: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24
  },
  heroBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  clubLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.primary}40`
  },
  clubInfo: {
    flex: 1,
    gap: 6
  },
  clubName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 22,
    color: theme.text
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8
  },
  badgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeDarkText: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgePrimaryText: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.primary,
    fontWeight: 'bold'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.textMuted,
    letterSpacing: 0.5
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.borderSubtle
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statBoxHalf: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  statBoxFull: {
    width: '100%',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  statLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    marginBottom: 6
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statValueRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 22,
    color: theme.text
  },
  rankBadge: {
    backgroundColor: `${theme.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  rankBadgeText: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: theme.primary,
    fontWeight: 'bold'
  },
  emptyClubContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16
  },
  emptyShieldWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative'
  },
  emptyLockIcon: {
    position: 'absolute',
    bottom: 24,
    right: 24
  },
  emptyTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 10
  },
  emptyDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32
  },
  emptyBtnGroup: {
    width: '100%',
    gap: 12
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 12,
    gap: 8
  },
  primaryActionBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.onPrimary
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary,
    gap: 8
  },
  secondaryActionBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.primary
  }
});
