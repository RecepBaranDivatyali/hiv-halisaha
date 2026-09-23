import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';
import { PITCH_DATABASE } from '@/config/pitches';

interface MatchSeekingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const MatchSeekingModal: React.FC<MatchSeekingModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const { user, saveUser } = useAuth();

  const [selectedDates, setSelectedDates] = useState<string[]>(['Bugün']);
  const [selectedCity, setSelectedCity] = useState(user?.city || 'İstanbul');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.preferredDistrict || 'Tüm İlçeler');
  const [selectedPitch, setSelectedPitch] = useState('Tüm Sahalar');
  const [note, setNote] = useState(user?.availableNote || '');
  const [loading, setLoading] = useState(false);

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [pitchModalVisible, setPitchModalVisible] = useState(false);

  const now = new Date();
  const todayName = TURKISH_DAYS[now.getDay()];
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowName = TURKISH_DAYS[tomorrow.getDay()];

  const quickDateOptions = useMemo(() => [
    { key: 'Bugün', label: `Bugün (${todayName})` },
    { key: 'Yarın', label: `Yarın (${tomorrowName})` },
  ], [todayName, tomorrowName]);

  const upcomingDaysList = useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = 2; i <= 21; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      const dayName = TURKISH_DAYS[d.getDay()];
      const monthName = TURKISH_MONTHS[d.getMonth()];
      const dateNum = d.getDate();
      list.push(`${dateNum} ${monthName} ${dayName}`);
    }
    return list;
  }, []);

  useEffect(() => {
    if (visible && user) {
      const parsedDates = user.availableDate
        ? user.availableDate.split(',').map((d: string) => d.trim()).filter((d: string) => d.length > 0 && d !== 'Hafta Sonu' && d !== 'Bu Hafta')
        : ['Bugün'];
      setSelectedDates(parsedDates.length > 0 ? parsedDates : ['Bugün']);
      setSelectedCity(user.city || 'İstanbul');
      setSelectedDistrict(user.preferredDistrict || 'Tüm İlçeler');
      setSelectedPitch((user as any).preferredPitch || 'Tüm Sahalar');
      setNote(user.availableNote || '');
    }
  }, [visible, user]);

  const toggleDate = (dateVal: string) => {
    setSelectedDates(prev => {
      const match = prev.find(d => d === dateVal || d.startsWith(dateVal));
      if (match) {
        if (prev.length <= 1) {
          Alert.alert('Uyarı', 'En az 1 tarih seçili olmalıdır.');
          return prev;
        }
        return prev.filter(d => d !== match);
      } else {
        return [...prev, dateVal];
      }
    });
  };

  const calculateAvailableUntil = (dates: string[]): number => {
    let maxTs = 0;
    const current = new Date();
    
    dates.forEach(d => {
      if (d.includes('Bugün')) {
        const endOfToday = new Date(current);
        endOfToday.setHours(23, 59, 59, 999);
        maxTs = Math.max(maxTs, endOfToday.getTime());
      } else if (d.includes('Yarın')) {
        const endOfTomorrow = new Date(current);
        endOfTomorrow.setDate(current.getDate() + 1);
        endOfTomorrow.setHours(23, 59, 59, 999);
        maxTs = Math.max(maxTs, endOfTomorrow.getTime());
      } else {
        const match = d.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/);
        if (match) {
          const dayNum = parseInt(match[1], 10);
          const monthName = match[2];
          const monthIdx = TURKISH_MONTHS.indexOf(monthName);
          if (monthIdx !== -1) {
            const target = new Date(current.getFullYear(), monthIdx, dayNum, 23, 59, 59, 999);
            if (target.getTime() < current.getTime()) {
              target.setFullYear(target.getFullYear() + 1);
            }
            maxTs = Math.max(maxTs, target.getTime());
          }
        }
      }
    });

    return maxTs > 0 ? maxTs : (Date.now() + 24 * 60 * 60 * 1000);
  };

  const availableDistricts = ['Tüm İlçeler', ...(DISTRICTS_MAP[selectedCity] || ['Merkez'])];
  const cityPitches = PITCH_DATABASE.filter(p => p.city === selectedCity);

  const handleActivate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const finalDistrict = selectedDistrict === 'Tüm İlçeler' ? '' : selectedDistrict;
      const finalPitch = selectedPitch === 'Tüm Sahalar' ? '' : selectedPitch;
      const finalDatesStr = selectedDates.length > 0 ? selectedDates.join(', ') : 'Bugün';
      const availableUntil = calculateAvailableUntil(selectedDates);

      const updatedUser = {
        ...user,
        isLookingForMatch: true,
        availableDate: finalDatesStr,
        availableUntil,
        availableDateUpdatedAt: Date.now(),
        city: selectedCity,
        preferredDistrict: finalDistrict,
        preferredPitch: finalPitch,
        availableNote: note.trim(),
      };
      await saveUser(updatedUser as any);

      if (user.uid) {
        await dbService.setUserLookingForMatch(user.uid, true, {
          availableDate: finalDatesStr,
          availableUntil,
          city: selectedCity,
          district: finalDistrict,
          preferredPitch: finalPitch,
          availableNote: note.trim(),
        });
      }

      Alert.alert(
        '🟢 Maç Arama Sinyali Açıldı!',
        `Durumunuz "${finalDatesStr}" (${selectedCity}${finalDistrict ? ` - ${finalDistrict}` : ''}) için aktif edildi. Kaptanlar sizi Oyuncu Arama listesinde en üstte görebilecek.`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Maç arama durumu güncelleme hatası:', e);
      Alert.alert('Hata', 'Durum güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        isLookingForMatch: false,
      };
      await saveUser(updatedUser);

      if (user.uid) {
        await dbService.setUserLookingForMatch(user.uid, false);
      }

      Alert.alert('Sinyal Kapatıldı', 'Maç arama durumunuz devre dışı bırakıldı.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Maç arama durumu kapatma hatası:', e);
      Alert.alert('Hata', 'Durum güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyActive = Boolean(user?.isLookingForMatch);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <MaterialIcons name="radar" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.headerTitle}>MAÇ ARAMA SİNYALİ</Text>
                <Text style={styles.headerSub}>Kaptanların ve takımların radarına girin</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Card */}
            <View style={[styles.statusCard, isCurrentlyActive ? styles.statusCardActive : styles.statusCardInactive]}>
              <MaterialIcons
                name={isCurrentlyActive ? 'wifi-tethering' : 'portable-wifi-off'}
                size={24}
                color={isCurrentlyActive ? '#22c55e' : theme.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusCardTitle, isCurrentlyActive && { color: '#22c55e' }]}>
                  {isCurrentlyActive ? 'SİNYALİNİZ AÇIK (YAYINDASINIZ)' : 'SİNYALİNİZ KAPALI'}
                </Text>
                <Text style={styles.statusCardDesc}>
                  {isCurrentlyActive
                    ? 'Kaptanlar ve maç organizatörleri sizi "🟢 Maç Arayanlar" listesinde en üstte görüyor.'
                    : 'Bugün veya yarın canınız maç mı çekti? Sinyalinizi açın, maç eksiği olan ekipler sizi anında kadroya alsın.'}
                </Text>
              </View>
            </View>

            {/* Tarih Seçimi (Çoklu Gün Seçimi) */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionLabel}>HANGİ GÜNLER OYNAMAK İSTİYORSUNUZ?</Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontWeight: 'bold' }}>
                  {selectedDates.length} Gün Seçili
                </Text>
              </View>

              <View style={styles.chipsRow}>
                {quickDateOptions.map((opt) => {
                  const isSelected = selectedDates.some(d => d === opt.key || d.startsWith(opt.key));
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      onPress={() => toggleDate(opt.key)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons 
                        name={isSelected ? "check" : "add"} 
                        size={14} 
                        color={isSelected ? '#ffffff' : theme.textMuted} 
                      />
                      <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Display any other selected custom dates */}
                {selectedDates.filter(d => d !== 'Bugün' && d !== 'Yarın').map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dateChip, styles.dateChipActive]}
                    onPress={() => toggleDate(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateChipText, styles.dateChipTextActive]}>{d}</Text>
                    <MaterialIcons name="close" size={13} color="#ffffff" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                ))}

                {/* Button to open multi-date selector modal */}
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setDateModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="calendar-today" size={13} color={theme.primary} />
                  <Text style={styles.datePickerBtnText}>+ Tarih Seç</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Konum & Tesis Filtreleri */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOKASYON VE SAHA TERCİHİ</Text>

              {/* 1. İl / Şehir (ZORUNLU) */}
              <TouchableOpacity 
                style={styles.pickerSelector} 
                onPress={() => setCityModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.pickerLeft}>
                  <MaterialIcons name="location-city" size={20} color={theme.primary} />
                  <View>
                    <Text style={styles.pickerFieldLabel}>ŞEHİR <Text style={{ color: theme.primary }}>* (Zorunlu)</Text></Text>
                    <Text style={styles.pickerFieldValue}>{selectedCity}</Text>
                  </View>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
              </TouchableOpacity>

              {/* 2. İlçe (İSTEĞE BAĞLI) */}
              <TouchableOpacity 
                style={styles.pickerSelector} 
                onPress={() => setDistrictModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.pickerLeft}>
                  <MaterialIcons name="place" size={20} color={theme.secondary} />
                  <View>
                    <Text style={styles.pickerFieldLabel}>İLÇE / BÖLGE (İsteğe Bağlı)</Text>
                    <Text style={styles.pickerFieldValue}>{selectedDistrict}</Text>
                  </View>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
              </TouchableOpacity>

              {/* 3. Tesis / Halısaha (İSTEĞE BAĞLI) */}
              <TouchableOpacity 
                style={styles.pickerSelector} 
                onPress={() => setPitchModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.pickerLeft}>
                  <MaterialIcons name="sports-soccer" size={20} color="#f59e0b" />
                  <View>
                    <Text style={styles.pickerFieldLabel}>TESİS / SAHA (İsteğe Bağlı)</Text>
                    <Text style={styles.pickerFieldValue} numberOfLines={1}>{selectedPitch}</Text>
                  </View>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* İsteğe Bağlı Not */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KAPTANLARA NOTUNUZ (İSTEĞE BAĞLI)</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="chat-bubble-outline" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Örn: 20:00'dan sonra uyar, her mevkide oynarım"
                  placeholderTextColor="#adaaaa"
                  maxLength={70}
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.actionsRow}>
              {isCurrentlyActive && (
                <TouchableOpacity
                  style={[styles.deactivateBtn, loading && { opacity: 0.6 }]}
                  onPress={handleDeactivate}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="power-settings-new" size={18} color="#ef4444" />
                  <Text style={styles.deactivateBtnText}>SİNYALİ KAPAT</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.activateBtn, loading && { opacity: 0.6 }, !isCurrentlyActive && { flex: 1 }]}
                onPress={handleActivate}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                    <Text style={styles.activateBtnText}>
                      {isCurrentlyActive ? 'GÜNCELLE' : 'YAYINI BAŞLAT (MAÇ ARIYORUM)'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Date Modal Picker (Çoklu Gün Seçimi) */}
          {dateModalVisible && (
            <TouchableOpacity 
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setDateModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.pickerModalBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.pickerModalHeader}>DİĞER GÜNLERİ SEÇİN</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontWeight: 'bold' }}>
                    Çoklu Seçim
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {upcomingDaysList.map((dayStr) => {
                    const isSelected = selectedDates.includes(dayStr);
                    return (
                      <TouchableOpacity
                        key={dayStr}
                        style={[styles.pickerModalItem, isSelected && styles.pickerModalItemActive]}
                        onPress={() => toggleDate(dayStr)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialIcons 
                            name={isSelected ? "check-box" : "check-box-outline-blank"} 
                            size={20} 
                            color={isSelected ? theme.primary : theme.textMuted} 
                          />
                          <Text style={[styles.pickerModalItemText, isSelected && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                            {dayStr}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity 
                  style={[styles.pickerModalClose, { backgroundColor: theme.primary, marginTop: 10 }]} 
                  onPress={() => setDateModalVisible(false)}
                >
                  <Text style={[styles.pickerModalCloseText, { color: theme.onPrimary }]}>
                    TAMAM ({selectedDates.length} Gün Seçili)
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* City Modal Picker */}
          {cityModalVisible && (
            <TouchableOpacity 
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setCityModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.pickerModalBox}>
                <Text style={styles.pickerModalHeader}>ŞEHİR SEÇİN</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {CITIES_LIST.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[styles.pickerModalItem, selectedCity === city && styles.pickerModalItemActive]}
                      onPress={() => {
                        setSelectedCity(city);
                        setSelectedDistrict('Tüm İlçeler');
                        setSelectedPitch('Tüm Sahalar');
                        setCityModalVisible(false);
                      }}
                    >
                      <Text style={[styles.pickerModalItemText, selectedCity === city && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                        {city}
                      </Text>
                      {selectedCity === city && <MaterialIcons name="check" size={18} color={theme.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.pickerModalClose} onPress={() => setCityModalVisible(false)}>
                  <Text style={styles.pickerModalCloseText}>KAPAT</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* District Modal Picker */}
          {districtModalVisible && (
            <TouchableOpacity 
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setDistrictModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.pickerModalBox}>
                <Text style={styles.pickerModalHeader}>{selectedCity.toUpperCase()} - İLÇE SEÇİN</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {availableDistricts.map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      style={[styles.pickerModalItem, selectedDistrict === dist && styles.pickerModalItemActive]}
                      onPress={() => {
                        setSelectedDistrict(dist);
                        setDistrictModalVisible(false);
                      }}
                    >
                      <Text style={[styles.pickerModalItemText, selectedDistrict === dist && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                        {dist}
                      </Text>
                      {selectedDistrict === dist && <MaterialIcons name="check" size={18} color={theme.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.pickerModalClose} onPress={() => setDistrictModalVisible(false)}>
                  <Text style={styles.pickerModalCloseText}>KAPAT</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Pitch Modal Picker */}
          {pitchModalVisible && (
            <TouchableOpacity 
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setPitchModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.pickerModalBox}>
                <Text style={styles.pickerModalHeader}>{selectedCity.toUpperCase()} - SAHA SEÇİN</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  <TouchableOpacity
                    style={[styles.pickerModalItem, selectedPitch === 'Tüm Sahalar' && styles.pickerModalItemActive]}
                    onPress={() => {
                      setSelectedPitch('Tüm Sahalar');
                      setPitchModalVisible(false);
                    }}
                  >
                    <Text style={[styles.pickerModalItemText, selectedPitch === 'Tüm Sahalar' && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                      🏟️ Tüm Sahalar (Filtresiz)
                    </Text>
                    {selectedPitch === 'Tüm Sahalar' && <MaterialIcons name="check" size={18} color={theme.primary} />}
                  </TouchableOpacity>

                  {cityPitches.map((pitch) => (
                    <TouchableOpacity
                      key={pitch.id}
                      style={[styles.pickerModalItem, selectedPitch === pitch.name && styles.pickerModalItemActive]}
                      onPress={() => {
                        setSelectedPitch(pitch.name);
                        if (pitch.district) setSelectedDistrict(pitch.district);
                        setPitchModalVisible(false);
                      }}
                    >
                      <View>
                        <Text style={[styles.pickerModalItemText, selectedPitch === pitch.name && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                          {pitch.name}
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted }}>
                          {pitch.district} • ★ {pitch.rating}
                        </Text>
                      </View>
                      {selectedPitch === pitch.name && <MaterialIcons name="check" size={18} color={theme.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.pickerModalClose} onPress={() => setPitchModalVisible(false)}>
                  <Text style={styles.pickerModalCloseText}>KAPAT</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      borderTopWidth: 1,
      borderColor: theme.borderSubtle,
    },
    scrollView: {
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 16,
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceContainerHighest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 20,
      gap: 16,
      paddingBottom: 34,
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    statusCardActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      borderColor: '#22c55e',
    },
    statusCardInactive: {
      backgroundColor: theme.surfaceContainer,
      borderColor: theme.borderSubtle,
    },
    statusCardTitle: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: theme.textMuted,
      letterSpacing: 0.5,
    },
    statusCardDesc: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
      lineHeight: 15,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      fontFamily: Fonts.headlineBold,
      fontSize: 11,
      color: theme.primary,
      letterSpacing: 0.5,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    dateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.surfaceContainer,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    dateChipActive: {
      backgroundColor: '#22c55e',
      borderColor: '#22c55e',
    },
    dateChipText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: theme.text,
    },
    dateChipTextActive: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    datePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: '#22c55e',
      borderStyle: 'dashed',
    },
    datePickerBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: '#22c55e',
    },
    pickerSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceContainer,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    pickerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    pickerFieldLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    pickerFieldValue: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: theme.text,
      marginTop: 2,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surfaceContainer,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    textInput: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: theme.text,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    deactivateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: '#ef4444',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    deactivateBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: '#ef4444',
    },
    activateBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#22c55e',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    activateBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: '#ffffff',
      letterSpacing: 0.3,
    },
    pickerModalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      zIndex: 99,
    },
    pickerModalBox: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerModalHeader: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13,
      color: theme.primary,
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    pickerModalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderSubtle,
    },
    pickerModalItemActive: {
      backgroundColor: `${theme.primary}15`,
      borderRadius: 8,
    },
    pickerModalItemText: {
      fontFamily: Fonts.body,
      fontSize: 14,
      color: theme.text,
    },
    pickerModalClose: {
      marginTop: 14,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: theme.surfaceContainerHighest,
      borderRadius: 8,
    },
    pickerModalCloseText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 12,
      color: theme.text,
    },
  });
