import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Switch, 
  Alert, 
  ActivityIndicator,
  Linking
} from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';
import { PitchDatabaseItem } from '@/config/pitches';

interface PitchDetailModalProps {
  visible: boolean;
  pitch: PitchDatabaseItem | null;
  onClose: () => void;
  onProposalSubmitted?: () => void;
}

const ALL_MODES = ['5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11'];

export const PitchDetailModal: React.FC<PitchDetailModalProps> = ({
  visible,
  pitch,
  onClose,
  onProposalSubmitted,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields for Proposal
  const [hourlyFee, setHourlyFee] = useState('');
  const [subscriberFee, setSubscriberFee] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [phone, setPhone] = useState('');
  const [bootsRental, setBootsRental] = useState(false);
  const [bootsFee, setBootsFee] = useState('');
  const [glovesRental, setGlovesRental] = useState(false);
  const [glovesFee, setGlovesFee] = useState('');
  const [vestsProvided, setVestsProvided] = useState(true);
  const [showerAvailable, setShowerAvailable] = useState(true);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [optimalModes, setOptimalModes] = useState<string[]>(['7v7']);
  const [tightModes, setTightModes] = useState<string[]>(['8v8']);
  const [proposalNotes, setProposalNotes] = useState('');

  // Sync state when pitch changes
  useEffect(() => {
    if (pitch) {
      setIsEditing(false);
      setHourlyFee(pitch.hourlyFee ? String(pitch.hourlyFee) : '');
      setSubscriberFee(pitch.subscriberFee ? String(pitch.subscriberFee) : '');
      setOpeningTime(pitch.openingTime || '09:00');
      setClosingTime(pitch.closingTime || '22:00');
      setPhone(pitch.phone || '');
      setBootsRental(pitch.equipmentRental?.bootsRental ?? false);
      setBootsFee(pitch.equipmentRental?.bootsFee ? String(pitch.equipmentRental.bootsFee) : '');
      setGlovesRental(pitch.equipmentRental?.glovesRental ?? false);
      setGlovesFee(pitch.equipmentRental?.glovesFee ? String(pitch.equipmentRental.glovesFee) : '');
      setVestsProvided(pitch.equipmentRental?.vestsProvided ?? true);
      setShowerAvailable(pitch.equipmentRental?.showerAvailable ?? true);
      setParkingAvailable(pitch.equipmentRental?.parkingAvailable ?? true);
      setOptimalModes(pitch.optimalModes || ['7v7']);
      setTightModes(pitch.tightModes || ['8v8']);
      setProposalNotes('');
    }
  }, [pitch, visible]);

  if (!pitch) return null;

  const handleToggleOptimalMode = (m: string) => {
    if (optimalModes.includes(m)) {
      setOptimalModes(optimalModes.filter(item => item !== m));
    } else {
      setOptimalModes([...optimalModes, m]);
      setTightModes(tightModes.filter(item => item !== m));
    }
  };

  const handleToggleTightMode = (m: string) => {
    if (tightModes.includes(m)) {
      setTightModes(tightModes.filter(item => item !== m));
    } else {
      setTightModes([...tightModes, m]);
      setOptimalModes(optimalModes.filter(item => item !== m));
    }
  };

  const handleSubmitProposal = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Bilgi önerisinde bulunmak için lütfen giriş yapın.');
      return;
    }

    setSubmitting(true);
    try {
      const originalData = {
        hourlyFee: pitch.hourlyFee,
        subscriberFee: pitch.subscriberFee,
        openingTime: pitch.openingTime,
        closingTime: pitch.closingTime,
        phone: pitch.phone,
        optimalModes: pitch.optimalModes,
        tightModes: pitch.tightModes,
        equipmentRental: pitch.equipmentRental,
      };

      const proposedData = {
        hourlyFee: hourlyFee ? Number(hourlyFee) : undefined,
        subscriberFee: subscriberFee ? Number(subscriberFee) : undefined,
        openingTime: openingTime || undefined,
        closingTime: closingTime || undefined,
        phone: phone || undefined,
        optimalModes,
        tightModes,
        equipmentRental: {
          bootsRental,
          bootsFee: bootsFee ? Number(bootsFee) : undefined,
          glovesRental,
          glovesFee: glovesFee ? Number(glovesFee) : undefined,
          vestsProvided,
          showerAvailable,
          parkingAvailable,
        },
      };

      await dbService.submitPitchProposal({
        pitchId: pitch.id,
        pitchName: pitch.name,
        city: pitch.city,
        district: pitch.district,
        userId: user.uid || 'anon',
        userName: user.name || 'Futbolsever',
        userAvatar: user.avatar,
        originalData,
        proposedData,
        notes: proposalNotes.trim() || undefined,
      });

      Alert.alert(
        '✓ Öneriniz İletildi!',
        'Tesis bilgilerine yaptığınız katkı için teşekkürler! Değişiklikler admin incelemesinden sonra güncellenecektir.',
        [{ text: 'Tamam', onPress: () => {
          setIsEditing(false);
          if (onProposalSubmitted) onProposalSubmitted();
          onClose();
        }}]
      );
    } catch {
      Alert.alert('Hata', 'Öneri gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <MaterialIcons name="stadium" size={20} color={theme.primary} />
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {isEditing ? 'BİLGİ ÖNER & DÜZELT' : 'TESİS DETAYLARI'}
                </Text>
              </View>
              <Text style={styles.headerSub} numberOfLines={1}>
                {pitch.name} • {pitch.district}
              </Text>
            </View>

            {/* Header Actions: Pencil (Edit) vs Check/Close (Submit/Cancel) */}
            <View style={styles.headerActions}>
              {!isEditing ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="edit" size={18} color={theme.primary} />
                    <Text style={styles.actionBtnEditText}>DÜZENLE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.actionBtnCancel}
                    onPress={() => setIsEditing(false)}
                    disabled={submitting}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.error} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnSave}
                    onPress={handleSubmitProposal}
                    disabled={submitting}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={theme.background} />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={18} color={theme.background} />
                        <Text style={styles.actionBtnSaveText}>GÖNDER</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {isEditing ? (
              /* ─── DÜZENLEME & ÖNERİ FORMU ─── */
              <View style={styles.formContainer}>
                <View style={styles.infoBanner}>
                  <MaterialIcons name="info-outline" size={16} color={theme.primary} />
                  <Text style={styles.infoBannerText}>
                    Eksik veya değişmiş bilgileri düzenleyin. Admin onayladığında tüm oyuncular için güncellenecektir.
                  </Text>
                </View>

                {/* 1. Ücretler */}
                <Text style={styles.formSectionTitle}>1. SAHA ÜCRETLERİ</Text>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Saatlik Normal Ücret (₺)</Text>
                    <TextInput
                      style={styles.input}
                      value={hourlyFee}
                      onChangeText={setHourlyFee}
                      keyboardType="numeric"
                      placeholder="Örn: 780"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Saatlik Abone Ücreti (₺)</Text>
                    <TextInput
                      style={styles.input}
                      value={subscriberFee}
                      onChangeText={setSubscriberFee}
                      keyboardType="numeric"
                      placeholder="Örn: 700"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                {/* 2. Çalışma Saatleri */}
                <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>2. ÇALIŞMA SAATLERİ</Text>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>İlk Maç Saati (Açılış)</Text>
                    <TextInput
                      style={styles.input}
                      value={openingTime}
                      onChangeText={setOpeningTime}
                      placeholder="09:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Son Maç Bitişi (Kapanış)</Text>
                    <TextInput
                      style={styles.input}
                      value={closingTime}
                      onChangeText={setClosingTime}
                      placeholder="22:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                {/* 3. İletişim / Tel */}
                <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>3. İLETİŞİM</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0312 ... veya 0532 ..."
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                />

                {/* 4. Format Uygunluğu */}
                <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>4. KAÇA KAÇ OYNANIR?</Text>
                <Text style={styles.inputHint}>Yeşil: İdeal Formatlar • Sarı: Sıkışık/Dar Oynanabilenler</Text>
                
                <Text style={[styles.subLabelText, { marginTop: 6 }]}>İdeal Formatlar (Yeşil):</Text>
                <View style={styles.modeChipsWrap}>
                  {ALL_MODES.map(m => (
                    <TouchableOpacity
                      key={`opt-${m}`}
                      style={[styles.modeChip, optimalModes.includes(m) && styles.modeChipActiveOptimal]}
                      onPress={() => handleToggleOptimalMode(m)}
                    >
                      <Text style={[styles.modeChipText, optimalModes.includes(m) && styles.modeChipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.subLabelText, { marginTop: 8 }]}>Sıkışık/Dar Oynanabilen Formatlar (Sarı):</Text>
                <View style={styles.modeChipsWrap}>
                  {ALL_MODES.map(m => (
                    <TouchableOpacity
                      key={`tight-${m}`}
                      style={[styles.modeChip, tightModes.includes(m) && styles.modeChipActiveTight]}
                      onPress={() => handleToggleTightMode(m)}
                    >
                      <Text style={[styles.modeChipText, tightModes.includes(m) && { color: '#f59e0b', fontWeight: 'bold' }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 5. Ekipman Kiralama ve Olanaklar */}
                <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>5. EKİPMAN & OLANAKLAR</Text>
                
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Krampon Kiralama</Text>
                    <Text style={styles.toggleSub}>Tesiste krampon kiralanabiliyor mu?</Text>
                  </View>
                  <Switch
                    value={bootsRental}
                    onValueChange={setBootsRental}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={theme.text}
                  />
                </View>
                {bootsRental && (
                  <View style={[styles.formRow, { marginTop: 6 }]}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Krampon Kiralama Ücreti (₺)</Text>
                      <TextInput
                        style={styles.input}
                        value={bootsFee}
                        onChangeText={setBootsFee}
                        keyboardType="numeric"
                        placeholder="Örn: 50"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                  </View>
                )}

                <View style={[styles.toggleRow, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Kaleci Eldiveni Kiralama</Text>
                    <Text style={styles.toggleSub}>Eldiven veriliyor mu?</Text>
                  </View>
                  <Switch
                    value={glovesRental}
                    onValueChange={setGlovesRental}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={theme.text}
                  />
                </View>
                {glovesRental && (
                  <View style={[styles.formRow, { marginTop: 6 }]}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Eldiven Kiralama Ücreti (₺)</Text>
                      <TextInput
                        style={styles.input}
                        value={glovesFee}
                        onChangeText={setGlovesFee}
                        keyboardType="numeric"
                        placeholder="Örn: 30"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                  </View>
                )}

                <View style={[styles.toggleRow, { marginTop: 10 }]}>
                  <Text style={styles.toggleTitle}>Yelek Temini (Ücretsiz)</Text>
                  <Switch
                    value={vestsProvided}
                    onValueChange={setVestsProvided}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={theme.text}
                  />
                </View>

                <View style={[styles.toggleRow, { marginTop: 10 }]}>
                  <Text style={styles.toggleTitle}>Sıcak Duş / Soyunma Odası</Text>
                  <Switch
                    value={showerAvailable}
                    onValueChange={setShowerAvailable}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={theme.text}
                  />
                </View>

                <View style={[styles.toggleRow, { marginTop: 10 }]}>
                  <Text style={styles.toggleTitle}>Otopark Alanı</Text>
                  <Switch
                    value={parkingAvailable}
                    onValueChange={setParkingAvailable}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={theme.text}
                  />
                </View>

                {/* Ek Açıklama */}
                <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>6. DEĞİŞİKLİK NOTU / AÇIKLAMA</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  value={proposalNotes}
                  onChangeText={setProposalNotes}
                  placeholder="Örn: Zemin yenilendi, son saat 22:00 oldu."
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              </View>
            ) : (
              /* ─── GÖRÜNTÜLEME MODU ─── */
              <View style={styles.viewContainer}>
                {/* Puan ve Konum Kartı */}
                <View style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={styles.ratingBadge}>
                      <MaterialIcons name="star" size={16} color="#fbbf24" />
                      <Text style={styles.ratingVal}>{pitch.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.locationText}>{pitch.city} / {pitch.district}</Text>
                  </View>
                  {pitch.address ? (
                    <Text style={styles.addressText}>📍 {pitch.address}</Text>
                  ) : null}
                  {pitch.phone ? (
                    <TouchableOpacity 
                      style={styles.phoneRow} 
                      onPress={() => Linking.openURL(`tel:${pitch.phone}`)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="phone" size={15} color={theme.primary} />
                      <Text style={styles.phoneText}>{pitch.phone} (Ara)</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Ücret Bilgileri */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.blockTitle}>💰 SAHA ÜCRETLERİ</Text>
                  <View style={styles.priceRow}>
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>Tek Maç (Saatlik)</Text>
                      <Text style={[styles.priceValue, { color: theme.primary }]}>
                        {pitch.hourlyFee ? `₺${pitch.hourlyFee}` : 'Belirtilmedi'}
                      </Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>Abone (Saatlik)</Text>
                      <Text style={[styles.priceValue, { color: '#38bdf8' }]}>
                        {pitch.subscriberFee ? `₺${pitch.subscriberFee}` : 'Farklı Tarifede'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Çalışma Saatleri */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.blockTitle}>⏰ ÇALIŞMA SAATLERİ</Text>
                  <View style={styles.hoursBox}>
                    <MaterialIcons name="access-time" size={16} color={theme.primary} />
                    <Text style={styles.hoursText}>
                      İlk Maç: <Text style={{ color: theme.text, fontFamily: Fonts.headlineBold }}>{pitch.openingTime || '09:00'}</Text> • 
                      Kapanış: <Text style={{ color: theme.text, fontFamily: Fonts.headlineBold }}>{pitch.closingTime || '22:00'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Desteklenen Formatlar (Kaça Kaç) */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.blockTitle}>⚽ OYNANABİLEN FORMATLAR</Text>
                  <View style={styles.formatPillRow}>
                    {(pitch.optimalModes || ['7v7']).map(m => (
                      <View key={`view-opt-${m}`} style={styles.optimalPill}>
                        <MaterialIcons name="check" size={12} color={theme.background} />
                        <Text style={styles.optimalPillText}>{m} (İdeal)</Text>
                      </View>
                    ))}
                    {(pitch.tightModes || ['8v8']).map(m => (
                      <View key={`view-tight-${m}`} style={styles.tightPill}>
                        <MaterialIcons name="warning" size={12} color="#b45309" />
                        <Text style={styles.tightPillText}>{m} (Sıkışık)</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Alt Sahalar (Parçalar) */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.blockTitle}>🏟️ MEVCUT SAHALAR ({pitch.subFields.length} Adet)</Text>
                  <View style={styles.subFieldsList}>
                    {pitch.subFields.map(sub => (
                      <View key={sub.id} style={styles.subFieldItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subFieldName}>{sub.name}</Text>
                          <Text style={styles.subFieldMeta}>
                            Zemin: {sub.surface} • {sub.slotType === 'half' ? 'Yarım saat aralıklı (19:30 vb.)' : 'Tam saat aralıklı (20:00 vb.)'}
                          </Text>
                        </View>
                        {sub.lastSlot ? (
                          <View style={styles.lastSlotBadge}>
                            <Text style={styles.lastSlotBadgeText}>Son: {sub.lastSlot}</Text>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Ekipman & Tesis Olanakları */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.blockTitle}>🎽 EKİPMAN KİRALAMA & OLANAKLAR</Text>
                  <View style={styles.amenitiesGrid}>
                    <View style={styles.amenityItem}>
                      <MaterialIcons 
                        name={pitch.equipmentRental?.bootsRental ? "check-circle" : "cancel"} 
                        size={16} 
                        color={pitch.equipmentRental?.bootsRental ? theme.primary : theme.textMuted} 
                      />
                      <Text style={styles.amenityText}>
                        Krampon Kiralama: {pitch.equipmentRental?.bootsRental ? `Var (${pitch.equipmentRental.bootsFee || 50} ₺)` : 'Yok'}
                      </Text>
                    </View>

                    <View style={styles.amenityItem}>
                      <MaterialIcons 
                        name={pitch.equipmentRental?.glovesRental ? "check-circle" : "cancel"} 
                        size={16} 
                        color={pitch.equipmentRental?.glovesRental ? theme.primary : theme.textMuted} 
                      />
                      <Text style={styles.amenityText}>
                        Eldiven Kiralama: {pitch.equipmentRental?.glovesRental ? `Var (${pitch.equipmentRental.glovesFee || 30} ₺)` : 'Yok'}
                      </Text>
                    </View>

                    <View style={styles.amenityItem}>
                      <MaterialIcons 
                        name={pitch.equipmentRental?.vestsProvided !== false ? "check-circle" : "cancel"} 
                        size={16} 
                        color={pitch.equipmentRental?.vestsProvided !== false ? theme.primary : theme.textMuted} 
                      />
                      <Text style={styles.amenityText}>Yelek: Temin Ediliyor</Text>
                    </View>

                    <View style={styles.amenityItem}>
                      <MaterialIcons 
                        name={pitch.equipmentRental?.showerAvailable !== false ? "check-circle" : "cancel"} 
                        size={16} 
                        color={pitch.equipmentRental?.showerAvailable !== false ? theme.primary : theme.textMuted} 
                      />
                      <Text style={styles.amenityText}>Sıcak Duş / Soyunma Odası: Mevcut</Text>
                    </View>

                    <View style={styles.amenityItem}>
                      <MaterialIcons 
                        name={pitch.equipmentRental?.parkingAvailable !== false ? "check-circle" : "cancel"} 
                        size={16} 
                        color={pitch.equipmentRental?.parkingAvailable !== false ? theme.primary : theme.textMuted} 
                      />
                      <Text style={styles.amenityText}>Otopark: Mevcut</Text>
                    </View>
                  </View>
                </View>

                {/* Alt Not / Öneri Çağrısı */}
                <TouchableOpacity 
                  style={styles.contributeCard} 
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="edit" size={18} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contributeTitle}>Bilgiler Eksik veya Değişmiş mi?</Text>
                    <Text style={styles.contributeSub}>
                      Dokunarak güncel fiyat, çalışma saati ve ekipman bilgilerini admine önerebilirsiniz.
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '65%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
  },
  actionBtnEditText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
  },
  actionBtnCancel: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${theme.error}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnSaveText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: theme.surfaceContainerHighest,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // View Mode
  viewContainer: {
    gap: 16,
  },
  statCard: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fbbf2418',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingVal: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: '#fbbf24',
  },
  locationText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
  },
  addressText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text,
    lineHeight: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  phoneText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.primary,
    fontWeight: 'bold',
  },
  sectionBlock: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  blockTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceBox: {
    flex: 1,
    gap: 2,
  },
  priceLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
  },
  priceValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.borderSubtle,
    marginHorizontal: 16,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoursText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
  },
  formatPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optimalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  optimalPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.background,
  },
  tightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tightPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: '#92400e',
  },
  subFieldsList: {
    gap: 8,
  },
  subFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHighest,
    padding: 10,
    borderRadius: 10,
  },
  subFieldName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
  },
  subFieldMeta: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  lastSlotBadge: {
    backgroundColor: `${theme.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lastSlotBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
  },
  amenitiesGrid: {
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text,
  },
  contributeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${theme.primary}12`,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    padding: 14,
    borderRadius: 12,
  },
  contributeTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
  },
  contributeSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },

  // Edit / Form Mode
  formContainer: {
    gap: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.primary}15`,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.text,
    lineHeight: 15,
  },
  formSectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginBottom: 4,
  },
  inputHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginBottom: 4,
  },
  subLabelText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.text,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  modeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  modeChipActiveOptimal: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  modeChipActiveTight: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  modeChipText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.text,
  },
  modeChipTextActive: {
    color: theme.background,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  toggleTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
});
