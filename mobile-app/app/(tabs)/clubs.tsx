import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ImageBackground, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { ChallengeModal } from '@/components/ChallengeModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { ClubActionModal } from '@/components/ClubActionModal';
import { useTheme } from '@/context/ThemeContext';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/hooks/use-auth';
import { dbService, ClubModel } from '@/services/dbService';
import { AppGuideModal } from '@/components/AppGuideModal';

export default function ClubsScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const { user, saveUser } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [selectedClubForChallenge, setSelectedClubForChallenge] = useState<ClubModel | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [clubActionVisible, setClubActionVisible] = useState(false);
  const [clubActionTab, setClubActionTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubsList, setClubsList] = useState<ClubModel[]>([]);

  const loadClubs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const clubs = await dbService.getClubs();
      if (clubs && clubs.length > 0) {
        setClubsList(clubs);
      } else if (__DEV__) {
        // Geliştirme ortamında DB boş ise demo kulüpler
        setClubsList([
          { id: '1', name: 'CYBER TITANS', desc: 'Hız ve veri odaklı elit futbol topluluğu.', rank: '#2 SIRALAMA', points: 22120, membersCount: 32, maxMembers: 50, level: 8, color: theme.secondary },
          { id: '2', name: 'INFERNO SQUAD', desc: 'Agresif oyun tarzı ve durdurulamaz forvetler.', rank: 'YENİ', points: 15400, membersCount: 12, maxMembers: 50, level: 4, color: theme.error },
          { id: '3', name: 'ICE BREAKERS', desc: 'Savunma duvarını aşmak imkansızdır.', rank: '#15 SIRALAMA', points: 18200, membersCount: 24, maxMembers: 50, level: 6, color: theme.tertiary },
          { id: '4', name: 'ZENITH UNITED', desc: 'Zirveye giden yolda asla pes etmeyenler.', rank: 'DÜNYA ÇAPI', points: 26500, membersCount: 45, maxMembers: 50, level: 12, color: theme.primary },
        ]);
      } else {
        setClubsList([]);
      }
    } catch {
      Alert.alert('Hata', 'Kulüp verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [theme.secondary, theme.error, theme.tertiary, theme.primary]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubs();
    setRefreshing(false);
  };

  const handleJoinClub = async (club: ClubModel) => {
    if (!user?.uid) {
      Alert.alert('Giriş Yapın', 'Kulübe katılmak için lütfen giriş yapın.');
      return;
    }
    if (user?.clubId === club.id) {
      Alert.alert('Zaten Üyesiniz', `Zaten ${club.name} kulübünün bir üyesisiniz.`);
      return;
    }
    if ((club.membersCount ?? 0) >= (club.maxMembers ?? 50)) {
      Alert.alert('Kulüp Dolu', 'Bu kulüp maksimum üye kapasitesine ulaşmıştır.');
      return;
    }
    try {
      if (club.id) {
        const uid = user.uid; // narrowed: user?.uid guard above already ensures user is defined
        await dbService.joinClub(club.id, uid, club.name);
        await saveUser({ clubId: club.id, clubName: club.name });
        Alert.alert('Tebrikler! ⚽️', `${club.name} kulübüne katıldınız!`);
        router.push('/my-club');
      }
    } catch {
      Alert.alert('Hata', 'Kulübe katılırken bir sorun oluştu.');
    }
  };

  const filteredClubs = clubsList.filter(c => 
    (c.name && c.name.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))) ||
    (c.desc && c.desc.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')))
  );

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenNotifications={() => setNotifVisible(true)} 
        onOpenGuide={() => setGuideVisible(true)}
      />
      <AppGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
      <ChallengeModal 
        visible={challengeModalVisible} 
        onClose={() => {
          setChallengeModalVisible(false);
          setSelectedClubForChallenge(null);
        }} 
        targetClub={selectedClubForChallenge}
        clubsList={clubsList}
      />
      <NotificationCenterModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <ClubActionModal 
        visible={clubActionVisible} 
        onClose={() => setClubActionVisible(false)} 
        initialTab={clubActionTab}
        onSuccess={loadClubs}
      />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)} 
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Menü" 
            accessibilityRole="button"
          >
            <MaterialIcons name="menu" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>H.İ.V.</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn} 
          onPress={() => setNotifVisible(true)} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Bildirimler" 
          accessibilityRole="button"
        >
          <MaterialIcons name="notifications" size={24} color={theme.primary} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Section Header */}
        <View style={styles.sectionHeaderBox}>
          <View>
            <Text style={styles.elitLabel}>ELİT LİG</Text>
            <Text style={styles.mainTitle}>KÜRESEL</Text>
            <Text style={[styles.mainTitle, { color: theme.primary }]}>KULÜPLER</Text>
          </View>
          <View style={styles.statBadgeBox}>
            <Text style={styles.statBadgeLabel}>AKTİF KULÜP</Text>
            <Text style={styles.statBadgeVal}>{clubsList.length}</Text>
          </View>
        </View>

        {/* Kullanıcının Kendi Kulübü Varsa Göster */}
        {user?.clubId ? (
          <TouchableOpacity 
            style={styles.myClubBanner} 
            activeOpacity={0.9} 
            onPress={() => router.push('/my-club')}
          >
            <View style={styles.myClubLeft}>
              <View style={styles.myClubIconBox}>
                <MaterialIcons name="shield" size={30} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.myClubBadge}>
                  <Text style={styles.myClubBadgeText}>KULÜBÜNÜZ</Text>
                </View>
                <Text style={styles.myClubName}>{user.clubName || 'Kulübüm'}</Text>
              </View>
            </View>
            <View style={styles.myClubActionBtn}>
              <Text style={styles.myClubActionText}>YÖNET</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          /* Kulübü Olmayanlar İçin: Kendi Kulübünü Kur Kartı */
          <View style={styles.createClubPromoCard}>
            <View style={styles.promoContent}>
              <View style={styles.promoIconWrap}>
                <MaterialIcons name="shield" size={34} color={theme.primary} />
              </View>
              <View style={styles.promoTextWrap}>
                <View style={styles.promoTag}>
                  <Text style={styles.promoTagText}>HALISAHA TAKIMI</Text>
                </View>
                <Text style={styles.promoTitle}>KENDİ KULÜBÜNÜ KUR</Text>
                <Text style={styles.promoDesc}>
                  Takımını topla, armanı belirle, lig maçlarına katıl ve diğer kulüplere meydan oku!
                </Text>
              </View>
            </View>
            <View style={styles.promoActionsRow}>
              <TouchableOpacity 
                style={styles.createClubPrimaryBtn}
                onPress={() => {
                  setClubActionTab('create');
                  setClubActionVisible(true);
                }}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add-circle" size={18} color={theme.background} />
                <Text style={styles.createClubPrimaryBtnText}>KULÜP KUR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.joinClubSecondaryBtn}
                onPress={() => {
                  setClubActionTab('join');
                  setClubActionVisible(true);
                }}
                activeOpacity={0.85}
              >
                <MaterialIcons name="group-add" size={18} color={theme.primary} />
                <Text style={styles.joinClubSecondaryBtnText}>DAVET KODU İLE GİR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.gridLayout}>
          {/* Main List */}
          <View style={styles.mainCol}>
            {/* Search */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
              <TextInput 
                placeholder="Kulüp ara..."
                placeholderTextColor={theme.textMuted}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listHeader}>
              <View style={styles.listHeaderLeft}>
                <View style={styles.headerBarPrimary} />
                <Text style={styles.listHeaderTitle}>TÜM KULÜPLER</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {Boolean(user?.clubId) && (
                  <TouchableOpacity 
                    onPress={() => {
                      setClubActionTab('create');
                      setClubActionVisible(true);
                    }}
                    style={styles.headerCreateBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="add" size={16} color={theme.primary} />
                    <Text style={styles.headerCreateBtnText}>KULÜP KUR</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedClubForChallenge(null);
                    setChallengeModalVisible(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.filterBtnText}>MEYDAN OKU</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Clubs Cards */}
            <View style={{ gap: 16 }}>
              {isLoading ? (
                [1, 2].map((i) => <Skeleton key={i} height={140} borderRadius={16} />)
              ) : filteredClubs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <MaterialIcons name="shield" size={40} color={theme.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Henüz Kulüp Bulunamadı</Text>
                  <Text style={styles.emptySub}>
                    İlk kulübü sen kurarak halısaha liginde zirveye giden yolu başlat!
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyCreateBtn}
                    onPress={() => {
                      setClubActionTab('create');
                      setClubActionVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="add-circle" size={18} color={theme.background} />
                    <Text style={styles.emptyCreateBtnText}>İLK KULÜBÜ KUR</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredClubs.map((club) => (
                <View key={club.id || club.name} style={styles.clubCard}>
                  <View style={styles.clubCardTop}>
                    {club.logo ? (
                      <Image source={{ uri: club.logo }} style={styles.clubLogoImg} />
                    ) : (
                      <View style={[styles.clubIconCircle, { backgroundColor: `${club.color || theme.primary}20` }]}>
                        <MaterialIcons name="shield" size={28} color={club.color || theme.primary} />
                      </View>
                    )}
                    <View style={styles.clubTitleWrap}>
                      <Text style={styles.clubNameTitle}>{club.name}</Text>
                      <Text style={styles.clubDesc}>{club.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.clubCardFooter}>
                    <View>
                      <Text style={styles.clubPointsText}>{club.points || 100} PK</Text>
                      <Text style={styles.clubRankSub}>{club.rank || 'LİG TAKIMI'}</Text>
                    </View>
                    {user?.clubId && user.clubId !== club.id ? (
                      <TouchableOpacity 
                        style={[styles.actionJoinBtn, { backgroundColor: 'rgba(255, 115, 81, 0.12)', borderColor: theme.error }]} 
                        onPress={() => {
                          setSelectedClubForChallenge(club);
                          setChallengeModalVisible(true);
                        }}
                      >
                        <Text style={[styles.actionJoinBtnText, { color: theme.error }]}>MEYDAN OKU</Text>
                        <MaterialIcons name="sports-mma" size={14} color={theme.error} />
                      </TouchableOpacity>
                    ) : user?.clubId === club.id ? (
                      <View style={[styles.actionJoinBtn, { opacity: 0.6, borderColor: theme.borderSubtle }]}>
                        <Text style={[styles.actionJoinBtnText, { color: theme.textMuted }]}>KULÜBÜNÜZ</Text>
                        <MaterialIcons name="check" size={14} color={theme.textMuted} />
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.actionJoinBtn} onPress={() => handleJoinClub(club)}>
                        <Text style={styles.actionJoinBtnText}>KATIL</Text>
                        <MaterialIcons name="person-add" size={14} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

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
    paddingHorizontal: 24,
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
    fontSize: 22,
    color: theme.primary,
    letterSpacing: -0.5
  },
  notificationBtn: {
    padding: 8,
    position: 'relative'
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24
  },
  elitLabel: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: theme.primary,
    fontWeight: 'bold',
    letterSpacing: 2
  },
  mainTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 28,
    color: theme.text,
    lineHeight: 32
  },
  statBadgeBox: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'flex-end'
  },
  statBadgeLabel: {
    fontFamily: Fonts.label,
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: 'bold'
  },
  statBadgeVal: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text
  },
  myClubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
  },
  myClubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  myClubIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myClubBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${theme.primary}26`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  myClubBadgeText: {
    fontFamily: Fonts.label,
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.primary,
  },
  myClubName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
  },
  myClubActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.primary}1A`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  myClubActionText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
  },

  // Kendi Kulübünü Kur Promo Kartı
  createClubPromoCard: {
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
    gap: 16,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promoIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: `${theme.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
  },
  promoTextWrap: {
    flex: 1,
    gap: 3,
  },
  promoTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${theme.primary}26`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  promoTagText: {
    fontFamily: Fonts.label,
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.primary,
    letterSpacing: 0.8,
  },
  promoTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 17,
    color: theme.text,
    letterSpacing: -0.3,
  },
  promoDesc: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 15,
  },
  promoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  createClubPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createClubPrimaryBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
  },
  joinClubSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.surfaceContainerHighest,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  joinClubSecondaryBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.text,
  },

  // Liste Üstü Hızlı Buton
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
  },
  headerCreateBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
    letterSpacing: 0.5,
  },

  // Boş Durum
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyCreateBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
  },

  gridLayout: {
    gap: 20
  },
  mainCol: {
    gap: 16
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: theme.border
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.text
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerBarPrimary: {
    width: 4,
    height: 16,
    backgroundColor: theme.primary,
    borderRadius: 2
  },
  listHeaderTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text
  },
  filterBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary
  },
  clubCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14
  },
  clubCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  clubIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clubLogoImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clubTitleWrap: {
    flex: 1
  },
  clubNameTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text
  },
  clubDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2
  },
  clubCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    paddingTop: 12
  },
  clubPointsText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.primary
  },
  clubRankSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted
  },
  actionJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${theme.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}40`
  },
  actionJoinBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary
  }
});
