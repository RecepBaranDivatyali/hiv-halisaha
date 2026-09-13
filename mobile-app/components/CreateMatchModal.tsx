import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Modal,
  ScrollView, TextInput, Alert, Switch, FlatList,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { PITCH_DATABASE, PitchDatabaseItem } from '@/config/pitches';

export interface NewMatchData {
  id: string;
  city: string;
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
}

interface CreateMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (matchData: NewMatchData) => void;
}

const CITIES = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya'];

// Standart tam saatler (19:00, 20:00, …)
const STANDARD_HOURS = [17, 18, 19, 20, 21, 22, 23, 0];
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
  const [selectedCity, setSelectedCity] = useState('Ankara');
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
    return cityPitches.filter(
      p => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q)
    );
  }, [cityPitches, pitchSearch]);

  const [selectedPitch, setSelectedPitch] = useState<PitchDatabaseItem>(
    cityPitches[0] || PITCH_DATABASE[0]
  );
  const [selectedSubField, setSelectedSubField] = useState(
    selectedPitch.subFields[0]?.name || 'Tek Saha'
  );

  // ── Tarih ──────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Saat ──────────────────────────────────────────────
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [showOffsetTimes, setShowOffsetTimes] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('21:00 - 22:00');

  // Tüm saat listesi
  const allTimeSlots = useMemo(() => {
    const slots: string[] = [];
    STANDARD_HOURS.forEach(h => {
      slots.push(formatTimeSlot(h, 0));
      if (showOffsetTimes) {
        OFFSET_MINUTES.forEach(m => slots.push(formatTimeSlot(h, m)));
      }
    });
    return slots;
  }, [showOffsetTimes]);

  // Popüler saatler (hızlı erişim)
  const popularSlots = ['20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00'];

  // ── Maç Formatı ──────────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState('7v7');
  const [showAllModes, setShowAllModes] = useState(false);

  // ── Ücret ──────────────────────────────────────────────
  const [totalFeeInput, setTotalFeeInput] = useState('2100');

  // ── Abonelik ──────────────────────────────────────────────
  const [isSubscription, setIsSubscription] = useState(false);

  // ── Hesaplama ──────────────────────────────────────────────
  const getPlayerCount = (mode: string) => {
    const n = parseInt(mode.split('v')[0], 10) || 7;
    return n * 2;
  };
  const totalPlayersCount = getPlayerCount(selectedMode);
  const totalFeeNum = parseInt(totalFeeInput, 10) || 0;
  const perPlayerFee = totalPlayersCount > 0 ? Math.round(totalFeeNum / totalPlayersCount) : 0;

  // ── Handlers ──────────────────────────────────────────────
  const handlePitchSelect = (pitch: PitchDatabaseItem) => {
    setSelectedPitch(pitch);
    setSelectedSubField(pitch.subFields[0]?.name || 'Tek Saha');
    setPitchPickerOpen(false);
    setPitchSearch('');
  };

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
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
    const dateStr = formatDateTR(selectedDate);
    const fullArenaName = `${selectedPitch.name} — ${selectedSubField}`;
    const fullDateTime = `${dateStr}, ${selectedTimeSlot}`;

    const newMatch: NewMatchData = {
      id: Date.now().toString(),
      city: selectedCity,
      arena: fullArenaName,
      pitchSubCode: selectedSubField,
      dateStr,
      timeSlot: selectedTimeSlot,
      dateTime: fullDateTime,
      mode: selectedMode,
      totalFee: totalFeeNum,
      fee: perPlayerFee,
      isSubscription,
      positions: { KL: 1, DF: 2, OS: 2, FV: 1 },
    };

    try {
      const created = await addMatch(newMatch as any, user);

      Alert.alert(
        '⚽ Maç İlanı Kaydedildi!',
        `${fullArenaName}\n${fullDateTime}\nToplam: ${totalFeeNum.toLocaleString('tr-TR')} ₺  •  Kişi Başı: ${perPlayerFee} ₺${isSubscription ? '\n🔄 Haftalık Abonelik Maçı' : ''}`,
        [{ text: 'Maç Odasına Git', onPress: () => { if (onSuccess) onSuccess((created || newMatch) as any); onClose(); } }]
      );
    } catch {
      Alert.alert('Hata', 'Maç oluşturulurken bir sorun oluştu.');
    }
  };

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
                    onPress={() => { setSelectedCity(c); setCitySelectorOpen(false); }}
                  >
                    <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

            {/* ── 1. HALISAHA SEÇİMİ ── */}
            <View style={styles.section}>
              <Text style={styles.label}>HALISAHA TESİSİ</Text>

              {/* Seçili tesis kutusu + değiştir butonu */}
              <TouchableOpacity style={styles.pitchSelectedBox} onPress={() => setPitchPickerOpen(true)}>
                <View style={styles.pitchSelectedLeft}>
                  <MaterialIcons name="stadium" size={20} color={theme.primary} />
                  <View>
                    <Text style={styles.pitchSelectedName}>{selectedPitch.name}</Text>
                    <Text style={styles.pitchSelectedDistrict}>{selectedPitch.district}  •  ★ {selectedPitch.rating}</Text>
                  </View>
                </View>
                <View style={styles.changeBadge}>
                  <Text style={styles.changeBadgeText}>Değiştir</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={16} color={theme.primary} />
                </View>
              </TouchableOpacity>

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
                  onPress={() => setShowDatePicker(true)}
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

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  locale="tr-TR"
                />
              )}
            </View>

            {/* ── 3. SAAT SEÇİMİ ── */}
            <View style={styles.section}>
              <Text style={styles.label}>MAÇ SAATİ</Text>

              {/* Popüler saatler + Seç butonu */}
              <View style={styles.timeTopRow}>
                {popularSlots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timePopChip, selectedTimeSlot === slot && styles.timePopChipActive]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text style={[styles.timePopText, selectedTimeSlot === slot && styles.timePopTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.timePickerBtn} onPress={() => setTimePickerOpen(true)}>
                  <MaterialIcons name="access-time" size={15} color={theme.primary} />
                  <Text style={styles.timePickerBtnText}>Tümü</Text>
                </TouchableOpacity>
              </View>

              {/* Seçili saat göstergesi (popüler dışında bir saat seçildiyse) */}
              {!popularSlots.includes(selectedTimeSlot) && (
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
                  >
                    <Text style={[styles.modeChipText, selectedMode === m && styles.modeChipTextActive]}>{m}</Text>
                    {m === '7v7' && <Text style={[styles.modeChipSub, selectedMode === m && { color: theme.onPrimary }]}>Popüler</Text>}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modeChip, styles.modeChipOther, showAllModes && styles.modeChipActive]}
                  onPress={() => setShowAllModes(!showAllModes)}
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
                      style={[styles.subModeChip, selectedMode === m && styles.subModeChipActive]}
                      onPress={() => setSelectedMode(m)}
                    >
                      <Text style={[styles.subModeText, selectedMode === m && styles.subModeTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
              <View style={styles.perPlayerBadge}>
                <MaterialIcons name="calculate" size={18} color={theme.primary} />
                <Text style={styles.perPlayerText}>
                  {totalFeeNum.toLocaleString('tr-TR')} ₺ ÷ {totalPlayersCount} oyuncu ={' '}
                  <Text style={{ color: theme.primary, fontFamily: Fonts.headlineBold }}>{perPlayerFee} ₺ / kişi</Text>
                </Text>
              </View>
            </View>

            {/* ── 6. HAFTAlık ABONELİK ── */}
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
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={handleCreate}>
              <MaterialIcons name="check-circle" size={22} color={theme.background} />
              <Text style={styles.createBtnText}>MAÇ İLANINI KAYDET</Text>
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
  subFieldRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  subFieldChip: { backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: theme.border, gap: 2 },
  subFieldChipActive: { backgroundColor: `${theme.primary}26`, borderColor: theme.primary },
  subFieldText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  subFieldTextActive: { color: theme.primary },
  subFieldSurface: { fontFamily: Fonts.body, fontSize: 9, color: theme.textMuted },

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
  modeChip: { flex: 1, alignItems: 'center', backgroundColor: theme.surfaceContainer, borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: theme.border, gap: 2 },
  modeChipOther: { borderColor: `${theme.primary}33` },
  modeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  modeChipText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  modeChipTextActive: { color: theme.onPrimary },
  modeChipSub: { fontFamily: Fonts.body, fontSize: 9, color: theme.primary },
  otherModesRow: { flexDirection: 'row', gap: 8 },
  subModeChip: { flex: 1, alignItems: 'center', backgroundColor: theme.surfaceContainerHighest, borderRadius: 8, paddingVertical: 9, borderWidth: 1, borderColor: 'transparent' },
  subModeChipActive: { backgroundColor: `${theme.primary}26`, borderColor: theme.primary },
  subModeText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  subModeTextActive: { color: theme.primary },

  // Ücret
  feeInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceContainer, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.border },
  currencySymbol: { fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.primary },
  feeInput: { flex: 1, fontFamily: Fonts.headlineBold, fontSize: 22, color: theme.text },
  perPlayerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${theme.primary}1A`, padding: 12, borderRadius: 10 },
  perPlayerText: { fontFamily: Fonts.body, fontSize: 12, color: theme.text },

  // Abonelik
  subscriptionBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surfaceContainer, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: `${theme.primary}4D` },
  subBoxTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text },
  subBoxSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },

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
});
