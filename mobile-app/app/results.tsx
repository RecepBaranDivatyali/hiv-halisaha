import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Bouncable } from '@/components/Bouncable';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { dbService } from '@/services/dbService';
import { Skeleton } from '@/components/Skeleton';

export default function ResultsScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{
    tab?: string;
    pos?: string;
    city?: string;
    district?: string;
    level?: string;
    difficulty?: string;
    mode?: string;
    arena?: string;
    timeFrame?: string;
    reservationStatus?: string;
    playerStatus?: string;
    minRating?: string;
    maxRating?: string;
  }>();
  const searchTab = (params.tab || 'Oyuncu') as string;
  const posName = params.pos ? `(${params.pos})` : '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);

  const fetchResults = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (searchTab === 'Oyuncu') {
        const list = await dbService.searchPlayers({
          city: params.city,
          district: params.district,
          position: params.pos,
          level: params.level,
          minRating: params.minRating ? parseFloat(params.minRating) : undefined,
          maxRating: params.maxRating ? parseFloat(params.maxRating) : undefined,
          onlyLookingForMatch: params.playerStatus === 'looking',
          timeFrame: params.timeFrame,
        });
        setPlayers(list);
      } else if (searchTab === 'Maç') {
        const list = await dbService.searchMatches({
          city: params.city,
          district: params.district,
          mode: params.mode,
          difficulty: params.difficulty,
          arena: params.arena,
          timeFrame: params.timeFrame,
          hasReservation: params.reservationStatus as any,
        });
        setMatches(list);
      } else if (searchTab === 'Rakip') {
        const list = await dbService.getClubs({
          city: params.city,
          district: params.district,
          hasReservation: params.reservationStatus === 'reserved' ? true : params.reservationStatus === 'no_reservation' ? false : undefined,
          timeFrame: params.timeFrame,
        });
        setOpponents(list);
      }
    } catch (e) {
      console.log('Arama sonuçları getirme hatası:', e);
      setError('Arama sonuçları yüklenirken bir bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  }, [searchTab, params.city, params.district, params.pos, params.level, params.minRating, params.maxRating, params.mode, params.difficulty, params.arena, params.timeFrame, params.reservationStatus, params.playerStatus]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResults();
    setRefreshing(false);
  };

  const tabTitle = searchTab === 'Rakip' ? 'RAKİPLER' : searchTab === 'Oyuncu' ? 'OYUNCULAR' : 'MAÇLAR';
  const resultsCount = searchTab === 'Oyuncu' ? players.length : searchTab === 'Rakip' ? opponents.length : matches.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Arama Sonuçları</Text>
        </View>
        <TouchableOpacity style={styles.iconBtnHover} onPress={onRefresh} accessibilityLabel="Yenile" accessibilityRole="button">
          <MaterialIcons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Search Status/Summary */}
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>
            EŞLEŞEN <Text style={{ color: theme.primary }}>{tabTitle} {posName}</Text>
          </Text>
          <Text style={styles.statusDesc}>
            {loading ? 'Aranıyor...' : `${resultsCount} Sonuç Bulundu (${params.city || 'Tüm Şehirler'}${params.timeFrame ? ` • ${params.timeFrame}` : ''})`}
          </Text>
        </View>

        {/* Dynamic List */}
        <View style={styles.listContainer}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.playerCard, { padding: 16, borderLeftColor: theme.border }]}>
                <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))
          ) : error ? (
            <View style={{ alignItems: 'center', paddingVertical: 50, gap: 16 }}>
              <MaterialIcons name="error-outline" size={60} color={theme.error} />
              <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, textAlign: 'center' }}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchResults}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 }}
              >
                <Text style={{ fontFamily: Fonts.headlineBold, color: theme.onPrimary, fontSize: 14 }}>TEKRAR DENE</Text>
              </TouchableOpacity>
            </View>
          ) : resultsCount === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
              <MaterialIcons name="search-off" size={64} color={theme.surfaceContainerHighest} />
              <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.textMuted, textAlign: 'center' }}>
                Kriterlere uygun sonuç bulunamadı
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
                Farklı şehir veya pozisyon filtreleri deneyebilirsiniz.
              </Text>
            </View>
          ) : (
            <>
              {searchTab === 'Oyuncu' && players.map((player, idx) => (
                <Animated.View key={player.id || idx} entering={FadeInRight.delay(idx * 80).springify()}>
                  <Bouncable 
                    style={[styles.playerCard, player.isLookingForMatch && styles.playerCardHighlight]} 
                    onPress={() => router.push({ pathname: '/chat-detail', params: { userName: player.name, recipientId: player.id } })}
                  >
                    <Image source={{ uri: player.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.playerAvatar} />
                    <View style={styles.playerInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        {player.isLookingForMatch && (
                          <View style={styles.lookingMiniBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.lookingMiniBadgeText}>Maç Arıyor</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerPos}>{player.position || 'Oyuncu'} • {player.city || 'İSTANBUL'}{player.district ? ` / ${player.district}` : ''}</Text>
                      {player.isLookingForMatch && player.availableNote ? (
                        <Text style={styles.playerAvailableNote} numberOfLines={1}>💬 &quot;{player.availableNote}&quot;</Text>
                      ) : null}
                    </View>
                    <View style={styles.playerRatingBox}>
                      <Text style={styles.playerRating}>{player.rating || '8.5'}</Text>
                      <MaterialIcons name="star" size={12} color={theme.primary} />
                    </View>
                  </Bouncable>
                </Animated.View>
              ))}

              {searchTab === 'Rakip' && opponents.map((opp, idx) => (
                <Animated.View key={opp.id || idx} entering={FadeInRight.delay(idx * 80).springify()}>
                  <Bouncable style={[styles.playerCard, { borderLeftWidth: 3, borderLeftColor: opp.hasReservation ? '#22c55e' : (opp.color || theme.primary) }]} onPress={() => router.push({ pathname: '/my-club', params: { clubId: opp.id } })}>
                    <View style={[styles.playerAvatar, { backgroundColor: `${opp.color || theme.primary}20`, alignItems: 'center', justifyContent: 'center' }]}>
                      <MaterialIcons name="shield" size={24} color={opp.color || theme.primary} />
                    </View>
                    <View style={styles.playerInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.playerName}>{opp.name}</Text>
                        {opp.hasReservation ? (
                          <View style={styles.reservedBadge}>
                            <MaterialIcons name="verified" size={11} color="#22c55e" />
                            <Text style={styles.reservedBadgeText}>Sahası Hazır</Text>
                          </View>
                        ) : (
                          <View style={styles.noResBadge}>
                            <MaterialIcons name="location-searching" size={11} color="#f59e0b" />
                            <Text style={styles.noResBadgeText}>Saha Aranıyor</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerPos}>Seviye: {opp.level || 1} • {opp.membersCount || 10} Üye • {opp.city || 'Ankara'}</Text>
                      {opp.reservationDetails ? (
                        <Text style={styles.playerAvailableNote} numberOfLines={1}>🏟️ {opp.reservationDetails}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.playerRatingBox, { backgroundColor: theme.surfaceContainerHighest }]}>
                      <Text style={styles.playerRating}>{opp.points || 100} PK</Text>
                    </View>
                  </Bouncable>
                </Animated.View>
              ))}

              {searchTab === 'Maç' && matches.map((match, idx) => (
                <Animated.View key={match.id || idx} entering={FadeInRight.delay(idx * 80).springify()}>
                  <Bouncable style={[styles.playerCard, { borderLeftWidth: 3, borderLeftColor: match.hasReservation ? '#22c55e' : match.isPitchFlexible ? '#f59e0b' : theme.primary }]} onPress={() => router.push({ pathname: '/match-room', params: { matchId: match.id } })}>
                    <View style={[styles.playerAvatar, { backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center' }]}>
                      <MaterialIcons name="sports-soccer" size={24} color={match.hasReservation ? '#22c55e' : theme.primary} />
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{match.arena}</Text>
                      <Text style={styles.playerPos}>{match.dateTime} • {match.mode}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {match.hasReservation ? (
                          <View style={styles.reservedBadge}>
                            <MaterialIcons name="verified" size={11} color="#22c55e" />
                            <Text style={styles.reservedBadgeText}>✓ Rezerve (Saha Hazır)</Text>
                          </View>
                        ) : match.isPitchFlexible ? (
                          <View style={styles.flexiblePitchBadge}>
                            <MaterialIcons name="location-searching" size={11} color="#f59e0b" />
                            <Text style={styles.flexiblePitchBadgeText}>📍 Saha Aranıyor</Text>
                          </View>
                        ) : (
                          <View style={styles.noResBadge}>
                            <MaterialIcons name="hourglass-empty" size={11} color="#f59e0b" />
                            <Text style={styles.noResBadgeText}>⚠️ Rezervasyon Yok</Text>
                          </View>
                        )}
                        {match.isTimeFlexible && (
                          <View style={styles.flexibleTimeBadge}>
                            <MaterialIcons name="schedule" size={11} color="#38bdf8" />
                            <Text style={styles.flexibleTimeBadgeText}>⏳ Saat Esnek</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[styles.playerRatingBox, { backgroundColor: theme.surfaceContainerHighest }]}>
                      <Text style={styles.playerRating}>{match.joinedPlayersCount}/{match.totalRequiredPlayers}</Text>
                      <MaterialIcons name="group" size={12} color={theme.textMuted} />
                    </View>
                  </Bouncable>
                </Animated.View>
              ))}
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
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    letterSpacing: -0.5
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60
  },
  statusBox: {
    marginBottom: 24,
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  statusTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    letterSpacing: -0.5
  },
  statusDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4
  },
  listContainer: {
    gap: 12
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14
  },
  playerInfo: {
    flex: 1
  },
  playerName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text
  },
  playerPos: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2
  },
  playerRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  playerRating: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary
  },
  playerCardHighlight: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  lookingMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lookingMiniBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#22c55e',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  playerAvailableNote: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  reservedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  reservedBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#22c55e',
  },
  flexiblePitchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  flexiblePitchBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#f59e0b',
  },
  noResBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  noResBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#f59e0b',
  },
  flexibleTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  flexibleTimeBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#38bdf8',
  },
});
