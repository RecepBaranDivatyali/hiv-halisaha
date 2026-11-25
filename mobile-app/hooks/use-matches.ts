import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { dbService, MatchModel } from '@/services/dbService';
import { isMatchPast } from '@/services/dateUtils';

const MATCHES_CACHE_KEY = '@hiv_matches_cache';
const TURKISH_MONTH_LABELS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function getConcreteDateString(dateStr?: string): string {
  const trimmed = (dateStr || '').trim();
  if (trimmed && !['bugün', 'bugun'].includes(trimmed.toLocaleLowerCase('tr-TR'))) {
    return trimmed;
  }
  const now = new Date();
  return `${now.getDate()} ${TURKISH_MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
}

// In-Memory Shared Cache & Multi-Tab Pub/Sub Subscribers
let sharedMatchesCache: MatchItemFull[] | null = null;
const matchSubscribers = new Set<(list: MatchItemFull[]) => void>();

function notifyMatchSubscribers(list: MatchItemFull[]) {
  sharedMatchesCache = list;
  matchSubscribers.forEach((sub) => {
    try {
      sub(list);
    } catch (e) {
      console.warn('Match subscriber notification error:', e);
    }
  });
}

export function clearSharedMatchesCache() {
  sharedMatchesCache = null;
  matchSubscribers.forEach((sub) => {
    try {
      sub([]);
    } catch (e) {
      console.warn('Match subscriber clear notification error:', e);
    }
  });
}

export interface MatchItemFull extends MatchModel {
  id: string;
}

// Helper: Kullanıcı bu maçta yer alıyor mu? (Organizatör, kaptan, kadro, yedek kulübesi)
export function isUserInMatchItem(m: any, uid?: string, name?: string): boolean {
  if (!m) return false;
  const currentUid = uid || auth.currentUser?.uid;
  const currentName = name || auth.currentUser?.displayName;
  const nameClean = currentName?.trim().toLowerCase();

  // 1. Organizatör kontrolü
  if (currentUid && m.organizerId === currentUid) return true;
  if (nameClean && nameClean.length >= 2 && m.organizer?.toLowerCase() === nameClean) return true;

  // 2. Kaptan kontrolü
  if (currentUid && (m.captainAId === currentUid || m.captainBId === currentUid)) return true;
  if (nameClean && nameClean.length >= 2) {
    if (m.captainAName?.toLowerCase() === nameClean || m.captainBName?.toLowerCase() === nameClean) return true;
  }

  // 3. Kadro slotları kontrolü
  if (m.slots && typeof m.slots === 'object') {
    const slotValues = Object.values(m.slots) as any[];
    const inSlot = slotValues.some((s: any) => {
      if (!s) return false;
      if (currentUid && s.uid === currentUid) return true;
      if (nameClean && nameClean.length >= 2 && s.name?.trim().toLowerCase() === nameClean) return true;
      return false;
    });
    if (inSlot) return true;
  }

  // 4. Yedek kulübesi (Bench & Reserves) kontrolü
  const checkBench = (arr: any[]) => {
    if (!Array.isArray(arr)) return false;
    return arr.some((b: any) => {
      if (!b) return false;
      if (currentUid && b.uid === currentUid) return true;
      if (nameClean && nameClean.length >= 2 && b.name?.trim().toLowerCase() === nameClean) return true;
      return false;
    });
  };

  if (checkBench(m.benchA) || checkBench(m.benchB) || checkBench(m.reserves)) {
    return true;
  }

  return false;
}

export function useMatches() {
  const [matches, setMatches] = useState<MatchItemFull[]>(sharedMatchesCache || []);
  const [pastMatches, setPastMatches] = useState<MatchItemFull[]>([]);
  const [loading, setLoading] = useState(!sharedMatchesCache);
  const [authUid, setAuthUid] = useState<string | undefined>(auth.currentUser?.uid);

  useEffect(() => {
    matchSubscribers.add(setMatches);
    return () => {
      matchSubscribers.delete(setMatches);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUid(firebaseUser?.uid);
    });
    return unsubscribe;
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const currentUid = auth.currentUser.uid;
      const currentName = auth.currentUser.displayName || undefined;

      // 1. Önce önbellekten hızlıca getir (geçmiş maçları aktiften eleyerek)
      if (!sharedMatchesCache) {
        try {
          const cached = await AsyncStorage.getItem(MATCHES_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as MatchItemFull[];
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(
                (m) => !isMatchPast(m.dateTime) && m.status !== 'cancelled' && m.status !== 'completed'
              );
              notifyMatchSubscribers(filtered);
            }
          }
        } catch (cacheParseErr) {
          console.warn('Maç önbelleği okuma/parse uyarısı:', cacheParseErr);
        }
      }

      // 2. Firestore'dan güncel aktif ve geçmiş maçları çek (kullanıcıya özel geçmiş maçlar)
      const [remoteMatches, remotePast] = await Promise.all([
        dbService.getMatches(),
        currentUid ? dbService.getPastMatches(currentUid) : Promise.resolve([]),
      ]);

      const activeList: MatchItemFull[] = [];
      const pastFromActive: MatchItemFull[] = [];

      for (const m of (remoteMatches as MatchItemFull[]) || []) {
        if (m.status === 'cancelled') continue;
        if (isMatchPast(m.dateTime) || m.status === 'completed') {
          // Sadece kullanıcının bizzat katıldığı geçmiş maçları ekle
          if (isUserInMatchItem(m, currentUid, currentName)) {
            pastFromActive.push({ ...m, status: 'completed' });
          }
        } else {
          activeList.push(m);
        }
      }

      // Birleştirilmiş geçmiş maçlar (tekil, sadece kullanıcıya ait ve en yeni üstte)
      const pastMap = new Map<string, MatchItemFull>();
      for (const p of (remotePast as MatchItemFull[]) || []) {
        if (isUserInMatchItem(p, currentUid, currentName)) {
          pastMap.set(p.id, p);
        }
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

      notifyMatchSubscribers(activeList);
      setPastMatches(allPast);
      try {
        await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(activeList));
      } catch (cacheWriteErr) {
        console.warn('Maç önbelleği yazma uyarısı:', cacheWriteErr);
      }
    } catch (e) {
      console.log('Maçları yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUid) {
      loadMatches();
    } else {
      setPastMatches([]);
      setLoading(false);
    }
  }, [authUid, loadMatches]);

  const addMatch = async (newMatchData: any, userProfile?: any) => {
    try {
      const modeString = newMatchData.mode || '7v7';
      const parsedNum = parseInt(modeString.split('v')[0], 10);
      const modeNum = !isNaN(parsedNum) && parsedNum > 0 ? parsedNum : 7;
      const totalPlayers = modeNum * 2;

      const effectiveUid = userProfile?.uid || auth.currentUser?.uid || 'host';
      const effectiveName = userProfile?.name || auth.currentUser?.displayName || 'Organizatör (Siz)';
      const effectiveAvatar = userProfile?.avatar || auth.currentUser?.photoURL || '';

      const concreteDate = getConcreteDateString(newMatchData.dateStr);
      const resolvedDateTime =
        newMatchData.dateTime &&
        !/^(bugün|bugun)\b/i.test(String(newMatchData.dateTime).trim())
          ? newMatchData.dateTime
          : `${concreteDate}, ${newMatchData.timeSlot || '21:00'}`;

      const payload: Omit<MatchModel, 'id'> = {
        arena: newMatchData.arena || 'Halı Saha',
        city: newMatchData.city || 'İstanbul',
        district: newMatchData.district || 'Merkez',
        dateTime: resolvedDateTime,
        mode: newMatchData.mode || '7v7',
        fee: newMatchData.fee ?? 150,
        totalFee: newMatchData.totalFee ?? 2100,
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
            paymentMethod: 'cash',
          },
        },
        createdAt: new Date().toISOString(),
      };

      const created = await dbService.createMatch(payload);
      const fullMatch: MatchItemFull = { id: created.id, ...payload };

      const baseList = sharedMatchesCache || matches;
      const updated = [fullMatch, ...baseList.filter((m) => m.id !== fullMatch.id)];
      notifyMatchSubscribers(updated);
      try {
        await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(updated));
      } catch (cacheWriteErr) {
        console.warn('Maç oluşturma önbellek yazma uyarısı:', cacheWriteErr);
      }

      return fullMatch;
    } catch (e) {
      console.log('Maç oluşturma hatası:', e);
      return null;
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      await dbService.updateMatch(matchId, { status: 'cancelled', cancelledAt: new Date().toISOString() });
      const baseList = sharedMatchesCache || matches;
      const updated = baseList.filter((m) => m.id !== matchId);
      notifyMatchSubscribers(updated);
      try {
        await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(updated));
      } catch (cacheWriteErr) {
        console.warn('Maç silme önbellek yazma uyarısı:', cacheWriteErr);
      }
      return true;
    } catch (e) {
      console.log('Maç silme hatası (Firestore):', e);
      return false;
    }
  };

  return { matches, pastMatches, addMatch, deleteMatch, loading, reloadMatches: loadMatches };
}
