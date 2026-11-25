import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { useAuth } from '@/hooks/use-auth';
import { checkIsAdmin } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/use-image-picker';
import { BadgeDetailModal, BadgeData } from '@/components/BadgeDetailModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { useMatches, isUserInMatchItem } from '@/hooks/use-matches';
import { useTheme } from '@/context/ThemeContext';
import { AppGuideModal } from '@/components/AppGuideModal';
import { isMatchEnded, parseTargetTimestamp } from '@/services/dateUtils';
import { appAlert } from '@/services/appAlert';
import { auth } from '@/services/firebaseConfig';

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

  const userMatches = matches
    .filter(m => isUserInMatchItem(m, user?.uid, user?.name))
    .sort((a, b) => parseTargetTimestamp(b.dateTime) - parseTargetTimestamp(a.dateTime));
  const [guideVisible, setGuideVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), reloadMatches()]);
    setRefreshing(false);
  };

  const stats = user?.stats || {};
  const matchesPlayed = stats.matchesPlayed ?? 0;
  const wins = stats.wins ?? 0;
  const mvpCount = stats.mvpCount ?? 0;
  const cleanSheets = stats.cleanSheets ?? 0;
  const goals = stats.goals ?? 0;
  const reliability = stats.reliabilityScore ?? 100;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const BADGES: BadgeData[] = [
    {
      id: '1',
      title: 'İlk Düdük',
      subtitle: 'İlk Halısaha Maçı Tamamlandı',
      icon: 'sports-soccer',
      color: theme.primary,
      earned: matchesPlayed >= 1,
      progress: Math.min(100, Math.round((matchesPlayed / 1) * 100)),
      reqCount: '1 Maç',
      unlockedAt: matchesPlayed >= 1 ? 'Kazanıldı ⚽️' : undefined,
    },
    {
      id: '2',
      title: 'Halısaha Müdavimi',
      subtitle: '5 Maç Barajı Aşıldı',
      icon: 'repeat',
      color: theme.secondary,
      earned: matchesPlayed >= 5,
      progress: Math.min(100, Math.round((matchesPlayed / 5) * 100)),
      reqCount: '5 Maç',
      unlockedAt: matchesPlayed >= 5 ? 'Kazanıldı 🌟' : undefined,
    },
    {
      id: '3',
      title: 'Kıdemli Krampon',
      subtitle: '10 Maç Başarıyla Tamamlandı',
      icon: 'military-tech',
      color: '#38bdf8',
      earned: matchesPlayed >= 10,
      progress: Math.min(100, Math.round((matchesPlayed / 10) * 100)),
      reqCount: '10 Maç',
      unlockedAt: matchesPlayed >= 10 ? 'Kazanıldı 🥉' : undefined,
    },
    {
      id: '4',
      title: 'Demir Adam (20 Maç)',
      subtitle: '20 Halısaha Maçı Tamamlandı',
      icon: 'shield',
      color: '#f59e0b',
      earned: matchesPlayed >= 20,
      progress: Math.min(100, Math.round((matchesPlayed / 20) * 100)),
      reqCount: '20 Maç',
      unlockedAt: matchesPlayed >= 20 ? 'Kazanıldı 🥈' : undefined,
    },
    {
      id: '5',
      title: 'Halısaha Efsanesi',
      subtitle: '50 Maçlık Muhteşem Kariyer',
      icon: 'workspace-premium',
      color: '#ec4899',
      earned: matchesPlayed >= 50,
      progress: Math.min(100, Math.round((matchesPlayed / 50) * 100)),
      reqCount: '50 Maç',
      unlockedAt: matchesPlayed >= 50 ? 'Kazanıldı 👑' : undefined,
    },
    {
      id: '6',
      title: 'MVP Koleksiyoncusu',
      subtitle: '5 Kez Maçın Adamı Seçildi',
      icon: 'emoji-events',
      color: theme.warning,
      earned: mvpCount >= 5,
      progress: Math.min(100, Math.round((mvpCount / 5) * 100)),
      reqCount: '5 MVP',
      unlockedAt: mvpCount >= 5 ? 'Kazanıldı 🏆' : undefined,
    },
    {
      id: '7',
      title: 'Geçilmez Duvar',
      subtitle: '3 Maç Gol Yemeden Bitirildi',
      icon: 'security',
      color: theme.error,
      earned: cleanSheets >= 3,
      progress: Math.min(100, Math.round((cleanSheets / 3) * 100)),
      reqCount: '3 Clean Sheet',
      unlockedAt: cleanSheets >= 3 ? 'Kazanıldı 🧤' : undefined,
    },
    {
      id: '8',
      title: 'Fair Play Lideri',
      subtitle: '%95+ Centilmenlik Skoru',
      icon: 'verified',
      color: theme.tertiary,
      earned: reliability >= 95 && matchesPlayed >= 3,
      progress: Math.min(100, reliability),
      reqCount: '%95 Centilmenlik',
      unlockedAt: reliability >= 95 && matchesPlayed >= 3 ? 'Kazanıldı 🤝' : undefined,
    },
    {
      id: '9',
      title: 'Kazanma Ustası',
      subtitle: '%70+ Galibiyet Oranı',
      icon: 'trending-up',
      color: '#10b981',
      earned: matchesPlayed >= 5 && winRate >= 70,
      progress: matchesPlayed >= 5 ? Math.min(100, winRate) : Math.min(100, Math.round((matchesPlayed / 5) * 100)),
      reqCount: '%70 Galibiyet (Min 5 Maç)',
      unlockedAt: matchesPlayed >= 5 && winRate >= 70 ? 'Kazanıldı 🔥' : undefined,
    },
    {
      id: '10',
      title: 'Gol Makinesi',
      subtitle: '10+ Gol Atıldı',
      icon: 'bolt',
      color: theme.primary,
      earned: goals >= 10,
      progress: Math.min(100, Math.round((goals / 10) * 100)),
      reqCount: '10 Gol',
      unlockedAt: goals >= 10 ? 'Kazanıldı ⚡️' : undefined,
    },
  ];

  const displayRating = user?.rating ?? 5.0;
  const ratingPercent = Math.max(10, Math.min(100, (displayRating / 10) * 100));
  const isVerifiedAccount = Boolean(auth.currentUser?.emailVerified || user?.uid === 'store_reviewer_demo_user');
  const isAdminUser = checkIsAdmin(user?.email, user?.role);

  const handleAvatarChange = async () => {
    try {
      const newUri = await promptPicker();
      if (newUri) {
        await saveUser({ avatar: newUri });
      }
    } catch {
      appAlert.alert('Hata', 'Profil fotoğrafı güncellenirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenNotifications={() => setNotifModalVisible(true)} 
        onOpenGuide={() => setGuideVisible(true)}
      />
      <AppGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.iconBtnHover} 
            onPress={() => router.push('/edit-profile')} 
            accessibilityLabel="Profili Düzenle" 
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={22} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnHover} onPress={() => setNotifModalVisible(true)} accessibilityLabel="Bildirimler" accessibilityRole="button">
            <MaterialIcons name="notifications" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Ban Uyarısı */}
        {user?.isBanned === true && (
          <View style={[styles.alertBox, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', marginBottom: 20 }]}>
            <MaterialIcons name="gavel" size={24} color="#ef4444" style={styles.alertIcon} />
            <View style={styles.alertInfo}>
              <Text style={[styles.alertTitle, { color: '#ef4444' }]}>HESAP ASKIYA ALINDI</Text>
              <Text style={styles.alertDesc}>
                {user?.banReason || 'Platform kurallarına uymadığınız tespit edildiği için hesabınız geçici olarak askıya alınmıştır.'}
              </Text>
            </View>
          </View>
        )}
        
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
                  <MaterialIcons name="photo-camera" size={14} color={theme.onPrimary} />
                </View>
              </View>
              <View style={styles.lvlBadge}>
                <Text style={styles.lvlBadgeText}>{user?.level || 'Eğlence'}</Text>
              </View>
            </TouchableOpacity>

            {user?.isLookingForMatch && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: `${theme.primary}1F`,
                borderWidth: 1,
                borderColor: theme.primary,
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 20,
                marginBottom: 10,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
                <Text style={{ color: theme.text, fontSize: 11, fontFamily: Fonts.headlineBold }}>
                  MAÇ ARIYOR • {user.availableDate || 'Aktif'}
                </Text>
              </View>
            )}

            <Text style={styles.positionText}>{user?.position || 'FORVET'}</Text>
            <Text style={styles.playerName}>{user?.name || 'Oyuncu'}</Text>

            <View style={styles.tagsRow}>
              <View style={styles.tagItem}>
                <MaterialIcons name="location-on" size={14} color={theme.secondary} />
                <Text style={styles.tagText}>
                  {user?.district ? `${user.city || 'İSTANBUL'} / ${user.district}` : (user?.city || 'İSTANBUL')}
                </Text>
              </View>
              <View style={styles.tagItem}>
                <MaterialIcons
                  name={isVerifiedAccount ? 'verified' : 'mark-email-unread'}
                  size={14}
                  color={isVerifiedAccount ? theme.primary : theme.warning}
                />
                <Text style={styles.tagText}>{isVerifiedAccount ? 'DOĞRULANMIŞ' : 'ONAY BEKLİYOR'}</Text>
              </View>
              {isAdminUser && (
                <View style={[styles.tagItem, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary, borderWidth: 1 }]}>
                  <MaterialIcons name="admin-panel-settings" size={14} color={theme.primary} />
                  <Text style={[styles.tagText, { color: theme.primary, fontFamily: Fonts.headlineBold }]}>YÖNETİCİ</Text>
                </View>
              )}
            </View>

            {/* Quick Profile & IBAN Edit Button */}
            <TouchableOpacity 
              style={styles.editProfilePill}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={13} color={theme.primary} />
              <Text style={styles.editProfilePillText}>
                {user?.iban ? '✓ IBAN TANIMLI • PROFİLİ DÜZENLE' : '+ KAPTAN IBAN TANIMLA / PROFİL DÜZENLE'}
              </Text>
            </TouchableOpacity>

            {/* Genel Puan Section */}
            <View style={styles.ratingBox}>
              <View style={styles.ratingHeader}>
                <View>
                  <Text style={styles.ratingSubtitle}>GENEL PUAN</Text>
                  <View style={styles.ratingValueRow}>
                    <Text style={styles.ratingValue}>{displayRating.toFixed(1)}</Text>
                    <Text style={styles.ratingValueMax}>/10</Text>
                  </View>
                </View>
                <View style={styles.starIconWrap}>
                  <MaterialIcons name="star" size={24} color={theme.primary} />
                </View>
              </View>
              <View style={styles.barGraphRow}>
                {[0.4, 0.55, 0.7, 0.85, 1.0].map((mult, idx) => {
                  const opacities = ['33', '66', '99', 'cc', ''];
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.barGraphItem,
                        {
                          backgroundColor: `${theme.primary}${opacities[idx]}`,
                          height: `${Math.max(12, Math.round(ratingPercent * mult))}%`,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

          </View>
        </View>

        {/* Kulüp Kartı / Bilgisi */}
        <View style={styles.sectionMargin}>
          {user?.clubName ? (
            <TouchableOpacity 
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: `${theme.secondary}40`,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              activeOpacity={0.85}
              onPress={() => router.push('/my-club')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${theme.secondary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: theme.secondary,
                }}>
                  <MaterialIcons name="shield" size={24} color={theme.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    KULÜBÜM
                  </Text>
                  <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text }} numberOfLines={1}>
                    {user.clubName}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.secondary }}>YÖNET</Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.secondary} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={{
                backgroundColor: `${theme.surfaceContainerHighest}60`,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/clubs')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialIcons name="group-add" size={22} color={theme.primary} />
                <View>
                  <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text }}>
                    Bir Halısaha Kulübüne Katıl
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted }}>
                    Takım kurarak diğer kulüplere meydan oku!
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
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
            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Oynanan Maçlar', `Bu sezon toplam ${matchesPlayed} halısaha maçına katıldınız.`)}
            >
              <MaterialIcons name="sports-soccer" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>MAÇLAR</Text>
              <Text style={[styles.statCardValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{matchesPlayed}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Galibiyetler', `Toplam ${wins} maçtan galibiyetle ayrıldınız.`)}
            >
              <MaterialIcons name="emoji-events" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>GALİBİYET</Text>
              <Text style={[styles.statCardValue, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit>{wins}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Kazanma Oranı', `Oynadığınız maçlardaki galibiyet oranınız %${winRate}.`)}
            >
              <MaterialIcons name="trending-up" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={styles.statCardLabel} numberOfLines={1}>KAZANMA</Text>
                <MaterialIcons name="info-outline" size={11} color={theme.textMuted} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>%{winRate}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Toplam Gol', `Bu sezon rakip filelere gönderdiğiniz toplam gol sayısı: ${goals}.`)}
            >
              <MaterialIcons name="bolt" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>GOL</Text>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>{goals}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Toplam Asist', `Takım arkadaşlarınıza yaptığınız toplam gol pası: ${stats.assists ?? 0}.`)}
            >
              <MaterialIcons name="sports-score" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>ASİST</Text>
              <Text style={[styles.statCardValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>{stats.assists ?? 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('MVP Seçilme', `Tamamlanan maçlarda ${mvpCount} kez 'Maçın Adamı (MVP)' seçildiniz.`)}
            >
              <MaterialIcons name="military-tech" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <Text style={styles.statCardLabel} numberOfLines={1}>MVP</Text>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>{mvpCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert('Clean Sheet (Temiz Sayfa)', `Gol yemeden tamamlanan maç sayısı: ${cleanSheets}. Savunma ve kaleci başarısını yansıtır.`)}
            >
              <MaterialIcons name="security" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={styles.statCardLabel} numberOfLines={1}>CLEAN SHEET</Text>
                <MaterialIcons name="info-outline" size={11} color={theme.textMuted} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.secondary }]} numberOfLines={1} adjustsFontSizeToFit>{cleanSheets}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => appAlert.alert(
                `Güvenilirlik Puanı (%${reliability})`,
                'Bu metrik, katıldığınız maçlara zamanında ve eksiksiz katılımınızı gösterir.\n\n• Maçlara zamanında katılmak puanınızı artırır.\n• Son dakika maçtan çıkmak veya gelmemek puanı düşürür.\n• %90 altına düşen oyuncular maç ararken uyarı alabilir.'
              )}
            >
              <MaterialIcons name="shield" size={80} color={`${theme.text}0d`} style={styles.statCardBgIcon} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={styles.statCardLabel} numberOfLines={1}>GÜVENİLİRLİK</Text>
                <MaterialIcons name="info-outline" size={11} color={theme.textMuted} />
              </View>
              <Text style={[styles.statCardValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>%{reliability}</Text>
            </TouchableOpacity>
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
            {userMatches.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <MaterialIcons name="sports-soccer" size={36} color={theme.surfaceContainerHighest} />
                <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text, textAlign: 'center' }}>
                  Henüz maç geçmişin yok
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, textAlign: 'center', maxWidth: 260 }}>
                  Katıldığın veya organize ettiğin maçlar burada listelenecektir.
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: theme.primary,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onPress={() => router.push('/(tabs)/matches')}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="search" size={16} color={theme.onPrimary} />
                  <Text style={{ fontFamily: Fonts.headlineBold, color: theme.onPrimary, fontSize: 12 }}>
                    MAÇLARI KEŞFET
                  </Text>
                </TouchableOpacity>
              </View>
            ) : userMatches.slice(0, 3).map((match) => {
              const isOrganizer = Boolean(
                (user?.uid && match.organizerId === user.uid) ||
                (user?.name && user.name.trim().length >= 2 && match.organizer?.toLowerCase() === user.name.trim().toLowerCase())
              );
              const ended = match.status === 'completed' || isMatchEnded(match.dateTime);
              const needsReview = ended && !user?.dismissedReviews?.includes(match.id);
              const barColor = needsReview ? theme.primary : (isOrganizer ? theme.primary : theme.secondary);
              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (ended) {
                      router.push({ pathname: '/rate-match', params: { matchId: match.id } });
                    } else {
                      router.push({ pathname: '/match-room', params: { matchId: match.id } });
                    }
                  }}
                >
                  <View style={[styles.matchColorBar, { backgroundColor: barColor }]} />
                  <View style={styles.matchItemDetail}>
                    <View style={styles.matchItemLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.matchItemDate} numberOfLines={1}>
                          {match.dateTime?.toLocaleUpperCase('tr-TR')} • {match.city?.toLocaleUpperCase('tr-TR')}
                        </Text>
                        {needsReview && (
                          <View style={{ backgroundColor: `${theme.primary}25`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.primary }}>⭐ DEĞERLENDİR</Text>
                          </View>
                        )}
                      </View>
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
                          name={needsReview ? 'star' : (isOrganizer ? 'stars' : 'people')}
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
    top: 2,
    right: 2,
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
    color: theme.onPrimary,
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
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
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
    justifyContent: 'center'},
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${theme.primary}18`,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: `${theme.primary}44`},
  editProfilePillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
    letterSpacing: 0.5}});
