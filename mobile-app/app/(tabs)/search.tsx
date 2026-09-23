import React, { useState, useEffect, useMemo } from 'react';
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
import Slider from '@react-native-community/slider';

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

const TURKISH_MONTHS_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];
const TURKISH_DAYS_NAMES = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

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
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const [pos, setPos] = useState('KL');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxRating, setMaxRating] = useState<number>(10);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['0-3.9']);
  const [difficulty, setDifficulty] = useState('Eğlence');
  const [selectedTimeFrames, setSelectedTimeFrames] = useState<string[]>([]);
  const [reservationStatus, setReservationStatus] = useState<'all' | 'reserved' | 'no_reservation'>('all');
  const [playerStatus, setPlayerStatus] = useState<'all' | 'looking'>('looking');
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const toggleLevel = (lv: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(lv)) {
        return prev.filter(item => item !== lv);
      } else {
        return [...prev, lv];
      }
    });
  };

  const toggleTimeFrame = (tf: string) => {
    if (tf === 'Tümü') {
      setSelectedTimeFrames([]);
      return;
    }
    setSelectedTimeFrames(prev => {
      if (prev.includes(tf)) {
        return prev.filter(item => item !== tf);
      } else {
        return [...prev, tf];
      }
    });
  };

  // Önümüzdeki 30 günün tarih seçenekleri
  const upcomingDateOptions = useMemo(() => {
    const list: { date: Date; label: string; fullLabel: string; isWeekend: boolean; tag?: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const day = d.getDate();
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const month = TURKISH_MONTHS_NAMES[d.getMonth()];
      const dayName = TURKISH_DAYS_NAMES[dayOfWeek];
      const tag = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : isWeekend ? 'Hafta Sonu' : undefined;
      list.push({
        date: d,
        label: `${day} ${month}`,
        fullLabel: `${day} ${month}, ${dayName}`,
        isWeekend,
        tag
      });
    }
    return list;
  }, []);

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
          if (parsed.minRating !== undefined) {
            setMinRating(Number(parsed.minRating));
          } else if (parsed.selectedLevels && Array.isArray(parsed.selectedLevels)) {
            setSelectedLevels(parsed.selectedLevels);
            if (parsed.selectedLevels.includes('8.0+')) setMinRating(8.0);
            else if (parsed.selectedLevels.includes('6.0-7.9')) setMinRating(6.0);
            else if (parsed.selectedLevels.includes('4.0-5.9')) setMinRating(4.0);
          } else if (parsed.level) {
            const num = parseFloat(parsed.level);
            if (!isNaN(num)) setMinRating(num);
          }
          if (parsed.maxRating !== undefined) {
            setMaxRating(Number(parsed.maxRating));
          }
          if (parsed.difficulty) setDifficulty(parsed.difficulty);
          if (parsed.timeFrames && Array.isArray(parsed.timeFrames)) {
            setSelectedTimeFrames(parsed.timeFrames);
          } else if (parsed.timeFrame && parsed.timeFrame !== 'Tümü') {
            setSelectedTimeFrames(parsed.timeFrame.split(',').map((s: string) => s.trim()).filter(Boolean));
          }
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
        minRating,
        maxRating,
        level: minRating > 0 ? `${minRating.toFixed(1)}+` : undefined,
        difficulty,
        timeFrames: selectedTimeFrames,
        timeFrame: selectedTimeFrames.join(','),
      })).catch((e) => { console.error('AsyncStorage error:', e); });
    }

    router.push({
      pathname: '/results',
      params: { 
        tab: activeTab, 
        pos: pos, 
        difficulty: difficulty, 
        level: minRating > 0 ? `${minRating.toFixed(1)}+` : undefined, 
        minRating: minRating > 0 ? minRating.toString() : undefined,
        maxRating: maxRating < 10 ? maxRating.toString() : undefined,
        city: selectedCity, 
        district: selectedDistrict,
        arena: selectedPitch !== 'Tüm Sahalar' ? selectedPitch : undefined,
        timeFrame: selectedTimeFrames.length > 0 ? selectedTimeFrames.join(',') : undefined,
        reservationStatus: (activeTab === 'Maç' || activeTab === 'Rakip') && reservationStatus !== 'all' ? reservationStatus : undefined,
        playerStatus: activeTab === 'Oyuncu' ? playerStatus : undefined,
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
            setMinRating(0);
            setMaxRating(10);
            setSelectedLevels([]);
            setDifficulty('Eğlence');
            setSelectedTimeFrames([]);
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

        {/* Location Filters - Compact Layout */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>KONUM FİLTRELERİ</Text>
          <View style={styles.locationRow}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, { flex: 1 }]} 
              onPress={() => setCityModalVisible(true)} 
              accessibilityLabel="Şehir Seç" 
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownLabel}>Şehir</Text>
                <Text style={styles.dropdownValue} numberOfLines={1}>{selectedCity}</Text>
              </View>
              <MaterialIcons name="expand-more" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownBtn, { flex: 1 }]} 
              onPress={() => setDistrictModalVisible(true)} 
              accessibilityLabel="İlçe Seç" 
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownLabel}>İlçe</Text>
                <Text style={styles.dropdownValue} numberOfLines={1}>{selectedDistrict}</Text>
              </View>
              <MaterialIcons name="expand-more" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

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
              <MaterialIcons name="expand-more" size={20} color={theme.primary} />
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

            {/* 1. Tarih / Zaman Filtresi (Maç, Oyuncu ve Rakip - TÜMÜ) */}
            <View style={styles.sectionBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'Maç' ? 'MAÇ ZAMANI' : activeTab === 'Oyuncu' ? 'OYUNCU İÇİN GÜN / ZAMAN' : 'MAÇ GÜNÜ / ZAMAN'}
                </Text>
                {selectedTimeFrames.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedTimeFrames([])}>
                    <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary }}>Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.levelGrid}>
                {['Tümü', 'Bugün', 'Yarın'].map((tf) => {
                  const active = tf === 'Tümü' ? selectedTimeFrames.length === 0 : selectedTimeFrames.includes(tf);
                  return (
                    <TouchableOpacity
                      key={tf}
                      style={levelBtnStyle(active)}
                      onPress={() => toggleTimeFrame(tf)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.levelText, active && styles.levelTextActive]}>{tf}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* 4. Buton: Tarih Seçici */}
                {(() => {
                  const customDates = selectedTimeFrames.filter(tf => tf !== 'Bugün' && tf !== 'Yarın');
                  const isCustomDate = customDates.length > 0;
                  const label = customDates.length === 1 
                    ? customDates[0].toUpperCase() 
                    : customDates.length > 1 
                      ? `${customDates.length} TARİH` 
                      : 'TARİH SEÇ';
                  return (
                    <TouchableOpacity
                      style={[
                        levelBtnStyle(isCustomDate),
                        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }
                      ]}
                      onPress={() => setDateModalVisible(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isCustomDate }}
                    >
                      <MaterialIcons 
                        name="calendar-today" 
                        size={14} 
                        color={isCustomDate ? theme.primary : theme.textMuted} 
                      />
                      <Text 
                        style={[
                          styles.levelText, 
                          isCustomDate && styles.levelTextActive,
                          { fontSize: isCustomDate ? 11 : 13 }
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>

            {/* 2. Rezervasyon Durumu Filtresi (Maç & Rakip) */}
            {(activeTab === 'Maç' || activeTab === 'Rakip') && (
              <View style={styles.sectionBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>REZERVASYON DURUMU</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted }}>
                    {activeTab === 'Rakip' ? 'Sahası olan rakipleri bul' : 'Saha durumuna göre filtrele'}
                  </Text>
                </View>
                <View style={styles.levelGrid}>
                  {[
                    { key: 'all', label: 'TÜMÜ' },
                    { key: 'reserved', label: 'SAHASI HAZIR' },
                    { key: 'no_reservation', label: 'SAHA ARANIYOR' },
                  ].map((item) => {
                    const active = reservationStatus === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.levelBtn,
                          { flex: item.key === 'all' ? 0.9 : 1.3 },
                          {
                            borderColor: active
                              ? (item.key === 'reserved' ? '#22c55e' : item.key === 'no_reservation' ? '#f59e0b' : theme.primary)
                              : theme.borderSubtle,
                            backgroundColor: active
                              ? (item.key === 'reserved' ? 'rgba(34,197,94,0.15)' : item.key === 'no_reservation' ? 'rgba(245,158,11,0.15)' : `${theme.primary}15`)
                              : theme.surfaceContainerHighest
                          }
                        ]}
                        onPress={() => setReservationStatus(item.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.levelText, 
                          active && {
                            color: item.key === 'reserved' ? '#22c55e' : item.key === 'no_reservation' ? '#f59e0b' : theme.primary,
                            fontFamily: Fonts.headlineBold
                          }
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Oyuncu Durumu Filtresi (Oyuncu Sekmesi) */}
            {activeTab === 'Oyuncu' && (
              <View style={styles.sectionBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>OYUNCU DURUMU</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted }}>
                    {playerStatus === 'looking' ? 'Bugün/yarın oynamak isteyenler' : 'Tüm oyuncular'}
                  </Text>
                </View>
                <View style={styles.levelGrid}>
                  {[
                    { key: 'looking', label: '🟢 MAÇ ARAYANLAR' },
                    { key: 'all', label: 'TÜM OYUNCULAR' },
                  ].map((item) => {
                    const active = playerStatus === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.levelBtn,
                          { flex: 1 },
                          {
                            borderColor: active ? (item.key === 'looking' ? '#22c55e' : theme.primary) : theme.borderSubtle,
                            backgroundColor: active ? (item.key === 'looking' ? 'rgba(34,197,94,0.15)' : `${theme.primary}15`) : theme.surfaceContainerHighest
                          }
                        ]}
                        onPress={() => setPlayerStatus(item.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.levelText, 
                          active && { color: item.key === 'looking' ? '#22c55e' : theme.primary, fontFamily: Fonts.headlineBold }
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Level filter for Oyuncu tab (Min - Max Puan Aralığı) */}
            {activeTab === 'Oyuncu' && (
              <View style={styles.sectionBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>OYUNCU PUAN ARALIĞI</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      {minRating === 0 && maxRating === 10
                        ? 'Tüm Puanlar (0.0 - 10.0)'
                        : `${minRating.toFixed(1)} - ${maxRating.toFixed(1)} Puan`}
                    </Text>
                  </View>
                </View>

                {/* Min Slider */}
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.textMuted }}>EN DÜŞÜK PUAN (MİN)</Text>
                    <View style={styles.sliderCurrentPill}>
                      <MaterialIcons name="star" size={12} color={theme.background} />
                      <Text style={styles.sliderCurrentText}>{minRating.toFixed(1)} ★</Text>
                    </View>
                  </View>
                  <Slider
                    style={styles.sliderBar}
                    minimumValue={0}
                    maximumValue={10}
                    step={0.5}
                    value={minRating}
                    onValueChange={(val) => {
                      const rounded = Math.round(val * 10) / 10;
                      setMinRating(Math.min(rounded, maxRating));
                    }}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.surfaceContainerHighest}
                    thumbTintColor={theme.primary}
                  />
                  <View style={styles.sliderLabelsRow}>
                    <Text style={styles.sliderMinMaxText}>0.0 (Taban)</Text>
                    <Text style={styles.sliderMinMaxText}>10.0</Text>
                  </View>
                </View>

                {/* Max Slider */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.textMuted }}>EN YÜKSEK PUAN (MAX)</Text>
                    <View style={[styles.sliderCurrentPill, { backgroundColor: theme.secondary }]}>
                      <MaterialIcons name="star" size={12} color={theme.background} />
                      <Text style={styles.sliderCurrentText}>{maxRating.toFixed(1)} ★</Text>
                    </View>
                  </View>
                  <Slider
                    style={styles.sliderBar}
                    minimumValue={0}
                    maximumValue={10}
                    step={0.5}
                    value={maxRating}
                    onValueChange={(val) => {
                      const rounded = Math.round(val * 10) / 10;
                      setMaxRating(Math.max(rounded, minRating));
                    }}
                    minimumTrackTintColor={theme.secondary}
                    maximumTrackTintColor={theme.surfaceContainerHighest}
                    thumbTintColor={theme.secondary}
                  />
                  <View style={styles.sliderLabelsRow}>
                    <Text style={styles.sliderMinMaxText}>0.0</Text>
                    <Text style={styles.sliderMinMaxText}>10.0 (Tavan)</Text>
                  </View>
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

      {/* Date Picker Modal with backdrop tap dismissal */}
      {dateModalVisible && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { maxHeight: 500, paddingBottom: 16 }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>MAÇ TARİHİ SEÇİN (ÇOKLU SEÇİM)</Text>
                <Text style={styles.modalSubtitle}>
                  Birden fazla gün seçebilirsiniz
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setDateModalVisible(false)} 
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Kapat"
              >
                <MaterialIcons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Option: Bu Hafta Sonu */}
            <TouchableOpacity 
              style={[
                styles.modalQuickOption,
                selectedTimeFrames.includes('Bu Hafta Sonu') && { borderColor: theme.primary, backgroundColor: `${theme.primary}18` }
              ]}
              onPress={() => toggleTimeFrame('Bu Hafta Sonu')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.modalDateIconBox, selectedTimeFrames.includes('Bu Hafta Sonu') && { backgroundColor: `${theme.primary}33` }]}>
                  <MaterialIcons name="weekend" size={18} color={selectedTimeFrames.includes('Bu Hafta Sonu') ? theme.primary : theme.textMuted} />
                </View>
                <View>
                  <Text style={[styles.modalItemText, selectedTimeFrames.includes('Bu Hafta Sonu') && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                    Bu Hafta Sonu
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted }}>
                    Cumartesi ve Pazar maçlarını filtreler
                  </Text>
                </View>
              </View>
              {selectedTimeFrames.includes('Bu Hafta Sonu') && (
                <MaterialIcons name="check-box" size={22} color={theme.primary} />
              )}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 290, marginTop: 4 }}>
              {upcomingDateOptions.map((item) => {
                const isSelected = selectedTimeFrames.includes(item.label);
                return (
                  <TouchableOpacity 
                    key={item.label}
                    style={[styles.modalDateItem, isSelected && { borderColor: theme.primary, backgroundColor: `${theme.primary}12` }]}
                    onPress={() => toggleTimeFrame(item.label)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.modalDateNumberBox, isSelected && { borderColor: theme.primary, backgroundColor: `${theme.primary}25` }]}>
                        <Text style={[styles.modalDateNumberText, isSelected && { color: theme.primary }]}>
                          {item.date.getDate()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.modalDateTitle, isSelected && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                          {item.fullLabel}
                        </Text>
                        {item.tag && (
                          <View style={[styles.modalTagBadge, { backgroundColor: isSelected ? `${theme.primary}30` : theme.surfaceContainerHighest }]}>
                            <Text style={[styles.modalTagText, { color: isSelected ? theme.primary : theme.textMuted }]}>
                              {item.tag}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <MaterialIcons 
                      name={isSelected ? "check-box" : "check-box-outline-blank"} 
                      size={22} 
                      color={isSelected ? theme.primary : theme.textMuted} 
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.modalCloseBtn, 
                selectedTimeFrames.length > 0 && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setDateModalVisible(false)}
            >
              <Text style={[
                styles.modalCloseText, 
                selectedTimeFrames.length > 0 && { color: theme.background, fontFamily: Fonts.headlineBold }
              ]}>
                {selectedTimeFrames.length > 0 ? `UYGULA (${selectedTimeFrames.length} GÜN SEÇİLDİ)` : 'KAPAT'}
              </Text>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 85
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  segmentBtnActive: {
    backgroundColor: theme.primary
  },
  segmentText: {
    fontFamily: Fonts.label,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500'
  },
  segmentTextActive: {
    color: theme.onPrimary,
    fontFamily: Fonts.headlineBold
  },
  sectionBox: {
    marginBottom: 16,
    gap: 8
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  dropdownLabel: {
    fontFamily: Fonts.label,
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: -0.5
  },
  dropdownValue: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 1
  },
  posGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  posBtn: {
    width: '23%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 4,
  },
  posIconText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.text,
    lineHeight: 22,
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
    marginTop: 2,
  },
  posLabelTextActive: {
    color: theme.primary,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  levelBtn: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12
  },
  levelText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  levelTextActive: {
    color: theme.primary
  },
  sliderContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sliderBar: {
    width: '100%',
    height: 40,
  },
  ratingBadge: {
    backgroundColor: `${theme.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
  },
  ratingBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sliderMinMaxText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.textMuted,
  },
  sliderCurrentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sliderCurrentText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.background,
  },
  toggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32
  },
  toggleTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
    textTransform: 'uppercase'
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 2
  },
  actionContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16
  },
  actionBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  modalQuickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.surfaceContainerHighest,
    marginBottom: 8,
  },
  modalDateIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 6,
    backgroundColor: theme.surface,
  },
  modalDateNumberBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDateNumberText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
  },
  modalDateTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.text,
  },
  modalTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  modalTagText: {
    fontFamily: Fonts.label,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
