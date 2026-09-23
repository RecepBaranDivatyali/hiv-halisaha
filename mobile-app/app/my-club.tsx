import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { ChallengeModal } from '@/components/ChallengeModal';
import { InvitePlayerModal } from '@/components/InvitePlayerModal';
import { ClubActionModal } from '@/components/ClubActionModal';
import { AppModal } from '@/components/AppModal';
import { useTheme } from '@/context/ThemeContext';
import { dbService, ClubModel } from '@/services/dbService';
import { auth } from '@/services/firebaseConfig';

export default function MyClubScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ clubId?: string }>();
  const { user, saveUser } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [clubActionModalVisible, setClubActionModalVisible] = useState(false);
  const [clubData, setClubData] = useState<ClubModel | null>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: string;
    actionType: 'delete' | 'leave_captain_transfer' | 'leave_captain_delete' | 'leave_member';
    targetCaptainId?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: theme.error,
    icon: 'delete-forever',
    actionType: 'delete',
  });

  const targetClubId = params.clubId || user?.clubId;
  const hasClub = !!targetClubId || !!clubData;
  const isViewingOwnClub = !params.clubId || Boolean(user?.clubId && params.clubId === user.clubId);

  const effectiveUserId = user?.uid || auth.currentUser?.uid || user?.email || 'player';

  const isCaptain = Boolean(
    isViewingOwnClub && (
      // 1. Explicit captainId match with uid or email
      (clubData?.captainId && effectiveUserId && (clubData.captainId === effectiveUserId || clubData.captainId === user?.email)) ||
      // 2. Captain name match with user name
      (clubData?.captainName && user?.name && clubData.captainName.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
      // 3. User is first in members list
      (clubData?.members && clubData.members.length > 0 && effectiveUserId && clubData.members[0] === effectiveUserId) ||
      // 4. Club only has 1 member and user belongs to this club (creator is always the sole member)
      (user?.clubId && clubData?.id && user.clubId === clubData.id && (!clubData.membersCount || clubData.membersCount <= 1)) ||
      // 5. Club has no captainId set at all, but user has clubId
      (user?.clubId && clubData?.id && user.clubId === clubData.id && !clubData.captainId)
    )
  );

  const loadClub = React.useCallback(async () => {
    if (targetClubId) {
      try {
        const data = await dbService.getClubById(targetClubId);
        if (data) {
          setClubData(data);
          const memberIds = data.members && data.members.length > 0 
            ? data.members 
            : (data.captainId ? [data.captainId] : []);
          
          if (memberIds.length > 0) {
            const memberProfiles = await Promise.all(
              memberIds.map(async (mId: string) => {
                if (!mId) return null;
                if (user && (user.uid === mId || user.email === mId)) {
                  return {
                    uid: mId,
                    name: user.name || 'Siz',
                    avatar: user.avatar,
                    position: user.position || 'OS',
                    rating: user.rating || 5.0,
                    isCaptain: true, // Captain or member evaluated dynamically
                  };
                }
                try {
                  const p = await dbService.getUserProfile(mId);
                  if (p) {
                    return {
                      uid: mId,
                      name: p.name || 'Oyuncu',
                      avatar: p.avatar,
                      position: p.position || 'OS',
                      rating: p.rating || 5.0,
                      isCaptain: mId === data.captainId || p.name === data.captainName,
                    };
                  }
                } catch {}
                return {
                  uid: mId,
                  name: mId === data.captainId ? (data.captainName || 'Kaptan') : 'Kulüp Üyesi',
                  avatar: undefined,
                  position: 'OS',
                  rating: 5.0,
                  isCaptain: mId === data.captainId,
                };
              })
            );
            const valid = memberProfiles.filter(Boolean);
            valid.sort((a: any, b: any) => {
              if (a.isCaptain && !b.isCaptain) return -1;
              if (!a.isCaptain && b.isCaptain) return 1;
              return (b.rating || 0) - (a.rating || 0);
            });
            setMembersList(valid);
          } else {
            setMembersList([]);
          }
        }
      } catch (e) {
        console.error('Kulüp getirme hatası:', e);
        Alert.alert('Hata', 'Kulüp bilgileri yüklenemedi. Lütfen bağlantınızı kontrol edin.');
      }
    }
  }, [targetClubId, user]);

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

  const clubId = clubData?.id || user?.clubId;

  const openDeleteClubModal = () => {
    setConfirmModal({
      visible: true,
      title: 'Kulübü Kalıcı Olarak Sil',
      message: `"${clubData?.name || user?.clubName || 'Kulüp'}" kulübünü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Evet, Kulübü Sil',
      confirmColor: theme.error,
      icon: 'delete-forever',
      actionType: 'delete',
    });
  };

  const openCaptainLeaveModal = () => {
    const currentUserId = effectiveUserId;
    const otherMembers = (clubData?.members || []).filter(
      (m: string) => m && m !== currentUserId && m !== user?.email && m !== user?.uid
    );

    if (otherMembers.length === 0) {
      setConfirmModal({
        visible: true,
        title: 'Kulüpten Ayrıl ve Sil',
        message: 'Kulüpte sizden başka üye bulunmuyor. Ayrıldığınızda kulüp tamamen silinecektir. Devam etmek istiyor musunuz?',
        confirmText: 'Kulübü Sil ve Ayrıl',
        confirmColor: theme.error,
        icon: 'delete-forever',
        actionType: 'leave_captain_delete',
      });
    } else {
      const randomCaptain = otherMembers[Math.floor(Math.random() * otherMembers.length)];
      setConfirmModal({
        visible: true,
        title: 'Kaptanlıktan ve Kulüpten Ayrıl',
        message: 'Kulüpten ayrıldığınızda kaptanlık rastgele seçilen başka bir kulüp üyesine devredilecektir. Onaylıyor musunuz?',
        confirmText: 'Devret ve Ayrıl',
        confirmColor: '#f59e0b',
        icon: 'exit-to-app',
        actionType: 'leave_captain_transfer',
        targetCaptainId: randomCaptain,
      });
    }
  };

  const openMemberLeaveModal = () => {
    setConfirmModal({
      visible: true,
      title: 'Kulüpten Ayrıl',
      message: `"${clubData?.name || user?.clubName || 'Kulüp'}" kulübünden ayrılmak istediğinize emin misiniz?`,
      confirmText: 'Ayrıl',
      confirmColor: theme.error,
      icon: 'exit-to-app',
      actionType: 'leave_member',
    });
  };

  const handleConfirmAction = async () => {
    const actionType = confirmModal.actionType;
    const targetCaptainId = confirmModal.targetCaptainId;
    setConfirmModal(prev => ({ ...prev, visible: false }));
    setActionLoading(true);

    const clubToAct = clubData?.id || user?.clubId || targetClubId;
    const currentUserId = user?.uid || auth.currentUser?.uid || effectiveUserId;

    try {
      if (actionType === 'delete' || actionType === 'leave_captain_delete') {
        if (clubToAct) {
          await dbService.deleteClub(clubToAct, currentUserId);
        }
      } else if (actionType === 'leave_captain_transfer' && targetCaptainId) {
        if (clubToAct) {
          await dbService.transferClubCaptainAndLeave(clubToAct, currentUserId, targetCaptainId);
        }
      } else if (actionType === 'leave_member') {
        if (clubToAct) {
          await dbService.leaveClub(clubToAct, currentUserId);
        }
      }
    } catch (e) {
      console.error('Kulüp işlemi hatası:', e);
    } finally {
      try {
        await saveUser({
          clubId: null,
          clubName: null,
          clubLogo: null,
        });
      } catch (err) {
        console.warn('saveUser cleanup warning:', err);
      }
      setClubData(null);
      setMembersList([]);
      setActionLoading(false);
      router.replace('/(tabs)/clubs');
    }
  };

  const handleJoinThisClub = async () => {
    if (!user?.uid) {
      Alert.alert('Giriş Yapın', 'Kulübe katılmak için lütfen giriş yapın.');
      return;
    }
    if (!clubData?.id) return;
    try {
      setActionLoading(true);
      await dbService.joinClub(clubData.id, user.uid, clubData.name);
      await saveUser({ clubId: clubData.id, clubName: clubData.name, clubLogo: clubData.logo });
      await loadClub();
      Alert.alert('Tebrikler! ⚽️', `${clubData.name} kulübüne katıldınız!`);
    } catch {
      Alert.alert('Hata', 'Kulübe katılırken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {actionLoading && (
        <View style={styles.actionLoadingOverlay}>
          <View style={styles.actionLoadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.actionLoadingText}>Kulüp işlemi gerçekleştiriliyor...</Text>
          </View>
        </View>
      )}
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
          <Text style={styles.brandTitle}>
            {isViewingOwnClub ? 'KULÜBÜM' : (clubData?.name || 'KULÜP DETAYI')}
          </Text>
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
                  {clubData?.logo ? (
                    <Image source={{ uri: clubData.logo }} style={styles.clubLogoImg} />
                  ) : (
                    <MaterialIcons name="sports-soccer" size={44} color={theme.primary} />
                  )}
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
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    %{clubData?.points ? Math.min(100, Math.round((clubData.points / 120) * 100)) : 75}
                  </Text>
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
              {isViewingOwnClub ? (
                <>
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
                </>
              ) : (
                <>
                  {user?.clubId && user.clubId !== clubData?.id ? (
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: `${theme.error}26`, borderWidth: 1, borderColor: theme.error, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      activeOpacity={0.8}
                      onPress={() => setChallengeModalVisible(true)}
                    >
                      <MaterialIcons name="sports-mma" size={18} color={theme.error} />
                      <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.error, letterSpacing: 0.5 }}>BU KULÜBE MEYDAN OKU</Text>
                    </TouchableOpacity>
                  ) : null}

                  {!user?.clubId ? (
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: `${theme.primary}26`, borderWidth: 1, borderColor: theme.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      activeOpacity={0.8}
                      onPress={handleJoinThisClub}
                      disabled={actionLoading}
                    >
                      <MaterialIcons name="person-add" size={18} color={theme.primary} />
                      <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.primary, letterSpacing: 0.5 }}>BU KULÜBE KATIL</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>

            {/* Club Squad & Members Section (Kulüp Kadrosu & Üye Listesi) */}
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionTitle}>KULÜP KADROSU</Text>
                  <View style={styles.memberCountBadge}>
                    <Text style={styles.memberCountBadgeText}>
                      {membersList.length > 0 ? membersList.length : (clubData?.membersCount || 1)} Üye
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setInviteModalVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.primary }}>+ Davet Et</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.membersGrid}>
                {(membersList.length > 0 ? membersList : [
                  {
                    uid: clubData?.captainId || 'cap',
                    name: clubData?.captainName || user?.name || 'Kaptan',
                    avatar: user?.avatar,
                    position: user?.position || 'FORVET',
                    rating: user?.rating || 7.5,
                    isCaptain: true,
                  }
                ]).map((member, idx) => (
                  <View key={member.uid || idx} style={[styles.memberCard, member.isCaptain && styles.captainCard]}>
                    <View style={styles.memberCardLeft}>
                      <View style={styles.memberAvatarBox}>
                        {member.avatar ? (
                          <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                        ) : (
                          <MaterialIcons name="person" size={24} color={theme.textMuted} />
                        )}
                        {member.isCaptain && (
                          <View style={styles.crownIconBox}>
                            <MaterialIcons name="military-tech" size={13} color="#f59e0b" />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name}
                          </Text>
                          {member.isCaptain ? (
                            <View style={styles.captainPill}>
                              <Text style={styles.captainPillText}>👑 KAPTAN</Text>
                            </View>
                          ) : (
                            <View style={styles.memberPill}>
                              <Text style={styles.memberPillText}>ÜYE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberSubInfo}>
                          {member.position || 'MEVKİ YOK'} • ★ {(member.rating || 5.0).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Club Management / Interaction Section */}
            <View style={{ marginTop: 24, gap: 12 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isViewingOwnClub ? 'KULÜP YÖNETİMİ' : 'KULÜP ETKİLEŞİMİ'}
                </Text>
                <View style={styles.sectionDivider} />
              </View>

              {isViewingOwnClub ? (
                isCaptain ? (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={[styles.dangerBtn, { flex: 1, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}
                      activeOpacity={0.8}
                      onPress={openCaptainLeaveModal}
                      disabled={actionLoading}
                    >
                      <MaterialIcons name="exit-to-app" size={18} color="#f59e0b" />
                      <Text style={[styles.dangerBtnText, { color: '#f59e0b' }]}>AYRIL (DEVRET)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.dangerBtn, { flex: 1, borderColor: theme.error, backgroundColor: `${theme.error}15` }]}
                      activeOpacity={0.8}
                      onPress={openDeleteClubModal}
                      disabled={actionLoading}
                    >
                      <MaterialIcons name="delete-forever" size={18} color={theme.error} />
                      <Text style={[styles.dangerBtnText, { color: theme.error }]}>KULÜBÜ SİL</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.dangerBtn, { borderColor: theme.error, backgroundColor: `${theme.error}15` }]}
                    activeOpacity={0.8}
                    onPress={openMemberLeaveModal}
                    disabled={actionLoading}
                  >
                    <MaterialIcons name="exit-to-app" size={18} color={theme.error} />
                    <Text style={[styles.dangerBtnText, { color: theme.error }]}>KULÜPTEN AYRIL</Text>
                  </TouchableOpacity>
                )
              ) : (
                /* Viewing other club: show join or challenge actions */
                <View style={{ gap: 10 }}>
                  {!user?.clubId ? (
                    <TouchableOpacity 
                      style={[styles.primaryActionBtn, { width: '100%' }]}
                      activeOpacity={0.85}
                      onPress={handleJoinThisClub}
                      disabled={actionLoading}
                    >
                      <MaterialIcons name="person-add" size={20} color={theme.onPrimary} />
                      <Text style={styles.primaryActionBtnText}>KULÜBE KATIL</Text>
                    </TouchableOpacity>
                  ) : user.clubId === clubData?.id ? (
                    <TouchableOpacity 
                      style={[styles.dangerBtn, { borderColor: theme.error, backgroundColor: `${theme.error}15` }]}
                      activeOpacity={0.8}
                      onPress={openMemberLeaveModal}
                      disabled={actionLoading}
                    >
                      <MaterialIcons name="exit-to-app" size={18} color={theme.error} />
                      <Text style={[styles.dangerBtnText, { color: theme.error }]}>KULÜPTEN AYRIL</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.dangerBtn, { borderColor: theme.error, backgroundColor: `${theme.error}15` }]}
                      activeOpacity={0.85}
                      onPress={() => setChallengeModalVisible(true)}
                    >
                      <MaterialIcons name="sports-mma" size={18} color={theme.error} />
                      <Text style={[styles.dangerBtnText, { color: theme.error }]}>KULÜBÜMÜZLE MEYDAN OKU</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
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

      {/* In-App Confirmation Modal */}
      <AppModal 
        visible={confirmModal.visible} 
        transparent 
        animationType="fade" 
        onClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalBox}>
            <View style={[styles.confirmIconCircle, { backgroundColor: `${confirmModal.confirmColor}18` }]}>
              <MaterialIcons name={confirmModal.icon as any} size={36} color={confirmModal.confirmColor} />
            </View>
            <Text style={styles.confirmModalTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmModalDesc}>{confirmModal.message}</Text>
            <View style={styles.confirmModalBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmitBtn, { backgroundColor: confirmModal.confirmColor }]}
                onPress={handleConfirmAction}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmSubmitBtnText}>{confirmModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>
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
    borderColor: `${theme.primary}40`,
    overflow: 'hidden'
  },
  clubLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 34
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
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  dangerBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actionLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLoadingBox: {
    backgroundColor: theme.surfaceContainerHigh,
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
  },
  actionLoadingText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
  },
  memberCountBadge: {
    backgroundColor: `${theme.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  memberCountBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
  },
  membersGrid: {
    gap: 10,
    marginTop: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  captainCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  memberCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  crownIconBox: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1f1b13',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  memberName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
  },
  memberSubInfo: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  captainPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  captainPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: '#f59e0b',
  },
  memberPill: {
    backgroundColor: `${theme.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.primary,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  confirmCancelBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.textMuted,
  },
  confirmSubmitBtn: {
    flex: 1.3,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: '#ffffff',
  },
});
