import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PitchReviewModal } from '@/components/PitchReviewModal';
import { useTheme } from '@/context/ThemeContext';
import { Skeleton } from '@/components/Skeleton';
import { PITCH_DATABASE } from '@/config/pitches';

type Tab = 'Maç' | 'Oyuncu' | 'Rakip';

const CITIES_LIST = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Kocaeli', 'Gaziantep', 'Konya', 'Eskişehir', 'Trabzon', 'Samsun'];
const DISTRICTS_MAP: Record<string, string[]> = {
  'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Maltepe', 'Ataşehir'],
  'Ankara': ['Çankaya', 'Dikmen', 'Yenimahalle', 'Keçiören', 'Etimesgut', 'Mamak'],
  'İzmir': ['Karşıyaka', 'Bornova', 'Konak', 'Alsancak', 'Buca'],
  'Bursa': ['Nilüfer', 'Osmangazi', 'Yıldırım'],
  'Antalya': ['Muratpaşa', 'Konyaaltı', 'Kepez'],
  'Trabzon': ['Ortahisar', 'Akçaabat', 'Yomra'],
  'Samsun': ['Atakum', 'İlkadım', 'Canik'],
};

const SEARCH_PREFS_KEY = '@hiv_search_prefs';

export default function SearchScreen() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  
  // Pre-select tab from URL param (e.g. from home quick buttons)
  const initialTab: Tab = (['Maç', 'Oyuncu', 'Rakip'].includes(params.tab ?? '') 
    ? (params.tab as Tab) 
    : 'Oyuncu');

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [pitchReviewVisible, setPitchReviewVisible] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState('Tüm Sahalar');
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  const [selectedDistrict, setSelectedDistrict] = useState('Kadıköy');

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [pitchModalVisible, setPitchModalVisible] = useState(false);

  const [pos, setPos] = useState('KL');
  const [level, setLevel] = useState('0-3.9');
  const [difficulty, setDifficulty] = useState('Eğlence');
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const availableDistricts = DISTRICTS_MAP[selectedCity] || ['Merkez', '1. Bölge', '2. Bölge'];
  const cityPitches = PITCH_DATABASE.filter(p => p.city === selectedCity);

  // Load remembered preferences
  useEffect(() => {
    AsyncStorage.getItem(SEARCH_PREFS_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.city) setSelectedCity(parsed.city);
          if (parsed.district) setSelectedDistrict(parsed.district);
          if (parsed.pos) setPos(parsed.pos);
          if (parsed.level) setLevel(parsed.level);
          if (parsed.difficulty) setDifficulty(parsed.difficulty);
        } catch (e) {
          console.error('AsyncStorage error:', e);
        }
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Update tab if param changes
  useEffect(() => {
    if (params.tab && ['Maç', 'Oyuncu', 'Rakip'].includes(params.tab)) {
      setActiveTab(params.tab as Tab);
    }
  }, [params.tab]);

  const handleStartSearch = async () => {
    if (remember) {
      AsyncStorage.setItem(SEARCH_PREFS_KEY, JSON.stringify({
        city: selectedCity,
        district: selectedDistrict,
        pos,
        level,
        difficulty,
      })).catch((e) => { console.error('AsyncStorage error:', e); });
    }

    router.push({
      pathname: '/results',
      params: { 
        tab: activeTab, 
        pos: pos, 
        difficulty: difficulty, 
        level: level, 
        city: selectedCity, 
        district: selectedDistrict,
        arena: selectedPitch !== 'Tüm Sahalar' ? selectedPitch : undefined,
      }
    });
  };

  const posBtnStyle = (active: boolean) => ([
    styles.posBtn,
    { borderColor: active ? theme.primary : theme.borderSubtle, backgroundColor: active ? `${theme.primary}15` : theme.surfaceContainerHighest }
  ]);

  const levelBtnStyle = (active: boolean) => ([
    styles.levelBtn,
    { borderColor: active ? theme.primary : theme.borderSubtle, backgroundColor: active ? `${theme.primary}15` : theme.surfaceContainerHighest }
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <PitchReviewModal 
        pitchName={selectedPitch === 'Tüm Sahalar' ? (cityPitches[0]?.name || 'Beşiktaş Arena') : selectedPitch} 
        visible={pitchReviewVisible} 
        onClose={() => setPitchReviewVisible(false)} 
      />
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="search" size={24} color={theme.primary} />
        <Text style={styles.headerTitle}>ARAMA</Text>
        <TouchableOpacity 
          onPress={() => {
            setSelectedCity('İstanbul');
            setSelectedDistrict('Kadıköy');
            setSelectedPitch('Tüm Sahalar');
            setPos('KL');
            setLevel('0-3.9');
            setDifficulty('Eğlence');
            Alert.alert('Filtreler Sıfırlandı', 'Arama kriterleri varsayılan değerlere döndürüldü.');
          }} 
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Filtreleri Sıfırla" 
          accessibilityRole="button"
        >
          <MaterialIcons name="restart-alt" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Segmented Control */}
        <View style={styles.segmentContainer}>
          {(['Maç', 'Oyuncu', 'Rakip'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Filters */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>KONUM FİLTRELERİ</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setCityModalVisible(true)} accessibilityLabel="Şehir Seç" accessibilityRole="button">
            <View>
              <Text style={styles.dropdownLabel}>Şehir</Text>
              <Text style={styles.dropdownValue}>{selectedCity}</Text>
            </View>
            <MaterialIcons name="expand-more" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDistrictModalVisible(true)} accessibilityLabel="İlçe Seç" accessibilityRole="button">
            <View>
              <Text style={styles.dropdownLabel}>İlçe</Text>
              <Text style={styles.dropdownValue}>{selectedDistrict}</Text>
            </View>
            <MaterialIcons name="expand-more" size={24} color={theme.primary} />
          </TouchableOpacity>

          {/* Saha Seçici */}
          <TouchableOpacity 
            style={styles.dropdownBtn} 
            onPress={() => setPitchModalVisible(true)} 
            accessibilityLabel="Saha Seç" 
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dropdownLabel}>Saha / Tesis</Text>
              <Text style={styles.dropdownValue} numberOfLines={1}>{selectedPitch}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {selectedPitch !== 'Tüm Sahalar' && (
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    setPitchReviewVisible(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="rate-review" size={18} color={theme.primary} />
                </TouchableOpacity>
              )}
              <MaterialIcons name="expand-more" size={24} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab-specific content */}
        {isLoading ? (
          <View style={{ gap: 40, paddingBottom: 20 }}>
            <View style={{ gap: 16 }}>
              <Skeleton width={150} height={16} />
              <View style={styles.posGrid}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} style={styles.posBtn} borderRadius={12} />)}
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Position filter for Maç & Oyuncu tabs */}
            {(activeTab === 'Maç' || activeTab === 'Oyuncu') && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>POZİSYON İHTİYACI</Text>
                <View style={styles.posGrid}>
                  {['KL', 'DF', 'OS', 'FV'].map((p, i) => {
                    const labels = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];
                    const active = pos === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={posBtnStyle(active)}
                        onPress={() => setPos(p)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.posIconText, active && styles.posIconTextActive]}>{p}</Text>
                        <Text style={[styles.posLabelText, active && styles.posLabelTextActive]}>{labels[i]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Level filter for Oyuncu tab */}
            {activeTab === 'Oyuncu' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>OYUNCU SEVİYESİ</Text>
                <View style={styles.levelGrid}>
                  {['0-3.9', '4.0-5.9', '6.0-7.9', '8.0+'].map((lv) => {
                    const active = level === lv;
                    return (
                      <TouchableOpacity
                        key={lv}
                        style={levelBtnStyle(active)}
                        onPress={() => setLevel(lv)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.levelText, active && styles.levelTextActive]}>{lv}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Difficulty filter for Rakip tab */}
            {activeTab === 'Rakip' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>ZORLUK SEVİYESİ</Text>
                <View style={styles.levelGrid}>
                  {['Eğlence', 'Düşük', 'Orta', 'Yüksek'].map((d) => {
                    const active = difficulty === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={levelBtnStyle(active)}
                        onPress={() => setDifficulty(d)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.levelText, active && styles.levelTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Settings Toggle */}
        <View style={styles.toggleBox}>
          <View>
            <Text style={styles.toggleTitle}>AYARLARI KAYDET</Text>
            <Text style={styles.toggleSub}>Beni Hatırla</Text>
          </View>
          <Switch 
            value={remember}
            onValueChange={setRemember}
            trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
            thumbColor={remember ? theme.text : theme.textMuted}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* City Modal with backdrop tap dismissal */}
      {cityModalVisible && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCityModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>ŞEHİR SEÇİN</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CITIES_LIST.map((city) => (
                <TouchableOpacity 
                  key={city}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCity(city);
                    const defaultDist = (DISTRICTS_MAP[city] && DISTRICTS_MAP[city][0]) || 'Merkez';
                    setSelectedDistrict(defaultDist);
                    setSelectedPitch('Tüm Sahalar');
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedCity === city && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setCityModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>KAPAT</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* District Modal with backdrop tap dismissal */}
      {districtModalVisible && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDistrictModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCity.toUpperCase()} - İLÇE SEÇİN</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availableDistricts.map((dist) => (
                <TouchableOpacity 
                  key={dist}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDistrict(dist);
                    setDistrictModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedDistrict === dist && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>{dist}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setDistrictModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>KAPAT</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Pitch Modal with backdrop tap dismissal */}
      {pitchModalVisible && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPitchModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCity.toUpperCase()} - SAHA SEÇİN</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setSelectedPitch('Tüm Sahalar');
                  setPitchModalVisible(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedPitch === 'Tüm Sahalar' && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                  🏟️ Tüm Sahalar (Filtresiz)
                </Text>
              </TouchableOpacity>
              {cityPitches.map((pitch) => (
                <TouchableOpacity 
                  key={pitch.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPitch(pitch.name);
                    setSelectedDistrict(pitch.district);
                    setPitchModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.modalItemText, selectedPitch === pitch.name && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                      {pitch.name}
                    </Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted }}>
                      {pitch.district} • ★ {pitch.rating}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setPitchModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>KAPAT</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Primary Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, !selectedCity && { opacity: 0.5 }]}
          disabled={!selectedCity}
          onPress={handleStartSearch}
          activeOpacity={0.9}
        >
          <Text style={styles.actionBtnText}>ARAMAYI BAŞLAT</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    zIndex: 50
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.5
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10
  },
  segmentBtnActive: {
    backgroundColor: theme.primary
  },
  segmentText: {
    fontFamily: Fonts.label,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500'
  },
  segmentTextActive: {
    color: theme.onPrimary,
    fontFamily: Fonts.headlineBold
  },
  sectionBox: {
    marginBottom: 32,
    gap: 16
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 4
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12,
    padding: 16
  },
  dropdownLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: -0.5
  },
  dropdownValue: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 2
  },
  posGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  posBtn: {
    width: '23%',
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
  },
  posIconText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.text,
    lineHeight: 24,
    textAlign: 'center',
    includeFontPadding: false,
  },
  posIconTextActive: {
    color: theme.primary,
  },
  posLabelText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.textMuted,
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: 4,
  },
  posLabelTextActive: {
    color: theme.primary,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  levelBtn: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12
  },
  levelText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
    textTransform: 'uppercase'
  },
  levelTextActive: {
    color: theme.primary
  },
  toggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    padding: 20,
    borderRadius: 12,
    marginBottom: 48
  },
  toggleTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
    textTransform: 'uppercase'
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 4
  },
  actionContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 24
  },
  actionBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8
  },
  actionBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border
  },
  modalTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    marginBottom: 16
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle
  },
  modalItemText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: theme.text
  },
  modalCloseBtn: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalCloseText: {
    color: theme.textMuted,
    fontFamily: Fonts.headlineBold
  }
});
