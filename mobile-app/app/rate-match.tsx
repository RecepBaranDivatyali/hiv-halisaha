import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MatchStoryModal } from '@/components/MatchStoryModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';
import Slider from '@react-native-community/slider';

export default function RateMatchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const params = useLocalSearchParams<{ matchId?: string; playerName?: string; playerAvatar?: string; matchScore?: string }>();
  const playerName = params.playerName || 'Seçilen Oyuncu';
  const playerAvatar = params.playerAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zN4BMEVqYUF3QeCqfMmUKmw5cBXxBSRW3VsxvUV-KXfxcfUNy6Y82Uw5RqW42gjFGsQrYA81GzfjxHDInaql-eBPtBAeWIzYvIo5IstQNOYNqQ8g3WQjb_WA4gUlWI3jtxS0-dZvcC5Az1uvxxCDgdHFIH9RwA7ZsebYxmMiF16BfI2i_Ms9TkF9YUXKDArXyw9YMuFV1_yUlUT27aKrZhO--9EpUrIuSs9PmeIxM6YUFzjuQBP3bjtPS29-G09qbUuQ9_U0i825';
  const matchScore = params.matchScore || '5 - 2';

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

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  const handleSaveRating = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await dbService.saveMatchRating(params.matchId || 'general_match', {
        userId: user?.uid || 'anon',
        rating,
        mvpNominee: isMvp ? (playerName || 'MVP') : undefined,
        comment: activeTags.join(', ')
      });
      
      Alert.alert(
        '✓ Değerlendirme Kaydedildi',
        `Puan: ${rating.toFixed(1)}/10${isMvp ? ' • MVP adayı eklendi' : ''}`,
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
        mvpName={isMvp ? playerName : 'KAPTAN SARI'}
        score={matchScore}
        onClose={() => setStoryVisible(false)}
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
        {/* Player Context Section */}
        <View style={styles.playerContext}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarBorder}>
              <Image 
                source={{ uri: playerAvatar }} 
                style={styles.avatarImg} 
              />
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>#10</Text>
            </View>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{playerName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Maç Sonu Değerlendirmesi</Text>
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
          style={[styles.submitBtn, saving && { opacity: 0.7 }]} 
          activeOpacity={0.9} 
          onPress={handleSaveRating}
          disabled={saving}
        >
          <MaterialIcons name="check" size={20} color={theme.background} />
          <Text style={styles.submitBtnText}>DEĞERLENDİRMEYİ GÖNDER</Text>
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
    letterSpacing: -0.5}
});
