import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/services/firebaseConfig';
import { dbService, MatchModel } from '@/services/dbService';
import { isMatchPast } from '@/services/dateUtils';

const MATCHES_CACHE_KEY = '@hiv_matches_cache';

export interface MatchItemFull extends MatchModel {
  id: string;
}

export function useMatches() {
  const [matches, setMatches] = useState<MatchItemFull[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchItemFull[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Önce önbellekten hızlıca getir (geçmiş maçları aktiften eleyerek)
      const cached = await AsyncStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as MatchItemFull[];
        setMatches(parsed.filter(m => !isMatchPast(m.dateTime)));
      }

      // 2. Firestore'dan güncel aktif ve geçmiş maçları çek
      const [remoteMatches, remotePast] = await Promise.all([
        dbService.getMatches(),
        dbService.getPastMatches()
      ]);

      const activeList: MatchItemFull[] = [];
      const pastFromActive: MatchItemFull[] = [];

      for (const m of ((remoteMatches as MatchItemFull[]) || [])) {
        if (isMatchPast(m.dateTime) || m.status === 'completed') {
          pastFromActive.push({ ...m, status: 'completed' });
        } else {
          activeList.push(m);
        }
      }

      // Birleştirilmiş geçmiş maçlar (tekil ve en yeni üstte)
      const pastMap = new Map<string, MatchItemFull>();
      for (const p of ((remotePast as MatchItemFull[]) || [])) {
        pastMap.set(p.id, p);
      }
      for (const p of pastFromActive) {
        if (!pastMap.has(p.id)) {
          pastMap.set(p.id, p);
        }
      }

      const allPast = Array.from(pastMap.values()).sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setMatches(activeList);
      setPastMatches(allPast);
      await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(activeList));
    } catch (e) {
      console.log('Maçları yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const addMatch = async (newMatchData: any, userProfile?: any) => {
    try {
      const modeString = newMatchData.mode || '7v7';
      const parsedNum = parseInt(modeString.split('v')[0], 10);
      const modeNum = !isNaN(parsedNum) && parsedNum > 0 ? parsedNum : 7;
      const totalPlayers = modeNum * 2;

      const effectiveUid = userProfile?.uid || auth.currentUser?.uid || 'host';
      const effectiveName = userProfile?.name || auth.currentUser?.displayName || 'Organizatör (Siz)';
      const effectiveAvatar = userProfile?.avatar || auth.currentUser?.photoURL || '';

      const payload: Omit<MatchModel, 'id'> = {
        arena: newMatchData.arena || 'Halı Saha',
        city: newMatchData.city || 'İstanbul',
        district: newMatchData.district || 'Merkez',
        dateTime: newMatchData.dateTime || `${newMatchData.dateStr || 'Bugün'}, ${newMatchData.timeSlot || '21:00'}`,
        mode: newMatchData.mode || '7v7',
        fee: newMatchData.fee || 150,
        totalFee: newMatchData.totalFee || 2100,
        isSubscription: !!newMatchData.isSubscription,
        isGkFree: !!newMatchData.isGkFree,
        organizer: effectiveName,
        organizerId: effectiveUid,
        organizerIban: newMatchData.organizerIban || userProfile?.iban || '',
        organizerIbanName: newMatchData.organizerIbanName || userProfile?.ibanName || effectiveName,
        organizerBankName: newMatchData.organizerBankName || userProfile?.bankName || '',
        matchFormatType: newMatchData.matchFormatType || 'single_organizer',
        captainAId: effectiveUid,
        captainAName: effectiveName,
        captainBId: newMatchData.captainBId || null,
        captainBName: newMatchData.captainBName || null,
        joinedPlayersCount: 1,
        totalRequiredPlayers: totalPlayers,
        hasReservation: newMatchData.hasReservation !== undefined ? !!newMatchData.hasReservation : false,
        isPitchFlexible: !!newMatchData.isPitchFlexible,
        isTimeFlexible: !!newMatchData.isTimeFlexible,
        preferredPitch: newMatchData.preferredPitch || '',
        preferredTimeSlot: newMatchData.preferredTimeSlot || '',
        teamAFormation: '2-3-1',
        teamBFormation: '2-3-1',
        status: 'active',
        slots: {
          A_OS_ORTA: {
            uid: effectiveUid,
            name: effectiveName,
            avatar: effectiveAvatar,
            position: 'Merkez OS',
            paid: true,
            paymentStatus: 'paid',
            paymentMethod: 'cash'
          }
        },
        createdAt: new Date().toISOString()
      };

      const created = await dbService.createMatch(payload);
      const fullMatch: MatchItemFull = { id: created.id, ...payload };

      const updated = [fullMatch, ...matches];
      setMatches(updated);
      await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(updated));

      return fullMatch;
    } catch (e) {
      console.log('Maç oluşturma hatası:', e);
      return null;
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      await dbService.deleteMatch(matchId);
    } catch (e) {
      console.log('Maç silme hatası (Firestore):', e);
    }
    const updated = matches.filter(m => m.id !== matchId);
    setMatches(updated);
    await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(updated));
    return true;
  };

  return { matches, pastMatches, addMatch, deleteMatch, loading, reloadMatches: loadMatches };
}
