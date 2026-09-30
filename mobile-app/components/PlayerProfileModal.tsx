import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { AppModal } from '@/components/AppModal';
import { useRouter } from 'expo-router';
import { dbService } from '@/services/dbService';

export interface PlayerProfileData {
  uid?: string;
  id?: string;
  name: string;
  avatar?: string;
  position?: string;
  city?: string;
  district?: string;
  rating?: number | string;
  level?: string;
  foot?: string;
  isLookingForMatch?: boolean;
  availableNote?: string;
  stats?: {
    matches?: number;
    matchesPlayed?: number;
    wins?: number;
    losses?: number;
    draws?: number;
    goals?: number;
    assists?: number;
    mvpCount?: number;
    reliabilityScore?: number;
    cleanSheets?: number;
  };
}

interface PlayerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  player: PlayerProfileData | null;
}

export function PlayerProfileModal({ visible, onClose, player }: PlayerProfileModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const styles = useStyles(theme);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [fullPlayer, setFullPlayer] = useState<PlayerProfileData | null>(player);
  const [inviting, setInviting] = useState(false);

  const targetUid = player?.uid || player?.id;
  const isSelf = Boolean(user?.uid && targetUid && user.uid === targetUid);

  useEffect(() => {
    if (!visible || !targetUid) {
      setFullPlayer(player);
      return;
    }

    setFullPlayer(player);
    // Fetch live profile details from Firestore if uid exists
    let isMounted = true;
    setLoadingDetails(true);

    dbService.getUserProfile(targetUid)
      .then((profile) => {
        if (isMounted && profile) {
          setFullPlayer({
            ...player,
            ...profile,
            stats: {
              ...(player?.stats || {}),
              ...(profile?.stats || {})
            }
          });
        }
      })
      .catch(() => {
        // Silently keep the passed player data on failure
      })
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, targetUid]);

  if (!player && !fullPlayer) return null;

  const data = fullPlayer || player!;
  const stats = data.stats || {};
  const totalMatches = stats.matchesPlayed ?? stats.matches ?? 0;
  const goals = stats.goals ?? 0;
  const assists = stats.assists ?? 0;
  const mvp = stats.mvpCount ?? 0;
  const reliability = stats.reliabilityScore ?? 100;
  const rating = typeof data.rating === 'number' ? data.rating.toFixed(1) : (data.rating || '8.5');

  const handleSendMessage = () => {
    onClose();
    if (!targetUid) {
      Alert.alert('Bilgi', 'Kullanıcı kimliği bulunamadı.');
      return;
    }
    router.push({
      pathname: '/chat-detail',
      params: {
        recipientId: targetUid,
        userName: data.name,
        avatar: data.avatar || ''
      }
    });
  };

  const handleInviteToClub = async () => {
    if (!user?.clubId) {
      Alert.alert('Kulüp Bulunamadı', 'Bir oyuncuyu davet etmek için bir kulübünüz olmalıdır.');
      return;
    }
    if (!targetUid) return;

    try {
      setInviting(true);
      await dbService.sendClubInvite(user.clubId, targetUid);
      Alert.alert('✅ Davet Gönderildi', `${data.name} kulübünüze davet edildi.`);
    } catch {
      Alert.alert('Hata', 'Davet gönderilemedi.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.modalContent}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={20} color={theme.textMuted} />
        </TouchableOpacity>

        {loadingDetails && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* Header Card */}
          <View style={styles.headerSection}>
            <View style={styles.avatarWrap}>
              <Image 
                source={{ uri: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} 
                style={styles.avatarImg} 
              />
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={13} color="#f59e0b" />
                <Text style={styles.ratingBadgeText}>{rating}</Text>
              </View>
            </View>

            <Text style={styles.playerName} numberOfLines={1}>{data.name}</Text>
            
            <View style={styles.tagsRow}>
              <View style={styles.tagItem}>
                <MaterialIcons name="sports-soccer" size={13} color={theme.primary} />
                <Text style={styles.tagText}>{data.position || 'Oyuncu'}</Text>
              </View>
              {Boolean(data.city) && (
                <View style={styles.tagItem}>
                  <MaterialIcons name="location-on" size={13} color={theme.secondary} />
                  <Text style={styles.tagText}>{data.city}{data.district ? ` / ${data.district}` : ''}</Text>
                </View>
              )}
              {Boolean(data.foot) && (
                <View style={styles.tagItem}>
                  <MaterialIcons name="accessibility" size={13} color={theme.textMuted} />
                  <Text style={styles.tagText}>{data.foot} Ayak</Text>
                </View>
              )}
            </View>

            {data.isLookingForMatch && (
              <View style={styles.matchSeekingCard}>
                <View style={styles.seekingDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.seekingTitle}>🟢 MAÇ ARIYOR</Text>
                  {Boolean(data.availableNote) && (
                    <Text style={styles.seekingNote}>"{data.availableNote}"</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Reliability Bar */}
          <View style={styles.reliabilityCard}>
            <View style={styles.reliabilityHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="verified-user" size={16} color={reliability >= 90 ? '#22c55e' : '#f59e0b'} />
                <Text style={styles.reliabilityTitle}>Güvenilirlik Puanı</Text>
              </View>
              <Text style={[styles.reliabilityValue, { color: reliability >= 90 ? '#22c55e' : '#f59e0b' }]}>
                %{reliability}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, Math.max(0, reliability))}%`,
                    backgroundColor: reliability >= 90 ? '#22c55e' : '#f59e0b'
                  }
                ]} 
              />
            </View>
          </View>

          {/* Stats Grid */}
          <Text style={styles.statsSectionTitle}>OYUNCU İSTATİSTİKLERİ</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalMatches}</Text>
              <Text style={styles.statLabel}>Maç</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.primary }]}>{goals}</Text>
              <Text style={styles.statLabel}>Gol</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.secondary }]}>{assists}</Text>
              <Text style={styles.statLabel}>Asist</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#f59e0b' }]}>{mvp}</Text>
              <Text style={styles.statLabel}>MVP</Text>
            </View>
          </View>

          {/* Actions */}
          {!isSelf && (
            <View style={styles.actionsWrap}>
              <TouchableOpacity 
                style={styles.directMessageBtn} 
                onPress={handleSendMessage}
                activeOpacity={0.85}
              >
                <MaterialIcons name="chat" size={18} color={theme.background} />
                <Text style={styles.directMessageBtnText}>MESAJ GÖNDER</Text>
              </TouchableOpacity>

              {Boolean(user?.clubId) && (
                <TouchableOpacity 
                  style={styles.clubInviteBtn} 
                  onPress={handleInviteToClub}
                  disabled={inviting}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="shield" size={18} color={theme.primary} />
                  <Text style={styles.clubInviteBtnText}>
                    {inviting ? 'DAVET GÖNDERİLİYOR...' : 'KULÜBÜNE DAVET ET'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isSelf && (
            <View style={styles.selfNotice}>
              <MaterialIcons name="info" size={16} color={theme.textMuted} />
              <Text style={styles.selfNoticeText}>Bu sizin profil kartınızdır.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </AppModal>
  );
}

const useStyles = (theme: any) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 20,
      width: '100%',
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: theme.borderSubtle || 'rgba(255,255,255,0.08)',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceContainerHighest || 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingBar: {
      position: 'absolute',
      top: 20,
      left: 20,
      zIndex: 10,
    },
    scrollBody: {
      paddingTop: 8,
      paddingBottom: 16,
      alignItems: 'center',
    },
    headerSection: {
      alignItems: 'center',
      width: '100%',
      marginBottom: 16,
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: 12,
    },
    avatarImg: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 3,
      borderColor: theme.primary,
      backgroundColor: theme.surfaceContainerHighest,
    },
    ratingBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#111827',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
    ratingBadgeText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 11,
      color: '#ffffff',
    },
    playerName: {
      fontFamily: Fonts.headlineBold,
      fontSize: 20,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.surfaceContainerHighest || 'rgba(255,255,255,0.06)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    tagText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: theme.text,
    },
    matchSeekingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.3)',
      borderRadius: 12,
      padding: 10,
      width: '100%',
      marginTop: 6,
    },
    seekingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22c55e',
    },
    seekingTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 11,
      color: '#22c55e',
      letterSpacing: 0.5,
    },
    seekingNote: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: theme.text,
      marginTop: 2,
    },
    reliabilityCard: {
      width: '100%',
      backgroundColor: theme.surfaceContainerHighest || 'rgba(255,255,255,0.04)',
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    reliabilityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    reliabilityTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: theme.textMuted,
    },
    reliabilityValue: {
      fontFamily: Fonts.headlineBold,
      fontSize: 14,
    },
    progressTrack: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    statsSectionTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 11,
      color: theme.textMuted,
      letterSpacing: 0.8,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    statsGrid: {
      flexDirection: 'row',
      width: '100%',
      gap: 8,
      marginBottom: 20,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.surfaceContainerHighest || 'rgba(255,255,255,0.04)',
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderSubtle || 'rgba(255,255,255,0.05)',
    },
    statVal: {
      fontFamily: Fonts.headlineBold,
      fontSize: 18,
      color: theme.text,
      marginBottom: 2,
    },
    statLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: theme.textMuted,
    },
    actionsWrap: {
      width: '100%',
      gap: 10,
    },
    directMessageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 14,
    },
    directMessageBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: theme.background,
      letterSpacing: 0.5,
    },
    clubInviteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.primary,
      paddingVertical: 12,
      borderRadius: 14,
    },
    clubInviteBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: theme.primary,
      letterSpacing: 0.5,
    },
    selfNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    selfNoticeText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: theme.textMuted,
    },
  });
