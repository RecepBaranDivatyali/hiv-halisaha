import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, TextInput, Alert, Switch, FlatList,
  Platform, ActivityIndicator,
} from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { PITCH_DATABASE, PitchDatabaseItem } from '@/config/pitches';
import { PitchDetailModal } from './PitchDetailModal';

export interface NewMatchData {
  id: string;
  city: string;
  district?: string;
  arena: string;
  pitchSubCode: string;
  dateStr: string;
  timeSlot: string;
  dateTime: string;
  mode: string;
  totalFee: number;
  fee: number;
  isSubscription: boolean;
  searchForPlayers?: boolean;
  positions: { [key: string]: number };
  isGkFree?: boolean;
  organizerIban?: string;
  organizerIbanName?: string;
  organizerBankName?: string;
  matchFormatType?: 'single_organizer' | 'two_captains';
  hasReservation?: boolean;
  isPitchFlexible?: boolean;
  isTimeFlexible?: boolean;
  preferredPitch?: string;
  preferredTimeSlot?: string;
}

interface CreateMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (matchData: NewMatchData) => void;
}

const CITIES = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya'];

// Ara dakikalar
const OFFSET_MINUTES = [15, 30, 45];

const POPULAR_MODES = ['7v7', '6v6', '8v8'];
const OTHER_MODES = ['5v5', '9v9', '10v10', '11v11'];

const formatTimeSlot = (h: number, m: number): string => {
  const startH = h;
  const startM = m;
  const totalMins = startH * 60 + startM + 60;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;
};

const formatDateTR = (date: Date): string => {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const { addMatch } = useMatches();

  // ── Şehir ──────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(user?.city || 'İstanbul');
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  // ── Halısaha Picker ──────────────────────────────────────────────
  const [pitchPickerOpen, setPitchPickerOpen] = useState(false);
  const [pitchSearch, setPitchSearch] = useState('');
  const cityPitches = useMemo(
    () => PITCH_DATABASE.filter(p => p.city === selectedCity),
    [selectedCity]
  );
  const filteredPitches = useMemo(() => {
    if (!pitchSearch.trim()) return cityPitches;
    const q = pitchSearch.toLowerCase();
    return PITCH_DATABASE.filter(
      p => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    );
  }, [cityPitches, pitchSearch]);

  const [selectedPitch, setSelectedPitch] = useState<PitchDatabaseItem>(() => {
    const initialCity = user?.city || 'İstanbul';
    return PITCH_DATABASE.find(p => p.city === initialCity) || PITCH_DATABASE[0];
  });
  const [selectedSubField, setSelectedSubField] = useState(
    selectedPitch.subFields[0]?.name || 'Tek Saha'
  );

  // ── Saha & Rezervasyon Esnekliği ──
  const [isPitchFlexible, setIsPitchFlexible] = useState(false);
  const [hasReservation, setHasReservation] = useState(true);
  const [preferredDistrict, setPreferredDistrict] = useState(user?.district || 'Çankaya');
  const [isTimeFlexible, setIsTimeFlexible] = useState(false);

  const handleSelectCity = (c: string) => {
    setSelectedCity(c);
    setCitySelectorOpen(false);
    const firstPitch = PITCH_DATABASE.find(p => p.city === c);
    if (firstPitch) {
      setSelectedPitch(firstPitch);
      setPreferredDistrict(firstPitch.district);
      setSelectedSubField(firstPitch.subFields[0]?.name || 'Tek Saha');
    }
  };

  // ── Tarih ──────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Yaklaşan 21 gün listesi
  const upcomingDates = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // ── Kaleci Ücretsiz (Muaf) ──────────────────────────────
  const [isGkFree, setIsGkFree] = useState(false);

  // ── Saat ──────────────────────────────────────────────
  const [pitchDetailModalOpen, setPitchDetailModalOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [showOffsetTimes, setShowOffsetTimes] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('21:00 - 22:00');

  // Seçili alt saha objesi
  const currentSubFieldObj = useMemo(() => {
    return selectedPitch?.subFields.find(s => s.name === selectedSubField) || selectedPitch?.subFields[0];
  }, [selectedPitch, selectedSubField]);

  // Alt sahaya göre dinamik saat listesi ve popüler saatler (son saat kısıtlaması dahil)
  const { allTimeSlots, popularSlots } = useMemo(() => {
    const isHalf = currentSubFieldObj?.slotType === 'half';
    const lastSlotStr = currentSubFieldObj?.lastSlot; // örn: "20:30-21:30" veya "21:00-22:00"

    let maxStartH = 23;
    let maxStartM = 0;
    if (lastSlotStr) {
      const parts = lastSlotStr.split('-')[0].trim();
      const [h, m] = parts.split(':').map(Number);
      if (!isNaN(h)) {
        maxStartH = h;
        maxStartM = m || 0;
      }
    }

    const slots: string[] = [];
    const startH = 10;
    for (let h = startH; h <= maxStartH; h++) {
      const m = isHalf ? 30 : 0;
      if (h === maxStartH && m > maxStartM) continue;
      slots.push(formatTimeSlot(h, m));
      if (showOffsetTimes && !isHalf) {
        OFFSET_MINUTES.forEach(offM => {
          if (h === maxStartH && offM > maxStartM) return;
          slots.push(formatTimeSlot(h, offM));
        });
      }
    }

    // Popüler saatler
    let pops: string[] = [];
    if (isHalf) {
      pops = ['18:30 - 19:30', '19:30 - 20:30', '20:30 - 21:30'].filter(s => slots.includes(s));
      if (pops.length === 0) pops = slots.slice(-3);
    } else {
      pops = ['19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'].filter(s => slots.includes(s));
      if (pops.length === 0) pops = slots.slice(-3);
    }

    return { allTimeSlots: slots, popularSlots: pops };
  }, [currentSubFieldObj, showOffsetTimes]);

  // Alt saha değiştiğinde geçerli saat ayarı
  React.useEffect(() => {
    if (allTimeSlots.length > 0 && !allTimeSlots.includes(selectedTimeSlot) && !isTimeFlexible) {
      const fallback = popularSlots[popularSlots.length - 1] || allTimeSlots[allTimeSlots.length - 1];
      if (fallback) setSelectedTimeSlot(fallback);
    }
  }, [allTimeSlots, selectedTimeSlot, popularSlots, isTimeFlexible]);

  // Rezervasyon var ise "Saat Esnek" iptal edilsin
  React.useEffect(() => {
    if (hasReservation && isTimeFlexible) {
      setIsTimeFlexible(false);
      const fallback = popularSlots[popularSlots.length - 1] || allTimeSlots[allTimeSlots.length - 1] || '20:00 - 21:00';
      setSelectedTimeSlot(fallback);
    }
  }, [hasReservation, isTimeFlexible, popularSlots, allTimeSlots]);

  // ── Maç Formatı ──────────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState('7v7');
  const [showAllModes, setShowAllModes] = useState(false);
  const [matchFormatType, setMatchFormatType] = useState<'single_organizer' | 'two_captains'>('single_organizer');

  // ── Format Uygunluk Kontrolü (Sarı & Kırmızı Uyarı) ──
  const formatWarning = useMemo(() => {
    if (isPitchFlexible || !selectedPitch) return null;
    const optimal = selectedPitch.optimalModes || ['7v7'];
    const tight = selectedPitch.tightModes || ['8v8'];

    if (optimal.includes(selectedMode)) {
      return null;
    }

    if (tight.includes(selectedMode)) {
      return {
        level: 'yellow' as const,
        text: `⚠️ Dikkat: Bu saha ${selectedMode} için dar olabilir. Oyun biraz sıkışık geçebilir. (İdeal format: ${optimal.join(', ')})`
      };
    }

    const selCount = parseInt(selectedMode.split('v')[0], 10) || 7;
    const allSupported = [...optimal, ...tight];
    const maxSupported = Math.max(...allSupported.map(m => parseInt(m.split('v')[0], 10) || 7));

    if (selCount > maxSupported) {
      return {
        level: 'red' as const,
        text: `🚫 Kritik Uyarı: Bu saha ${selectedMode} formatı için kesinlikle uygun değildir! Saha boyutları bu oyuncu sayısını kaldıramaz. (Maksimum oynanabilen: ${allSupported.join(', ')})`
      };
    }

    return null;
  }, [isPitchFlexible, selectedPitch, selectedMode]);

  // ── Ücret ──────────────────────────────────────────────
  const [totalFeeInput, setTotalFeeInput] = useState(
    selectedPitch?.hourlyFee ? String(selectedPitch.hourlyFee) : '2100'
  );

  // ── Kaptan IBAN ──────────────────────────────────────────
  const [organizerIban, setOrganizerIban] = useState(user?.iban || '');
  const [organizerIbanName, setOrganizerIbanName] = useState(user?.ibanName || user?.name || '');
  const [organizerBankName, setOrganizerBankName] = useState(user?.bankName || '');
  const [showIbanInput, setShowIbanInput] = useState(Boolean(user?.iban));

  React.useEffect(() => {
    if (visible && user) {
      if (user.iban) {
        setOrganizerIban(user.iban);
        setShowIbanInput(true);
      }
      if (user.ibanName || user.name) {
        setOrganizerIbanName(user.ibanName || user.name || '');
      }
      if (user.bankName) {
        setOrganizerBankName(user.bankName);
      }
    }
  }, [visible, user]);

  // ── Abonelik ──────────────────────────────────────────────
  const [isSubscription, setIsSubscription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Hesaplama ──────────────────────────────────────────────
  const getPlayerCount = (mode: string) => {
    const n = parseInt(mode.split('v')[0], 10) || 7;
    return n * 2;
  };
  const totalPlayersCount = getPlayerCount(selectedMode);
  const totalFeeNum = parseInt(totalFeeInput, 10) || 0;
  // 2 kaleci (her iki takımdan 1 kaleci) ücretten muaf
  const payingPlayersCount = isGkFree ? Math.max(1, totalPlayersCount - 2) : totalPlayersCount;
  const perPlayerFee = payingPlayersCount > 0 ? Math.round(totalFeeNum / payingPlayersCount) : 0;

  // ── Handlers ──────────────────────────────────────────────
  const handlePitchSelect = (pitch: PitchDatabaseItem) => {
    setSelectedPitch(pitch);
    setSelectedCity(pitch.city); // Sync city!
    setPreferredDistrict(pitch.district);
    setSelectedSubField(pitch.subFields[0]?.name || 'Tek Saha');
    setPitchPickerOpen(false);
    setPitchSearch('');
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };
  const isTomorrow = (d: Date) => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const dateLabelShort = isToday(selectedDate) ? 'Bugün' : isTomorrow(selectedDate) ? 'Yarın' : null;
  const dateDisplayText = dateLabelShort
    ? `${dateLabelShort} — ${formatDateTR(selectedDate)}`
    : formatDateTR(selectedDate);

  const handleCreate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const dateStr = formatDateTR(selectedDate);
    const targetDistrict = isPitchFlexible 
      ? (selectedPitch?.district || preferredDistrict || 'Merkez')
      : selectedPitch.district;

    let fullArenaName = '';
    if (isPitchFlexible) {
      fullArenaName = selectedPitch?.name 
        ? `${selectedPitch.name} (Saha Aranıyor)`
        : `Saha Aranıyor (${targetDistrict})`;
    } else {
      fullArenaName = `${selectedPitch.name} — ${selectedSubField}`;
    }

    const timeSlotStr = isTimeFlexible ? 'Saat Esnek' : selectedTimeSlot;
    const fullDateTime = `${dateStr}, ${timeSlotStr}`;

    const newMatch: NewMatchData = {
      id: Date.now().toString(),
      city: selectedCity,
      district: targetDistrict,
      arena: fullArenaName,
      pitchSubCode: isPitchFlexible ? 'Esnek' : selectedSubField,
      dateStr,
      timeSlot: timeSlotStr,
      dateTime: fullDateTime,
      mode: selectedMode,
      totalFee: totalFeeNum,
      fee: perPlayerFee,
      isSubscription,
      isGkFree,
      matchFormatType,
      hasReservation: isPitchFlexible ? false : hasReservation,
      isPitchFlexible,
      isTimeFlexible,
      preferredPitch: selectedPitch?.name,
      preferredTimeSlot: isTimeFlexible ? undefined : selectedTimeSlot,
      organizerIban: showIbanInput && organizerIban ? organizerIban.trim() : undefined,
      organizerIbanName: showIbanInput && organizerIbanName ? organizerIbanName.trim() : undefined,
      organizerBankName: showIbanInput && organizerBankName ? organizerBankName.trim() : undefined,
      positions: { KL: 1, DF: 2, OS: 2, FV: 1 },
    };

    try {
      const created = await addMatch(newMatch as any, user);
      onClose();
      if (onSuccess) {
        onSuccess((created || newMatch) as any);
      }
    } catch (err) {
      console.error('Maç oluşturma hatası:', err);
      Alert.alert('Hata', 'Maç oluşturulurken bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="sports-soccer" size={24} color={theme.primary} />
              <View>
                <Text style={styles.headerTitle}>MAÇ İLANI OLUŞTUR</Text>
                <TouchableOpacity style={styles.cityMiniTag} onPress={() => setCitySelectorOpen(!citySelectorOpen)}>
                  <MaterialIcons name="location-on" size={12} color={theme.primary} />
                  <Text style={styles.cityMiniTagText}>{selectedCity} (Şehir Değiştir)</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* ── ŞEHİR SEÇİCİ ── */}
          {citySelectorOpen && (
            <View style={styles.cityBox}>
              <Text style={styles.cityBoxTitle}>ŞEHİR SEÇİN</Text>
              <View style={styles.cityRow}>
                {CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
                    onPress={() => handleSelectCity(c)}
                  >
                    <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

            {/* ── 1. HALISAHA VE REZERVASYON SEÇİMİ ── */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.label}>HALISAHA TESİSİ</Text>
                <View style={styles.pitchModeTabs}>
                  <TouchableOpacity
                    style={[styles.pitchModeTab, !isPitchFlexible && styles.pitchModeTabActive]}
                    onPress={() => setIsPitchFlexible(false)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="stadium" size={13} color={!isPitchFlexible ? theme.onPrimary : theme.textMuted} />
                    <Text style={[styles.pitchModeTabText, !isPitchFlexible && styles.pitchModeTabTextActive]}>Saha Belirli</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pitchModeTab, isPitchFlexible && styles.pitchModeTabActiveWarning]}
                    onPress={() => { setIsPitchFlexible(true); setHasReservation(false); }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="location-searching" size={13} color={isPitchFlexible ? '#ffffff' : theme.textMuted} />
                    <Text style={[styles.pitchModeTabText, isPitchFlexible && { color: '#ffffff', fontFamily: Fonts.headlineBold }]}>Saha Aranıyor</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!isPitchFlexible ? (
                <>
                  {/* Seçili tesis kutusu + değiştir butonu */}
                  <View style={styles.pitchSelectedBox}>
                    <TouchableOpacity 
                      style={styles.pitchSelectedLeft} 
                      onPress={() => setPitchDetailModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="stadium" size={22} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.pitchSelectedName}>{selectedPitch.name}</Text>
                          <MaterialIcons name="info-outline" size={14} color={theme.primary} />
                        </View>
                        <Text style={styles.pitchSelectedDistrict}>
                          {selectedPitch.district}  •  ★ {selectedPitch.rating}  •  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Detay & Bilgi</Text>
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.changeBadge} 
                      onPress={() => setPitchPickerOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.changeBadgeText}>Değiştir</Text>
                      <MaterialIcons name="keyboard-arrow-down" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Alt Saha Seçimi */}
                  {selectedPitch.subFields.length > 0 && (
                    <View>
                      <Text style={styles.subLabel}>SAHA / PARÇA</Text>
                      <View style={styles.subFieldRow}>
                        {selectedPitch.subFields.map(sub => (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.subFieldChip, selectedSubField === sub.name && styles.subFieldChipActive]}
                            onPress={() => setSelectedSubField(sub.name)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.subFieldText, selectedSubField === sub.name && styles.subFieldTextActive]}>
                              {sub.name}
                            </Text>
                            <Text style={[styles.subFieldSurface, selectedSubField === sub.name && { color: theme.primary }]}>
                              {sub.surface}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Rezervasyon Durumu Seçici */}
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.subLabel}>HALISAHA REZERVASYONU ALINDI MI?</Text>
                    <View style={styles.resStatusRow}>
                      <TouchableOpacity
                        style={[styles.resStatusCard, hasReservation && styles.resStatusCardActiveSuccess]}
                        onPress={() => setHasReservation(true)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.resStatusCardTop}>
                          <MaterialIcons name="verified" size={18} color={hasReservation ? '#22c55e' : theme.textMuted} />
                          <Text style={[styles.resStatusCardTitle, hasReservation && { color: '#22c55e' }]}>
                            Rezervasyon Var
                          </Text>
                        </View>
                        <Text style={styles.resStatusCardSub}>Saha tutuldu, maç kesin (Saha Hazır)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.resStatusCard, !hasReservation && styles.resStatusCardActiveWarning]}
                        onPress={() => setHasReservation(false)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.resStatusCardTop}>
                          <MaterialIcons name="hourglass-empty" size={18} color={!hasReservation ? '#f59e0b' : theme.textMuted} />
                          <Text style={[styles.resStatusCardTitle, !hasReservation && { color: '#f59e0b' }]}>
                            Henüz Alınmadı
                          </Text>
                        </View>
                        <Text style={styles.resStatusCardSub}>Saha aranıyor / Rezerve rakip aranıyor</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                /* Saha Aranıyor Modu */
                <View style={styles.flexiblePitchCard}>
                  <View style={styles.flexiblePitchHeader}>
                    <MaterialIcons name="not-listed-location" size={24} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flexiblePitchTitle}>Saha Henüz Belirlenmedi (Saha Aranıyor)</Text>
                      <Text style={styles.flexiblePitchDesc}>
                        Maç ilanınızda &apos;Saha Aranıyor&apos; olarak gösterilir. Rezervasyonu hazır olan rakipler ve oyuncular size teklif gönderebilir.
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.flexibleTargetPitchBox} 
                    onPress={() => setPitchPickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="place" size={18} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flexibleTargetPitchLabel}>Hedef Tesis / Bölge Tercihi:</Text>
                      <Text style={styles.flexibleTargetPitchValue}>
                        {selectedPitch ? `${selectedPitch.name} (${selectedPitch.district})` : `${selectedCity} / ${preferredDistrict}`}
                      </Text>
                    </View>
                    <Text style={styles.flexibleChangeText}>Değiştir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── 2. TARİH SEÇİMİ ── */}
            <View style={styles.section}>
              <Text style={styles.label}>MAÇ TARİHİ</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateQuickChip, isToday(selectedDate) && styles.dateQuickChipActive]}
                  onPress={() => setSelectedDate(new Date())}
                >
                  <Text style={[styles.dateQuickText, isToday(selectedDate) && styles.dateQuickTextActive]}>Bugün</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateQuickChip, isTomorrow(selectedDate) && styles.dateQuickChipActive]}
                  onPress={() => { const d = new Date(); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                >
                  <Text style={[styles.dateQuickText, isTomorrow(selectedDate) && styles.dateQuickTextActive]}>Yarın</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerBtn, !isToday(selectedDate) && !isTomorrow(selectedDate) && styles.datePickerBtnActive]}
                  onPress={() => setDatePickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="calendar-today" size={15} color={!isToday(selectedDate) && !isTomorrow(selectedDate) ? theme.background : theme.primary} />
                  <Text style={[styles.datePickerBtnText, !isToday(selectedDate) && !isTomorrow(selectedDate) && { color: theme.background }]}>
                    Tarih Seç
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Seçili tarih göstergesi */}
              <View style={styles.dateDisplayBox}>
                <MaterialIcons name="event" size={16} color={theme.primary} />
                <Text style={styles.dateDisplayText}>{dateDisplayText}</Text>
              </View>
            </View>

            {/* ── 3. SAAT SEÇİMİ ── */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.label}>MAÇ SAATİ</Text>
                {isTimeFlexible && (
                  <View style={styles.timeFlexibleBadge}>
                    <MaterialIcons name="schedule" size={12} color="#38bdf8" />
                    <Text style={styles.timeFlexibleBadgeText}>Saat Esnek</Text>
                  </View>
                )}
              </View>

              {/* Popüler saatler + Saat Esnek + Seç butonu */}
              <View style={styles.timeTopRow}>
                {popularSlots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timePopChip, !isTimeFlexible && selectedTimeSlot === slot && styles.timePopChipActive]}
                    onPress={() => { setIsTimeFlexible(false); setSelectedTimeSlot(slot); }}
                  >
                    <Text style={[styles.timePopText, !isTimeFlexible && selectedTimeSlot === slot && styles.timePopTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                ))}

                {!hasReservation && (
                  <TouchableOpacity
                    style={[styles.timePopChip, isTimeFlexible && styles.timePopChipActiveFlexible]}
                    onPress={() => {
                      setIsTimeFlexible(true);
                      setSelectedTimeSlot('Saat Esnek');
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="all-inclusive" size={14} color={isTimeFlexible ? '#0284c7' : theme.textMuted} />
                    <Text style={[styles.timePopText, isTimeFlexible && { color: '#0284c7', fontFamily: Fonts.headlineBold }]}>
                      Saat Esnek
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.timePickerBtn} onPress={() => setTimePickerOpen(true)}>
                  <MaterialIcons name="access-time" size={15} color={theme.primary} />
                  <Text style={styles.timePickerBtnText}>Tümü</Text>
                </TouchableOpacity>
              </View>

              {/* Seçili saat göstergesi */}
              {!isTimeFlexible && !popularSlots.includes(selectedTimeSlot) && (
                <View style={styles.selectedTimeBox}>
                  <MaterialIcons name="schedule" size={16} color={theme.primary} />
                  <Text style={styles.selectedTimeText}>Seçili: {selectedTimeSlot}</Text>
                </View>
              )}
            </View>

            {/* ── 4. MAÇ FORMATI ── */}
            <View style={styles.section}>
              <Text style={styles.label}>MAÇ FORMATI</Text>
              <View style={styles.modeRow}>
                {POPULAR_MODES.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, selectedMode === m && styles.modeChipActive]}
                    onPress={() => setSelectedMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeChipText, selectedMode === m && styles.modeChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.modeChip, styles.modeChipOther, showAllModes && styles.modeChipActive]}
                  onPress={() => setShowAllModes(!showAllModes)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeChipText, showAllModes && styles.modeChipTextActive]}>
                    {showAllModes ? 'Kapat ▲' : 'Diğer ▼'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAllModes && (
                <View style={styles.otherModesRow}>
                  {OTHER_MODES.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeChip, selectedMode === m && styles.modeChipActive]}
                      onPress={() => setSelectedMode(m)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.modeChipText, selectedMode === m && styles.modeChipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Saha Format Uygunluk Uyarısı (Sarı & Kırmızı) */}
              {formatWarning && (
                <View style={[styles.formatWarningBox, formatWarning.level === 'red' ? styles.formatWarningRed : styles.formatWarningYellow]}>
                  <MaterialIcons 
                    name={formatWarning.level === 'red' ? "dangerous" : "warning"} 
                    size={16} 
                    color={formatWarning.level === 'red' ? '#ef4444' : '#f59e0b'} 
                  />
                  <Text style={[styles.formatWarningText, formatWarning.level === 'red' ? styles.formatWarningTextRed : styles.formatWarningTextYellow]}>
                    {formatWarning.text}
                  </Text>
                </View>
              )}
            </View>

            {/* ── 4.5. ORGANİZASYON & KAPTANLIK MODELİ ── */}
            <View style={styles.section}>
              <Text style={styles.label}>ORGANİZASYON VE KAPTANLIK MODELİ</Text>
              <View style={styles.orgModelContainer}>
                <TouchableOpacity
                  style={[styles.orgModelCard, matchFormatType === 'single_organizer' && styles.orgModelCardActive]}
                  onPress={() => setMatchFormatType('single_organizer')}
                  activeOpacity={0.8}
                >
                  <View style={styles.orgModelHeader}>
                    <MaterialIcons 
                      name="groups" 
                      size={20} 
                      color={matchFormatType === 'single_organizer' ? theme.primary : theme.textMuted} 
                    />
                    <Text style={[styles.orgModelTitle, matchFormatType === 'single_organizer' && { color: theme.primary }]}>
                      👑 Tek Organizatör (Karma Kadro / 14 Kişi)
                    </Text>
                  </View>
                  <Text style={styles.orgModelDesc}>
                    Tüm oyuncuları ve her iki takımı tek başınıza koordine edersiniz. Karşı takımın ayrı bir kaptanı yoktur, tüm kasa doğrudan sizin sorumluluğunuzdadır.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.orgModelCard, matchFormatType === 'two_captains' && styles.orgModelCardActive]}
                  onPress={() => setMatchFormatType('two_captains')}
                  activeOpacity={0.8}
                >
                  <View style={styles.orgModelHeader}>
                    <MaterialIcons 
                      name="military-tech" 
                      size={20} 
                      color={matchFormatType === 'two_captains' ? theme.secondary : theme.textMuted} 
                    />
                    <Text style={[styles.orgModelTitle, matchFormatType === 'two_captains' && { color: theme.secondary }]}>
                      ⚔️ İki Takımlı Maç (Organizatör A vs Rakip B)
                    </Text>
                  </View>
                  <Text style={styles.orgModelDesc}>
                    A Takımı kaptanı sizsiniz. B Takımı için bir rakip kaptan belirlenebilir veya davet edilebilir. B Takımı payını rakip kaptanla koordine edebilirsiniz.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 5. TOPLAM ÜCRET ── */}
            <View style={styles.section}>
              <Text style={styles.label}>TOPLAM SAHA ÜCRETİ (₺)</Text>
              <View style={styles.feeInputWrap}>
                <Text style={styles.currencySymbol}>₺</Text>
                <TextInput
                  style={styles.feeInput}
                  keyboardType="numeric"
                  value={totalFeeInput}
                  onChangeText={setTotalFeeInput}
                  placeholder="0"
                  placeholderTextColor="#adaaaa"
                />
              </View>

              {/* Kaleciler Ödemiyor Butonu */}
              <TouchableOpacity
                style={[styles.gkFreeToggle, isGkFree && styles.gkFreeToggleActive]}
                onPress={() => setIsGkFree(!isGkFree)}
                activeOpacity={0.8}
              >
                <View style={styles.gkFreeLeft}>
                  <MaterialIcons
                    name="sports-handball"
                    size={20}
                    color={isGkFree ? theme.primary : theme.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gkFreeTitle, isGkFree && { color: theme.primary }]}>
                      🧤 Kaleciler Ödemez (Ücretsiz Kaleci)
                    </Text>
                    <Text style={styles.gkFreeSub}>
                      {isGkFree
                        ? '2 kaleci muaf • Tutar saha oyuncularına bölünür'
                        : 'Tüm oyuncular ücreti eşit paylaşır'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.gkFreeSwitch, isGkFree && styles.gkFreeSwitchActive]}>
                  <View style={[styles.gkFreeThumb, isGkFree && styles.gkFreeThumbActive]} />
                </View>
              </TouchableOpacity>

              {/* Kişi başı ücret rozeti */}
              <View style={styles.perPlayerBadge}>
                <MaterialIcons name="calculate" size={18} color={theme.primary} />
                <Text style={styles.perPlayerText}>
                  {totalFeeNum.toLocaleString('tr-TR')} ₺ ÷ {payingPlayersCount} oyuncu{' '}
                  {isGkFree && <Text style={{ color: theme.primary, fontFamily: Fonts.headlineBold }}>(2 Kaleci Muaf) </Text>}= {' '}
                  <Text style={{ color: theme.primary, fontFamily: Fonts.headlineBold }}>
                    {perPlayerFee} ₺ / kişi
                  </Text>
                </Text>
              </View>
            </View>

            {/* ── KAPTAN IBAN (FAST İLE MAÇ ÜCRETİ TOPLAMA) ── */}
            <View style={styles.ibanSettingCard}>
              <TouchableOpacity 
                style={styles.ibanSettingHeader}
                onPress={() => setShowIbanInput(!showIbanInput)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <MaterialIcons name="account-balance" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ibanSettingTitle}>KAPTAN IBAN TANIMLA (FAST)</Text>
                    <Text style={styles.ibanSettingSub}>
                      {showIbanInput 
                        ? 'Oyuncular maç odasında IBAN kopyalayıp FAST ile ücret atabilir.' 
                        : 'Kapalı • Oyuncular sahada elden nakit öder.'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={showIbanInput}
                  onValueChange={setShowIbanInput}
                  trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                  thumbColor={showIbanInput ? theme.text : theme.textMuted}
                />
              </TouchableOpacity>

              {showIbanInput && (
                <View style={styles.ibanInputsWrap}>
                  <View style={styles.miniInputGroup}>
                    <Text style={styles.miniInputLabel}>BANKA ADI</Text>
                    <TextInput
                      style={styles.miniTextInput}
                      value={organizerBankName}
                      onChangeText={setOrganizerBankName}
                      placeholder="Örn: Ziraat Bankası, Garanti BBVA"
                      placeholderTextColor="#adaaaa"
                    />
                  </View>

                  <View style={styles.miniInputGroup}>
                    <Text style={styles.miniInputLabel}>HESAP SAHİBİ ADI SOYADI</Text>
                    <TextInput
                      style={styles.miniTextInput}
                      value={organizerIbanName}
                      onChangeText={setOrganizerIbanName}
                      placeholder="Örn: Ahmet Yılmaz"
                      placeholderTextColor="#adaaaa"
                    />
                  </View>

                  <View style={styles.miniInputGroup}>
                    <Text style={styles.miniInputLabel}>IBAN NUMARASI</Text>
                    <TextInput
                      style={styles.miniTextInput}
                      value={organizerIban}
                      onChangeText={(t) => setOrganizerIban(t.toUpperCase())}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      placeholderTextColor="#adaaaa"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* ── 6. HAFTALIK ABONELİK ── */}
            <View style={styles.subscriptionBox}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="update" size={18} color={theme.primary} />
                  <Text style={styles.subBoxTitle}>HAFTALIK DÜZENLİ ABONELİK</Text>
                </View>
                <Text style={styles.subBoxSub}>
                  {isSubscription
                    ? 'Her hafta aynı gün ve saatte otomatik yenilenir.'
                    : 'Tek seferlik maç olarak yayınlanır.'}
                </Text>
              </View>
              <Switch
                value={isSubscription}
                onValueChange={setIsSubscription}
                trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                thumbColor={isSubscription ? theme.text : theme.textMuted}
              />
            </View>

            {/* ── KAYDET BUTONU ── */}
            <TouchableOpacity 
              style={[styles.createBtn, isSubmitting && { opacity: 0.6 }]} 
              activeOpacity={0.85} 
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={theme.background} />
                  <Text style={styles.createBtnText}>KAYDEDİLİYOR...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={22} color={theme.background} />
                  <Text style={styles.createBtnText}>MAÇ İLANINI KAYDET</Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>

      {/* ── HALISAHA PICKER MODAL ── */}
      <Modal visible={pitchPickerOpen} transparent animationType="slide" onRequestClose={() => setPitchPickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>HALİSAHA SEÇİN</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setPitchPickerOpen(false); setPitchSearch(''); }}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Arama */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tesis veya semt ara..."
                placeholderTextColor="#adaaaa"
                value={pitchSearch}
                onChangeText={setPitchSearch}
                autoFocus
              />
              {pitchSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPitchSearch('')}>
                  <MaterialIcons name="close" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Liste */}
            <FlatList
              data={filteredPitches}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.pitchList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialIcons name="search-off" size={36} color={theme.surfaceContainerHighest} />
                  <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedPitch.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.pitchListItem, isSelected && styles.pitchListItemActive]}
                    onPress={() => handlePitchSelect(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pitchListLeft}>
                      <View style={[styles.pitchIconWrap, isSelected && { backgroundColor: `${theme.primary}33` }]}>
                        <MaterialIcons name="stadium" size={20} color={isSelected ? theme.primary : theme.textMuted} />
                      </View>
                      <View>
                        <Text style={[styles.pitchListName, isSelected && { color: theme.primary }]}>{item.name}</Text>
                        <Text style={styles.pitchListDistrict}>
                          {item.district}  •  {item.subFields.length} saha  •  ★ {item.rating}
                        </Text>
                        {item.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>⚡ Popüler</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {isSelected && <MaterialIcons name="check-circle" size={22} color={theme.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── SAAT PICKER MODAL ── */}
      <Modal visible={timePickerOpen} transparent animationType="slide" onRequestClose={() => setTimePickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>SAAT SEÇİN</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setTimePickerOpen(false)}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Ara saat toggle */}
            <TouchableOpacity
              style={styles.offsetToggleRow}
              onPress={() => setShowOffsetTimes(!showOffsetTimes)}
            >
              <View style={[styles.offsetToggleIcon, showOffsetTimes && { backgroundColor: `${theme.primary}33` }]}>
                <MaterialIcons name="access-time" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.offsetToggleLabel}>Ara Saatler (:15, :30, :45)</Text>
                <Text style={styles.offsetToggleSub}>
                  {showOffsetTimes ? 'Aktif — Tüm saat dilimleri görünüyor' : 'Sadece tam saatler'}
                </Text>
              </View>
              <View style={[styles.offsetSwitch, showOffsetTimes && styles.offsetSwitchOn]}>
                <View style={[styles.offsetSwitchThumb, showOffsetTimes && styles.offsetSwitchThumbOn]} />
              </View>
            </TouchableOpacity>

            <FlatList
              data={allTimeSlots}
              keyExtractor={item => item}
              contentContainerStyle={styles.timeList}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const isActive = selectedTimeSlot === item;
                return (
                  <TouchableOpacity
                    style={[styles.timeListItem, isActive && styles.timeListItemActive]}
                    onPress={() => { setSelectedTimeSlot(item); setTimePickerOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="schedule" size={14} color={isActive ? theme.onPrimary : theme.textMuted} />
                    <Text style={[styles.timeListText, isActive && styles.timeListTextActive]}>{item}</Text>
                    {isActive && <MaterialIcons name="check" size={14} color={theme.onPrimary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── TARİH PICKER MODAL ── */}
      <Modal visible={datePickerOpen} transparent animationType="slide" onRequestClose={() => setDatePickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="calendar-today" size={20} color={theme.primary} />
                <Text style={styles.pickerTitle}>TARİH SEÇİN</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDatePickerOpen(false)}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Web Native Date Input Helper */}
            {Platform.OS === 'web' && (
              <View style={styles.webDateInputBox}>
                <MaterialIcons name="event" size={18} color={theme.primary} />
                <Text style={styles.webDateInputLabel}>Takvimden Seç:</Text>
                <input
                  type="date"
                  style={{
                    backgroundColor: theme.surfaceContainerHighest,
                    color: '#ffffff',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e: any) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d));
                      setDatePickerOpen(false);
                    }
                  }}
                />
              </View>
            )}

            {/* Yaklaşan 21 Gün Listesi */}
            <FlatList
              data={upcomingDates}
              keyExtractor={item => item.toISOString()}
              contentContainerStyle={styles.dateList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.toDateString() === selectedDate.toDateString();
                const isItemToday = isToday(item);
                const isItemTomorrow = isTomorrow(item);
                const tag = isItemToday ? 'Bugün' : isItemTomorrow ? 'Yarın' : null;

                return (
                  <TouchableOpacity
                    style={[styles.dateListItem, isSelected && styles.dateListItemActive]}
                    onPress={() => {
                      setSelectedDate(item);
                      setDatePickerOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dateListLeft}>
                      <View style={[styles.dateListIconBox, isSelected && { backgroundColor: `${theme.primary}33` }]}>
                        <MaterialIcons
                          name="event"
                          size={18}
                          color={isSelected ? theme.primary : theme.textMuted}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.dateListName, isSelected && { color: theme.primary }]}>
                          {formatDateTR(item)}
                        </Text>
                        {tag && (
                          <View style={[styles.dateTagBadge, { backgroundColor: isSelected ? theme.primary : `${theme.primary}26` }]}>
                            <Text style={[styles.dateTagText, { color: isSelected ? theme.background : theme.primary }]}>
                              {tag}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {isSelected && <MaterialIcons name="check" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── SAHA DETAYLARI & BİLGİ ÖNERİ MODALI ── */}
      <PitchDetailModal
        visible={pitchDetailModalOpen}
        pitch={selectedPitch}
        onClose={() => setPitchDetailModalOpen(false)}
      />

    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '93%', paddingBottom: 24 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.primary, fontStyle: 'italic', letterSpacing: -0.5 },
  cityMiniTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityMiniTagText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, textDecorationLine: 'underline' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },

  // Şehir
  cityBox: { backgroundColor: theme.surfaceContainer, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 8 },
  cityBoxTitle: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.primary, letterSpacing: 0.5 },
  cityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cityChip: { backgroundColor: theme.surfaceContainerHighest, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  cityChipActive: { backgroundColor: theme.primary },
  cityChipText: { fontFamily: Fonts.body, fontSize: 11, color: theme.text },
  cityChipTextActive: { color: theme.onPrimary, fontWeight: 'bold' },

  // Body
  body: { padding: 20, gap: 20 },
  section: { gap: 10 },
  label: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary, letterSpacing: 0.5 },
  subLabel: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginBottom: 6 },

  // Halısaha Seçili Kutu
  pitchSelectedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceContainer, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: `${theme.primary}66` },
  pitchSelectedLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pitchSelectedName: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  pitchSelectedDistrict: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, marginTop: 2 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: `${theme.primary}1F`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  changeBadgeText: { fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontWeight: 'bold' },

  // Alt Saha
  subFieldRow: { flexDirection: 'row', gap: 6 },
  subFieldChip: { flex: 1, backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: theme.border, gap: 2 },
  subFieldChipActive: { backgroundColor: `${theme.primary}26`, borderColor: theme.primary },
  subFieldText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.text },
  subFieldTextActive: { color: theme.primary },
  subFieldSurface: { fontFamily: Fonts.body, fontSize: 9, color: theme.textMuted },
  subFieldSlot: { fontFamily: Fonts.body, fontSize: 9, color: theme.textMuted, marginTop: 1 },

  // Tarih
  dateRow: { flexDirection: 'row', gap: 8 },
  dateQuickChip: { flex: 1, alignItems: 'center', backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: theme.border },
  dateQuickChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  dateQuickText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  dateQuickTextActive: { color: theme.onPrimary },
  datePickerBtn: { flex: 1.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: `${theme.primary}4D` },
  datePickerBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  datePickerBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.primary },
  dateDisplayBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${theme.primary}14`, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  dateDisplayText: { fontFamily: Fonts.body, fontSize: 13, color: theme.text },

  // Saat
  timeTopRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  timePopChip: { backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: theme.border },
  timePopChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  timePopText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.text },
  timePopTextActive: { color: theme.onPrimary },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: `${theme.primary}4D` },
  timePickerBtnText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary },
  selectedTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${theme.primary}14`, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  selectedTimeText: { fontFamily: Fonts.body, fontSize: 12, color: theme.text },

  // Format
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: theme.border },
  modeChipOther: { borderColor: `${theme.primary}33` },
  modeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  modeChipText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text, textAlign: 'center' },
  modeChipTextActive: { color: theme.onPrimary },
  otherModesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },

  // Ücret
  feeInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceContainer, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.border },
  currencySymbol: { fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.primary },
  feeInput: { flex: 1, fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.text },

  // Kaleci Muafiyet Toggle
  gkFreeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceContainer, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: 10 },
  gkFreeToggleActive: { borderColor: `${theme.primary}80`, backgroundColor: `${theme.primary}0D` },
  gkFreeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  gkFreeTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  gkFreeSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  gkFreeSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: theme.surfaceContainerHighest, justifyContent: 'center', paddingHorizontal: 2 },
  gkFreeSwitchActive: { backgroundColor: theme.primary },
  gkFreeThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.textMuted },
  gkFreeThumbActive: { backgroundColor: theme.background, alignSelf: 'flex-end' },

  perPlayerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${theme.primary}1A`, padding: 12, borderRadius: 10 },
  perPlayerText: { fontFamily: Fonts.body, fontSize: 12, color: theme.text },

  // Abonelik
  subscriptionBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceContainer, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: `${theme.primary}4D` },
  subBoxTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  subBoxSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },

  // Kaptan IBAN Ayarı
  ibanSettingCard: { backgroundColor: theme.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  ibanSettingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  ibanSettingTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  ibanSettingSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  ibanInputsWrap: { paddingHorizontal: 16, paddingBottom: 16, gap: 10, borderTopWidth: 1, borderTopColor: theme.borderSubtle, paddingTop: 12 },
  miniInputGroup: { gap: 4 },
  miniInputLabel: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.textMuted, letterSpacing: 0.5 },
  miniTextInput: { backgroundColor: theme.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontFamily: Fonts.body, fontSize: 13, color: theme.text, borderWidth: 1, borderColor: theme.borderSubtle },

  // Kaydet
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  createBtnText: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.background, letterSpacing: 0.5 },

  // ── Picker Modalları ──
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 24 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.border },
  pickerTitle: { fontFamily: Fonts.headlineBold, fontSize: 15, color: theme.primary, fontStyle: 'italic', letterSpacing: -0.3 },

  // Arama
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceContainer, marginHorizontal: 20, marginVertical: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: theme.text },

  // Halısaha Listesi
  pitchList: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  pitchListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.borderSubtle },
  pitchListItemActive: { backgroundColor: theme.surfaceContainer, borderColor: `${theme.primary}80` },
  pitchListLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pitchIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  pitchListName: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  pitchListDistrict: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, marginTop: 2 },
  popularBadge: { backgroundColor: 'rgba(255,183,3,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  popularBadgeText: { fontFamily: Fonts.body, fontSize: 9, color: '#ffb703', fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted },

  // Ara Saat Toggle
  offsetToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  offsetToggleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  offsetToggleLabel: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  offsetToggleSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  offsetSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: theme.surfaceContainerHighest, justifyContent: 'center', paddingHorizontal: 2 },
  offsetSwitchOn: { backgroundColor: theme.primary },
  offsetSwitchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.textMuted },
  offsetSwitchThumbOn: { backgroundColor: theme.background, alignSelf: 'flex-end' },

  // Saat Listesi
  timeList: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  timeListItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  timeListItemActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  timeListText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  timeListTextActive: { color: theme.background },

  // Tarih Picker
  dateList: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  dateListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.borderSubtle },
  dateListItemActive: { backgroundColor: theme.surfaceContainer, borderColor: `${theme.primary}80` },
  dateListLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dateListIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  dateListName: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  dateTagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dateTagText: { fontFamily: Fonts.headlineBold, fontSize: 10 },
  webDateInputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, marginBottom: 6, backgroundColor: theme.surfaceContainer, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  webDateInputLabel: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text, flex: 1 },

  // Organizasyon Modeli Kartları
  orgModelContainer: { gap: 10 },
  orgModelCard: { backgroundColor: theme.surfaceContainer, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: theme.borderSubtle },
  orgModelCardActive: { borderColor: theme.primary, backgroundColor: `${theme.primary}12` },
  orgModelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  orgModelTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  orgModelDesc: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, lineHeight: 16 },

  // Saha Modu & Rezervasyon Durumu
  pitchModeTabs: { flexDirection: 'row', backgroundColor: theme.surfaceContainerHighest, borderRadius: 8, padding: 2, gap: 2 },
  pitchModeTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  pitchModeTabActive: { backgroundColor: theme.primary },
  pitchModeTabActiveWarning: { backgroundColor: '#f59e0b' },
  pitchModeTabText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.textMuted },
  pitchModeTabTextActive: { color: theme.background, fontWeight: 'bold' },

  resStatusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  resStatusCard: { flex: 1, backgroundColor: theme.surfaceContainer, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: theme.borderSubtle, gap: 4 },
  resStatusCardActiveSuccess: { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  resStatusCardActiveWarning: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  resStatusCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resStatusCardTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  resStatusCardSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, lineHeight: 14 },

  flexiblePitchCard: { backgroundColor: theme.surfaceContainer, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#f59e0b', gap: 12 },
  flexiblePitchHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flexiblePitchTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: '#f59e0b' },
  flexiblePitchDesc: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted, marginTop: 3, lineHeight: 16 },
  flexibleTargetPitchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.surfaceContainerHighest, padding: 10, borderRadius: 8 },
  flexibleTargetPitchLabel: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  flexibleTargetPitchValue: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  flexibleChangeText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary },

  timeFlexibleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeFlexibleBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: '#38bdf8' },
  timePopChipActiveFlexible: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' },

  // Format Uyarıları (Sarı & Kırmızı)
  formatWarningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  formatWarningYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.35)' },
  formatWarningRed: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.4)' },
  formatWarningText: { flex: 1, fontFamily: Fonts.body, fontSize: 11, lineHeight: 15 },
  formatWarningTextYellow: { color: '#f59e0b' },
  formatWarningTextRed: { color: '#ef4444', fontWeight: 'bold' },
});
