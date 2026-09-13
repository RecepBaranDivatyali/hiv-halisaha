import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { useMatches } from '@/hooks/use-matches';
import { dbService } from '@/services/dbService';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';

export default function ConversationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { matches, reloadMatches } = useMatches();
  const styles = useStyles(theme);
  const [notifVisible, setNotifVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = React.useCallback(async () => {
    if (user?.uid) {
      try {
        const list = await dbService.getConversations(user.uid);
        setConversations(list);
      } catch (e) {
        console.log('Sohbetler getirme hatası:', e);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadConversations(), reloadMatches()]);
    setRefreshing(false);
  };

  const formatTimestamp = (timeVal: any) => {
    if (!timeVal) return '';
    try {
      const date = typeof timeVal?.toDate === 'function' ? timeVal.toDate() : new Date(timeVal);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NotificationCenterModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>SOHBETLER</Text>
        </View>
        <TouchableOpacity style={styles.iconBtnHover} onPress={() => setNotifVisible(true)} accessibilityLabel="Bildirimler" accessibilityRole="button">
          <MaterialIcons name="notifications" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        
        {/* Club Team Chat Card */}
        {user?.clubName && (
          <View style={styles.sectionMargin}>
            <TouchableOpacity 
              style={styles.chatCard} 
              activeOpacity={0.9} 
              onPress={() => router.push({
                pathname: '/chat-detail',
                params: { conversationId: `club_${user?.clubId || 'general'}`, title: user?.clubName || 'Kulüp Sohbeti' }
              })}
            >
              <View style={styles.primaryIndicator} />
              <View style={styles.avatarWrapBig}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9ajYvZlLwGKklQrdhNZj2Hw6UfNjRkinE7u1WI2aUCqKMIBvubgMs0lYgfGBObbyPffWxiRmf8vzMfpLq83EmiY9JBQtsCL0JmkWvdr1D4xg_D17lRZVxb6LrjxrW-NgGggmODKkZYEEiEWFThsfXNMWShj645JR0GZ7PDxxqwZAMsvIwLgpIsmh10Xogocg-F_KBpHmhapAGS3HNMxyva93y5CtC9-NwbMQM1AZzddHdezG_LjqGzSNyOf1hNYA1Uxuy79e41trH' }} style={styles.avatarImgBig} />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{user.clubName}</Text>
                  <Text style={styles.chatTime}>Kulüp</Text>
                </View>
                <Text style={styles.chatMessageItalic} numberOfLines={1}>Kulüp üyeleri canlı sohbet odası</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Match Chats */}
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Maç Sohbetleri</Text>
            <Text style={styles.sectionSubtitle}>Aktif Odalar</Text>
          </View>
          
          <View style={styles.listWrap}>
            {matches.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontFamily: Fonts.body, fontSize: 13 }}>
                  Aktif maç bulunamadı. Yeni bir maç oluşturduğunuzda oda sohbeti burada açılır.
                </Text>
              </View>
            ) : matches.map((match) => (
              <TouchableOpacity 
                key={match.id} 
                style={styles.chatCard} 
                activeOpacity={0.9} 
                onPress={() => router.push({
                  pathname: '/chat-detail',
                  params: { conversationId: `match_${match.id}`, title: `${match.arena} Sohbeti` }
                })}
              >
                <View style={styles.primaryIndicator} />
                <View style={styles.avatarWrapBig}>
                  <View style={[styles.avatarImgBig, { backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="sports-soccer" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>CANLI</Text></View>
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle} numberOfLines={1}>{match.arena}</Text>
                    <Text style={styles.chatTime}>{match.mode}</Text>
                  </View>
                  <Text style={styles.chatMessageItalic} numberOfLines={1}>{match.dateTime} • Kadro Odası</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Direct Messages & Connected Players */}
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Özel Mesajlar</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAllText}>Oyuncu Bul</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listWrapSmall}>
            {conversations.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontFamily: Fonts.body, fontSize: 13 }}>
                  Henüz özel mesajınız yok. Arama ekranından bir oyuncuya mesaj gönderebilirsiniz.
                </Text>
              </View>
            ) : conversations.map((conv) => (
              <TouchableOpacity 
                key={conv.id} 
                style={styles.dmCard} 
                activeOpacity={0.9} 
                onPress={() => router.push({
                  pathname: '/chat-detail',
                  params: { conversationId: conv.id, title: conv.otherUserName || 'Özel Sohbet' }
                })}
              >
                <View style={styles.avatarWrapSmall}>
                  <Image source={{ uri: conv.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCl2n8X-3eGGDFE7mZ1zAF_AaY8YYRl0bhQM9XKb5COjdw4b__QrKC7pkASjYrTHLE8sJfxPqcSsiqth9PWhnkLdpbf0EGCq_0aZGOspXmncO-8-1r0SzhntrvsX1llUgtTQfcgfMpefsqt1QzTzBPamBhOw896obyjzis3VrVSJjXTvzdZoHKvqkJifFaKWypEZqf0E921XXw9kyGf3jwukAos91pk5c6lvLhCkBRdypMUbEw6DlKE4rcplDshZ_bLwDzdfggaM4qm' }} style={styles.avatarImgSmall} />
                  <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
                </View>
                <View style={styles.dmInfoBordered}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.dmTitle} numberOfLines={1}>{conv.otherUserName || 'Oyuncu'}</Text>
                    <Text style={styles.dmTimeHighlight}>
                      {formatTimestamp(conv.lastMessageTime)}
                    </Text>
                  </View>
                  <Text style={styles.dmMessageBold} numberOfLines={1}>{conv.lastMessage || 'Mesaj başlatıldı.'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* FAB: Start conversation */}
      <TouchableOpacity 
        style={styles.fabBtn} 
        onPress={() => router.push({ pathname: '/(tabs)/search', params: { tab: 'Oyuncu' } })}
        accessibilityLabel="Yeni sohbet başlat"
        accessibilityRole="button"
      >
        <MaterialIcons name="person-add" size={26} color={theme.onPrimary} />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  iconBtnHover: {
    padding: 8,
    borderRadius: 8
  },
  brandTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    letterSpacing: -0.5
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100
  },
  sectionMargin: {
    marginBottom: 28
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: -0.3
  },
  sectionSubtitle: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: theme.primary,
    fontWeight: 'bold'
  },
  seeAllText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 10
  },
  primaryIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.primary
  },
  avatarWrapBig: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    position: 'relative'
  },
  avatarImgBig: {
    width: '100%',
    height: '100%',
    borderRadius: 24
  },
  liveBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  liveBadgeText: {
    fontFamily: Fonts.label,
    fontSize: 8,
    color: theme.background,
    fontWeight: 'bold'
  },
  chatInfo: {
    flex: 1
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  chatTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text
  },
  chatTime: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted
  },
  chatMessage: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted
  },
  chatMessageItalic: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.primary,
    fontStyle: 'italic'
  },
  listWrap: {
    gap: 4
  },
  listWrapSmall: {
    gap: 8
  },
  dmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  avatarWrapSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    position: 'relative'
  },
  avatarImgSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 20
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.surface
  },
  dmInfoBordered: {
    flex: 1
  },
  dmTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text
  },
  dmTimeHighlight: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.primary,
    fontWeight: 'bold'
  },
  dmMessageBold: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text,
    marginTop: 2
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8
  }
});
