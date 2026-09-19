import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchStoryModal } from '@/components/MatchStoryModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { PitchReviewModal } from '@/components/PitchReviewModal';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RosterPlayer {
  id: string;
  name: string;
  avatar: string;
  position: string;
  number?: string;
  team?: 'A' | 'B';
}

const DEFAULT_PLAYERS: RosterPlayer[] = [
  { id: '1', name: 'Burak Kaleci', position: 'Kaleci', number: '#1', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' },
  { id: '2', name: 'Ege Kaptan', position: 'Orta Saha', number: '#10', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEgY_XdNWMIj9yAYPG31RfO-rUvIt9prSpOqQHShIufOnkDbrYIlyKE5OZY68gsCgDSnwxHtMW-j19KupMZmC1tNOq2QEesdu0Hh1zinr1P_g8cyWt1cHFNPGGmiuhIZPaOmTY8ssYbYKbbtC1nP9RVOEgPKgWBYWiA4E6WPsGYKqCpqU3aMljt6lAwmwmmFRefyWbWiaAfQTMPcUlEPjZEzau9MIBiNfLMhzwyqoMX1Po75F4qVfsV9hLp3_uervSUefQPNM33cr' },
  { id: '3', name: 'Hızlı Forvet', position: 'Forvet', number: '#9', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zN4BMEVqYUF3QeCqfMmUKmw5cBXxBSRW3VsxvUV-KXfxcfUNy6Y82Uw5RqW42gjFGsQrYA81GzfjxHDInaql-eBPtBAeWIzYvIo5IstQNOYNqQ8g3WQjb_WA4gUlWI3jtxS0-dZvcC5Az1uvxxCDgdHFIH9RwA7ZsebYxmMiF16BfI2i_Ms9TkF9YUXKDArXyw9YMuFV1_yUlUT27aKrZhO--9EpUrIuSs9PmeIxM6YUFzjuQBP3bjtPS29-G09qbUuQ9_U0i825' },
  { id: '4', name: 'Mert Defans', position: 'Defans', number: '#4', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' },
];

export default function RateMatchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const params = useLocalSearchParams<{ matchId?: string; playerName?: string; playerAvatar?: string; matchScore?: string }>();
  const [scoreA, setScoreA] = useState(7);
  const [scoreB, setScoreB] = useState(5);
  const [evaluatedPlayers, setEvaluatedPlayers] = useState<Record<string, number>>({});

  const [roster, setRoster] = useState<RosterPlayer[]>(DEFAULT_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer>(DEFAULT_PLAYERS[1]);
  const [pitchReviewVisible, setPitchReviewVisible] = useState(false);
  const [matchArena, setMatchArena] = useState<string>('Beşiktaş Arena');

  useEffect(() => {
    if (params.matchScore && params.matchScore.includes('-')) {
      const parts = params.matchScore.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        setScoreA(parts[0]);
        setScoreB(parts[1]);
      }
    }
  }, [params.matchScore]);

  useEffect(() => {
    if (params.matchId) {
      // Önce bu maça ait değerlendirilen oyuncuları depodan yükle
      const storageKey = `@hiv_evaluated_${params.matchId}`;
      AsyncStorage.getItem(storageKey).then(raw => {
        if (raw) setEvaluatedPlayers(JSON.parse(raw));
      }).catch(() => {});

      dbService.getMatchById(params.matchId).then((match) => {
        if (match) {
          if (match.arena) setMatchArena(match.arena);
          if (match.score && match.score.includes('-')) {
            const parts = match.score.split('-').map(s => parseInt(s.trim(), 10));
            if (!isNaN(parts[0]) && !isNaN(parts[1])) {
              setScoreA(parts[0]);
              setScoreB(parts[1]);
            }
          }
          if (match.slots) {
            const rawPlayers: RosterPlayer[] = Object.entries(match.slots)
              .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[1] && entry[1].name))
              .map(([slotKey, s], idx) => ({
                id: s.uid || `slot-${slotKey}`,
                name: s.name,
                avatar: s.avatar || DEFAULT_PLAYERS[0].avatar,
                position: s.position || (slotKey.includes('OS') ? 'Orta Saha' : slotKey.includes('FORVET') ? 'Forvet' : slotKey.includes('DEF') || slotKey.includes('DF') ? 'Defans' : slotKey.includes('KL') ? 'Kaleci' : 'Oyuncu'),
                number: `#${idx + 1}`,
                team: slotKey.startsWith('B_') ? 'B' : 'A',
              }));

            // Kesin tekilleştirme: Kullanıcı veya aynı isimdeki oyuncular asla 2 kez çıkmaz
            const seenKeys = new Set<string>();
            const deduplicated: RosterPlayer[] = [];

            rawPlayers.forEach((p) => {
              const isCurrentUser = (user?.uid && p.id === user.uid) || 
                                    (user?.name && p.name.trim().toLowerCase() === user.name.trim().toLowerCase());
              const key = isCurrentUser ? '__CURRENT_USER__' : (p.id && !p.id.startsWith('slot-') ? p.id : p.name.trim().toLowerCase());
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                deduplicated.push({
                  ...p,
                  id: isCurrentUser && user?.uid ? user.uid : p.id
                });
              }
            });

            if (deduplicated.length > 0) {
              setRoster(deduplicated);
              const found = deduplicated.find(p => p.name === params.playerName) || 
                            deduplicated.find(p => p.id !== user?.uid) || 
                            deduplicated[0];
              setSelectedPlayer(found);
            }
          }
        }
      });
    }
  }, [params.matchId, params.playerName, user?.uid, user?.name]);

  const [rating, setRating] = useState(8.0);
  const [isMvp, setIsMvp] = useState(false);
  const [storyVisible, setStoryVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(['Centilmen / Fair Play']);
  const [saving, setSaving] = useState(false);

  const tags = [
    'Paslaşmayı Seven',
    'Centilmen / Fair Play',
    'Teknik',
    'Mücadeleci',
    'Bencil',
    'Sert Oynayan',
    'Koşmuyor'
  ];

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      const next = Math.max(0, scoreA + delta);
      setScoreA(next);
      if (params.matchId) {
        dbService.updateMatch(params.matchId, { score: `${next} - ${scoreB}`, status: 'completed' }).catch(() => {});
      }
    } else {
      const next = Math.max(0, scoreB + delta);
      setScoreB(next);
      if (params.matchId) {
        dbService.updateMatch(params.matchId, { score: `${scoreA} - ${next}`, status: 'completed' }).catch(() => {});
      }
    }
  };

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  const handleSaveRating = async () => {
    if (saving) return;
    if (selectedPlayer?.id === user?.uid) {
      Alert.alert('Centilmenlik Kuralı', 'Kendinizi puanlayamazsınız. Lütfen takım arkadaşlarınızı veya rakiplerinizi değerlendirin.');
      return;
    }
    setSaving(true);
    try {
      const finalScoreStr = `${scoreA} - ${scoreB}`;
      await dbService.saveMatchRating(params.matchId || 'general_match', {
        userId: user?.uid || 'anon',
        ratedPlayerId: selectedPlayer?.id,
        ratedPlayerName: selectedPlayer?.name,
        rating,
        mvpNominee: isMvp ? (selectedPlayer?.name || 'MVP') : undefined,
        comment: activeTags.join(', ')
      });
      
      if (params.matchId) {
        try {
          await dbService.updateMatch(params.matchId, { score: finalScoreStr, status: 'completed' });
          const raw = await AsyncStorage.getItem('@hiv_rated_matches');
          const list: string[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(params.matchId)) {
            list.push(params.matchId);
            await AsyncStorage.setItem('@hiv_rated_matches', JSON.stringify(list));
          }

          // Değerlendirilen oyuncular haritasını güncelle
          if (selectedPlayer?.id) {
            const updatedEval = { ...evaluatedPlayers, [selectedPlayer.id]: rating };
            setEvaluatedPlayers(updatedEval);
            await AsyncStorage.setItem(`@hiv_evaluated_${params.matchId}`, JSON.stringify(updatedEval));
          }
        } catch (err) {
          console.log('Rated storage error:', err);
        }
      }

      Alert.alert(
        '✓ Değerlendirme Kaydedildi',
        `${selectedPlayer?.name} için puanınız: ${rating.toFixed(1)}/10${isMvp ? ' • MVP adayı eklendi' : ''}\nMaç Skoru: ${finalScoreStr}`,
        [
          { text: 'Tamam', onPress: () => router.back() },
          { text: 'Story Oluştur', onPress: () => setStoryVisible(true) },
        ]
      );
    } catch (e) {
      console.log('Puan kaydetme hatası:', e);
      Alert.alert('Hata', 'Değerlendirme kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MatchStoryModal
        visible={storyVisible}
        mvpName={isMvp ? selectedPlayer?.name : 'KAPTAN SARI'}
        score={`${scoreA} - ${scoreB}`}
        onClose={() => setStoryVisible(false)}
      />
      <PitchReviewModal
        visible={pitchReviewVisible}
        pitchName={matchArena}
        onClose={() => setPitchReviewVisible(false)}
      />
      <NotificationCenterModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>MAÇ DEĞERLENDİR</Text>
        </View>
        <TouchableOpacity style={styles.iconBtnHover} onPress={() => setNotifVisible(true)}>
          <MaterialIcons name="notifications" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Match Score Section */}
        <View style={styles.scoreSectionCard}>
          <View style={styles.scoreSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="sports-score" size={20} color={theme.primary} />
              <Text style={styles.scoreSectionTitle}>MAÇ SKORU</Text>
            </View>
            <View style={styles.scoreStatusPill}>
              <Text style={styles.scoreStatusPillText}>BİTEN MAÇ</Text>
            </View>
          </View>
          
          <View style={styles.scoreCounterRow}>
            {/* Team A */}
            <View style={styles.teamScoreBox}>
              <Text style={styles.teamNameLabel} numberOfLines={1}>A TAKIMI</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepBtn} 
                  onPress={() => handleScoreChange('A', -1)} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="remove" size={16} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.scoreBigNum}>{scoreA}</Text>
                <TouchableOpacity 
                  style={styles.stepBtn} 
                  onPress={() => handleScoreChange('A', 1)} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="add" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.scoreDividerBox}>
              <Text style={styles.scoreDividerDash}>-</Text>
            </View>

            {/* Team B */}
            <View style={styles.teamScoreBox}>
              <Text style={styles.teamNameLabel} numberOfLines={1}>B TAKIMI</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepBtn} 
                  onPress={() => handleScoreChange('B', -1)} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="remove" size={16} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.scoreBigNum}>{scoreB}</Text>
                <TouchableOpacity 
                  style={styles.stepBtn} 
                  onPress={() => handleScoreChange('B', 1)} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="add" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Roster Picker Section */}
        <View style={styles.rosterSection}>
          <View style={styles.rosterHeader}>
            <MaterialIcons name="groups" size={18} color={theme.primary} />
            <Text style={styles.rosterSectionTitle}>KADRODAN OYUNCU SEÇİN</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterList}>
            {roster.map((player) => {
              const isSelected = selectedPlayer?.id === player.id;
              const isSelf = (user?.uid && player.id === user.uid) || 
                             (user?.name && player.name.trim().toLowerCase() === user.name.trim().toLowerCase());
              const playerRating = evaluatedPlayers[player.id];
              const isRated = playerRating !== undefined;

              return (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.rosterItem, 
                    isSelected && styles.rosterItemActive,
                    isRated && !isSelected && styles.rosterItemRated,
                    isSelf && { borderColor: `${theme.secondary}55` }
                  ]}
                  onPress={() => {
                    if (isSelf) {
                      Alert.alert(
                        '⚖️ Centilmenlik Kuralı',
                        'Centilmenlik ve lig adaleti gereği kendinizi puanlayamazsınız. Lütfen takım arkadaşlarınızı veya rakiplerinizi değerlendirin.',
                        [{ text: 'Anladım' }]
                      );
                      return;
                    }
                    setSelectedPlayer(player);
                    if (playerRating !== undefined) {
                      setRating(playerRating);
                    } else {
                      setRating(8.0);
                    }
                    setIsMvp(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.rosterAvatarWrap, 
                    isSelected && { borderColor: theme.primary },
                    isRated && !isSelected && { borderColor: '#22c55e' }
                  ]}>
                    <Image source={{ uri: player.avatar }} style={styles.rosterAvatar} />
                    {isSelected && (
                      <View style={styles.rosterSelectedBadge}>
                        <MaterialIcons name="edit" size={9} color={theme.background} />
                      </View>
                    )}
                    {isRated && !isSelected && (
                      <View style={[styles.rosterSelectedBadge, { backgroundColor: '#22c55e' }]}>
                        <MaterialIcons name="check" size={9} color="#090B10" />
                      </View>
                    )}
                    {isSelf && !isSelected && !isRated && (
                      <View style={[styles.rosterSelectedBadge, { backgroundColor: theme.secondary }]}>
                        <Text style={{ fontSize: 7, color: theme.background, fontWeight: 'bold' }}>SİZ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.rosterName, 
                    isSelected && { color: theme.primary, fontFamily: Fonts.headlineBold },
                    isRated && !isSelected && { color: '#22c55e' }
                  ]} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={[
                    styles.rosterPosition,
                    isRated && { color: '#22c55e', fontWeight: 'bold' }
                  ]} numberOfLines={1}>
                    {isSelf ? '(Kendiniz)' : isRated ? `✓ ${playerRating.toFixed(1)}` : player.position}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Player Context Section */}
        <View style={styles.playerContext}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarBorder}>
              <Image 
                source={{ uri: selectedPlayer?.avatar }} 
                style={styles.avatarImg} 
              />
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{selectedPlayer?.number || '#10'}</Text>
            </View>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{selectedPlayer?.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>{selectedPlayer?.position} • Maç Sonu Değerlendirmesi</Text>
            </View>
          </View>
        </View>

        {/* MVP Vote Section */}
        <TouchableOpacity 
          style={[
            styles.mvpBox, 
            isMvp && styles.mvpBoxActive
          ]} 
          activeOpacity={0.85}
          onPress={() => setIsMvp(!isMvp)}
        >
          <View style={styles.mvpLeft}>
            <View style={[styles.mvpIconWrap, isMvp && { backgroundColor: theme.primary }]}>
              <MaterialIcons name="emoji-events" size={24} color={isMvp ? theme.background : theme.textMuted} />
            </View>
            <View>
              <Text style={[styles.mvpTitle, isMvp && { color: theme.primary }]}>MAÇIN ADAMI (MVP) SEÇ</Text>
              <Text style={styles.mvpSub}>Bu oyuncuyu maçın en iyisi olarak aday göster</Text>
            </View>
          </View>
          <MaterialIcons 
            name={isMvp ? 'check-circle' : 'radio-button-unchecked'} 
            size={24} 
            color={isMvp ? theme.primary : theme.textMuted} 
          />
        </TouchableOpacity>

        {/* Rating Slider Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingTitle}>PERFORMANS PUANI</Text>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            value={rating}
            onValueChange={setRating}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.surfaceContainerHighest}
            thumbTintColor={theme.primary}
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Kötü</Text>
            <Text style={styles.sliderLabelText}>Ortalama</Text>
            <Text style={styles.sliderLabelText}>Efsanevi</Text>
          </View>
        </View>

        {/* Feedback Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>ÖZEL GERİ BİLDİRİM</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <TouchableOpacity 
                  key={tag} 
                  style={[styles.tagBtn, isActive ? styles.tagBtnActive : styles.tagBtnInactive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tagText, isActive ? styles.tagTextActive : styles.tagTextInactive]}>
                    {tag}
                  </Text>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={16} color={theme.background} style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.submitBtn, (saving || selectedPlayer?.id === user?.uid) && { opacity: 0.6 }]} 
          activeOpacity={0.9} 
          onPress={handleSaveRating}
          disabled={saving || selectedPlayer?.id === user?.uid}
        >
          <MaterialIcons name="check" size={20} color={theme.background} />
          <Text style={styles.submitBtnText}>
            {selectedPlayer?.id === user?.uid ? 'KENDİNİZİ PUANLAYAMAZSINIZ' : 'DEĞERLENDİRMEYİ GÖNDER'}
          </Text>
        </TouchableOpacity>

        {/* Saha / Tesis Puanlama Butonu */}
        <TouchableOpacity
          style={styles.pitchReviewBtn}
          onPress={() => setPitchReviewVisible(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="stadium" size={18} color={theme.secondary} />
          <Text style={styles.pitchReviewBtnText}>SAHAYI / TESİSİ DEĞERLENDİR ({matchArena})</Text>
        </TouchableOpacity>
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
    backgroundColor: `${theme.background}CC`,
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
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  playerContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 40},
  avatarWrap: {
    position: 'relative'},
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: `${theme.primary}33`,
    overflow: 'hidden',
    backgroundColor: theme.surfaceContainerHighest},
  avatarImg: {
    width: '100%',
    height: '100%'},
  numberBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4},
  numberBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.onPrimary,
    fontStyle: 'italic'},
  playerInfo: {
    flex: 1},
  playerName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 24,
    color: theme.text,
    letterSpacing: -0.5,
    lineHeight: 28},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4},
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.secondary},
  statusText: {
    fontFamily: Fonts.label,
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5},
  mvpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.borderSubtle,
    marginBottom: 24,
  },
  mvpBoxActive: {
    backgroundColor: `${theme.background}CC`,
    borderColor: theme.primary,
  },
  mvpLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mvpIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  mvpTitle: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  mvpSub: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, marginTop: 2 },
  ratingSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 32,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    marginBottom: 24},
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32},
  ratingTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    textTransform: 'uppercase',
    letterSpacing: 1},
  ratingValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 48,
    color: theme.primary,
    fontStyle: 'italic',
    lineHeight: 48},
  slider: {
    width: '100%',
    height: 48},
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16},
  sliderLabelText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5},
  tagsSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 32,
    marginBottom: 48},
  tagsTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24},
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12},
  tagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24},
  tagBtnInactive: {
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: theme.borderSubtle},
  tagBtnActive: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4},
  tagText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14},
  tagTextInactive: {
    color: theme.text},
  tagTextActive: {
    color: theme.background},
  submitBtn: {
    backgroundColor: theme.primary, // the gradient would be nice but simple flat works in RN unless SVG is used
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 8},
  submitBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.background,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.5},

  scoreSectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  scoreSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreSectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  scoreStatusPill: {
    backgroundColor: `${theme.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreStatusPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  scoreCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  teamScoreBox: {
    alignItems: 'center',
    gap: 6,
  },
  teamNameLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 10,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBigNum: {
    fontFamily: Fonts.headlineBold,
    fontSize: 22,
    color: theme.text,
    minWidth: 28,
    textAlign: 'center',
  },
  scoreDividerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  scoreDividerDash: {
    fontFamily: Fonts.headlineBold,
    fontSize: 28,
    color: theme.textMuted,
  },

  rosterSection: {
    marginBottom: 24,
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rosterSectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    letterSpacing: 0.5,
  },
  rosterList: {
    gap: 8,
    paddingVertical: 4,
  },
  rosterItem: {
    alignItems: 'center',
    width: 64,
    padding: 6,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.borderSubtle,
  },
  rosterItemActive: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}15`,
  },
  rosterItemRated: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  rosterAvatarWrap: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  rosterAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  rosterSelectedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterName: {
    fontFamily: Fonts.headline,
    fontSize: 10,
    color: theme.text,
    textAlign: 'center',
    width: '100%',
  },
  rosterPosition: {
    fontFamily: Fonts.body,
    fontSize: 8,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  pitchReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${theme.secondary}1A`,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${theme.secondary}4D`,
    marginTop: 12,
  },
  pitchReviewBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.secondary,
    letterSpacing: 0.5,
  },
});
