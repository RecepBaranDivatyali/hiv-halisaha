import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Linking, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { DirectPaymentModal } from '@/components/DirectPaymentModal';
import { PitchReviewModal } from '@/components/PitchReviewModal';
import { MatchStoryModal } from '@/components/MatchStoryModal';
import { WeatherAlertCard } from '@/components/WeatherAlertCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { dbService, MatchModel } from '@/services/dbService';

interface PlayerPayment {
  id: string;
  name: string;
  role: string;
  avatar: string;
  paid: boolean;
  method: 'nakit' | 'online';
  amount: number;
}

export default function MatchRoomScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const params = useLocalSearchParams<{ matchId?: string }>();
  const { matches } = useMatches();
  
  // Realtime match state
  const [remoteMatch, setRemoteMatch] = useState<MatchModel | null>(null);
  
  // Find the active match — prefer the one passed by param, else use the first one
  const fallbackMatch = matches.find(m => m.id === params.matchId) ?? matches[0];
  const activeMatch = remoteMatch ?? fallbackMatch;
  const activeMatchId = params.matchId || fallbackMatch?.id || 'demo-match';

  const matchArena = activeMatch?.arena ?? 'Beşiktaş Arena';
  const matchFee = activeMatch?.fee ?? 150;
  const matchTotalFee = activeMatch?.totalFee ?? 2100;
  const matchMode = activeMatch?.mode ?? '7v7';
  const matchDateTime = activeMatch?.dateTime ?? 'Bugün, 21:00';
  const matchCity = activeMatch?.city ?? 'İstanbul';
  const isOrganizer = activeMatch?.organizer?.toLowerCase().includes('siz') || (activeMatch?.organizerId && activeMatch?.organizerId === user?.uid);
  const [joinTerms, setJoinTerms] = useState(0);
  const [userSlot, setUserSlot] = useState<string | null>(null);
  const [directPayVisible, setDirectPayVisible] = useState(false);
  const [pitchReviewVisible, setPitchReviewVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  
  // Payment State
  const [splitMode, setSplitMode] = useState<'separate' | 'joint'>('separate');
  const [payMethod, setPayMethod] = useState<'cash' | 'online'>('cash');
  const [totalMatchFee, setTotalMatchFee] = useState(2100);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);

  // Firestore live match subscription
  React.useEffect(() => {
    if (params.matchId) {
      const unsub = dbService.subscribeMatch(params.matchId, (doc) => {
        if (doc) {
          setRemoteMatch(doc);
          if (doc.totalFee) setTotalMatchFee(doc.totalFee);
        }
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [params.matchId]);

  // Firestore live chat subscription
  React.useEffect(() => {
    const unsubChat = dbService.subscribeMessages(`match_${activeMatchId}`, (msgs) => {
      if (msgs && msgs.length > 0) {
        setChatMessages(msgs.map(m => ({
          id: m.id || Math.random().toString(),
          name: m.senderName,
          text: m.text,
          color: m.senderId === user?.uid ? theme.secondary : theme.primary,
          isSelf: m.senderId === user?.uid
        })));
      }
    });
    return () => {
      if (unsubChat) unsubChat();
    };
  }, [activeMatchId, user?.uid, theme.primary, theme.secondary]);

  // Sync with real match data
  React.useEffect(() => {
    if (matchTotalFee) setTotalMatchFee(matchTotalFee);
  }, [matchTotalFee]);

  const [playersPayment, setPlayersPayment] = useState<PlayerPayment[]>([]);

  const togglePlayerPayment = (id: string) => {
    setPlayersPayment((prev) =>
      prev.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p))
    );
  };

  const togglePaymentMethod = (id: string) => {
    setPlayersPayment((prev) =>
      prev.map((p) => (p.id === id ? { ...p, method: p.method === 'nakit' ? 'online' : 'nakit' } : p))
    );
  };

  const [isGkFree, setIsGkFree] = useState(false);

  const collectedAmount = playersPayment
    .filter((p) => p.paid)
    .reduce((sum, p) => sum + p.amount, 0);

  // If GK is free, divide total fee by 12 field players instead of 14
  const activePayersCount = isGkFree ? 12 : 14;
  const perPlayerFee = Math.round(totalMatchFee / activePayersCount);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{id: string; name: string; text: string; color: string; isSelf: boolean}[]>([]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    try {
      await dbService.sendMessage(`match_${activeMatchId}`, {
        senderId: user?.uid || 'anon',
        senderName: user?.name || 'Ben',
        senderAvatar: user?.avatar,
        text: text
      });
    } catch (e) {
      console.log('Mesaj gönderme hatası:', e);
      // Fallback local update
      const newMsg = {
        id: Date.now().toString(),
        name: user?.name || 'Ben',
        text: text,
        color: theme.secondary,
        isSelf: true
      };
      setChatMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleSelectSlot = async (slotKey: string, slotLabel: string) => {
    if (userSlot === slotKey) {
      setUserSlot(null);
      if (params.matchId) {
        try {
          await dbService.leaveMatchSlot(params.matchId, slotKey);
          Alert.alert('Ayrıldınız', `${slotLabel} mevkisinden ayrıldınız.`);
        } catch (e) {
          console.error('Slot ayrılma hatası:', e);
          setUserSlot(slotKey); // Rollback
          Alert.alert('Hata', 'Mevkiden ayrılırken bir sorun oluştu.');
        }
      }
    } else {
      const oldSlot = userSlot;
      setUserSlot(slotKey);
      if (params.matchId) {
        try {
          if (oldSlot) {
            await dbService.leaveMatchSlot(params.matchId, oldSlot);
          }
          await dbService.joinMatchSlot(params.matchId, slotKey, {
            uid: user?.uid || 'anon',
            name: user?.name || 'Oyuncu',
            avatar: user?.avatar,
            position: slotLabel
          });
          Alert.alert('Kadroya Girildi', `${slotLabel} mevkiine geçtiniz.`);
        } catch (e) {
          console.error('Slot katılma hatası:', e);
          setUserSlot(oldSlot); // Rollback
          Alert.alert('Hata', 'Mevkiye katılırken bir sorun oluştu veya mevki dolmuş olabilir.');
        }
      } else {
        Alert.alert('Kadroya Girildi', `${slotLabel} mevkiine geçtiniz.`);
      }
    }
  };

  const handleConfirmTerms = async () => {
    Alert.alert('✓ Şartlar Onaylandı', 'Maç katılım şartları kaydedildi.', [{ text: 'Tamam' }]);
  };

  const openVenueLocation = () => {
    const venue = encodeURIComponent(matchArena + ' ' + matchCity);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${venue}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <DirectPaymentModal
          amount={matchFee}
          matchTitle={matchArena + ' • ' + matchMode}
          visible={directPayVisible}
          onClose={() => setDirectPayVisible(false)}
        />
        <PitchReviewModal
          pitchName={matchArena}
          visible={pitchReviewVisible}
          onClose={() => setPitchReviewVisible(false)}
        />
        <MatchStoryModal
          visible={storyModalVisible}
          onClose={() => setStoryModalVisible(false)}
        />

        {/* TopAppBar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>MAÇ ODASI</Text>
          </View>
          <TouchableOpacity style={styles.storyHeaderBtn} onPress={() => setStoryModalVisible(true)}>
            <MaterialIcons name="camera-alt" size={16} color={theme.background} />
            <Text style={styles.storyHeaderBtnText}>STORY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnHover} onPress={openVenueLocation}>
            <MaterialIcons name="location-on" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Live Weather Forecast Alert */}
          <WeatherAlertCard temp="15°C" rainRisk={80} condition="Sağanak Yağış Riski" isOpenField={true} />
          
          {/* Haftalık Düzenli Abonelik Ayarları */}
          <View style={styles.subSettingsCard}>
          <View style={styles.subSettingsHeader}>
            <View style={styles.subSettingsLeft}>
              <MaterialIcons name="update" size={20} color={theme.primary} />
              <View>
                <Text style={styles.subSettingsTitle}>HAFTALIK DÜZENLİ ABONELİK</Text>
                <Text style={styles.subSettingsSub}>{matchDateTime} • {activeMatch?.isSubscription ? 'Otomatik Yenilenir' : 'Tek Seferlik'}</Text>
              </View>
            </View>
            <View style={styles.activeSubBadge}>
              <Text style={styles.activeSubBadgeText}>AKTİF</Text>
            </View>
          </View>

          {isOrganizer && (
            <View style={styles.subActionsRow}>
              <TouchableOpacity 
                style={styles.subActionBtn} 
                onPress={() => Alert.alert('Saat Güncelleme', 'Abonelik saatini 22:00 olarak güncellemek istiyor musunuz?', [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Güncelle', onPress: () => Alert.alert('✓ Başarılı', 'Abonelik saati güncellendi.') }
                ])}
              >
                <MaterialIcons name="access-time" size={14} color={theme.primary} />
                <Text style={styles.subActionText}>Saati Güncelle</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.subActionBtn, { borderColor: `${theme.error}66` }]} 
                onPress={() => Alert.alert('Abonelik İptali', 'Haftalık aboneliğinizi iptal etmek istediğinize emin misiniz?', [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Aboneliği Durdur', style: 'destructive', onPress: () => Alert.alert('İptal Edildi', 'Aboneliğiniz durduruldu.') }
                ])}
              >
                <MaterialIcons name="cancel" size={14} color={theme.error} />
                <Text style={[styles.subActionText, { color: theme.error }]}>Aboneliği Durdur</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Strategy & Field */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: theme.primary }]} />
              <Text style={styles.sectionTitle}>SAHA DİZİLİMİ ({matchMode.toUpperCase()})</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setPitchReviewVisible(true)}>
              <MaterialIcons name="star" size={14} color={theme.primary} />
              <Text style={styles.settingsBtnText}>TESİS PUANI (4.8)</Text>
            </TouchableOpacity>
          </View>

          {/* AI Team Balancer Button */}
          <TouchableOpacity
            style={styles.aiBalanceBtn}
            activeOpacity={0.85}
            onPress={() => {
              Alert.alert(
                '⚖️ Yapay Zeka Takım Dengelendi!',
                'Oyuncuların reyting ve mevkilerine göre kadro tam %50 - %50 eşit güçte A Takımı ve B Takımı olarak dağıtıldı.\n\n• A Takımı Güç Oranı: %50.0 (8.4 Avg)\n• B Takımı Güç Oranı: %50.0 (8.4 Avg)',
                [{ text: 'Kadroya Uygula', style: 'default' }]
              );
            }}
          >
            <MaterialIcons name="balance" size={18} color={theme.primary} />
            <Text style={styles.aiBalanceBtnText}>TAKIMLARI OTOMATİK DENGELER (AI)</Text>
          </TouchableOpacity>

          {/* Field Visualization */}
          <View style={styles.fieldWrap}>
            <View style={styles.fieldBox}>
              <View style={styles.pitchLinesArea}>
                <View style={styles.pitchBorder} />
                <View style={styles.pitchCenterLine} />
                <View style={styles.pitchCenterCircle} />
              </View>

              {/* Kale Dönmeli btn */}
              <TouchableOpacity style={styles.kaleBtn}>
                <MaterialIcons name="sync-alt" size={12} color={theme.primary} />
                <Text style={styles.kaleBtnText}>KALE DÖNMELİ</Text>
              </TouchableOpacity>

              {/* Slots */}
              <View style={styles.formationGrid}>
                {/* Forward */}
                <View style={styles.slotRow}>
                   <View style={styles.slotContainer}>
                     {userSlot === 'FORVET' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('FORVET', 'Forvet')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>9</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('FORVET', 'Forvet')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                     <Text style={[styles.slotLabel, userSlot === 'FORVET' && { color: theme.primary, fontWeight: 'bold' }]}>FORVET</Text>
                   </View>
                </View>
                
                {/* Midfielders */}
                <View style={[styles.slotRow, { justifyContent: 'space-between', paddingHorizontal: 32 }]}>
                   <View style={styles.slotContainer}>
                     {userSlot === 'OS_SOL' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('OS_SOL', 'Sol Orta Saha')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>8</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('OS_SOL', 'Sol Orta Saha')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                   </View>
                   <View style={styles.slotContainer}>
                     <View style={styles.occupiedSlot}>
                       <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEgY_XdNWMIj9yAYPG31RfO-rUvIt9prSpOqQHShIufOnkDbrYIlyKE5OZY68gsCgDSnwxHtMW-j19KupMZmC1tNOq2QEesdu0Hh1zinr1P_g8cyWt1cHFNPGGmiuhIZPaOmTY8ssYbYKbbtC1nP9RVOEgPKgWBYWiA4E6WPsGYKqCpqU3aMljt6lAwmwmmFRefyWbWiaAfQTMPcUlEPjZEzau9MIBiNfLMhzwyqoMX1Po75F4qVfsV9hLp3_uervSUefQPNM33cr' }} style={styles.slotAvatar} />
                       <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>10</Text></View>
                     </View>
                     <Text style={[styles.slotLabel, { color: theme.primary, fontWeight: 'bold' }]}>KAPTAN</Text>
                   </View>
                   <View style={styles.slotContainer}>
                     {userSlot === 'OS_SAG' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('OS_SAG', 'Sağ Orta Saha')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>7</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('OS_SAG', 'Sağ Orta Saha')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                   </View>
                </View>

                {/* Defenders */}
                <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                   <View style={styles.slotContainer}>
                     {userSlot === 'DEF_SOL' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('DEF_SOL', 'Sol Defans')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>3</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('DEF_SOL', 'Sol Defans')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                   </View>
                   <View style={styles.slotContainer}>
                     {userSlot === 'DEF_SAG' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('DEF_SAG', 'Sağ Defans')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>4</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('DEF_SAG', 'Sağ Defans')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                   </View>
                </View>

                {/* GK */}
                <View style={styles.slotRow}>
                   <View style={styles.slotContainer}>
                     {userSlot === 'KALECI' ? (
                       <TouchableOpacity style={styles.occupiedSlot} onPress={() => handleSelectSlot('KALECI', 'Kaleci')}>
                         <Image source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} style={styles.slotAvatar} />
                         <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>1</Text></View>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity style={styles.emptySlot} onPress={() => handleSelectSlot('KALECI', 'Kaleci')}>
                         <MaterialIcons name="add" size={24} color={theme.primary + '66'} />
                       </TouchableOpacity>
                     )}
                     <Text style={[styles.slotLabel, userSlot === 'KALECI' && { color: theme.primary, fontWeight: 'bold' }]}>KALECİ</Text>
                   </View>
                </View>
              </View>
            </View>
          </View>

          {/* Match Settings & Conditions */}
          <View style={styles.termsBox}>
            <Text style={styles.termsBoxTitle}>MAÇA KATILMA ŞARTLARI</Text>
            <View style={styles.termsList}>
              {['Davetle Katılma', 'İstekle Katılma', 'Katılma Kapalı'].map((term, idx) => (
                <TouchableOpacity key={idx} style={styles.termRow} onPress={() => setJoinTerms(idx)}>
                  <View style={[styles.radioOutline, joinTerms === idx && styles.radioActive]}>
                    {joinTerms === idx && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.termText, joinTerms === idx && { color: theme.text }]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmTerms}>
              <Text style={styles.confirmBtnText}>ŞARTLARI ONAYLA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 💳 KAPTAN & OYUNCU HALISAHAYA ÜCRET ÖDEME TAKİBİ MODULE */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.paymentAccordionHeader}
            onPress={() => setShowPaymentDetails(!showPaymentDetails)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="account-balance-wallet" size={20} color={theme.primary} />
              <View>
                <Text style={styles.sectionTitle}>HALISAHAYA ÜCRETİ & KAPTAN TAKİBİ</Text>
                <Text style={styles.paymentSubTitle}>Kişi Başı Tahmini: ₺{perPlayerFee} • Toplam: ₺{totalMatchFee}</Text>
              </View>
            </View>
            <MaterialIcons name={showPaymentDetails ? "expand-less" : "expand-more"} size={24} color={theme.primary} />
          </TouchableOpacity>

          {showPaymentDetails && (
            <View style={styles.paymentBody}>
              {/* Kaleci Ücret Muafiyeti Toggle */}
              <View style={styles.gkFreeToggleBox}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="sports-handball" size={18} color={theme.primary} />
                    <Text style={styles.gkFreeTitle}>KALECİDEN ÜCRET ALINMASIN (ÜCRETSİZ)</Text>
                  </View>
                  <Text style={styles.gkFreeSub}>
                    {isGkFree ? 'Kaleciler muaf tutuldu. Ücret 12 saha oyuncusuna bölündü.' : 'Kaleciler dahil tüm 14 oyuncu ücreti eşit paylaşır.'}
                  </Text>
                </View>
                <Switch
                  value={isGkFree}
                  onValueChange={setIsGkFree}
                  trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                  thumbColor={isGkFree ? theme.text : theme.textMuted}
                />
              </View>

              {/* Split Mode Selector */}
              <Text style={styles.paymentLabel}>1. ÖDEME PAYLAŞIM KURALI</Text>
              <View style={styles.splitToggleRow}>
                <TouchableOpacity 
                  style={[styles.splitBtn, splitMode === 'separate' && styles.splitBtnActive]}
                  onPress={() => setSplitMode('separate')}
                >
                  <MaterialIcons name="groups" size={18} color={splitMode === 'separate' ? theme.onPrimary : theme.textMuted} />
                  <Text style={[styles.splitBtnText, splitMode === 'separate' && styles.splitBtnTextActive]}>TAKIMLAR AYRI</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.splitBtn, splitMode === 'joint' && styles.splitBtnActive]}
                  onPress={() => setSplitMode('joint')}
                >
                  <MaterialIcons name="pie-chart" size={18} color={splitMode === 'joint' ? theme.onPrimary : theme.textMuted} />
                  <Text style={[styles.splitBtnText, splitMode === 'joint' && styles.splitBtnTextActive]}>ORTAK HESAP</Text>
                </TouchableOpacity>
              </View>

              {/* Payment Method Selector */}
              <Text style={[styles.paymentLabel, { marginTop: 16 }]}>2. VARSAYILAN ÖDEME YÖNTEMİ</Text>
              <View style={styles.splitToggleRow}>
                <TouchableOpacity 
                  style={[styles.splitBtn, payMethod === 'cash' && styles.splitBtnActive]}
                  onPress={() => setPayMethod('cash')}
                >
                  <MaterialIcons name="payments" size={18} color={payMethod === 'cash' ? theme.onPrimary : theme.textMuted} />
                  <Text style={[styles.splitBtnText, payMethod === 'cash' && styles.splitBtnTextActive]}>NAKİT (KAPTANA)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.splitBtn, payMethod === 'online' && styles.splitBtnActive]}
                  onPress={() => { setPayMethod('online'); setDirectPayVisible(true); }}
                >
                  <MaterialIcons name="credit-card" size={18} color={payMethod === 'online' ? theme.onPrimary : theme.textMuted} />
                  <Text style={[styles.splitBtnText, payMethod === 'online' && styles.splitBtnTextActive]}>ONLINE (KARTLA)</Text>
                </TouchableOpacity>
              </View>

              {/* Payment Progress Summary */}
              <View style={styles.paymentSummaryCard}>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.summaryLabel}>TOPLANAN KANITLI ÜCRET</Text>
                  <Text style={styles.summaryValue}>₺{collectedAmount} / <Text style={{ color: theme.textMuted }}>₺{totalMatchFee}</Text></Text>
                </View>

                <View style={styles.paymentProgressBg}>
                  <View style={[styles.paymentProgressFill, { width: `${Math.min(100, Math.round((collectedAmount / totalMatchFee) * 100))}%` }]} />
                </View>
                <Text style={styles.progressPercentText}>%{Math.round((collectedAmount / totalMatchFee) * 100)} Tamamlandı</Text>
              </View>

              {/* Captain Player Payment List */}
              <Text style={[styles.paymentLabel, { marginTop: 20, marginBottom: 8 }]}>3. OYUNCU ÖDEME DURUMU (KAPTAN DÜZENLEMESİ)</Text>
              <View style={styles.paymentPlayerList}>
                {playersPayment.map((player) => (
                  <View key={player.id} style={styles.playerPayCard}>
                    <Image source={{ uri: player.avatar }} style={styles.playerPayAvatar} />
                    <View style={styles.playerPayInfo}>
                      <Text style={styles.playerPayName}>{player.name}</Text>
                      <View style={styles.playerPaySubRow}>
                        <Text style={styles.playerPayRole}>{player.role}</Text>
                        <TouchableOpacity onPress={() => togglePaymentMethod(player.id)}>
                          <Text style={styles.playerPayMethodTag}>
                            {player.method === 'nakit' ? '💵 Nakit' : '💳 Online'} (Değiştir)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[styles.payStatusBtn, player.paid ? styles.payStatusPaid : styles.payStatusUnpaid]}
                      onPress={() => togglePlayerPayment(player.id)}
                    >
                      <MaterialIcons name={player.paid ? "check-circle" : "cancel"} size={16} color={player.paid ? theme.onPrimary : theme.error} />
                      <Text style={[styles.payStatusBtnText, player.paid ? { color: theme.onPrimary } : { color: theme.error }]}>
                        {player.paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

            </View>
          )}
        </View>

        {/* Players List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: theme.secondary }]} />
              <Text style={styles.sectionTitle}>MEVCUT OYUNCULAR</Text>
            </View>
          </View>
          
          <View style={styles.playersList}>
            {playersPayment.length === 0 ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
                  Henüz kadroya katılan oyuncu yok. Sahadaki boş bir mevkiye tıklayarak ilk siz katılın!
                </Text>
              </View>
            ) : (
              playersPayment.map((player) => {
                const isCurrent = player.name.includes('Siz') || (player.name === user?.name);
                return (
                  <View key={player.id} style={[styles.playerItem, { borderLeftColor: isCurrent ? theme.primary : 'transparent' }]}>
                    <View style={styles.playerItemLeft}>
                      <Image source={{ uri: player.avatar || user?.avatar }} style={styles.playerAvatar} />
                      <View>
                        <Text style={styles.playerName}>{player.name} {isCurrent ? '(Siz)' : ''}</Text>
                        <Text style={styles.playerRole}>{player.role}</Text>
                      </View>
                    </View>
                    {isCurrent ? (
                      <TouchableOpacity onPress={() => userSlot && handleSelectSlot(userSlot, player.role)}>
                        <MaterialIcons name="logout" size={20} color={theme.error} />
                      </TouchableOpacity>
                    ) : (
                      <MaterialIcons name="verified" size={18} color={theme.primary} />
                    )}
                  </View>
                );
              })
            )}
            
            <View style={styles.playerCountFooter}>
              <Text style={styles.playerCountText}>{playersPayment.length} / {activeMatch?.totalRequiredPlayers ?? 14} OYUNCU KATILDI</Text>
            </View>
          </View>
        </View>

        {/* Chat */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="chat" size={18} color={theme.secondary} />
              <Text style={styles.sectionTitle}>MAÇ SOHBETİ</Text>
            </View>
            <View style={styles.liveIndicator} />
          </View>

          <View style={styles.chatBox}>
            <ScrollView style={styles.chatList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {chatMessages.map((msg) => (
                <View key={msg.id} style={[msg.isSelf ? styles.chatMsgSelf : styles.chatMsgOther, { marginBottom: 12 }]}>
                  <Text style={[styles.chatName, { color: msg.color, textAlign: msg.isSelf ? 'right' : 'left' }]}>{msg.name}</Text>
                  <View style={msg.isSelf ? styles.chatBubbleSelf : styles.chatBubbleOther}>
                    <Text style={styles.chatText}>{msg.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputWrap}>
              <TextInput 
                style={styles.chatInput}
                placeholder="Mesaj yazın..."
                placeholderTextColor={theme.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
                <MaterialIcons name="send" size={16} color={theme.background} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 40},
  sectionContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 24,
    overflow: 'hidden'},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle},
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  sectionHeaderBar: {
    width: 4,
    height: 24,
    borderRadius: 2},
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    textTransform: 'uppercase',
    letterSpacing: -0.5},
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8},
  settingsBtnText: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 1},
  fieldWrap: {
    padding: 16},
  fieldBox: {
    backgroundColor: theme.surface,
    aspectRatio: 4/3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    position: 'relative',
    overflow: 'hidden'},
  pitchLinesArea: {
    ...StyleSheet.absoluteFillObject,
    padding: 16},
  pitchBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: `${theme.primary}15`},
  pitchCenterLine: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    left: '50%',
    width: 2,
    backgroundColor: `${theme.primary}15`,
    transform: [{ translateX: -1 }]},
  pitchCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: `${theme.primary}15`,
    transform: [{ translateX: -50 }, { translateY: -50 }]},
  kaleBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.borderSubtle,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10},
  kaleBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.5},
  formationGrid: {
    ...StyleSheet.absoluteFillObject,
    padding: 32,
    justifyContent: 'space-between'},
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'},
  slotContainer: {
    alignItems: 'center'},
  emptySlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${theme.primary}66`,
    backgroundColor: `${theme.surfaceContainerHighest}80`,
    alignItems: 'center',
    justifyContent: 'center'},
  occupiedSlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15},
  slotAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26},
  slotBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'},
  slotBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.onPrimary},
  slotLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginTop: 4},
  termsBox: {
    backgroundColor: theme.surface,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle},
  termsBoxTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.primary,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    marginBottom: 16},
  termsList: {
    gap: 12,
    marginBottom: 24},
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  radioOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.textMuted,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center'},
  radioActive: {
    borderColor: theme.primary},
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary},
  termText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500'},
  confirmBtn: {
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'},
  confirmBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.5},
  
  // Payment Module Styles
  paymentAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.surfaceContainer},
  paymentSubTitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2},
  paymentBody: {
    padding: 16,
    backgroundColor: theme.surface},
  paymentLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8},
  splitToggleRow: {
    flexDirection: 'row',
    gap: 12},
  splitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle},
  splitBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary},
  splitBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.textMuted},
  splitBtnTextActive: {
    color: theme.onPrimary},
  paymentSummaryCard: {
    backgroundColor: theme.surfaceContainer,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    marginTop: 16},
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8},
  summaryLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase'},
  summaryValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 18,
    color: theme.primary},
  paymentProgressBg: {
    height: 8,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6},
  paymentProgressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4},
  progressPercentText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    textAlign: 'right'},
  paymentPlayerList: {
    gap: 8},
  playerPayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainer,
    padding: 10,
    borderRadius: 8,
    gap: 12},
  playerPayAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18},
  playerPayInfo: {
    flex: 1},
  playerPayName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text},
  playerPaySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2},
  playerPayRole: {
    fontFamily: Fonts.label,
    fontSize: 9,
    color: theme.textMuted},
  playerPayMethodTag: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.secondary,
    fontWeight: 'bold'},
  payStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6},
  payStatusPaid: {
    backgroundColor: `${theme.primary}26`,
    borderWidth: 1,
    borderColor: theme.primary},
  payStatusUnpaid: {
    backgroundColor: `${theme.error}26`,
    borderWidth: 1,
    borderColor: theme.error},
  payStatusBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10},

  playersList: {
    padding: 16,
    gap: 16},
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHighest,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4},
  playerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border},
  playerName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
    letterSpacing: -0.5},
  playerRole: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase'},
  playerCountFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    alignItems: 'center'},
  playerCountText: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5},
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8},
  chatBox: {
    height: 320},
  chatList: {
    flex: 1,
    padding: 16},
  chatMsgOther: {
    gap: 4},
  chatMsgSelf: {
    gap: 4,
    alignItems: 'flex-end'},
  chatName: {
    fontFamily: Fonts.label,
    fontSize: 10,
    textTransform: 'uppercase'},
  chatBubbleOther: {
    backgroundColor: theme.surfaceContainerHighest,
    padding: 8,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    maxWidth: '85%'},
  chatBubbleSelf: {
    backgroundColor: `${theme.secondary}33`,
    borderWidth: 1,
    borderColor: `${theme.secondary}33`,
    padding: 8,
    borderRadius: 8,
    borderTopRightRadius: 0,
    maxWidth: '85%'},
  chatText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text},
  chatInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.surfaceContainer},
  chatInput: {
    flex: 1,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text},
  chatSendBtn: {
    backgroundColor: theme.primary,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'},

  storyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
    marginRight: 8,
  },
  storyHeaderBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.onPrimary,
    letterSpacing: 0.5,
  },
  aiBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${theme.primary}1E`,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  aiBalanceBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  gkFreeToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHigh,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
  },
  gkFreeTitle: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.text },
  gkFreeSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  subSettingsCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
    gap: 12,
  },
  subSettingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subSettingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subSettingsTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text, letterSpacing: 0.5 },
  subSettingsSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
  activeSubBadge: { backgroundColor: `${theme.primary}26`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeSubBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 9, color: theme.primary },
  subActionsRow: { flexDirection: 'row', gap: 10 },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.surfaceContainerHigh,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
  },
  subActionText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.primary },
});
