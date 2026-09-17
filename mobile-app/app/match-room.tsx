import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Linking, Switch, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { MatchPaymentModal } from '@/components/MatchPaymentModal';
import { PitchReviewModal } from '@/components/PitchReviewModal';
import { MatchStoryModal } from '@/components/MatchStoryModal';
import { WeatherAlertCard } from '@/components/WeatherAlertCard';
import { AppModal as Modal } from '@/components/AppModal';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useMatches } from '@/hooks/use-matches';
import { useAuth } from '@/hooks/use-auth';
import { dbService, MatchModel } from '@/services/dbService';

interface PlayerPayment {
  slotKey: string;
  uid: string;
  name: string;
  role: string;
  avatar: string;
  paid: boolean;
  paymentStatus: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt';
  paymentMethod: 'iban' | 'cash';
  amount: number;
  isGk: boolean;
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

  const openVenueLocation = () => {
    const query = encodeURIComponent(`${matchArena} ${matchCity}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const isOrganizer = activeMatch?.organizer?.toLowerCase().includes('siz') || (activeMatch?.organizerId && activeMatch?.organizerId === user?.uid);
  const isCaptainA = isOrganizer || Boolean(activeMatch?.captainAId && activeMatch?.captainAId === user?.uid);
  const isCaptainB = Boolean(activeMatch?.captainBId && activeMatch?.captainBId === user?.uid);
  const hasCaptainB = Boolean(activeMatch?.captainBId);
  const isTwoCaptainsMode = activeMatch?.matchFormatType === 'two_captains' || hasCaptainB;
  const [joinTerms, setJoinTerms] = useState(activeMatch?.joinTerms ?? 0);
  const [userSlot, setUserSlot] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  const [directPayVisible, setDirectPayVisible] = useState(false);
  const [pitchReviewVisible, setPitchReviewVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  
  // Score modal state for captain
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreTeamA, setScoreTeamA] = useState('7');
  const [scoreTeamB, setScoreTeamB] = useState('5');
  const [submittingScore, setSubmittingScore] = useState(false);

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
          if (doc.joinTerms !== undefined) setJoinTerms(doc.joinTerms);
        }
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [params.matchId]);

  // Dynamic Pitch Rating
  const [pitchRating, setPitchRating] = useState<number>(4.8);

  const fetchPitchScore = React.useCallback(async () => {
    if (!matchArena) return;
    try {
      const reviews = await dbService.getPitchReviews(matchArena);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setPitchRating(parseFloat(avg.toFixed(1)));
      }
    } catch {
      // keep fallback
    }
  }, [matchArena]);

  React.useEffect(() => {
    fetchPitchScore();
  }, [fetchPitchScore]);

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

  // Sync userSlot from Firestore match slots
  React.useEffect(() => {
    if (activeMatch?.slots && user?.uid) {
      const foundSlot = Object.keys(activeMatch.slots).find(
        (key) => activeMatch.slots?.[key]?.uid === user.uid
      );
      if (foundSlot) {
        setUserSlot(foundSlot);
        if (foundSlot.startsWith('B_')) {
          setActiveTeam('B');
        } else {
          setActiveTeam('A');
        }
      }
    }
  }, [activeMatch?.slots, user?.uid]);

  const [isGkFree, setIsGkFree] = useState(activeMatch?.isGkFree ?? false);

  React.useEffect(() => {
    if (activeMatch?.isGkFree !== undefined) {
      setIsGkFree(activeMatch.isGkFree);
    }
  }, [activeMatch?.isGkFree]);

  // Dynamic players and fee calculation based on match mode
  const modePlayersPerTeam = parseInt(matchMode.split('v')[0], 10) || 7;
  const totalPlayersCount = modePlayersPerTeam * 2;
  const activePayersCount = isGkFree ? Math.max(1, totalPlayersCount - 2) : totalPlayersCount;
  const perPlayerFee = Math.round(totalMatchFee / activePayersCount);

  // Dynamic Roster Payments synchronized with Firestore slots
  const rosterPayments: PlayerPayment[] = React.useMemo(() => {
    const slots = activeMatch?.slots || {};
    const list: PlayerPayment[] = [];

    Object.entries(slots).forEach(([slotKey, slotData]) => {
      if (!slotData || !slotData.uid) return;
      const isGk = slotKey.includes('KALECI');
      const isExempt = isGkFree && isGk;
      const isPaid = Boolean(slotData.paid) || slotData.paymentStatus === 'paid';
      const paymentStatus: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt' = isExempt
        ? 'exempt'
        : (slotData.paymentStatus || (isPaid ? 'paid' : 'unpaid'));

      list.push({
        slotKey,
        uid: slotData.uid,
        name: slotData.name,
        role: slotData.position || slotKey,
        avatar: slotData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        paid: isPaid,
        paymentStatus,
        paymentMethod: slotData.paymentMethod || 'cash',
        amount: isExempt ? 0 : perPlayerFee,
        isGk
      });
    });

    return list;
  }, [activeMatch?.slots, isGkFree, perPlayerFee]);

  const collectedPaidAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectedCashAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'cash_on_pitch')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovalAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'pending_approval')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollectedOrPledged = collectedPaidAmount + collectedCashAmount;
  const unpaidAmount = Math.max(0, totalMatchFee - collectedPaidAmount - collectedCashAmount);

  // Team A & Team B Subtotals for 2-Captain Mode
  const rosterPaymentsA = rosterPayments.filter(p => p.slotKey.startsWith('A_'));
  const rosterPaymentsB = rosterPayments.filter(p => p.slotKey.startsWith('B_'));

  const teamAPaid = rosterPaymentsA
    .filter(p => p.paymentStatus === 'paid' || p.paymentStatus === 'cash_on_pitch')
    .reduce((sum, p) => sum + p.amount, 0);

  const teamBPaid = rosterPaymentsB
    .filter(p => p.paymentStatus === 'paid' || p.paymentStatus === 'cash_on_pitch')
    .reduce((sum, p) => sum + p.amount, 0);

  const teamATotal = Math.round(totalMatchFee / 2);
  const teamBTotal = totalMatchFee - teamATotal;

  // Assign or remove B Captain
  const handleAssignCaptainB = (playerUid: string, playerName: string) => {
    if (!isOrganizer) return;
    const isCurrentlyCaptainB = Boolean(activeMatch?.captainBId && activeMatch.captainBId === playerUid);

    Alert.alert(
      isCurrentlyCaptainB ? 'B Kaptanlığını Kaldır' : 'B Takımı Kaptanı Ata',
      isCurrentlyCaptainB 
        ? `${playerName} oyuncusunun B Takımı Kaptanlığı yetkisini kaldırmak istiyor musunuz?`
        : `${playerName} oyuncusunu B Takımı Kaptanı (Rakip Kaptan) olarak yetkilendirmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: isCurrentlyCaptainB ? 'Kaptanlığı Kaldır' : 'Kaptan Olarak Ata',
          style: isCurrentlyCaptainB ? 'destructive' : 'default',
          onPress: async () => {
            if (!activeMatchId) return;
            try {
              if (isCurrentlyCaptainB) {
                await dbService.updateMatchCaptainB(activeMatchId, null, null);
                await dbService.sendMessage(`match_${activeMatchId}`, {
                  senderId: user?.uid || 'anon',
                  senderName: 'Organizatör',
                  text: `ℹ️ [Kaptan Güncellemesi]: ${playerName} oyuncusunun B Takımı Kaptanlığı kaldırıldı.`
                });
                Alert.alert('Güncellendi', `${playerName} artık B Takımı Kaptanı değil.`);
              } else {
                await dbService.updateMatchCaptainB(activeMatchId, playerUid, playerName);
                await dbService.sendMessage(`match_${activeMatchId}`, {
                  senderId: user?.uid || 'anon',
                  senderName: 'Organizatör',
                  text: `⭐ [Kaptan Ataması]: ${playerName} B Takımı Kaptanı (Rakip Kaptan) olarak belirlendi!`
                });
                Alert.alert('✓ Kaptan Atandı', `${playerName} B Takımı Kaptanı olarak belirlendi.`);
              }
            } catch (e) {
              Alert.alert('Hata', 'Kaptan yetkisi güncellenirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  // Captain Quick Payment Toggle
  const handleCaptainTogglePayment = (slotKey: string, playerName: string, currentStatus: string, playerUid?: string) => {
    const isTargetInTeamB = slotKey.startsWith('B_');
    const canManageThisPlayer = isOrganizer || (isCaptainB && isTargetInTeamB);

    if (!canManageThisPlayer) return;

    if (currentStatus === 'exempt') {
      Alert.alert('Muaf Oyuncu', 'Bu oyuncu kaleci olduğu için maç kuralları gereği ücret muafiyetine sahiptir.');
      return;
    }

    const isSlotCaptainB = Boolean(playerUid && activeMatch?.captainBId === playerUid);

    const buttons: any[] = [
      {
        text: '✅ Ödendi Olarak Onayla',
        onPress: async () => {
          try {
            await dbService.updateSlotPayment(activeMatchId, slotKey, true, 'paid');
            await dbService.sendMessage(`match_${activeMatchId}`, {
              senderId: user?.uid || 'anon',
              senderName: isOrganizer ? 'Organizatör' : 'B Kaptanı',
              text: `✅ [Ödeme Onayı]: ${playerName} oyuncusunun maç ücreti alındı ve "ÖDENDİ" olarak işaretlendi.`
            });
          } catch (e) {
            Alert.alert('Hata', 'Ödeme durumu güncellenemedi.');
          }
        }
      },
      {
        text: '💵 Sahada Nakit Olarak İşaretle',
        onPress: async () => {
          try {
            await dbService.updateSlotPayment(activeMatchId, slotKey, false, 'cash_on_pitch', 'cash');
          } catch (e) {
            Alert.alert('Hata', 'Ödeme durumu güncellenemedi.');
          }
        }
      },
      {
        text: '❌ Ödenmedi Yap',
        style: 'destructive',
        onPress: async () => {
          try {
            await dbService.updateSlotPayment(activeMatchId, slotKey, false, 'unpaid');
          } catch (e) {
            Alert.alert('Hata', 'Ödeme durumu güncellenemedi.');
          }
        }
      }
    ];

    if (isOrganizer && isTargetInTeamB && playerUid && playerUid !== user?.uid) {
      buttons.unshift({
        text: isSlotCaptainB ? '⭐ B Kaptanlığını Kaldır' : '⭐ B Takımı Kaptanı Yap',
        onPress: () => handleAssignCaptainB(playerUid, playerName)
      });
    }

    buttons.push({ text: 'Vazgeç', style: 'cancel' });

    Alert.alert(
      `Oyuncu Yönetimi: ${playerName}`,
      `${isOrganizer ? 'Organizatör' : 'B Kaptanı'} olarak işlem seçin:`,
      buttons
    );
  };

  // Captain IBAN Modal state
  const [captainIbanModalVisible, setCaptainIbanModalVisible] = useState(false);
  const [captainIbanInput, setCaptainIbanInput] = useState(activeMatch?.organizerIban || user?.iban || '');
  const [captainIbanNameInput, setCaptainIbanNameInput] = useState(activeMatch?.organizerIbanName || user?.ibanName || user?.name || '');
  const [captainBankNameInput, setCaptainBankNameInput] = useState(activeMatch?.organizerBankName || user?.bankName || '');
  const [savingCaptainIban, setSavingCaptainIban] = useState(false);

  const handleSaveCaptainIban = async () => {
    if (!captainIbanInput.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen geçerli bir IBAN girin.');
      return;
    }
    setSavingCaptainIban(true);
    try {
      await dbService.updateMatchOrganizerIban(activeMatchId, {
        organizerIban: captainIbanInput.trim().toUpperCase(),
        organizerIbanName: captainIbanNameInput.trim(),
        organizerBankName: captainBankNameInput.trim() || 'Banka Hesabı'
      });
      setCaptainIbanModalVisible(false);
      Alert.alert('✓ IBAN Kaydedildi', 'Kaptan IBAN bilgileriniz güncellendi. Oyuncular artık bu IBAN\'ı görerek FAST ile maç ücretini gönderebilir.');
    } catch (e) {
      Alert.alert('Hata', 'IBAN bilgileri güncellenirken bir sorun oluştu.');
    } finally {
      setSavingCaptainIban(false);
    }
  };

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

  // Remaining hours calculation for tiered penalty
  const calculateHoursUntilMatch = (dateTimeStr: string): number => {
    try {
      const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
      const now = new Date();
      if (timeMatch) {
        const h = parseInt(timeMatch[1], 10);
        const m = parseInt(timeMatch[2], 10);
        const target = new Date();
        target.setHours(h, m, 0, 0);
        if (target.getTime() < now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        return (target.getTime() - now.getTime()) / (1000 * 3600);
      }
    } catch {}
    return 25; // Default: > 24 hours
  };

  const executeLeaveSlot = async (slotKey: string, slotLabel: string, penaltyPercent: number) => {
    setUserSlot(null);
    if (params.matchId) {
      try {
        await dbService.leaveMatchSlot(params.matchId, slotKey, user?.uid);
        if (penaltyPercent > 0 && user?.uid) {
          const newScore = await dbService.updateUserReliability(user.uid, penaltyPercent);
          Alert.alert(
            'Mevkiden Ayrıldınız',
            `${slotLabel} mevkisinden ayrıldınız.\n\n⚠️ Geç iptal nedeniyle Güvenilirlik Puanınız %${penaltyPercent} düşürüldü. (Yeni Puanınız: %${newScore})`
          );
        } else {
          Alert.alert('Ayrıldınız', `${slotLabel} mevkisinden ayrıldınız.`);
        }
      } catch (e) {
        console.error('Slot ayrılma hatası:', e);
        setUserSlot(slotKey); // Rollback
        Alert.alert('Hata', 'Mevkiden ayrılırken bir sorun oluştu.');
      }
    } else {
      Alert.alert('Ayrıldınız', `${slotLabel} mevkisinden ayrıldınız.`);
    }
  };

  const handleSelectSlot = async (slotKey: string, slotLabel: string) => {
    if (!user?.uid) {
      Alert.alert('Giriş Yapın', 'Kadroya katılmak veya mevkiden ayrılmak için lütfen önce giriş yapın.');
      return;
    }

    if (userSlot === slotKey) {
      // User is attempting to leave the slot -> apply tiered penalty!
      const hoursLeft = calculateHoursUntilMatch(matchDateTime);
      if (hoursLeft <= 2) {
        Alert.alert(
          '🚨 ACİL MAÇ BOZMA UYARISI',
          `Maça 2 saatten az süre kaldı (${hoursLeft.toFixed(1)} saat)! Son dakika ayrılmak kadroyu eksik bırakır ve maçı tehlikeye atar.\n\nKadrodan ayrılırsanız Güvenilirlik Puanınız %15 düşürülecektir. Devam edilsin mi?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            { 
              text: 'Evet, Ayrıl (%15 Ceza)', 
              style: 'destructive',
              onPress: () => executeLeaveSlot(slotKey, slotLabel, 15)
            }
          ]
        );
      } else if (hoursLeft <= 6) {
        Alert.alert(
          '⚠️ Ciddi İptal Uyarısı',
          `Maça 6 saatten az süre kaldı (${hoursLeft.toFixed(1)} saat)! Kadroyu eksik bırakmak maçı riske atar.\n\nAyrılırsanız Güvenilirlik Puanınız %8 düşecektir. Devam etmek istiyor musunuz?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            { 
              text: 'Ayrıl (%8 Ceza)', 
              style: 'destructive',
              onPress: () => executeLeaveSlot(slotKey, slotLabel, 8)
            }
          ]
        );
      } else if (hoursLeft <= 24) {
        Alert.alert(
          '⚠️ Geç İptal Uyarısı',
          `Maça 24 saatten az süre kaldı (${Math.round(hoursLeft)} saat). Ayrılırsanız Güvenilirlik Puanınız %3 düşecektir. Onaylıyor musunuz?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            { 
              text: 'Ayrıl (%3 Ceza)', 
              style: 'destructive',
              onPress: () => executeLeaveSlot(slotKey, slotLabel, 3)
            }
          ]
        );
      } else {
        Alert.alert(
          'Kadrodan Ayrıl',
          `${slotLabel} mevkisinden ayrılmak istediğinize emin misiniz? (Maça 24 saatten fazla olduğu için ceza uygulanmaz)`,
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayrıl', style: 'destructive', onPress: () => executeLeaveSlot(slotKey, slotLabel, 0) }
          ]
        );
      }
      return;
    }

    // Check if slot is occupied by someone else
    const existingOccupant = activeMatch?.slots?.[slotKey];
    if (existingOccupant && existingOccupant.uid !== user?.uid) {
      Alert.alert('Mevki Dolu', `Bu mevki ${existingOccupant.name} tarafından doldurulmuştur.`);
      return;
    }

    const oldSlot = userSlot;
    setUserSlot(slotKey);
    if (params.matchId) {
      try {
        if (oldSlot) {
          await dbService.leaveMatchSlot(params.matchId, oldSlot, user?.uid);
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
  };

  const handleConfirmTerms = async () => {
    if (params.matchId) {
      try {
        await dbService.updateMatchTerms(params.matchId, joinTerms);
        Alert.alert('✓ Şartlar Kaydedildi', 'Maç katılım kuralları başarıyla güncellendi.', [{ text: 'Tamam' }]);
      } catch (e) {
        Alert.alert('Hata', 'Katılım şartları güncellenirken bir sorun oluştu.');
      }
    } else {
      Alert.alert('✓ Şartlar Onaylandı', 'Maç katılım şartları kaydedildi.', [{ text: 'Tamam' }]);
    }
  };

  const handleFinishMatch = async () => {
    if (submittingScore) return;
    setSubmittingScore(true);
    try {
      const finalScore = `${scoreTeamA.trim()} - ${scoreTeamB.trim()}`;
      if (params.matchId) {
        await dbService.updateMatchScore(params.matchId, finalScore);
      }
      setScoreModalVisible(false);
      Alert.alert(
        '🏆 Maç Tamamlandı!',
        `Maç skoru ${finalScore} olarak sisteme işlendi. Şimdi maçtaki oyuncuları puanlayabilirsiniz.`,
        [
          { 
            text: 'Oyuncuları Puanla', 
            onPress: () => router.push({ pathname: '/rate-match', params: { matchId: activeMatchId, matchScore: finalScore } }) 
          },
          { text: 'Tamam', onPress: () => router.back() }
        ]
      );
    } catch (e) {
      console.error('Maç tamamlama hatası:', e);
      Alert.alert('Hata', 'Skor kaydedilirken bir sorun oluştu.');
    } finally {
      setSubmittingScore(false);
    }
  };

  // WhatsApp & Social Share
  const handleShareMatch = async () => {
    try {
      const remainingCount = Math.max(0, totalPlayersCount - rosterPayments.length);
      const shareMessage = `⚽ H.İ.V. Halısaha Maç Daveti!\n\n🏟️ Saha: ${matchArena} (${matchCity})\n📅 Tarih: ${matchDateTime}\n👥 Format: ${matchMode} (${remainingCount > 0 ? `${remainingCount} oyuncu aranıyor!` : 'Kadro dolmak üzere!'})\n💰 Ücret: ₺${perPlayerFee} / Kişi\n\nKadroya katılıp mevkini seçmek için hemen maça katıl!`;
      await Share.share({
        message: shareMessage,
        title: `${matchArena} Halısaha Maçı`,
      });
    } catch (error) {
      console.log('Paylaşım hatası:', error);
    }
  };

  // Organizer: Cancel / Delete Match
  const handleCancelMatch = () => {
    if (!isOrganizer) return;
    Alert.alert(
      'Maçı İptal Et',
      'Bu maçı yayından kaldırmak ve iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Maçı İptal Et', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.deleteMatch(activeMatchId);
              Alert.alert('İptal Edildi', 'Maçınız başarıyla iptal edildi.');
              router.replace('/(tabs)/matches');
            } catch (e) {
              Alert.alert('Hata', 'Maç iptal edilirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  // Reserve Join Handler
  const handleJoinReserve = async () => {
    if (!user?.uid) {
      Alert.alert('Giriş Yapın', 'Yedek sırasına girmek için lütfen giriş yapın.');
      return;
    }
    try {
      await dbService.joinMatchReserve(activeMatchId, {
        uid: user.uid,
        name: user.name || 'Oyuncu',
        avatar: user.avatar
      });
      Alert.alert('✓ Yedek Sırasındasınız', 'Kadroda boş yer açıldığında veya bir oyuncu ayrıldığında size bildirim gönderilecektir.');
    } catch (e) {
      Alert.alert('Hata', 'Yedek sırasına eklenirken bir sorun oluştu.');
    }
  };

  // Player counts for Team A & Team B
  const matchSlots = activeMatch?.slots || {};
  const teamAPlayers = Object.keys(matchSlots).filter(k => 
    (k.startsWith('A_') || (!k.startsWith('B_') && ['FORVET', 'OS_SOL', 'OS_SAG', 'DEF_SOL', 'DEF_SAG', 'KALECI', 'KAPTAN', 'OS_ORTA'].includes(k))) && matchSlots[k]
  );
  const teamBPlayers = Object.keys(matchSlots).filter(k => k.startsWith('B_') && matchSlots[k]);
  const teamACount = teamAPlayers.length;
  const teamBCount = teamBPlayers.length;

  const renderSlotItem = (keySuffix: string, roleName: string, numberStr: string) => {
    const slotKey = `${activeTeam}_${keySuffix}`;
    const isSelectedByMe = userSlot === slotKey;
    const legacyKey = keySuffix;
    const occupant = activeMatch?.slots?.[slotKey] || (activeTeam === 'A' ? activeMatch?.slots?.[legacyKey] : null);
    const isOccupied = !!occupant;
    const isMySlot = isSelectedByMe || (occupant && occupant.uid === user?.uid);
    const teamColor = activeTeam === 'A' ? theme.primary : theme.secondary;

    const avatarUrl = isMySlot
      ? (user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG')
      : (occupant?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEgY_XdNWMIj9yAYPG31RfO-rUvIt9prSpOqQHShIufOnkDbrYIlyKE5OZY68gsCgDSnwxHtMW-j19KupMZmC1tNOq2QEesdu0Hh1zinr1P_g8cyWt1cHFNPGGmiuhIZPaOmTY8ssYbYKbbtC1nP9RVOEgPKgWBYWiA4E6WPsGYKqCpqU3aMljt6lAwmwmmFRefyWbWiaAfQTMPcUlEPjZEzau9MIBiNfLMhzwyqoMX1Po75F4qVfsV9hLp3_uervSUefQPNM33cr');

    const isGk = slotKey.includes('KALECI');
    const isSlotExempt = isGkFree && isGk;
    const isPaid = occupant?.paid || occupant?.paymentStatus === 'paid';
    const isPending = occupant?.paymentStatus === 'pending_approval';
    const isCash = occupant?.paymentStatus === 'cash_on_pitch';

    let badgeText = 'ÖDENMEDİ';
    let badgeColor = theme.error;
    let badgeIcon: any = 'cancel';
    if (isSlotExempt) {
      badgeText = 'MUAF';
      badgeColor = theme.secondary;
      badgeIcon = 'sports-handball';
    } else if (isPaid) {
      badgeText = 'ÖDENDİ';
      badgeColor = theme.primary;
      badgeIcon = 'check-circle';
    } else if (isPending) {
      badgeText = 'BEKLİYOR';
      badgeColor = '#ffb703';
      badgeIcon = 'hourglass-top';
    } else if (isCash) {
      badgeText = 'NAKİT';
      badgeColor = '#6e9bff';
      badgeIcon = 'payments';
    }

    return (
      <View style={styles.slotContainer}>
        {isOccupied || isMySlot ? (
          <TouchableOpacity 
            style={[styles.occupiedSlot, isMySlot && { borderColor: teamColor, borderWidth: 2 }]} 
            onPress={() => handleSelectSlot(slotKey, roleName)}
          >
            <Image source={{ uri: avatarUrl }} style={styles.slotAvatar} />
            <View style={[styles.slotBadge, { backgroundColor: teamColor }]}>
              <Text style={[styles.slotBadgeText, { color: theme.background }]}>{numberStr}</Text>
            </View>
            {/* Captain / Organizer Crown Badge */}
            {(() => {
              const occUid = isMySlot ? user?.uid : occupant?.uid;
              const isOrg = occUid && (occUid === activeMatch?.organizerId || occUid === activeMatch?.captainAId || (slotKey === 'A_FORVET_1' && activeMatch?.organizerId === occUid));
              const isCapB = occUid && activeMatch?.captainBId && occUid === activeMatch.captainBId;
              if (isOrg) {
                return (
                  <View style={styles.slotCaptainCrownOrg}>
                    <Text style={styles.slotCaptainCrownText}>👑</Text>
                  </View>
                );
              }
              if (isCapB) {
                return (
                  <View style={styles.slotCaptainCrownB}>
                    <Text style={styles.slotCaptainCrownText}>⭐</Text>
                  </View>
                );
              }
              return null;
            })()}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.emptySlot, { borderColor: `${teamColor}66` }]} 
            onPress={() => handleSelectSlot(slotKey, roleName)}
          >
            <MaterialIcons name="add" size={24} color={teamColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.slotLabel, isMySlot && { color: teamColor, fontWeight: 'bold' }]} numberOfLines={1}>
          {isOccupied ? occupant?.name : roleName}
        </Text>
        {(isOccupied || isMySlot) && (
          <TouchableOpacity 
            style={[styles.slotPaymentPill, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}
            onPress={() => {
              const occUid = isMySlot ? user?.uid : occupant?.uid;
              const occName = isMySlot ? user?.name : occupant?.name;
              if (isOrganizer || (isCaptainB && slotKey.startsWith('B_'))) {
                handleCaptainTogglePayment(slotKey, occName || 'Oyuncu', occupant?.paymentStatus || (isPaid ? 'paid' : 'unpaid'), occUid);
              } else if (isMySlot && !isPaid && !isSlotExempt) {
                setDirectPayVisible(true);
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name={badgeIcon} size={9} color={badgeColor} />
            <Text style={[styles.slotPaymentPillText, { color: badgeColor }]}>{badgeText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <MatchPaymentModal
          amount={perPlayerFee}
          matchTitle={matchArena + ' • ' + matchMode}
          visible={directPayVisible}
          onClose={() => setDirectPayVisible(false)}
          matchId={activeMatchId}
          isGoalkeeper={Boolean(userSlot?.includes('KALECI'))}
          isGkFree={isGkFree}
          organizerName={activeMatch?.organizer || 'Kaptan'}
          organizerIban={activeMatch?.organizerIban}
          organizerIbanName={activeMatch?.organizerIbanName}
          organizerBankName={activeMatch?.organizerBankName}
          userSlotKey={userSlot}
          currentStatus={userSlot ? (activeMatch?.slots?.[userSlot]?.paymentStatus || (activeMatch?.slots?.[userSlot]?.paid ? 'paid' : 'unpaid')) : 'unpaid'}
          onSuccess={() => {
            setDirectPayVisible(false);
          }}
        />

        {/* Captain IBAN Edit Modal */}
        <Modal visible={captainIbanModalVisible} transparent animationType="slide" onRequestClose={() => setCaptainIbanModalVisible(false)}>
          <View style={styles.captainIbanOverlay}>
            <View style={styles.captainIbanSheet}>
              <View style={styles.captainIbanHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="account-balance" size={20} color={theme.primary} />
                  <Text style={styles.captainIbanTitle}>KAPTAN IBAN BİLGİLERİ</Text>
                </View>
                <TouchableOpacity onPress={() => setCaptainIbanModalVisible(false)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, lineHeight: 16 }}>
                  Oyuncuların maç ücretini FAST ile gönderebilmesi için kendi banka ve IBAN bilgilerinizi girin.
                </Text>

                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>BANKA ADI</Text>
                  <TextInput
                    style={styles.captainIbanInput}
                    value={captainBankNameInput}
                    onChangeText={setCaptainBankNameInput}
                    placeholder="Örn: Ziraat Bankası, Garanti BBVA"
                    placeholderTextColor="#adaaaa"
                  />
                </View>

                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>HESAP SAHİBİ (AD SOYAD)</Text>
                  <TextInput
                    style={styles.captainIbanInput}
                    value={captainIbanNameInput}
                    onChangeText={setCaptainIbanNameInput}
                    placeholder="Örn: Ahmet Yılmaz"
                    placeholderTextColor="#adaaaa"
                  />
                </View>

                <View style={styles.miniInputGroup}>
                  <Text style={styles.miniInputLabel}>IBAN NUMARASI</Text>
                  <TextInput
                    style={styles.captainIbanInput}
                    value={captainIbanInput}
                    onChangeText={(t) => setCaptainIbanInput(t.toUpperCase())}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    placeholderTextColor="#adaaaa"
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveIbanBtn, savingCaptainIban && { opacity: 0.7 }]}
                  onPress={handleSaveCaptainIban}
                  disabled={savingCaptainIban}
                >
                  <Text style={styles.saveIbanBtnText}>
                    {savingCaptainIban ? 'KAYDEDİLİYOR...' : 'IBAN BİLGİLERİNİ KAYDET'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <PitchReviewModal
          pitchName={matchArena}
          visible={pitchReviewVisible}
          onClose={() => {
            setPitchReviewVisible(false);
            fetchPitchScore();
          }}
        />
        <MatchStoryModal
          visible={storyModalVisible}
          onClose={() => setStoryModalVisible(false)}
        />

        {/* TopAppBar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>MAÇ ODASI</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isOrganizer && (
              <TouchableOpacity style={styles.finishMatchHeaderBtn} onPress={() => setScoreModalVisible(true)} activeOpacity={0.85}>
                <MaterialIcons name="sports-score" size={15} color={theme.background} />
                <Text style={styles.finishMatchHeaderBtnText}>SKOR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.storyHeaderBtn} onPress={() => setStoryModalVisible(true)} activeOpacity={0.85}>
              <MaterialIcons name="camera-alt" size={15} color={theme.background} />
              <Text style={styles.storyHeaderBtnText}>STORY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnHover} onPress={handleShareMatch} accessibilityLabel="Kadro Paylaş" accessibilityRole="button">
              <MaterialIcons name="share" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnHover} onPress={openVenueLocation} accessibilityLabel="Konum" accessibilityRole="button">
              <MaterialIcons name="location-on" size={20} color={theme.primary} />
            </TouchableOpacity>
            {isOrganizer && (
              <TouchableOpacity style={styles.iconBtnHover} onPress={handleCancelMatch} accessibilityLabel="Maçı İptal Et" accessibilityRole="button">
                <MaterialIcons name="delete-outline" size={20} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Live Weather Forecast Alert */}
          <WeatherAlertCard 
            city={matchCity}
            isOpenField={!matchArena.toLowerCase().includes('kapalı')} 
          />
          
          {/* Haftalık Düzenli Abonelik Ayarları - Sadece abonelik maçı ise */}
          {activeMatch?.isSubscription && (
            <View style={styles.subSettingsCard}>
              <View style={styles.subSettingsHeader}>
                <View style={styles.subSettingsLeft}>
                  <MaterialIcons name="update" size={20} color={theme.primary} />
                  <View>
                    <Text style={styles.subSettingsTitle}>HAFTALIK DÜZENLİ ABONELİK</Text>
                    <Text style={styles.subSettingsSub}>{matchDateTime} • Otomatik Yenilenir</Text>
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
          )}
        
        {/* Strategy & Field */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionHeaderBar, { backgroundColor: theme.primary }]} />
              <Text style={styles.sectionTitle}>SAHA DİZİLİMİ ({matchMode.toUpperCase()})</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setPitchReviewVisible(true)}>
              <MaterialIcons name="star" size={14} color={theme.primary} />
              <Text style={styles.settingsBtnText}>TESİS PUANI ({pitchRating.toFixed(1)})</Text>
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

          {/* Team Switcher Tabs */}
          <View style={styles.teamTabsContainer}>
            <TouchableOpacity 
              style={[styles.teamTabBtn, activeTeam === 'A' && styles.teamTabBtnActiveA]} 
              onPress={() => setActiveTeam('A')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shield" size={18} color={activeTeam === 'A' ? theme.primary : theme.textMuted} />
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.teamTabText, activeTeam === 'A' && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                  A TAKIMI
                </Text>
                <Text style={{ fontFamily: Fonts.label, fontSize: 9, color: activeTeam === 'A' ? theme.primary : theme.textMuted }}>
                  👑 ORGANİZATÖR
                </Text>
              </View>
              <View style={[styles.teamCountBadge, activeTeam === 'A' && { backgroundColor: `${theme.primary}33` }]}>
                <Text style={[styles.teamCountText, activeTeam === 'A' && { color: theme.primary }]}>{teamACount}/{modePlayersPerTeam}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.teamTabBtn, activeTeam === 'B' && styles.teamTabBtnActiveB]} 
              onPress={() => setActiveTeam('B')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shield" size={18} color={activeTeam === 'B' ? theme.secondary : theme.textMuted} />
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.teamTabText, activeTeam === 'B' && { color: theme.secondary, fontFamily: Fonts.headlineBold }]}>
                  B TAKIMI
                </Text>
                <Text style={{ fontFamily: Fonts.label, fontSize: 9, color: activeTeam === 'B' ? theme.secondary : theme.textMuted }}>
                  {activeMatch?.captainBName ? `⭐ ${activeMatch.captainBName}` : (isTwoCaptainsMode ? '⭐ RAKİP KAPTAN' : 'KARMA KADRO')}
                </Text>
              </View>
              <View style={[styles.teamCountBadge, activeTeam === 'B' && { backgroundColor: `${theme.secondary}33` }]}>
                <Text style={[styles.teamCountText, activeTeam === 'B' && { color: theme.secondary }]}>{teamBCount}/{modePlayersPerTeam}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* B Takımı Kaptan Bilgi & Atama Kartı */}
          {activeTeam === 'B' && (
            <View style={styles.captainBBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialIcons name="military-tech" size={22} color={theme.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.captainBBannerTitle}>
                    {activeMatch?.captainBName 
                      ? `B TAKIMI KAPTANI: ${activeMatch.captainBName}` 
                      : (isTwoCaptainsMode ? 'B TAKIMI KAPTANI ATANMADI' : 'KARMA TAKIM (ORGANİZATÖR YÖNETİMİNDE)')}
                  </Text>
                  <Text style={styles.captainBBannerSub}>
                    {activeMatch?.captainBName 
                      ? (isCaptainB ? '⭐ Siz B Takımı Kaptanısınız. Kendi takımınızın ödemelerini teyit edebilirsiniz.' : 'B Takımının koordinasyonundan sorumludur.')
                      : (isTwoCaptainsMode ? 'Organizatör olarak sahadaki bir B Takımı oyuncusuna dokunarak kaptan atayabilirsiniz.' : 'Organizatör 14 kişiyi tek elden yönetir.')}
                  </Text>
                </View>
              </View>
              {isOrganizer && activeMatch?.captainBId && (
                <TouchableOpacity 
                  style={styles.removeCaptainBtn}
                  onPress={() => handleAssignCaptainB(activeMatch.captainBId!, activeMatch.captainBName!)}
                >
                  <Text style={styles.removeCaptainBtnText}>Değiştir</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Hızlı Kadro Paylaşımı & Eksik Oyuncu Çağır Kartı */}
          <TouchableOpacity 
            style={styles.shareRosterCard}
            onPress={handleShareMatch}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.shareRosterIconBox}>
                <MaterialIcons name="share" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shareRosterTitle}>
                  {rosterPayments.length >= totalPlayersCount 
                    ? '🏆 KADRO TAMAMLANDI (DOLDU)' 
                    : `📢 ${totalPlayersCount - rosterPayments.length} OYUNCU EKSİK • ARKADAŞLARINI ÇAĞIR`}
                </Text>
                <Text style={styles.shareRosterSub}>
                  WhatsApp'ta kadro davetini tek tıkla paylaşın
                </Text>
              </View>
            </View>
            <View style={styles.shareRosterBtnBadge}>
              <Text style={styles.shareRosterBtnBadgeText}>PAYLAŞ</Text>
            </View>
          </TouchableOpacity>

          {/* Kadro Doluysa ve kullanıcı kadroda değilse: Yedek Sırası Kartı */}
          {rosterPayments.length >= totalPlayersCount && !userSlot && (
            <View style={styles.reserveJoinCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <MaterialIcons name="hourglass-empty" size={20} color={theme.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reserveJoinTitle}>KADRO DOLDU • YEDEK SIRASI</Text>
                  <Text style={styles.reserveJoinSub}>
                    Bir oyuncu maçtan ayrılırsa ilk size bildirim gönderilir.
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.reserveJoinBtn} onPress={handleJoinReserve}>
                <Text style={styles.reserveJoinBtnText}>YEDEĞE GİR</Text>
              </TouchableOpacity>
            </View>
          )}

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
                <MaterialIcons name="sync-alt" size={12} color={activeTeam === 'A' ? theme.primary : theme.secondary} />
                <Text style={[styles.kaleBtnText, { color: activeTeam === 'A' ? theme.primary : theme.secondary }]}>
                  {activeTeam === 'A' ? 'A TAKIMI KADROSU' : 'B TAKIMI KADROSU'}
                </Text>
              </TouchableOpacity>

              {/* Slots */}
              <View style={styles.formationGrid}>
                {/* Forward */}
                <View style={styles.slotRow}>
                   {renderSlotItem('FORVET', 'Forvet', '9')}
                </View>
                
                {/* Midfielders */}
                <View style={[styles.slotRow, { justifyContent: 'space-between', paddingHorizontal: 32 }]}>
                   {renderSlotItem('OS_SOL', 'Sol OS', '8')}
                   {renderSlotItem('OS_ORTA', activeTeam === 'A' ? 'Kaptan' : 'Orta Saha', '10')}
                   {renderSlotItem('OS_SAG', 'Sağ OS', '7')}
                </View>

                {/* Defenders */}
                <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                   {renderSlotItem('DEF_SOL', 'Sol Def', '3')}
                   {renderSlotItem('DEF_SAG', 'Sağ Def', '4')}
                </View>

                {/* GK */}
                <View style={styles.slotRow}>
                   {renderSlotItem('KALECI', 'Kaleci', '1')}
                </View>
              </View>
            </View>
          </View>

          {/* 🪑 YEDEK KULÜBESİ (RESERVE BENCH) */}
          <View style={styles.reserveSection}>
            <View style={styles.reserveHeader}>
              <View style={styles.reserveHeaderLeft}>
                <MaterialIcons name="event-seat" size={18} color={theme.tertiary} />
                <Text style={styles.reserveTitle}>YEDEK KULÜBESİ ({activeMatch?.reserves?.length || 0})</Text>
              </View>
              <Text style={styles.reserveSubHint}>Asil kadrodan çıkan olursa ilk sıradaki geçer</Text>
            </View>

            {/* Reserve players row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reserveList}>
              {(!activeMatch?.reserves || activeMatch.reserves.length === 0) ? (
                <Text style={styles.emptyReserveText}>Şu an yedekte bekleyen oyuncu yok</Text>
              ) : (
                activeMatch.reserves.map((reserve, idx) => (
                  <View key={reserve.uid || idx} style={styles.reserveItem}>
                    <View style={styles.reserveAvatarWrap}>
                      <Image source={{ uri: reserve.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }} style={styles.reserveAvatar} />
                      <View style={styles.reserveOrderBadge}>
                        <Text style={styles.reserveOrderText}>#{idx + 1}</Text>
                      </View>
                    </View>
                    <Text style={styles.reserveName} numberOfLines={1}>{reserve.name}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Action button: Join or Leave Reserve Queue */}
            {(() => {
              const isAlreadyInMainSlot = Boolean(userSlot);
              const isAlreadyInReserve = Boolean(user?.uid && activeMatch?.reserves?.some(r => r.uid === user.uid));

              if (isAlreadyInMainSlot) {
                return null;
              }

              if (isAlreadyInReserve) {
                return (
                  <TouchableOpacity
                    style={styles.leaveReserveBtn}
                    onPress={async () => {
                      if (!user?.uid || !activeMatchId) return;
                      try {
                        await dbService.leaveMatchReserve(activeMatchId, user.uid);
                        Alert.alert('Ayrıldınız', 'Yedek sırasından ayrıldınız.');
                      } catch (e) {
                        Alert.alert('Hata', 'Yedek sırasından ayrılırken bir hata oluştu.');
                      }
                    }}
                  >
                    <MaterialIcons name="person-remove" size={16} color={theme.error} />
                    <Text style={styles.leaveReserveBtnText}>Yedek Sırasından Çık</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  style={styles.joinReserveBtn}
                  onPress={async () => {
                    if (!user?.uid || !activeMatchId) {
                      Alert.alert('Giriş Yapın', 'Yedek sırasına girmek için giriş yapmalısınız.');
                      return;
                    }
                    try {
                      await dbService.joinMatchReserve(activeMatchId, {
                        uid: user.uid,
                        name: user.name || 'Yedek Oyuncu',
                        avatar: user.avatar
                      });
                      Alert.alert('✓ Sıraya Girildi', 'Yedek listesine eklendiniz. Asil kadrodan biri ayrıldığında öncelik sizin olacak!');
                    } catch (e) {
                      Alert.alert('Hata', 'Yedek sırasına girilirken bir hata oluştu.');
                    }
                  }}
                >
                  <MaterialIcons name="person-add" size={16} color={theme.background} />
                  <Text style={styles.joinReserveBtnText}>YEDEK SIRASINA YAZIL</Text>
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* Match Settings & Conditions - Only Captain/Organizer can edit */}
          {isOrganizer && (
            <View style={styles.termsBox}>
              <Text style={styles.termsBoxTitle}>MAÇA KATILMA ŞARTLARI (KAPTAN YÖNETİMİ)</Text>
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
                <Text style={styles.confirmBtnText}>ŞARTLARI KAYDET</Text>
              </TouchableOpacity>
            </View>
          )}
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
                <Text style={styles.paymentSubTitle}>Kişi Başı: ₺{perPlayerFee} • Toplam: ₺{totalMatchFee}</Text>
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
                    {isGkFree ? `Kaleciler muaf tutuldu. Ücret ${activePayersCount} saha oyuncusuna bölündü.` : `Kaleciler dahil tüm ${totalPlayersCount} oyuncu ücreti eşit paylaşır.`}
                  </Text>
                </View>
                {isOrganizer ? (
                  <Switch
                    value={isGkFree}
                    onValueChange={async (val) => {
                      setIsGkFree(val);
                      if (activeMatchId) {
                        try {
                          await dbService.updateMatchGkFree(activeMatchId, val);
                        } catch (e) {
                          console.error('Kaleci muafiyet güncelleme hatası:', e);
                        }
                      }
                    }}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={isGkFree ? theme.text : theme.textMuted}
                  />
                ) : (
                  <View style={[styles.activeSubBadge, { backgroundColor: isGkFree ? `${theme.primary}26` : theme.surfaceContainerHighest }]}>
                    <Text style={[styles.activeSubBadgeText, { color: isGkFree ? theme.primary : theme.textMuted }]}>
                      {isGkFree ? 'AKTİF' : 'KAPALI'}
                    </Text>
                  </View>
                )}
              </View>

              {/* 1. KAPTAN IBAN BİLGİSİ & KOPYALAMA KARTI */}
              <Text style={[styles.paymentLabel, { marginTop: 14 }]}>1. KAPTAN IBAN & FAST BİLGİSİ</Text>
              <View style={styles.ibanCardWrap}>
                <View style={styles.ibanCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="account-balance" size={18} color={theme.primary} />
                    <Text style={styles.ibanBankTitle}>
                      {activeMatch?.organizerBankName || 'BANKA HESABI / FAST'}
                    </Text>
                  </View>
                  {isOrganizer ? (
                    <TouchableOpacity 
                      style={styles.editIbanPill} 
                      onPress={() => setCaptainIbanModalVisible(true)}
                    >
                      <MaterialIcons name="edit" size={12} color={theme.primary} />
                      <Text style={styles.editIbanPillText}>IBAN Düzenle</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {activeMatch?.organizerIban ? (
                  <View style={styles.ibanCardBody}>
                    <Text style={styles.ibanHolderName}>
                      Alıcı: <Text style={{ color: theme.text, fontFamily: Fonts.headlineBold }}>{activeMatch?.organizerIbanName || activeMatch?.organizer || 'Kaptan'}</Text>
                    </Text>
                    <View style={styles.ibanCopyRow}>
                      <Text style={styles.ibanNumberText} numberOfLines={1} ellipsizeMode="middle">
                        {activeMatch.organizerIban}
                      </Text>
                      <TouchableOpacity 
                        style={styles.copyIbanBtn} 
                        onPress={async () => {
                          await Clipboard.setStringAsync(activeMatch.organizerIban!);
                          Alert.alert('✓ Kopyalandı', 'Kaptan IBAN panoya kopyalandı. Banka uygulamanızdan FAST ile gönderebilirsiniz.');
                        }}
                      >
                        <MaterialIcons name="content-copy" size={14} color={theme.onPrimary} />
                        <Text style={styles.copyIbanBtnText}>Kopyala</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.ibanFastHint}>
                      💡 Açıklamaya adınızı yazıp gönderdikten sonra aşağıdan kaptana bildirim yapabilirsiniz.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noIbanBox}>
                    <MaterialIcons name="info-outline" size={18} color={theme.textMuted} />
                    <Text style={styles.noIbanText}>
                      {isOrganizer 
                        ? 'Henüz IBAN eklemediniz. Oyuncuların FAST ile ödeme yapabilmesi için IBAN bilgilerinizi ekleyin.' 
                        : 'Kaptan henüz IBAN bilgisi eklemedi. Ödemenizi sahada nakit olarak elden teslim edebilirsiniz.'}
                    </Text>
                    {isOrganizer && (
                      <TouchableOpacity 
                        style={styles.addIbanBtn} 
                        onPress={() => setCaptainIbanModalVisible(true)}
                      >
                        <MaterialIcons name="add" size={14} color={theme.onPrimary} />
                        <Text style={styles.addIbanBtnText}>IBAN EKLE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* 2. KASA & MUHASEBE DURUMU (ACCOUNTING BAR) */}
              <Text style={[styles.paymentLabel, { marginTop: 18 }]}>2. KASA & MUHASEBE TAKİBİ</Text>
              <View style={styles.accountingCard}>
                <View style={styles.accountingStatsRow}>
                  <View style={styles.accountingCol}>
                    <Text style={[styles.accColLabel, { color: theme.primary }]}>ÖDENDİ</Text>
                    <Text style={[styles.accColVal, { color: theme.primary }]}>₺{collectedPaidAmount}</Text>
                  </View>
                  <View style={styles.accountingDivider} />
                  <View style={styles.accountingCol}>
                    <Text style={[styles.accColLabel, { color: '#6e9bff' }]}>SAHADA NAKİT</Text>
                    <Text style={[styles.accColVal, { color: '#6e9bff' }]}>₺{collectedCashAmount}</Text>
                  </View>
                  <View style={styles.accountingDivider} />
                  <View style={styles.accountingCol}>
                    <Text style={[styles.accColLabel, { color: '#ffb703' }]}>ONAY BEKLEYEN</Text>
                    <Text style={[styles.accColVal, { color: '#ffb703' }]}>₺{pendingApprovalAmount}</Text>
                  </View>
                  <View style={styles.accountingDivider} />
                  <View style={styles.accountingCol}>
                    <Text style={[styles.accColLabel, { color: theme.error }]}>KALAN</Text>
                    <Text style={[styles.accColVal, { color: theme.error }]}>₺{unpaidAmount}</Text>
                  </View>
                </View>

                {/* Multi-segment Progress Bar */}
                <View style={styles.multiProgressWrap}>
                  <View style={[styles.multiProgressPaid, { flex: Math.max(0.001, collectedPaidAmount) }]} />
                  <View style={[styles.multiProgressCash, { flex: Math.max(0.001, collectedCashAmount) }]} />
                  <View style={[styles.multiProgressPending, { flex: Math.max(0.001, pendingApprovalAmount) }]} />
                  <View style={[styles.multiProgressUnpaid, { flex: Math.max(0.001, unpaidAmount) }]} />
                </View>
                <View style={styles.progressSubInfo}>
                  <Text style={styles.progressSubText}>
                    Toplam: ₺{totalMatchFee} • Kişi Başı: ₺{perPlayerFee}
                  </Text>
                  <Text style={[styles.progressSubText, { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                    %{totalMatchFee > 0 ? Math.min(100, Math.round(((collectedPaidAmount + collectedCashAmount) / totalMatchFee) * 100)) : 0} Güvencede
                  </Text>
                </View>

                {/* İki Takımlı Maç İse: A Takımı vs B Takımı Kasa Kırılımı */}
                {isTwoCaptainsMode && (
                  <View style={styles.teamAccountingRow}>
                    <View style={styles.teamAccBox}>
                      <Text style={styles.teamAccTitle}>A TAKIMI (ORGANİZATÖR)</Text>
                      <Text style={[styles.teamAccFee, { color: theme.primary }]}>₺{teamAPaid} / ₺{teamATotal}</Text>
                      <Text style={styles.teamAccStatus}>
                        %{teamATotal > 0 ? Math.min(100, Math.round((teamAPaid / teamATotal) * 100)) : 0} Toplandı
                      </Text>
                    </View>
                    <View style={styles.teamAccDivider} />
                    <View style={styles.teamAccBox}>
                      <Text style={styles.teamAccTitle}>B TAKIMI {activeMatch?.captainBName ? `(${activeMatch.captainBName})` : ''}</Text>
                      <Text style={[styles.teamAccFee, { color: theme.secondary }]}>₺{teamBPaid} / ₺{teamBTotal}</Text>
                      <Text style={styles.teamAccStatus}>
                        %{teamBTotal > 0 ? Math.min(100, Math.round((teamBPaid / teamBTotal) * 100)) : 0} Toplandı
                      </Text>
                    </View>
                  </View>
                )}

                {/* B Takımı Kaptanı Bildirim / Yönetim Kartı */}
                {isCaptainB && !isOrganizer && (
                  <View style={styles.captainBActionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialIcons name="military-tech" size={20} color={theme.secondary} />
                      <Text style={styles.captainBActionTitle}>⭐ B TAKIMI KAPTANI YÖNETİMİ</Text>
                    </View>
                    <Text style={styles.captainBActionDesc}>
                      Takımınızın toplam payı ₺{teamBTotal}'dir. Kendi takımınızın ödemelerini aşağıdaki çizelgeden kontrol edebilir ve Organizatör ile paylaşabilirsiniz.
                    </Text>
                  </View>
                )}
              </View>

              {/* OYUNCU KENDİ ÖDEME AKSİYONU (Eğer mevkisi varsa ve henüz ödememişse) */}
              {(() => {
                if (!userSlot) return null;
                const myP = rosterPayments.find(p => p.slotKey === userSlot);
                if (!myP) return null;
                if (myP.isGk && isGkFree) {
                  return (
                    <View style={styles.myPayNoticeCard}>
                      <MaterialIcons name="sports-handball" size={20} color={theme.secondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.myPayNoticeTitle, { color: theme.secondary }]}>KALECİ ÜCRET MUAFİYETİ</Text>
                        <Text style={styles.myPayNoticeSub}>Bu maçta kalecilerden ücret talep edilmemektedir.</Text>
                      </View>
                    </View>
                  );
                }
                if (myP.paymentStatus === 'paid') {
                  return (
                    <View style={[styles.myPayNoticeCard, { borderColor: theme.primary }]}>
                      <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.myPayNoticeTitle, { color: theme.primary }]}>PAYINIZ ÖDENDİ (₺{myP.amount})</Text>
                        <Text style={styles.myPayNoticeSub}>Kaptan ödemenizi teyit etti, teşekkürler!</Text>
                      </View>
                    </View>
                  );
                }
                if (myP.paymentStatus === 'pending_approval') {
                  return (
                    <View style={[styles.myPayNoticeCard, { borderColor: '#ffb703' }]}>
                      <MaterialIcons name="hourglass-top" size={20} color="#ffb703" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.myPayNoticeTitle, { color: '#ffb703' }]}>KAPTAN ONAYI BEKLENİYOR</Text>
                        <Text style={styles.myPayNoticeSub}>FAST bildirimi yapıldı. Kaptan hesabını kontrol edip onaylayacaktır.</Text>
                      </View>
                      <TouchableOpacity style={styles.myPayNoticeAction} onPress={() => setDirectPayVisible(true)}>
                        <Text style={styles.myPayNoticeActionText}>Değiştir</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                if (myP.paymentStatus === 'cash_on_pitch') {
                  return (
                    <View style={[styles.myPayNoticeCard, { borderColor: '#6e9bff' }]}>
                      <MaterialIcons name="payments" size={20} color="#6e9bff" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.myPayNoticeTitle, { color: '#6e9bff' }]}>SAHADA NAKİT ÖDENECEK (₺{myP.amount})</Text>
                        <Text style={styles.myPayNoticeSub}>Maç saatinde kaptana elden teslim edeceksiniz.</Text>
                      </View>
                      <TouchableOpacity style={styles.myPayNoticeAction} onPress={() => setDirectPayVisible(true)}>
                        <Text style={styles.myPayNoticeActionText}>Değiştir</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <View style={[styles.myPayNoticeCard, { borderColor: theme.error }]}>
                    <MaterialIcons name="announcement" size={22} color={theme.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.myPayNoticeTitle, { color: theme.error }]}>MAÇ PAYINIZ: ₺{perPlayerFee}</Text>
                      <Text style={styles.myPayNoticeSub}>IBAN (FAST) ile gönderin ya da sahada nakit seçeneğini bildirin.</Text>
                    </View>
                    <TouchableOpacity style={styles.payNowBtn} onPress={() => setDirectPayVisible(true)}>
                      <Text style={styles.payNowBtnText}>ÖDEME SEÇENEKLERİ</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* 3. TÜM OYUNCULARIN ÖDEME LİSTESİ & KAPTAN YÖNETİMİ */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
                <Text style={styles.paymentLabel}>3. KADRO ÖDEME ÇİZELGESİ</Text>
                {isOrganizer && (
                  <Text style={styles.captainHintText}>💡 Durumu değiştirmek için dokunun</Text>
                )}
              </View>

              <View style={styles.paymentPlayerList}>
                {rosterPayments.length === 0 ? (
                  <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted }}>
                      Kadroda henüz oyuncu bulunmuyor.
                    </Text>
                  </View>
                ) : (
                  rosterPayments.map((player) => {
                    const isMe = player.uid === user?.uid;
                    const isPlayerOrg = player.uid && (player.uid === activeMatch?.organizerId || player.uid === activeMatch?.captainAId || (player.slotKey === 'A_FORVET_1' && player.uid === activeMatch?.organizerId));
                    const isPlayerCapB = player.uid && activeMatch?.captainBId && player.uid === activeMatch.captainBId;

                    let badgeBg = `${theme.error}22`;
                    let badgeBorder = theme.error;
                    let badgeText = 'ÖDENMEDİ';
                    let badgeIcon: any = 'cancel';
                    let badgeTextColor = theme.error;

                    if (player.paymentStatus === 'exempt') {
                      badgeBg = `${theme.secondary}22`;
                      badgeBorder = theme.secondary;
                      badgeText = 'MUAF';
                      badgeIcon = 'sports-handball';
                      badgeTextColor = theme.secondary;
                    } else if (player.paymentStatus === 'paid') {
                      badgeBg = `${theme.primary}22`;
                      badgeBorder = theme.primary;
                      badgeText = 'ÖDENDİ';
                      badgeIcon = 'check-circle';
                      badgeTextColor = theme.primary;
                    } else if (player.paymentStatus === 'pending_approval') {
                      badgeBg = '#ffb70326';
                      badgeBorder = '#ffb703';
                      badgeText = 'ONAY BEKLİYOR';
                      badgeIcon = 'hourglass-top';
                      badgeTextColor = '#ffb703';
                    } else if (player.paymentStatus === 'cash_on_pitch') {
                      badgeBg = '#6e9bff26';
                      badgeBorder = '#6e9bff';
                      badgeText = 'SAHADA NAKİT';
                      badgeIcon = 'payments';
                      badgeTextColor = '#6e9bff';
                    }

                    const canManageThisPlayer = isOrganizer || (isCaptainB && player.slotKey.startsWith('B_'));

                    return (
                      <TouchableOpacity
                        key={player.slotKey}
                        style={[styles.playerPayCard, isMe && { borderColor: `${theme.primary}4D`, borderWidth: 1 }]}
                        onPress={() => {
                          if (canManageThisPlayer) {
                            handleCaptainTogglePayment(player.slotKey, player.name, player.paymentStatus, player.uid);
                          } else if (isMe && player.paymentStatus !== 'paid' && player.paymentStatus !== 'exempt') {
                            setDirectPayVisible(true);
                          }
                        }}
                        activeOpacity={canManageThisPlayer || (isMe && player.paymentStatus !== 'paid') ? 0.7 : 1}
                      >
                        <Image source={{ uri: player.avatar }} style={styles.playerPayAvatar} />
                        <View style={styles.playerPayInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.playerPayName} numberOfLines={1}>
                              {player.name} {isMe ? '(Siz)' : ''}
                            </Text>
                            {isPlayerOrg && (
                              <View style={styles.organizerBadge}>
                                <Text style={styles.organizerBadgeText}>👑 ORGANİZATÖR</Text>
                              </View>
                            )}
                            {isPlayerCapB && (
                              <View style={styles.captainBBadge}>
                                <Text style={styles.captainBBadgeText}>⭐ B KAPTANI</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.playerPaySubRow}>
                            <Text style={styles.playerPayRole}>{player.role}</Text>
                            <Text style={{ fontFamily: Fonts.label, fontSize: 10, color: theme.textMuted }}>•</Text>
                            <Text style={[styles.playerPayAmountText, player.paymentStatus === 'exempt' && { color: theme.secondary }]}>
                              {player.paymentStatus === 'exempt' ? '0 ₺' : `₺${player.amount}`}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.payStatusBtn, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                          <MaterialIcons name={badgeIcon} size={14} color={badgeTextColor} />
                          <Text style={[styles.payStatusBtnText, { color: badgeTextColor }]}>
                            {badgeText}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
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
            {rosterPayments.length === 0 ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>
                  Henüz kadroya katılan oyuncu yok. Sahadaki boş bir mevkiye tıklayarak ilk siz katılın!
                </Text>
              </View>
            ) : (
              rosterPayments.map((player) => {
                const isCurrent = player.uid === user?.uid;
                const isPlayerOrg = player.uid && (player.uid === activeMatch?.organizerId || player.uid === activeMatch?.captainAId || (player.slotKey === 'A_FORVET_1' && player.uid === activeMatch?.organizerId));
                const isPlayerCapB = player.uid && activeMatch?.captainBId && player.uid === activeMatch.captainBId;
                return (
                  <View key={player.slotKey} style={[styles.playerItem, { borderLeftColor: isCurrent ? theme.primary : 'transparent' }]}>
                    <View style={styles.playerItemLeft}>
                      <Image source={{ uri: player.avatar || user?.avatar }} style={styles.playerAvatar} />
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.playerName}>{player.name} {isCurrent ? '(Siz)' : ''}</Text>
                          {isPlayerOrg && (
                            <View style={styles.organizerBadge}>
                              <Text style={styles.organizerBadgeText}>👑 ORGANİZATÖR</Text>
                            </View>
                          )}
                          {isPlayerCapB && (
                            <View style={styles.captainBBadge}>
                              <Text style={styles.captainBBadgeText}>⭐ B KAPTANI</Text>
                            </View>
                          )}
                        </View>
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
              <Text style={styles.playerCountText}>{rosterPayments.length} / {totalPlayersCount} OYUNCU KATILDI</Text>
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

        {/* Kaptan Skor Giriş Modalı */}
        <Modal
          visible={scoreModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setScoreModalVisible(false)}
        >
          <View style={styles.scoreModalOverlay}>
            <View style={styles.scoreModalContent}>
              <View style={styles.scoreModalHeader}>
                <MaterialIcons name="sports-score" size={28} color={theme.primary} />
                <Text style={styles.scoreModalTitle}>MAÇ SKORUNU BİLDİR</Text>
                <Text style={styles.scoreModalSub}>
                  Maç bittiğinde resmi sonucu girerek maçı tamamlayın.
                </Text>
              </View>

              <View style={styles.scoreInputsRow}>
                <View style={styles.scoreTeamCol}>
                  <Text style={[styles.scoreTeamName, { color: theme.primary }]}>A TAKIMI</Text>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={scoreTeamA}
                    onChangeText={setScoreTeamA}
                    selectTextOnFocus
                  />
                </View>

                <Text style={styles.scoreColon}>-</Text>

                <View style={styles.scoreTeamCol}>
                  <Text style={[styles.scoreTeamName, { color: theme.secondary }]}>B TAKIMI</Text>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={scoreTeamB}
                    onChangeText={setScoreTeamB}
                    selectTextOnFocus
                  />
                </View>
              </View>

              <View style={styles.scoreModalActions}>
                <TouchableOpacity
                  style={styles.scoreCancelBtn}
                  onPress={() => setScoreModalVisible(false)}
                  disabled={submittingScore}
                >
                  <Text style={styles.scoreCancelText}>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.scoreSubmitBtn, submittingScore && { opacity: 0.6 }]}
                  onPress={handleFinishMatch}
                  disabled={submittingScore}
                >
                  <Text style={styles.scoreSubmitText}>
                    {submittingScore ? 'Kaydediliyor...' : 'Maçı Bitir ve Kaydet'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

  finishMatchHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  finishMatchHeaderBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: '#000',
    letterSpacing: 0.5,
  },

  teamTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  teamTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamTabBtnActiveA: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}18`,
  },
  teamTabBtnActiveB: {
    borderColor: theme.secondary,
    backgroundColor: `${theme.secondary}18`,
  },
  teamTabText: {
    fontFamily: Fonts.headline,
    fontSize: 11,
    color: theme.textMuted,
  },
  teamCountBadge: {
    backgroundColor: theme.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  teamCountText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
  },

  scoreModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scoreModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    alignItems: 'center',
  },
  scoreModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreModalTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  scoreModalSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  scoreTeamCol: {
    alignItems: 'center',
    gap: 8,
  },
  scoreTeamName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  scoreInput: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: theme.borderSubtle,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: Fonts.headlineBold,
    color: theme.text,
  },
  scoreColon: {
    fontSize: 28,
    fontFamily: Fonts.headlineBold,
    color: theme.textMuted,
    marginTop: 20,
  },
  scoreModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  scoreCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCancelText: {
    fontFamily: Fonts.headline,
    fontSize: 13,
    color: theme.textMuted,
  },
  scoreSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSubmitText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.onPrimary,
  },
  reserveSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${theme.tertiary}4D`,
    marginTop: 14,
    gap: 10,
  },
  reserveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reserveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reserveTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.tertiary,
    letterSpacing: 0.5,
  },
  reserveSubHint: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
  },
  reserveList: {
    gap: 12,
    paddingVertical: 6,
  },
  emptyReserveText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  reserveItem: {
    alignItems: 'center',
    width: 60,
    gap: 4,
  },
  reserveAvatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: theme.tertiary,
    overflow: 'hidden',
  },
  reserveAvatar: {
    width: '100%',
    height: '100%',
  },
  reserveOrderBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.tertiary,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  reserveOrderText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    color: theme.background,
  },
  reserveName: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.text,
    textAlign: 'center',
  },
  joinReserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.tertiary,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  joinReserveBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.background,
  },
  leaveReserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${theme.error}1A`,
    borderWidth: 1,
    borderColor: `${theme.error}66`,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  leaveReserveBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.error,
  },

  // Slot Payment Pill Styles
  slotPaymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  slotPaymentPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    letterSpacing: 0.5,
  },

  // Captain IBAN Modal Styles
  captainIbanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  captainIbanSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    maxHeight: '85%',
  },
  captainIbanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  captainIbanTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  miniInputGroup: {
    gap: 6,
  },
  miniInputLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  captainIbanInput: {
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  saveIbanBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveIbanBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.onPrimary,
    letterSpacing: 0.5,
  },

  // P2P IBAN Card Styles
  ibanCardWrap: {
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    overflow: 'hidden',
  },
  ibanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.surfaceContainerHighest,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  ibanBankTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  editIbanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.primary}22`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editIbanPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.primary,
  },
  ibanCardBody: {
    padding: 14,
    gap: 8,
  },
  ibanHolderName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
  },
  ibanCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  ibanNumberText: {
    flex: 1,
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
    letterSpacing: 0.5,
  },
  copyIbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyIbanBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.onPrimary,
  },
  ibanFastHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    lineHeight: 14,
  },
  noIbanBox: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  noIbanText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  addIbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  addIbanBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.onPrimary,
  },

  // Accounting Bar Styles
  accountingCard: {
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  accountingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountingCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  accColLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  accColVal: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
  },
  accountingDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.borderSubtle,
  },
  multiProgressWrap: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.surfaceContainerHighest,
    overflow: 'hidden',
  },
  multiProgressPaid: {
    backgroundColor: theme.primary,
    height: '100%',
  },
  multiProgressCash: {
    backgroundColor: '#6e9bff',
    height: '100%',
  },
  multiProgressPending: {
    backgroundColor: '#ffb703',
    height: '100%',
  },
  multiProgressUnpaid: {
    backgroundColor: `${theme.error}44`,
    height: '100%',
  },
  progressSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSubText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },

  // Player's Notice Card Styles
  myPayNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surfaceContainerHighest,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.borderSubtle,
    marginTop: 14,
  },
  myPayNoticeTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  myPayNoticeSub: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
    marginTop: 2,
  },
  myPayNoticeAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.surfaceContainer,
  },
  myPayNoticeActionText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.text,
  },
  payNowBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payNowBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.onPrimary,
  },

  // Other List Styles
  captainHintText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
  },
  captainBadge: {
    backgroundColor: `${theme.primary}22`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.primary,
  },
  captainBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    color: theme.primary,
  },
  playerPayAmountText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.text,
  },

  // Organizer & Captain Badges and Crowns
  slotCaptainCrownOrg: {
    position: 'absolute',
    top: -8,
    left: -4,
    backgroundColor: theme.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: theme.background,
  },
  slotCaptainCrownB: {
    position: 'absolute',
    top: -8,
    left: -4,
    backgroundColor: theme.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: theme.background,
  },
  slotCaptainCrownText: {
    fontSize: 10,
  },
  organizerBadge: {
    backgroundColor: `${theme.primary}25`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.primary,
  },
  organizerBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    color: theme.primary,
  },
  captainBBadge: {
    backgroundColor: `${theme.secondary}25`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.secondary,
  },
  captainBBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
    color: theme.secondary,
  },

  // Captain B Banner
  captainBBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginTop: 8,
    gap: 8,
  },
  captainBBannerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.text,
  },
  captainBBannerSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  removeCaptainBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: `${theme.secondary}22`,
    borderWidth: 1,
    borderColor: theme.secondary,
  },
  removeCaptainBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.secondary,
  },

  // Team Accounting Breakdown
  teamAccountingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  teamAccBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  teamAccTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  teamAccFee: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
  },
  teamAccStatus: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
  },
  teamAccDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.borderSubtle,
    marginHorizontal: 8,
  },

  // Captain B Action Card
  captainBActionCard: {
    backgroundColor: `${theme.secondary}15`,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: `${theme.secondary}44`,
    gap: 6,
  },
  captainBActionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.secondary,
  },
  captainBActionDesc: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.text,
    lineHeight: 14,
  },
  captainBNotifyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  captainBNotifyBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.background,
  },

  // Share Roster Card
  shareRosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${theme.primary}12`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    marginBottom: 10,
    gap: 8,
  },
  shareRosterIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${theme.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareRosterTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  shareRosterSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  shareRosterBtnBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareRosterBtnBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.background,
  },

  // Reserve Join Card
  reserveJoinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${theme.secondary}15`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${theme.secondary}44`,
    marginBottom: 10,
    gap: 8,
  },
  reserveJoinTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.secondary,
    letterSpacing: 0.5,
  },
  reserveJoinSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  reserveJoinBtn: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reserveJoinBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.background,
  },
});
