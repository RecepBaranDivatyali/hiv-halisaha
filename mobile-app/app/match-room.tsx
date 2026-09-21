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
import { dbService, MatchModel, BenchPlayer } from '@/services/dbService';
import { auth } from '@/services/firebaseConfig';
import { PITCH_DATABASE } from '@/config/pitches';

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

  // Sahanın veri tabanındaki resmi kaydı (gerçek şehir & ilçe çözümlemesi için)
  const dbPitch = React.useMemo(() => {
    if (!matchArena) return null;
    const lower = matchArena.toLowerCase();
    return PITCH_DATABASE.find(p => 
      lower.includes(p.name.toLowerCase()) || 
      p.name.toLowerCase().includes(lower)
    );
  }, [matchArena]);

  const matchTotalFee = activeMatch?.totalFee ?? 2100;
  const matchMode = activeMatch?.mode ?? '7v7';
  const matchDateTime = activeMatch?.dateTime ?? 'Bugün, 21:00';
  // Eğer saha veri tabanında bulunuyorsa sahanın gerçek şehri esastır (Örn: ODTÜ Halısaha her zaman Ankara'dır)
  const matchCity = dbPitch?.city || activeMatch?.city || 'İstanbul';
  const matchDistrict = dbPitch?.district || activeMatch?.district || '';

  // Eğer Firestore'daki eski kayıtta şehir yanlış kalmışsa (Örn: ODTÜ için İstanbul girilmişse) arka planda düzelt
  React.useEffect(() => {
    if (activeMatchId && dbPitch?.city && activeMatch?.city && activeMatch.city !== dbPitch.city) {
      dbService.updateMatch(activeMatchId, { city: dbPitch.city, district: dbPitch.district }).catch(() => {});
    }
  }, [activeMatchId, dbPitch?.city, dbPitch?.district, activeMatch?.city]);

  const openVenueLocation = () => {
    const query = encodeURIComponent(`${matchArena} ${matchCity}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const currentUid = user?.uid || auth.currentUser?.uid;
  const isOrganizer = Boolean(
    (currentUid && activeMatch?.organizerId === currentUid) ||
    (currentUid && activeMatch?.captainAId === currentUid) ||
    activeMatch?.organizer?.toLowerCase().includes('siz')
  );
  const isCaptainA = isOrganizer || Boolean(currentUid && activeMatch?.captainAId === currentUid);
  const isCaptainB = Boolean(currentUid && activeMatch?.captainBId === currentUid);
  const hasCaptainB = Boolean(activeMatch?.captainBId);
  const isTwoCaptainsMode = activeMatch?.matchFormatType === 'two_captains' || hasCaptainB;
  const [joinTerms, setJoinTerms] = useState(activeMatch?.joinTerms ?? 0);
  const [userSlot, setUserSlot] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  const hasInitialTeamSet = React.useRef(false);
  const [directPayVisible, setDirectPayVisible] = useState(false);
  const [pitchReviewVisible, setPitchReviewVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [formationModalVisible, setFormationModalVisible] = useState(false);

  // Tactical Formations (2-3-1, 3-2-1, 2-2-2, 3-1-2)
  // Bench state from active match
  const benchA: BenchPlayer[] = React.useMemo(() => activeMatch?.benchA || [], [activeMatch?.benchA]);
  const benchB: BenchPlayer[] = React.useMemo(() => activeMatch?.benchB || [], [activeMatch?.benchB]);

  const userInBenchA = Boolean(currentUid && benchA.some(p => p.uid === currentUid));
  const userInBenchB = Boolean(currentUid && benchB.some(p => p.uid === currentUid));
  const userInSlotA = Boolean(userSlot && !userSlot.startsWith('B_'));
  const userInSlotB = Boolean(userSlot && userSlot.startsWith('B_'));

  // My Team ('A' | 'B' | null) — locked to the team user joined (either slot or bench)
  const myTeam: 'A' | 'B' | null = (userInSlotB || userInBenchB) ? 'B' : ((userInSlotA || userInBenchA) ? 'A' : null);

  // Role & Permissions:
  // In single organizer mode (tek organizatör): Organizer can manage BOTH Team A and Team B.
  // In two captains mode: Captain A manages Team A, Captain B manages Team B.
  const canManageTeamA = isOrganizer || isCaptainA;
  const canManageTeamB = isTwoCaptainsMode ? isCaptainB : isOrganizer;
  const canManageActiveTeam = activeTeam === 'A' ? canManageTeamA : canManageTeamB;

  // Placement state: Selected bench player waiting to be assigned to a pitch slot
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<{ team: 'A' | 'B'; player: BenchPlayer } | null>(null);

  // Tactical Formations (2-3-1, 3-2-1, 2-2-2, 3-1-2)
  const currentTeamFormation = activeTeam === 'A'
    ? (activeMatch?.teamAFormation || '2-3-1')
    : (activeMatch?.teamBFormation || '2-3-1');
  const canManageCurrentFormation = canManageActiveTeam;

  const handleSelectFormation = async (newFormation: string) => {
    setFormationModalVisible(false);
    if (!activeMatchId) return;
    try {
      await dbService.updateTeamFormation(activeMatchId, activeTeam, newFormation);
      await dbService.sendMessage(`match_${activeMatchId}`, {
        senderId: currentUid || 'anon',
        senderName: activeTeam === 'A' ? (activeMatch?.captainAName || 'A Kaptanı') : (activeMatch?.captainBName || 'B Kaptanı'),
        text: `📋 [Diziliş]: ${activeTeam} Takımı formasyonunu ${newFormation} olarak güncelledi.`
      });
      Alert.alert('✓ Diziliş Güncellendi', `${activeTeam} Takımı formasyonu ${newFormation} olarak ayarlandı.`);
    } catch {
      Alert.alert('Hata', 'Diziliş formasyonu güncellenemedi.');
    }
  };

  // Tactical Roster Privacy
  const isTeamAHidden = Boolean(activeMatch?.teamAHidden);
  const isTeamBHidden = Boolean(activeMatch?.teamBHidden);
  const isTeamAHiddenForMe = isTeamAHidden && !(isOrganizer || isCaptainA || myTeam === 'A');
  const isTeamBHiddenForMe = isTeamBHidden && !(isCaptainB || myTeam === 'B' || (isOrganizer && !hasCaptainB));
  
  // Score modal state for captain
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreTeamA, setScoreTeamA] = useState('7');
  const [scoreTeamB, setScoreTeamB] = useState('5');
  const [submittingScore, setSubmittingScore] = useState(false);

  // Payment State

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

  // Sync with real match data
  React.useEffect(() => {
    if (matchTotalFee) setTotalMatchFee(matchTotalFee);
  }, [matchTotalFee]);

  // Sync userSlot from Firestore match slots
  React.useEffect(() => {
    const effUid = user?.uid || auth.currentUser?.uid;
    if (activeMatch?.slots) {
      let foundSlot = effUid 
        ? Object.keys(activeMatch.slots).find((key) => activeMatch.slots?.[key]?.uid === effUid)
        : null;

      // If user is organizer and no slot matched by UID yet, check organizer's slot
      if (!foundSlot && isOrganizer) {
        if (activeMatch.slots['A_OS_ORTA']) foundSlot = 'A_OS_ORTA';
        else if (activeMatch.slots['OS_ORTA']) foundSlot = 'A_OS_ORTA';
        else if (activeMatch.slots['A_FORVET']) foundSlot = 'A_FORVET';
      }

      if (foundSlot) {
        setUserSlot(foundSlot);
        if (!hasInitialTeamSet.current) {
          setActiveTeam(foundSlot.startsWith('B_') ? 'B' : 'A');
          hasInitialTeamSet.current = true;
        }
      } else {
        setUserSlot(null);
        if (!hasInitialTeamSet.current && effUid) {
          if (benchB.some(p => p.uid === effUid)) {
            setActiveTeam('B');
            hasInitialTeamSet.current = true;
          } else if (benchA.some(p => p.uid === effUid)) {
            setActiveTeam('A');
            hasInitialTeamSet.current = true;
          }
        }
      }
    } else if (isOrganizer && !userSlot) {
      setUserSlot('A_OS_ORTA');
    } else {
      setUserSlot(null);
      if (!hasInitialTeamSet.current && effUid) {
        if (benchB.some(p => p.uid === effUid)) {
          setActiveTeam('B');
          hasInitialTeamSet.current = true;
        } else if (benchA.some(p => p.uid === effUid)) {
          setActiveTeam('A');
          hasInitialTeamSet.current = true;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch?.slots, benchA, benchB, user?.uid, isOrganizer]);

  const [isGkFree, setIsGkFree] = useState(activeMatch?.isGkFree ?? false);

  React.useEffect(() => {
    if (activeMatch?.isGkFree !== undefined) {
      setIsGkFree(activeMatch.isGkFree);
    }
  }, [activeMatch?.isGkFree]);

  // Dynamic players and fee calculation based on match mode
  const modePlayersPerTeam = parseInt(matchMode.split('v')[0], 10) || 7;
  const targetPerTeam = modePlayersPerTeam;
  const totalPlayersCount = modePlayersPerTeam * 2;
  const activePayersCount = isGkFree ? Math.max(1, totalPlayersCount - 2) : totalPlayersCount;
  const perPlayerFee = Math.round(totalMatchFee / activePayersCount);

  // All squad members for the active team (pitch slots + bench), sorted chronologically by joinedAt
  const activeTeamAllPlayers = React.useMemo(() => {
    const list: {
      uid: string;
      name: string;
      avatar?: string;
      position?: string;
      joinedAt: number;
      source: 'pitch' | 'bench';
      slotKey?: string;
    }[] = [];

    // 1. Slots for active team
    const slots = activeMatch?.slots || {};
    Object.entries(slots).forEach(([slotKey, slotData]) => {
      if (!slotData || !slotData.uid) return;
      const belongsToThisTeam = activeTeam === 'A' 
        ? (!slotKey.startsWith('B_')) 
        : slotKey.startsWith('B_');
      if (belongsToThisTeam) {
        list.push({
          uid: slotData.uid,
          name: slotData.name,
          avatar: slotData.avatar,
          position: slotData.position || slotKey,
          joinedAt: slotData.joinedAt || 1,
          source: 'pitch',
          slotKey
        });
      }
    });

    // 2. Bench for active team
    const bench = activeTeam === 'A' ? benchA : benchB;
    bench.forEach((bp, index) => {
      if (bp.uid && !list.some(item => item.uid === bp.uid)) {
        list.push({
          uid: bp.uid,
          name: bp.name,
          avatar: bp.avatar,
          position: bp.position,
          joinedAt: bp.joinedAt || (1000 + index),
          source: 'bench'
        });
      }
    });

    // Sort ascending by joinedAt
    list.sort((a, b) => a.joinedAt - b.joinedAt);
    return list;
  }, [activeMatch?.slots, activeTeam, benchA, benchB]);

  // Helper to determine surplus status and order
  const getPlayerSquadStatus = React.useCallback((playerUid: string) => {
    const idx = activeTeamAllPlayers.findIndex(p => p.uid === playerUid);
    if (idx === -1) return { orderNumber: 0, isSurplus: false };
    const orderNumber = idx + 1;
    const isSurplus = orderNumber > targetPerTeam;
    return { orderNumber, isSurplus };
  }, [activeTeamAllPlayers, targetPerTeam]);

  // Dynamic Roster Payments synchronized with Firestore slots and benches
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

    // Also include bench players if not already in list
    const appendBench = (bench: BenchPlayer[], teamPrefix: string) => {
      bench.forEach(bp => {
        if (!bp.uid || list.some(p => p.uid === bp.uid)) return;
        const isPaid = Boolean(bp.paid) || bp.paymentStatus === 'paid';
        const paymentStatus: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt' =
          bp.paymentStatus || (isPaid ? 'paid' : 'unpaid');
        list.push({
          slotKey: `BENCH_${teamPrefix}_${bp.uid}`,
          uid: bp.uid,
          name: bp.name,
          role: bp.position || `${teamPrefix} Takımı Yedeği`,
          avatar: bp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          paid: isPaid,
          paymentStatus,
          paymentMethod: bp.paymentMethod || 'cash',
          amount: perPlayerFee,
          isGk: false
        });
      });
    };
    appendBench(benchA, 'A');
    appendBench(benchB, 'B');

    return list;
  }, [activeMatch?.slots, benchA, benchB, isGkFree, perPlayerFee]);

  const collectedPaidAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectedCashAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'cash_on_pitch')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingApprovalAmount = rosterPayments
    .filter((p) => p.paymentStatus === 'pending_approval')
    .reduce((sum, p) => sum + p.amount, 0);


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
            } catch {
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
          } catch {
            Alert.alert('Hata', 'Ödeme durumu güncellenemedi.');
          }
        }
      },
      {
        text: '💵 Sahada Nakit Olarak İşaretle',
        onPress: async () => {
          try {
            await dbService.updateSlotPayment(activeMatchId, slotKey, false, 'cash_on_pitch', 'cash');
          } catch {
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
          } catch {
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
    } catch {
      Alert.alert('Hata', 'IBAN bilgileri güncellenirken bir sorun oluştu.');
    } finally {
      setSavingCaptainIban(false);
    }
  };

  // Dual Chat State (General 14-player & Team 7-player)
  const [chatChannel, setChatChannel] = useState<'general' | 'team'>('general');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{id: string; name: string; text: string; color: string; isSelf: boolean}[]>([]);
  const [teamChatMessages, setTeamChatMessages] = useState<{id: string; name: string; text: string; color: string; isSelf: boolean}[]>([]);

  // Firestore live general chat subscription
  React.useEffect(() => {
    if (!activeMatchId) return;
    const unsubChat = dbService.subscribeMessages(`match_${activeMatchId}`, (msgs) => {
      if (msgs) {
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

  // Firestore live team tactical chat subscription (private to Team A or Team B)
  React.useEffect(() => {
    if (!myTeam || !activeMatchId) {
      setTeamChatMessages([]);
      return;
    }
    const unsubTeamChat = dbService.subscribeMessages(`match_${activeMatchId}_team_${myTeam}`, (msgs) => {
      if (msgs) {
        setTeamChatMessages(msgs.map(m => ({
          id: m.id || Math.random().toString(),
          name: m.senderName,
          text: m.text,
          color: m.senderId === user?.uid ? theme.secondary : theme.primary,
          isSelf: m.senderId === user?.uid
        })));
      }
    });
    return () => {
      if (unsubTeamChat) unsubTeamChat();
    };
  }, [activeMatchId, myTeam, user?.uid, theme.primary, theme.secondary]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    const isTeam = chatChannel === 'team' && myTeam;
    const targetRoomId = isTeam ? `match_${activeMatchId}_team_${myTeam}` : `match_${activeMatchId}`;

    try {
      await dbService.sendMessage(targetRoomId, {
        senderId: user?.uid || 'anon',
        senderName: user?.name || 'Ben',
        senderAvatar: user?.avatar,
        text: text
      });
    } catch {
      console.log('Mesaj gönderme hatası');
      const newMsg = {
        id: Date.now().toString(),
        name: user?.name || 'Ben',
        text: text,
        color: theme.secondary,
        isSelf: true
      };
      if (isTeam) {
        setTeamChatMessages((prev) => [...prev, newMsg]);
      } else {
        setChatMessages((prev) => [...prev, newMsg]);
      }
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
    const effUid = user?.uid || auth.currentUser?.uid;
    const targetMatchId = params.matchId || fallbackMatch?.id;
    setUserSlot(null);
    if (targetMatchId && targetMatchId !== 'demo-match') {
      try {
        await dbService.leaveMatchSlot(targetMatchId, slotKey, effUid);
        if (penaltyPercent > 0 && effUid) {
          const newScore = await dbService.updateUserReliability(effUid, penaltyPercent);
          Alert.alert(
            'Mevkiden Ayrıldınız',
            `${slotLabel} mevkisinden ayrıldınız.\n\n⚠️ Geç iptal nedeniyle Güvenilirlik Puanınız %${penaltyPercent} düşürüldü. (Yeni Puanınız: %${newScore})`
          );
        } else {
          Alert.alert('Ayrıldınız', `${slotLabel} mevkisinden ayrıldınız.`);
        }
      } catch {
        console.error('Slot ayrılma hatası');
        setUserSlot(slotKey); // Rollback
        Alert.alert('Hata', 'Mevkiden ayrılırken bir sorun oluştu.');
      }
    } else {
      Alert.alert('Ayrıldınız', `${slotLabel} mevkisinden ayrıldınız.`);
    }
  };

  const handleSelectSlot = async (slotKey: string, slotLabel: string) => {
    const effUid = user?.uid || auth.currentUser?.uid;
    if (!effUid) {
      Alert.alert('Giriş Yapın', 'Kadroya katılmak veya işlem yapmak için lütfen önce giriş yapın.');
      return;
    }

    const targetMatchId = params.matchId || fallbackMatch?.id;
    if (!targetMatchId || targetMatchId === 'demo-match') {
      Alert.alert('Demo Maç', 'Demo maçta kadro değişiklikleri sunucuya kaydedilmez.');
      return;
    }

    // 1. If a bench player is currently selected for placement
    if (selectedBenchPlayer) {
      if (selectedBenchPlayer.team !== activeTeam) {
        Alert.alert('Hata', 'Seçilen yedek oyuncu farklı bir takıma ait.');
        setSelectedBenchPlayer(null);
        return;
      }

      // Check permission: can user place this bench player?
      const isMyOwnBenchPlayer = selectedBenchPlayer.player.uid === effUid;
      if (!canManageActiveTeam && !isMyOwnBenchPlayer) {
        Alert.alert('Yetki Yok', 'Bu yedek oyuncuyu sadece takım kaptanı veya organizatör sahaya yerleştirebilir.');
        return;
      }

      const existingOccupant = activeMatch?.slots?.[slotKey];
      if (existingOccupant && existingOccupant.uid) {
        // Swap occupant to bench, and put selected bench player here
        Alert.alert(
          'Oyuncu Değişikliği',
          `Sahadaki ${existingOccupant.name} yedek kulübesine alınacak ve yerine ${selectedBenchPlayer.player.name} sahaya geçecek. Onaylıyor musunuz?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Değişikliği Yap',
              onPress: async () => {
                try {
                  await dbService.assignBenchPlayerToSlot(targetMatchId, activeTeam, selectedBenchPlayer.player.uid, slotKey);
                  Alert.alert('✓ Değişiklik Yapıldı', `${selectedBenchPlayer.player.name} sahaya alındı, ${existingOccupant.name} yedek kulübesine çekildi.`);
                  setSelectedBenchPlayer(null);
                } catch {
                  Alert.alert('Hata', 'Oyuncu değişikliği yapılırken bir sorun oluştu.');
                }
              }
            }
          ]
        );
        return;
      }

      // Slot is empty -> Assign bench player directly
      try {
        await dbService.assignBenchPlayerToSlot(targetMatchId, activeTeam, selectedBenchPlayer.player.uid, slotKey);
        Alert.alert('✓ Sahaya Yerleştirildi', `${selectedBenchPlayer.player.name} ${slotLabel} mevkisine yerleştirildi.`);
        setSelectedBenchPlayer(null);
      } catch {
        Alert.alert('Hata', 'Yedek oyuncu sahaya yerleştirilirken bir sorun oluştu.');
      }
      return;
    }

    // 2. Normal Slot Interaction (No bench player selected)
    const existingOccupant = activeMatch?.slots?.[slotKey];

    if (existingOccupant && existingOccupant.uid) {
      const isMySlot = existingOccupant.uid === effUid || userSlot === slotKey;

      if (isMySlot) {
        // My own slot -> options to move to bench or leave match
        Alert.alert(
          'Mevki İşlemleri',
          `${slotLabel} mevkisindesiniz. Ne yapmak istersiniz?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: '🔄 Yedek Kulübesine Geç',
              onPress: async () => {
                try {
                  await dbService.moveSlotToBench(targetMatchId, activeTeam, slotKey);
                  Alert.alert('Yedek Kulübesine Geçtiniz', 'Sahadan çıkıp yedek kulübesine geçtiniz.');
                } catch {
                  Alert.alert('Hata', 'Yedek kulübesine geçilirken bir sorun oluştu.');
                }
              }
            },
            {
              text: '🚪 Kadrodan Ayrıl',
              style: 'destructive',
              onPress: () => {
                const hoursLeft = calculateHoursUntilMatch(matchDateTime);
                let penalty = 0;
                if (hoursLeft <= 2) penalty = 15;
                else if (hoursLeft <= 6) penalty = 8;
                else if (hoursLeft <= 24) penalty = 3;
                executeLeaveSlot(slotKey, slotLabel, penalty);
              }
            }
          ]
        );
        return;
      }

      // Slot is occupied by someone else
      if (canManageActiveTeam) {
        const options: any[] = [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: '🔄 Yedek Kulübesine Çek',
            onPress: async () => {
              try {
                await dbService.moveSlotToBench(targetMatchId, activeTeam, slotKey);
                Alert.alert('Yedek Kulübesine Alındı', `${existingOccupant.name} yedek kulübesine çekildi.`);
              } catch {
                Alert.alert('Hata', 'Oyuncu kulübeye çekilirken bir sorun oluştu.');
              }
            }
          },
          {
            text: '💵 Ödeme Durumunu Değiştir',
            onPress: () => {
              handleCaptainTogglePayment(slotKey, existingOccupant.name, existingOccupant.paymentStatus || 'unpaid', existingOccupant.uid);
            }
          }
        ];

        if (isOrganizer && activeTeam === 'B' && existingOccupant.uid !== effUid) {
          const isSlotCapB = Boolean(activeMatch?.captainBId && activeMatch.captainBId === existingOccupant.uid);
          options.splice(1, 0, {
            text: isSlotCapB ? '⭐ B Kaptanlığını Kaldır' : '⭐ B Takımı Kaptanı Yap',
            onPress: () => handleAssignCaptainB(existingOccupant.uid, existingOccupant.name)
          });
        }

        Alert.alert(`Oyuncu Yönetimi: ${existingOccupant.name}`, `${activeTeam} Takımı yöneticisi olarak işlem seçin:`, options);
        return;
      }

      // Regular user trying to click someone else's slot
      Alert.alert('Mevki Dolu', `Bu mevki ${existingOccupant.name} tarafından doldurulmuştur.`);
      return;
    }

    // 3. Slot is EMPTY:
    // Check team lock: can user take this slot?
    if (myTeam && myTeam !== activeTeam) {
      Alert.alert('Farklı Takımdasınız', `Siz ${myTeam} Takımındasınız. ${activeTeam} Takımının mevkisine geçemez veya takım değiştiremezsiniz.`);
      return;
    }

    // If user is already in this team's bench:
    const isInThisTeamBench = (activeTeam === 'A' ? benchA : benchB).some(p => p.uid === effUid);
    if (isInThisTeamBench) {
      try {
        await dbService.assignBenchPlayerToSlot(targetMatchId, activeTeam, effUid, slotKey);
        Alert.alert('✓ Kadroya Girildi', `${slotLabel} mevkisine yerleştiniz.`);
      } catch {
        Alert.alert('Hata', 'Mevkiye yerleşirken bir sorun oluştu.');
      }
      return;
    }

    // If user is already on another pitch slot in this team:
    if (userSlot && userSlot !== slotKey) {
      try {
        await dbService.leaveMatchSlot(targetMatchId, userSlot, effUid);
        await dbService.joinMatchSlot(targetMatchId, slotKey, {
          uid: effUid,
          name: user?.name || auth.currentUser?.displayName || 'Oyuncu',
          avatar: user?.avatar || auth.currentUser?.photoURL || '',
          position: slotLabel,
          joinedAt: Date.now()
        });
        Alert.alert('Mevki Değiştirildi', `${slotLabel} mevkiine geçtiniz.`);
      } catch {
        Alert.alert('Hata', 'Mevki değiştirilirken bir sorun oluştu.');
      }
      return;
    }

    // If user is not yet in the team at all:
    // Joining bench then placing into slot:
    try {
      await dbService.joinTeamBench(targetMatchId, activeTeam, {
        uid: effUid,
        name: user?.name || auth.currentUser?.displayName || 'Oyuncu',
        avatar: user?.avatar || auth.currentUser?.photoURL || '',
        joinedAt: Date.now()
      });
      await dbService.assignBenchPlayerToSlot(targetMatchId, activeTeam, effUid, slotKey);
      Alert.alert('✓ Takıma Katıldınız', `${activeTeam} Takımı ${slotLabel} mevkisine yerleştiniz.`);
    } catch {
      Alert.alert('Hata', 'Takıma katılırken bir sorun oluştu.');
    }
  };

  // Join active team's bench
  const handleJoinActiveTeamBench = async () => {
    const effUid = user?.uid || auth.currentUser?.uid;
    if (!effUid) {
      Alert.alert('Giriş Yapın', 'Yedek kulübesine katılmak için lütfen önce giriş yapın.');
      return;
    }
    if (myTeam && myTeam !== activeTeam) {
      Alert.alert('Farklı Takımdasınız', `Siz ${myTeam} Takımındasınız. ${activeTeam} Takımına geçemezsiniz.`);
      return;
    }
    const targetMatchId = params.matchId || fallbackMatch?.id;
    if (!targetMatchId || targetMatchId === 'demo-match') return;

    try {
      await dbService.joinTeamBench(targetMatchId, activeTeam, {
        uid: effUid,
        name: user?.name || auth.currentUser?.displayName || 'Oyuncu',
        avatar: user?.avatar || auth.currentUser?.photoURL || '',
        joinedAt: Date.now()
      });
      Alert.alert('✓ Yedek Kulübesindesiniz', `${activeTeam} Takımı yedek kulübesine katıldınız. Kaptan veya siz sahadaki boş bir mevkiye geçebilirsiniz.`);
    } catch {
      Alert.alert('Hata', 'Yedek kulübesine katılırken bir sorun oluştu.');
    }
  };

  // Leave bench
  const handleLeaveBench = async (playerUid: string, playerName: string) => {
    const effUid = user?.uid || auth.currentUser?.uid;
    const canRemove = canManageActiveTeam || playerUid === effUid;
    if (!canRemove) return;

    const targetMatchId = params.matchId || fallbackMatch?.id;
    if (!targetMatchId || targetMatchId === 'demo-match') return;

    Alert.alert(
      playerUid === effUid ? 'Yedek Kulübesinden Ayrıl' : 'Oyuncuyu Çıkar',
      playerUid === effUid 
        ? `${activeTeam} Takımı yedek kulübesinden ayrılmak istiyor musunuz?`
        : `${playerName} oyuncusunu ${activeTeam} Takımı yedek kulübesinden çıkarmak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl / Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbService.leaveMatchSquad(targetMatchId, playerUid);
              if (selectedBenchPlayer?.player.uid === playerUid) {
                setSelectedBenchPlayer(null);
              }
              Alert.alert('Ayrıldı', `${playerName} yedek kulübesinden ayrıldı.`);
            } catch {
              Alert.alert('Hata', 'İşlem yapılırken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleConfirmTerms = async () => {
    if (params.matchId) {
      try {
        await dbService.updateMatchTerms(params.matchId, joinTerms);
        Alert.alert('✓ Şartlar Kaydedildi', 'Maç katılım kuralları başarıyla güncellendi.', [{ text: 'Tamam' }]);
      } catch {
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
            onPress: () => router.push({ 
              pathname: '/rate-match', 
              params: { 
                matchId: activeMatchId, 
                matchScore: finalScore,
                isOrganizer: isOrganizer ? 'true' : 'false'
              } 
            }) 
          },
          { text: 'Tamam', onPress: () => router.back() }
        ]
      );
    } catch {
      console.error('Maç tamamlama hatası');
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
            } catch {
              Alert.alert('Hata', 'Maç iptal edilirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
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
    let occupant = activeMatch?.slots?.[slotKey] || (activeTeam === 'A' ? activeMatch?.slots?.[legacyKey] : null);

    // Fallbacks for key aliases & backwards compatibility:
    if (!occupant) {
      if (activeTeam === 'A' && keySuffix === 'OS_ORTA') {
        occupant = activeMatch?.slots?.['A_OS_ORTA'] || activeMatch?.slots?.['KAPTAN'] || activeMatch?.slots?.['OS_ORTA'];
      } else if (keySuffix === 'FORVET_SOL' && activeMatch?.slots?.[`${activeTeam}_FORVET`]) {
        occupant = activeMatch.slots[`${activeTeam}_FORVET`];
      } else if (keySuffix === 'FORVET' && activeMatch?.slots?.[`${activeTeam}_FORVET_SOL`]) {
        occupant = activeMatch.slots[`${activeTeam}_FORVET_SOL`];
      }
    }
    const isOccupied = !!occupant;
    const isMySlot = isSelectedByMe || Boolean(occupant && occupant.uid === currentUid);
    const teamColor = activeTeam === 'A' ? theme.primary : theme.secondary;

    const occUid = isMySlot ? currentUid : occupant?.uid;
    const { orderNumber, isSurplus } = occUid ? getPlayerSquadStatus(occUid) : { orderNumber: 0, isSurplus: false };

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

    const isSlotPlacementTarget = selectedBenchPlayer && selectedBenchPlayer.team === activeTeam;

    return (
      <View style={styles.slotContainer}>
        {isOccupied || isMySlot ? (
          <TouchableOpacity 
            style={[
              styles.occupiedSlot, 
              { borderColor: isSurplus ? '#f59e0b' : (isMySlot ? teamColor : `${teamColor}99`), borderWidth: isSurplus ? 2.5 : (isMySlot ? 2 : 1.5) },
              isSurplus && { backgroundColor: 'rgba(245, 158, 11, 0.18)' }
            ]} 
            onPress={() => handleSelectSlot(slotKey, roleName)}
          >
            <Image source={{ uri: avatarUrl }} style={styles.slotAvatar} />
            <View style={[styles.slotBadge, { backgroundColor: isSurplus ? '#f59e0b' : teamColor }]}>
              <Text style={[styles.slotBadgeText, { color: isSurplus ? '#000000' : theme.background }]}>
                {isSurplus ? `⚡${orderNumber}` : numberStr}
              </Text>
            </View>
            {/* Captain / Organizer Crown Badge */}
            {(() => {
              const isOrg = occUid && (
                occUid === activeMatch?.organizerId || 
                occUid === activeMatch?.captainAId || 
                (isOrganizer && (isMySlot || occupant?.name?.includes('Siz') || occupant?.name?.includes('Organizatör')))
              );
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
            style={[
              styles.emptySlot, 
              { borderColor: isSlotPlacementTarget ? teamColor : `${teamColor}66` },
              isSlotPlacementTarget && {
                borderWidth: 2.5,
                backgroundColor: `${teamColor}28`,
                shadowColor: teamColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 6
              }
            ]} 
            onPress={() => handleSelectSlot(slotKey, roleName)}
          >
            <MaterialIcons 
              name={isSlotPlacementTarget ? "touch-app" : "add"} 
              size={isSlotPlacementTarget ? 26 : 24} 
              color={teamColor} 
            />
          </TouchableOpacity>
        )}
        <Text 
          style={[
            styles.slotLabel, 
            isMySlot && { color: teamColor, fontWeight: 'bold' },
            isSurplus && { color: '#f59e0b', fontWeight: 'bold' }
          ]} 
          numberOfLines={1}
        >
          {isOccupied ? (isSurplus ? `⚡ ${occupant?.name}` : occupant?.name) : roleName}
        </Text>
        {(isOccupied || isMySlot) && (
          <TouchableOpacity 
            style={[styles.slotPaymentPill, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}
            onPress={() => {
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

        {/* Tactical Formation Selection Modal */}
        <Modal 
          visible={formationModalVisible} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setFormationModalVisible(false)}
        >
          <View style={styles.formationModalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFillObject} 
              activeOpacity={1} 
              onPress={() => setFormationModalVisible(false)} 
            />
            <View style={styles.formationModalContent}>
              <View style={styles.formationModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="grid-on" size={20} color={activeTeam === 'A' ? theme.primary : theme.secondary} />
                  <Text style={styles.formationModalTitle}>{activeTeam} TAKIMI DİZİLİŞİNİ SEÇ</Text>
                </View>
                <TouchableOpacity onPress={() => setFormationModalVisible(false)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.formationList}>
                {[
                  { id: '2-3-1', title: '2 - 3 - 1 (Klasik & Dengeli)', desc: '1 Forvet • 3 Orta Saha (Sol OS, Merkez OS, Sağ OS) • 2 Defans • 1 Kaleci' },
                  { id: '3-2-1', title: '3 - 2 - 1 (Savunma & Kontra)', desc: '1 Forvet • 2 Orta Saha (Sol OS, Sağ OS) • 3 Defans (Sol Def, Stoper, Sağ Def) • 1 Kaleci' },
                  { id: '2-2-2', title: '2 - 2 - 2 (Ofansif & Çift Forvet)', desc: '2 Forvet (Sol, Sağ) • 2 Orta Saha (Sol OS, Sağ OS) • 2 Defans • 1 Kaleci' },
                  { id: '3-1-2', title: '3 - 1 - 2 (Baskı & Çift Forvet)', desc: '2 Forvet (Sol, Sağ) • 1 Merkez OS • 3 Defans (Sol Def, Stoper, Sağ Def) • 1 Kaleci' },
                ].map((f) => {
                  const isSelected = currentTeamFormation === f.id;
                  const activeColor = activeTeam === 'A' ? theme.primary : theme.secondary;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.formationOptionCard, isSelected && { borderColor: activeColor, backgroundColor: `${activeColor}15` }]}
                      onPress={() => handleSelectFormation(f.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.formationOptionTitle, isSelected && { color: activeColor }]}>{f.title}</Text>
                        {isSelected && <MaterialIcons name="check-circle" size={18} color={activeColor} />}
                      </View>
                      <Text style={styles.formationOptionDesc}>{f.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* TopAppBar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtnHover} onPress={() => router.back()} accessibilityLabel="Geri" accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>MAÇ ODASI</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {matchArena}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
          {/* 1. Saha & Maç Bilgi Kartı (Saha Adı, İlçe/Şehir, Tarih/Saat, Format ve Rezervasyon Durumu) */}
          <TouchableOpacity 
            style={styles.venueInfoCard} 
            activeOpacity={0.88}
            onPress={openVenueLocation}
          >
            <View style={styles.venueCardTop}>
              <View style={styles.venueIconBadge}>
                <MaterialIcons name="stadium" size={24} color={theme.primary} />
              </View>
              <View style={styles.venueMainInfo}>
                <View style={styles.venueTitleRow}>
                  <Text style={styles.venueTitle} numberOfLines={2}>
                    {matchArena}
                  </Text>
                </View>
                <View style={styles.venueLocationRow}>
                  <MaterialIcons name="location-on" size={13} color={theme.primary} />
                  <Text style={styles.venueLocationText}>
                    {matchDistrict ? `${matchDistrict}, ` : ''}{matchCity}
                  </Text>
                  {activeMatch?.hasReservation ? (
                    <View style={styles.venueResBadge}>
                      <MaterialIcons name="verified" size={11} color="#22c55e" />
                      <Text style={styles.venueResBadgeText}>Sahası Hazır</Text>
                    </View>
                  ) : activeMatch?.isPitchFlexible ? (
                    <View style={styles.venueFlexBadge}>
                      <MaterialIcons name="location-searching" size={11} color="#f59e0b" />
                      <Text style={styles.venueFlexBadgeText}>Saha Aranıyor</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.venueMapBtn}
                onPress={openVenueLocation}
                activeOpacity={0.8}
              >
                <MaterialIcons name="directions" size={15} color={theme.onPrimary || theme.background} />
                <Text style={styles.venueMapBtnText}>Harita</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.venueCardDivider} />

            <View style={styles.venueMetaRow}>
              <View style={styles.venueMetaItem}>
                <MaterialIcons name="event" size={13} color={theme.primary} />
                <Text style={styles.venueMetaText}>{matchDateTime}</Text>
              </View>
              <View style={styles.venueMetaItem}>
                <MaterialIcons name="groups" size={13} color={theme.secondary} />
                <Text style={styles.venueMetaText}>{matchMode}</Text>
              </View>
              <View style={styles.venueMetaItem}>
                <MaterialIcons name="payments" size={13} color={theme.warning || '#f59e0b'} />
                <Text style={styles.venueMetaText}>₺{perPlayerFee} / kişi</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. Live Weather Forecast Alert */}
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
                <Text style={[styles.teamCountText, activeTeam === 'A' && { color: theme.primary }]}>{teamACount + benchA.length}/{modePlayersPerTeam}</Text>
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
                <Text style={[styles.teamCountText, activeTeam === 'B' && { color: theme.secondary }]}>{teamBCount + benchB.length}/{modePlayersPerTeam}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tactical Formation Selector Bar */}
          <View style={styles.formationBar}>
            <View style={styles.formationBarLeft}>
              <MaterialIcons name="grid-on" size={16} color={activeTeam === 'A' ? theme.primary : theme.secondary} />
              <Text style={styles.formationBarLabel}>DİZİLİŞ:</Text>
              <View style={[styles.formationPill, { backgroundColor: activeTeam === 'A' ? `${theme.primary}22` : `${theme.secondary}22` }]}>
                <Text style={[styles.formationPillText, { color: activeTeam === 'A' ? theme.primary : theme.secondary }]}>
                  {currentTeamFormation}
                </Text>
              </View>
            </View>

            {canManageCurrentFormation ? (
              <TouchableOpacity 
                style={[styles.changeFormationBtn, { borderColor: activeTeam === 'A' ? `${theme.primary}66` : `${theme.secondary}66` }]}
                onPress={() => setFormationModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="tune" size={14} color={activeTeam === 'A' ? theme.primary : theme.secondary} />
                <Text style={[styles.changeFormationBtnText, { color: activeTeam === 'A' ? theme.primary : theme.secondary }]}>
                  Dizilişi Değiştir
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.formationBarSubHint}>Kaptan tarafından belirlenir</Text>
            )}
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
                  WhatsApp&apos;ta kadro davetini tek tıkla paylaşın
                </Text>
              </View>
            </View>
            <View style={styles.shareRosterBtnBadge}>
              <Text style={styles.shareRosterBtnBadgeText}>PAYLAŞ</Text>
            </View>
          </TouchableOpacity>

          {/* Placement Guide Banner when moving bench player */}
          {selectedBenchPlayer && (
            <View style={styles.placementModeBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Image 
                  source={{ uri: selectedBenchPlayer.player.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }} 
                  style={styles.placementAvatar} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.placementTitle} numberOfLines={1}>
                    👉 {selectedBenchPlayer.player.name} Seçildi
                  </Text>
                  <Text style={styles.placementSub}>
                    Sahada boş bir mevkiye (+) dokunarak yerleştirin veya oyuncu değiştirin
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.placementCancelBtn} 
                onPress={() => setSelectedBenchPlayer(null)}
              >
                <Text style={styles.placementCancelBtnText}>İptal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Field Visualization */}
          <View style={styles.fieldWrap}>
            <View style={styles.fieldBox}>
              <View style={styles.pitchLinesArea} pointerEvents="none">
                {/* Outer Pitch Border */}
                <View style={styles.pitchBorder} />
                
                {/* Horizontal Center Line (Orta Saha Çizgisi) */}
                <View style={styles.pitchCenterLine} />
                {/* Center Circle & Center Spot */}
                <View style={styles.pitchCenterCircle} />
                <View style={styles.pitchCenterSpot} />

                {/* Top Penalty Area & Goal (Hücum Sahası) */}
                <View style={styles.pitchPenaltyAreaTop} />
                <View style={styles.pitchGoalAreaTop} />
                <View style={styles.pitchPenaltySpotTop} />
                <View style={styles.pitchGoalTop} />

                {/* Bottom Penalty Area & Goal (Kaleci / Savunma Sahası) */}
                <View style={styles.pitchPenaltyAreaBottom} />
                <View style={styles.pitchGoalAreaBottom} />
                <View style={styles.pitchPenaltySpotBottom} />
                <View style={styles.pitchGoalBottom} />

                {/* 4 Corner Arcs */}
                <View style={styles.pitchCornerTopLeft} />
                <View style={styles.pitchCornerTopRight} />
                <View style={styles.pitchCornerBottomLeft} />
                <View style={styles.pitchCornerBottomRight} />
              </View>

              {/* Secret Tactical Shroud OR Formation Grid */}
              {((activeTeam === 'A' && isTeamAHiddenForMe) || (activeTeam === 'B' && isTeamBHiddenForMe)) ? (
                <View style={styles.hiddenTacticOverlay}>
                  <View style={[styles.hiddenTacticIconCircle, { borderColor: activeTeam === 'A' ? theme.primary : theme.secondary }]}>
                    <MaterialIcons name="security" size={42} color={activeTeam === 'A' ? theme.primary : theme.secondary} />
                  </View>
                  <Text style={styles.hiddenTacticTitle}>🔒 TAKTİK VE KADRO GİZLİ</Text>
                  <Text style={styles.hiddenTacticSub}>
                    {activeTeam === 'A' ? 'A Takımı Kaptanı' : 'B Takımı Kaptanı'} maç saatine kadar kadrosunu ve dizilimini rakip takımdan gizledi.
                  </Text>
                  <View style={[styles.hiddenTacticCountBadge, { backgroundColor: activeTeam === 'A' ? `${theme.primary}26` : `${theme.secondary}26` }]}>
                    <Text style={[styles.hiddenTacticCountText, { color: activeTeam === 'A' ? theme.primary : theme.secondary }]}>
                      {activeTeam === 'A' ? `${teamACount}/${modePlayersPerTeam} OYUNCU KATILDI` : `${teamBCount}/${modePlayersPerTeam} OYUNCU KATILDI`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.formationGrid}>
                  {currentTeamFormation === '3-2-1' ? (
                    <>
                      {/* Forward (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('FORVET', 'Forvet', '9')}
                      </View>

                      {/* Midfield (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('OS_SOL', 'Sol OS', '8')}
                        {renderSlotItem('OS_SAG', 'Sağ OS', '7')}
                      </View>

                      {/* Defenders (3) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-between', paddingHorizontal: 20 }]}>
                        {renderSlotItem('DEF_SOL', 'Sol Def', '3')}
                        {renderSlotItem('DEF_STP', 'Stoper', '5')}
                        {renderSlotItem('DEF_SAG', 'Sağ Def', '4')}
                      </View>

                      {/* GK (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('KALECI', 'Kaleci', '1')}
                      </View>
                    </>
                  ) : currentTeamFormation === '2-2-2' ? (
                    <>
                      {/* Forwards (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('FORVET_SOL', 'Sol Forvet', '9')}
                        {renderSlotItem('FORVET_SAG', 'Sağ Forvet', '11')}
                      </View>

                      {/* Midfield (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('OS_SOL', 'Sol OS', '8')}
                        {renderSlotItem('OS_SAG', 'Sağ OS', '7')}
                      </View>

                      {/* Defenders (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('DEF_SOL', 'Sol Def', '3')}
                        {renderSlotItem('DEF_SAG', 'Sağ Def', '4')}
                      </View>

                      {/* GK (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('KALECI', 'Kaleci', '1')}
                      </View>
                    </>
                  ) : currentTeamFormation === '3-1-2' ? (
                    <>
                      {/* Forwards (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('FORVET_SOL', 'Sol Forvet', '9')}
                        {renderSlotItem('FORVET_SAG', 'Sağ Forvet', '11')}
                      </View>

                      {/* Midfield (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('OS_ORTA', 'Merkez OS', '10')}
                      </View>

                      {/* Defenders (3) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-between', paddingHorizontal: 20 }]}>
                        {renderSlotItem('DEF_SOL', 'Sol Def', '3')}
                        {renderSlotItem('DEF_STP', 'Stoper', '5')}
                        {renderSlotItem('DEF_SAG', 'Sağ Def', '4')}
                      </View>

                      {/* GK (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('KALECI', 'Kaleci', '1')}
                      </View>
                    </>
                  ) : (
                    /* Default 2-3-1 */
                    <>
                      {/* Forward (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('FORVET', 'Forvet', '9')}
                      </View>
                      
                      {/* Midfielders (3) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-between', paddingHorizontal: 24 }]}>
                        {renderSlotItem('OS_SOL', 'Sol OS', '8')}
                        {renderSlotItem('OS_ORTA', 'Merkez OS', '10')}
                        {renderSlotItem('OS_SAG', 'Sağ OS', '7')}
                      </View>

                      {/* Defenders (2) */}
                      <View style={[styles.slotRow, { justifyContent: 'space-around', paddingHorizontal: 48 }]}>
                        {renderSlotItem('DEF_SOL', 'Sol Def', '3')}
                        {renderSlotItem('DEF_SAG', 'Sağ Def', '4')}
                      </View>

                      {/* GK (1) */}
                      <View style={styles.slotRow}>
                        {renderSlotItem('KALECI', 'Kaleci', '1')}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* 🪑 YEDEK KULÜBESİ (TEAM BENCH) */}
          {(() => {
            const currentBench = activeTeam === 'A' ? benchA : benchB;
            const teamColor = activeTeam === 'A' ? theme.primary : theme.secondary;
            const isInMyBench = Boolean(currentUid && currentBench.some(p => p.uid === currentUid));
            const isUserInOtherTeam = Boolean(myTeam && myTeam !== activeTeam);

            return (
              <View style={[styles.benchSection, { borderColor: `${teamColor}40` }]}>
                <View style={styles.benchHeader}>
                  <View style={styles.benchHeaderLeft}>
                    <MaterialIcons name="event-seat" size={18} color={teamColor} />
                    <Text style={[styles.benchTitle, { color: teamColor }]}>
                      {activeTeam} TAKIMI YEDEK KULÜBESİ ({currentBench.length})
                    </Text>
                  </View>
                  <Text style={styles.benchSubHint}>
                    {canManageActiveTeam 
                      ? 'Dokunarak sahaya yerleştirebilir veya oyundaki oyuncuyu kulübeye alabilirsiniz'
                      : 'Kadroya katılanlar ve yedekler burada listelenir'}
                  </Text>
                </View>

                {/* Bench Players List */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.benchList}>
                  {currentBench.length === 0 ? (
                    <Text style={styles.emptyBenchText}>Bu takımın yedek kulübesinde bekleyen oyuncu yok.</Text>
                  ) : (
                    currentBench.map((bp) => {
                      const { orderNumber, isSurplus } = getPlayerSquadStatus(bp.uid);
                      const isSelected = selectedBenchPlayer?.player.uid === bp.uid;
                      const isSelf = bp.uid === currentUid;
                      const canManageThisPlayer = canManageActiveTeam || isSelf;

                      return (
                        <View 
                          key={bp.uid} 
                          style={[
                            styles.benchCard,
                            isSurplus && styles.benchCardSurplus,
                            isSelected && [styles.benchCardSelected, { borderColor: teamColor }]
                          ]}
                        >
                          {/* Surplus badge on top if 8th+ player */}
                          {isSurplus ? (
                            <View style={styles.benchSurplusBadge}>
                              <Text style={styles.benchSurplusBadgeText}>⚡ {orderNumber}. KİŞİ (YEDEK)</Text>
                            </View>
                          ) : (
                            <View style={[styles.benchOrderBadge, { backgroundColor: teamColor }]}>
                              <Text style={[styles.benchOrderBadgeText, { color: theme.background }]}>#{orderNumber}</Text>
                            </View>
                          )}

                          <View style={[styles.benchCardAvatarWrap, isSurplus && { borderColor: '#f59e0b' }]}>
                            <Image 
                              source={{ uri: bp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }} 
                              style={styles.benchCardAvatar} 
                            />
                          </View>

                          <Text style={styles.benchCardName} numberOfLines={1}>
                            {bp.name} {isSelf ? '(Siz)' : ''}
                          </Text>

                          {isSurplus && (
                            <Text style={styles.benchCardSurplusNotice}>
                              Sonradan Katıldı
                            </Text>
                          )}

                          {/* Action button: Sahaya Al / Seçildi */}
                          {canManageThisPlayer && (
                            <TouchableOpacity
                              style={[
                                styles.benchCardBtn,
                                isSelected ? [styles.benchCardBtnSelected, { backgroundColor: teamColor }] : { borderColor: teamColor }
                              ]}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedBenchPlayer(null);
                                } else {
                                  setSelectedBenchPlayer({ team: activeTeam, player: bp });
                                }
                              }}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.benchCardBtnText, isSelected ? { color: theme.background } : { color: teamColor }]}>
                                {isSelected ? '✓ SEÇİLDİ' : 'SAHAYA AL'}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Remove button */}
                          {canManageThisPlayer && (
                            <TouchableOpacity
                              style={styles.benchCardRemoveBtn}
                              onPress={() => handleLeaveBench(bp.uid, bp.name)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialIcons name="close" size={12} color={theme.textMuted} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* User actions on Bench */}
                {(() => {
                  if (isUserInOtherTeam) {
                    return (
                      <View style={styles.benchTeamLockedNotice}>
                        <MaterialIcons name="lock" size={16} color={theme.textMuted} />
                        <Text style={styles.benchTeamLockedNoticeText}>
                          Siz {myTeam} Takımındasınız. Rakip takımın yedek kulübesine katılamazsınız.
                        </Text>
                      </View>
                    );
                  }

                  if (isInMyBench) {
                    return (
                      <TouchableOpacity
                        style={styles.leaveBenchBtn}
                        onPress={() => {
                          const me = currentBench.find(p => p.uid === currentUid);
                          if (me) handleLeaveBench(me.uid, me.name);
                        }}
                      >
                        <MaterialIcons name="logout" size={15} color={theme.error} />
                        <Text style={styles.leaveBenchBtnText}>Yedek Kulübesinden Ayrıl</Text>
                      </TouchableOpacity>
                    );
                  }

                  if (!myTeam && !userSlot) {
                    return (
                      <TouchableOpacity
                        style={[styles.joinBenchBtn, { backgroundColor: teamColor }]}
                        onPress={handleJoinActiveTeamBench}
                      >
                        <MaterialIcons name="group-add" size={16} color={theme.background} />
                        <Text style={[styles.joinBenchBtnText, { color: theme.background }]}>
                          + {activeTeam} TAKIMI YEDEK KULÜBESİNE KATIL
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  return null;
                })()}
              </View>
            );
          })()}

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
            <View style={[styles.sectionHeaderLeft, { flex: 1, marginRight: 8 }]}>
              <MaterialIcons name="account-balance-wallet" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle} numberOfLines={1}>HALI SAHA ÜCRETİ & KASA TAKİBİ</Text>
                <Text style={styles.paymentSubTitle} numberOfLines={1}>Kişi Başı: ₺{perPlayerFee} • Toplam: ₺{totalMatchFee}</Text>
              </View>
            </View>
            <MaterialIcons name={showPaymentDetails ? "expand-less" : "expand-more"} size={24} color={theme.primary} />
          </TouchableOpacity>

          {showPaymentDetails && (
            <View style={styles.paymentBody}>
              {/* Kaleci Ücret Muafiyeti Toggle - Compact & Editable */}
              <View style={styles.gkFreeCompactRow}>
                <View style={styles.gkFreeLeft}>
                  <MaterialIcons name="sports-handball" size={18} color={theme.primary} />
                  <View>
                    <Text style={styles.gkFreeCompactTitle}>Kalecilerden Ücret Alınmasın</Text>
                    <Text style={styles.gkFreeCompactSub}>
                      {isGkFree 
                        ? `Muaf • ₺${perPlayerFee}/kişi (${activePayersCount} saha oyuncusu)` 
                        : `Herkes Eşit • ₺${perPlayerFee}/kişi (14 oyuncu)`}
                    </Text>
                  </View>
                </View>
                {isOrganizer ? (
                  <Switch
                    value={isGkFree}
                    onValueChange={async (val) => {
                      setIsGkFree(val);
                      if (activeMatchId) {
                        try {
                          await dbService.updateMatchGkFree(activeMatchId, val);
                          await dbService.sendMessage(`match_${activeMatchId}`, {
                            senderId: user?.uid || 'anon',
                            senderName: 'Organizatör',
                            text: val 
                              ? `🧤 [Kaleci Ayarı]: Organizatör bu maçta kalecileri ücretten muaf tuttu. Yeni kişi başı ücret: ₺${Math.round(totalMatchFee / Math.max(1, totalPlayersCount - 2))}`
                              : `🧤 [Kaleci Ayarı]: Kaleci ücret muafiyeti kaldırıldı. Ücret tüm kadroya eşit bölündü (₺${Math.round(totalMatchFee / totalPlayersCount)}/kişi).`
                          });
                        } catch {
                          console.error('Kaleci muafiyet güncelleme hatası');
                        }
                      }
                    }}
                    trackColor={{ false: theme.surfaceContainerHighest, true: theme.primary }}
                    thumbColor={isGkFree ? theme.text : theme.textMuted}
                  />
                ) : (
                  <View style={[styles.miniGkBadge, { backgroundColor: isGkFree ? `${theme.primary}26` : theme.surfaceContainerHighest }]}>
                    <Text style={[styles.miniGkBadgeText, { color: isGkFree ? theme.primary : theme.textMuted }]}>
                      {isGkFree ? 'ÜCRETSİZ' : 'STANDART'}
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

              {/* 2. KASA & MUHASEBE DURUMU (ACCOUNTING BAR) — sadece organizatör & kaptanlar */}
              {(isOrganizer || isCaptainB) && (
                <>
                  <Text style={[styles.paymentLabel, { marginTop: 18 }]}>2. KASA & MUHASEBE TAKİBİ</Text>
                  <View style={styles.accountingCard}>
                    <View style={styles.accountingStatsRow}>
                      <View style={styles.accountingCol}>
                        <View style={styles.accColLabelContainer}>
                          <Text style={[styles.accColLabel, { color: theme.primary }]} numberOfLines={1}>ÖDENDİ</Text>
                        </View>
                        <Text style={[styles.accColVal, { color: theme.primary }]}>₺{collectedPaidAmount}</Text>
                      </View>
                      <View style={styles.accountingDivider} />
                      <View style={styles.accountingCol}>
                        <View style={styles.accColLabelContainer}>
                          <Text style={[styles.accColLabel, { color: '#6e9bff' }]} numberOfLines={1}>NAKİT</Text>
                        </View>
                        <Text style={[styles.accColVal, { color: '#6e9bff' }]}>₺{collectedCashAmount}</Text>
                      </View>
                      <View style={styles.accountingDivider} />
                      <View style={styles.accountingCol}>
                        <View style={styles.accColLabelContainer}>
                          <Text style={[styles.accColLabel, { color: '#ffb703' }]} numberOfLines={1}>BEKLEYEN</Text>
                        </View>
                        <Text style={[styles.accColVal, { color: '#ffb703' }]}>₺{pendingApprovalAmount}</Text>
                      </View>
                      <View style={styles.accountingDivider} />
                      <View style={styles.accountingCol}>
                        <View style={styles.accColLabelContainer}>
                          <Text style={[styles.accColLabel, { color: theme.error }]} numberOfLines={1}>KALAN</Text>
                        </View>
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
                          Takımınızın toplam payı ₺{teamBTotal}&apos;dir. Kendi takımınızın ödemelerini aşağıdaki çizelgeden kontrol edebilir ve Organizatör ile paylaşabilirsiniz.
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}

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
                    <View style={[styles.playerItemLeft, { flex: 1, marginRight: 8 }]}>
                      <Image source={{ uri: player.avatar || user?.avatar }} style={styles.playerAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.playerName} numberOfLines={1}>{player.name} {isCurrent ? '(Siz)' : ''}</Text>
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
                      <TouchableOpacity 
                        onPress={() => userSlot && handleSelectSlot(userSlot, player.role)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
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

        {/* Dual Channel Match & Team Chat */}
        <View style={styles.sectionContainer}>
          {/* Chat Channel Selector Tabs (Left: Takım Sohbeti, Right: Genel Sohbet) */}
          <View style={styles.chatTabsHeader}>
            <TouchableOpacity
              style={[styles.chatTabBtn, chatChannel === 'team' && styles.chatTabBtnActiveTeam]}
              onPress={() => setChatChannel('team')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shield" size={16} color={chatChannel === 'team' ? theme.secondary : theme.textMuted} />
              <Text style={[styles.chatTabText, chatChannel === 'team' && { color: theme.secondary, fontFamily: Fonts.headlineBold }]}>
                {myTeam ? `${myTeam} TAKIMI (${modePlayersPerTeam} KİŞİ)` : 'TAKIM SOHBETİ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chatTabBtn, chatChannel === 'general' && styles.chatTabBtnActiveGeneral]}
              onPress={() => setChatChannel('general')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="public" size={16} color={chatChannel === 'general' ? theme.primary : theme.textMuted} />
              <Text style={[styles.chatTabText, chatChannel === 'general' && { color: theme.primary, fontFamily: Fonts.headlineBold }]}>
                GENEL SOHBET ({totalPlayersCount} KİŞİ)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subheader hint */}
          <View style={styles.chatChannelHintBar}>
            <MaterialIcons 
              name={chatChannel === 'general' ? "public" : "security"} 
              size={13} 
              color={chatChannel === 'general' ? theme.primary : theme.secondary} 
            />
            <Text style={styles.chatChannelHintText}>
              {chatChannel === 'general' 
                ? '🌐 Bu odadaki mesajları her iki takımın tüm oyuncuları görebilir.' 
                : (myTeam 
                    ? `🛡️ Gizli Taktik Odası: Sadece ${myTeam} Takımı oyuncuları görür. Karşı takım göremez!` 
                    : '🔒 Takım taktik odası için yukarıdaki sahadan bir mevki seçmelisiniz.')}
            </Text>
          </View>

          <View style={styles.chatBox}>
            {chatChannel === 'team' && !myTeam ? (
              <View style={styles.teamChatLockedBox}>
                <MaterialIcons name="lock" size={32} color={theme.textMuted} />
                <Text style={styles.teamChatLockedTitle}>Takım Taktik Odası Kilitli</Text>
                <Text style={styles.teamChatLockedSub}>
                  Karşı takımdan gizli özel taktik sohbeti kullanabilmek için yukarıdaki sahadan A veya B takımında bir mevki seçin.
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.chatList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {(chatChannel === 'team' ? teamChatMessages : chatMessages).length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted }}>
                        {chatChannel === 'team' 
                          ? `🛡️ ${myTeam} Takımı taktik odasında henüz mesaj yok. İlk taktik mesajını yazın!` 
                          : 'Henüz mesaj yok. İlk mesajı siz yazın!'}
                      </Text>
                    </View>
                  ) : (
                    (chatChannel === 'team' ? teamChatMessages : chatMessages).map((msg) => (
                      <View key={msg.id} style={[msg.isSelf ? styles.chatMsgSelf : styles.chatMsgOther, { marginBottom: 12 }]}>
                        <Text style={[styles.chatName, { color: msg.color, textAlign: msg.isSelf ? 'right' : 'left' }]}>{msg.name}</Text>
                        <View style={msg.isSelf ? styles.chatBubbleSelf : styles.chatBubbleOther}>
                          <Text style={styles.chatText}>{msg.text}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.chatInputWrap}>
                  <TextInput 
                    style={styles.chatInput}
                    placeholder={chatChannel === 'team' ? `${myTeam} Takımına özel taktik mesajı yazın...` : "Maç odasına genel mesaj yazın..."}
                    placeholderTextColor={theme.textMuted}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={handleSendChat}
                  />
                  <TouchableOpacity 
                    style={[styles.chatSendBtn, chatChannel === 'team' && { backgroundColor: theme.secondary }]} 
                    onPress={handleSendChat}
                  >
                    <MaterialIcons name="send" size={16} color={theme.background} />
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: `${theme.background}CC`,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  brandTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 20,
    color: theme.primary,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 14,
    marginTop: 1,
  },
  iconBtnHover: {
    padding: 8,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Venue Info Card Styles
  venueInfoCard: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${theme.primary}40`,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  venueCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${theme.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMainInfo: {
    flex: 1,
  },
  venueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  venueLocationText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
  },
  venueResBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  venueResBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: '#22c55e',
  },
  venueFlexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  venueFlexBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: '#f59e0b',
  },
  venueMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  venueMapBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.onPrimary || theme.background,
  },
  venueCardDivider: {
    height: 1,
    backgroundColor: theme.borderSubtle,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueMetaText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
  },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fieldBox: {
    backgroundColor: '#0a1f12',
    height: 440,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${theme.primary}50`,
    position: 'relative',
    overflow: 'hidden',
  },
  pitchLinesArea: {
    ...StyleSheet.absoluteFillObject,
    padding: 14,
  },
  pitchBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    borderRadius: 4,
  },
  pitchCenterLine: {
    position: 'absolute',
    top: '50%',
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.28)',
    transform: [{ translateY: -1 }],
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    transform: [{ translateX: -42 }, { translateY: -42 }],
  },
  pitchCenterSpot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.45)',
    transform: [{ translateX: -3 }, { translateY: -3 }],
  },
  pitchPenaltyAreaBottom: {
    position: 'absolute',
    bottom: 14,
    left: '20%',
    right: '20%',
    height: 70,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  pitchGoalAreaBottom: {
    position: 'absolute',
    bottom: 14,
    left: '35%',
    right: '35%',
    height: 28,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  pitchPenaltySpotBottom: {
    position: 'absolute',
    bottom: 58,
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    transform: [{ translateX: -3 }],
  },
  pitchGoalBottom: {
    position: 'absolute',
    bottom: 8,
    left: '38%',
    right: '38%',
    height: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  pitchPenaltyAreaTop: {
    position: 'absolute',
    top: 14,
    left: '20%',
    right: '20%',
    height: 55,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  pitchGoalAreaTop: {
    position: 'absolute',
    top: 14,
    left: '35%',
    right: '35%',
    height: 22,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  pitchPenaltySpotTop: {
    position: 'absolute',
    top: 48,
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    transform: [{ translateX: -3 }],
  },
  pitchGoalTop: {
    position: 'absolute',
    top: 8,
    left: '38%',
    right: '38%',
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  pitchCornerTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 18,
    height: 18,
    borderBottomRightRadius: 18,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  pitchCornerTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderBottomLeftRadius: 18,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  pitchCornerBottomLeft: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 18,
    height: 18,
    borderTopRightRadius: 18,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  pitchCornerBottomRight: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 18,
    height: 18,
    borderTopLeftRadius: 18,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  kaleBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: `${theme.primary}4D`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 20,
  },
  kaleBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  formationGrid: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 36,
    paddingBottom: 14,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotContainer: {
    alignItems: 'center',
    minWidth: 68,
  },
  emptySlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${theme.primary}66`,
    backgroundColor: 'rgba(10, 31, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupiedSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  slotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  slotBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: theme.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.onPrimary,
  },
  slotLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.text,
    textTransform: 'uppercase',
    marginTop: 2,
    maxWidth: 76,
    textAlign: 'center',
  },
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
    gap: 12,
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  playerName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
    letterSpacing: -0.3,
  },
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
  // Placement Mode Guide Banner
  placementModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${theme.primary}20`,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  placementAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  placementTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.primary,
  },
  placementSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 1,
  },
  placementCancelBtn: {
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  placementCancelBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
  },

  // Team Bench Styles
  benchSection: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  benchHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  benchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benchTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  benchSubHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    lineHeight: 14,
  },
  benchList: {
    gap: 10,
    paddingVertical: 4,
  },
  emptyBenchText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  benchCard: {
    alignItems: 'center',
    width: 90,
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: theme.borderSubtle,
    position: 'relative',
    gap: 4,
  },
  benchCardSurplus: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  benchCardSelected: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  benchSurplusBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 5,
  },
  benchSurplusBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 7.5,
    color: '#000000',
    letterSpacing: 0.2,
  },
  benchOrderBadge: {
    position: 'absolute',
    top: -6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    zIndex: 5,
  },
  benchOrderBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 8,
  },
  benchCardAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: theme.borderSubtle,
    overflow: 'hidden',
    marginTop: 4,
  },
  benchCardAvatar: {
    width: '100%',
    height: '100%',
  },
  benchCardName: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.text,
    textAlign: 'center',
    maxWidth: 82,
  },
  benchCardSurplusNotice: {
    fontFamily: Fonts.headline,
    fontSize: 8,
    color: '#f59e0b',
    textAlign: 'center',
  },
  benchCardBtn: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  benchCardBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
  },
  benchCardBtnSelected: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  benchCardRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    padding: 3,
    zIndex: 6,
  },
  leaveBenchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${theme.error}1A`,
    borderWidth: 1,
    borderColor: `${theme.error}55`,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveBenchBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.error,
  },
  joinBenchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinBenchBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  benchTeamLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surfaceContainerHighest,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  benchTeamLockedNoticeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
    lineHeight: 14,
  },
  slotSurplusPill: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  slotSurplusPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 7,
    color: '#000000',
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
    paddingVertical: 2,
  },
  accountingCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  accColLabelContainer: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accColLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  accColVal: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    textAlign: 'center',
  },
  accountingDivider: {
    width: 1,
    height: 28,
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

  // Tactical Roster Privacy
  rosterPrivacyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 8,
  },
  rosterPrivacyToggleBtnActive: {
    borderColor: theme.secondary,
    backgroundColor: `${theme.secondary}12`,
  },
  rosterPrivacyToggleText: {
    flex: 1,
    fontFamily: Fonts.headline,
    fontSize: 11,
    color: theme.textMuted,
  },
  miniPrivacyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniPrivacyPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // Hidden Tactical Shroud on Pitch
  hiddenTacticOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${theme.surface}F2`,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 15,
  },
  hiddenTacticIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceContainerHighest,
    marginBottom: 12,
  },
  hiddenTacticTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 15,
    color: theme.text,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hiddenTacticSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
    marginBottom: 12,
  },
  hiddenTacticCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  hiddenTacticCountText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Open slots notice in reserve section
  openSlotsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.primary}15`,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
    marginTop: 4,
  },
  openSlotsNoticeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.text,
    lineHeight: 14,
  },

  // Compact GK Free Row
  gkFreeCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${theme.primary}33`,
  },
  gkFreeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gkFreeCompactTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.text,
  },
  gkFreeCompactSub: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: theme.textMuted,
    marginTop: 1,
  },
  miniGkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniGkBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // Dual Chat Styles
  chatTabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  chatTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: theme.surfaceContainerHighest,
  },
  chatTabBtnActiveGeneral: {
    backgroundColor: `${theme.primary}18`,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
  },
  chatTabBtnActiveTeam: {
    backgroundColor: `${theme.secondary}18`,
    borderBottomWidth: 2,
    borderBottomColor: theme.secondary,
  },
  chatTabText: {
    fontFamily: Fonts.headline,
    fontSize: 10,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  chatChannelHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: theme.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  chatChannelHintText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },
  teamChatLockedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  teamChatLockedTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
  },
  teamChatLockedSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  formationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  formationBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formationBarLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  formationPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formationPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  changeFormationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeFormationBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
  },
  formationBarSubHint: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },
  formationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formationModalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    overflow: 'hidden',
  },
  formationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  formationModalTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.text,
    letterSpacing: 0.5,
  },
  formationList: {
    padding: 16,
    gap: 10,
  },
  formationOptionCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  formationOptionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
  },
  formationOptionDesc: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 15,
  },
});
