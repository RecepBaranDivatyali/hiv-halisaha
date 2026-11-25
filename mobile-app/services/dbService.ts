import { db } from './firebaseConfig';
import { parseTargetTimestamp, TURKISH_MONTHS } from './dateUtils';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
  writeBatch,
  serverTimestamp,
  deleteField,
  deleteDoc
} from 'firebase/firestore';

export interface BenchPlayer {
  uid: string;
  name: string;
  avatar?: string;
  position?: string;
  joinedAt: number;
  paid?: boolean;
  paymentStatus?: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt';
  paymentMethod?: 'iban' | 'cash';
}

export interface MatchModel {
  id?: string;
  arena: string;
  dateTime: string;
  mode: string;
  city: string;
  district?: string;
  fee: number;
  totalFee: number;
  totalRequiredPlayers: number;
  joinedPlayersCount: number;
  organizer: string;
  organizerId?: string;
  organizerIban?: string;
  organizerIbanName?: string;
  organizerBankName?: string;
  matchFormatType?: 'single_organizer' | 'two_captains';
  captainAId?: string;
  captainAName?: string;
  captainBId?: string | null;
  captainBName?: string | null;
  isSubscription?: boolean;
  isGkFree?: boolean;
  isRotatingGk?: boolean; // Kale dönmeli: kaleci slotundaki kişi kaleci değil, herkes ücret öder
  teamAHidden?: boolean;
  teamBHidden?: boolean;
  teamAFormation?: string;
  teamBFormation?: string;
  hasReservation?: boolean; // Saha rezervasyonu alındı mı
  isPitchFlexible?: boolean; // Saha henüz kesin değil / saha aranıyor
  isTimeFlexible?: boolean; // Saat henüz kesin değil / esnek
  preferredPitch?: string; // İstenen veya hedeflenen halısaha
  preferredTimeSlot?: string; // İstenen veya hedeflenen saat
  status: 'active' | 'completed' | 'cancelled';
  score?: string;
  formaGoluTeam?: 'A' | 'B' | null; // Forma (yelek) golünü atan takım; berabere biterse galip sayılır
  joinTerms?: number;
  teamAJoinTerms?: number;
  teamBJoinTerms?: number;
  benchA?: BenchPlayer[];
  benchB?: BenchPlayer[];
  reserves?: {
    uid: string;
    name: string;
    avatar?: string;
    joinedAt?: any;
  }[];
  slots?: {
    [key: string]: {
      uid: string;
      name: string;
      avatar?: string;
      position?: string;
      joinedAt?: any;
      paid?: boolean;
      paymentStatus?: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt';
      paymentMethod?: 'iban' | 'cash';
    } | null;
  };
  createdAt?: any;
  cancelledAt?: string;
}


export interface ClubChallengeModel {
  id?: string;
  fromClubId?: string;
  fromClubName: string;
  toClubId?: string;
  toClubName: string;
  venue: string;
  date: string;
  senderId: string;
  senderName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdMatchId?: string;
  createdAt?: any;
}

export interface ClubModel {
  id?: string;
  name: string;
  desc: string;
  city?: string;
  district?: string;
  rank?: string;
  points?: number;
  membersCount?: number;
  maxMembers?: number;
  level?: number;
  captainId?: string;
  captainName?: string;
  logo?: string;
  color?: string;
  members?: string[];
  hasReservation?: boolean; // Kulübün hazır sahası/rezervasyonu var mı
  reservationDetails?: string; // Örn: "ODTÜ Halısaha - Çarşamba 21:00"
  availableDate?: string; // Oynamaya hazır olduğu tarih (örn: "24 Eylül", "Bugün")
  inviteCode?: string;
  joinPolicy?: 'open' | 'request' | 'invite' | 'closed';
  joinRequests?: Array<{ uid: string; name: string; avatar?: string; position?: string; rating?: number; requestedAt: number }>;
  createdAt?: any;
}

export interface PitchReviewModel {
  id?: string;
  pitchName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date?: string;
  criteria?: {
    turf?: number;
    showers?: number;
    lighting?: number;
    parking?: number;
  };
  createdAt?: any;
}
export interface PitchProposalModel {
  id?: string;
  pitchId: string;
  pitchName: string;
  city?: string;
  district?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  originalData: Record<string, any>;
  proposedData: Record<string, any>;
  notes?: string;
}

export interface MessageModel {
  id?: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type?: 'system' | 'user' | 'text';
  createdAt: any;
}

export interface CustomPitchModel {
  id?: string;
  name?: string;
  title?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  price?: number;
  hourlyFee?: number;
  rating?: number;
  reviewsCount?: number;
  features?: string[];
  images?: string[];
  status?: 'active' | 'inactive' | 'deleted' | string;
  active?: boolean;
  [key: string]: any;
}

export interface PlatformSettingsModel {
  maintenance?: boolean;
  maintenanceMessage?: string;
  minAppVersion?: string;
  announcement?: string;
  [key: string]: any;
}

export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj instanceof Date || (obj.constructor && obj.constructor !== Object)) {
    return obj;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      cleaned[key] = stripUndefined(val);
    }
  }
  return cleaned as T;
}

export const dbService = {
  // ==========================================
  // 1. KULLANICI PROFİL İŞLEMLERİ (USERS)
  // ==========================================
  
  createUserProfile: async (userId: string, data: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      const profilePayload = {
        name: data.name || 'Oyuncu',
        email: (data.email || '').trim().toLowerCase(),
        city: data.city || 'İstanbul',
        position: data.position || 'Orta Saha',
        level: data.level || 'Eğlence',
        role: data.role || 'user',
        isBanned: false,
        rating: typeof data.rating === 'number' ? data.rating : 5.0,
        reliability: 100,
        isLookingForMatch: false,
        bio: data.bio || 'Futbol tutkunu, takım oyuncusu.',
        ...(data.avatar ? { avatar: data.avatar } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        stats: {
          goals: 0,
          assists: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          mvpCount: 0,
          reliabilityScore: 100,
          cleanSheets: 0,
          ratingSum: 0,
          ratingsCount: 0,
          ...(data.stats || {})
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, profilePayload, { merge: true });
      return true;
    } catch (error) {
      console.error("Kullanıcı profil oluşturma hatası:", error);
      throw error;
    }
  },

  getUserProfile: async (userId: string): Promise<any> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { uid: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Kullanıcı bilgisi çekme hatası:", error);
      throw error;
    }
  },

  // Reviewer test hesapları ve eksik profiller için kendini onaran (Self-Healing) profil garantisi
  ensureUserProfile: async (userId: string, fallbackData?: { email?: string; name?: string }): Promise<any> => {
    try {
      const existing = await dbService.getUserProfile(userId);
      if (existing) return existing;

      const defaultName = fallbackData?.name || (fallbackData?.email ? fallbackData.email.split('@')[0] : 'Oyuncu');
      const defaultEmail = (fallbackData?.email || '').trim().toLowerCase();

      await dbService.createUserProfile(userId, {
        name: defaultName,
        email: defaultEmail,
        city: 'İstanbul',
        position: 'Orta Saha',
        level: 'Eğlence',
        role: 'user',
      });

      return await dbService.getUserProfile(userId);
    } catch (error) {
      console.error("ensureUserProfile hatası:", error);
      return null;
    }
  },

  updateUserProfile: async (userId: string, data: Partial<any>) => {
    try {
      if (!userId) return false;
      const userRef = doc(db, 'users', userId);
      const cleanData: any = {};
      for (const key of Object.keys(data)) {
        if (data[key] !== undefined) {
          cleanData[key] = data[key] === null ? deleteField() : stripUndefined(data[key]);
        } else if (key === 'clubId' || key === 'clubName' || key === 'clubLogo') {
          cleanData[key] = deleteField();
        }
      }
      await setDoc(userRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      throw error;
    }
  },

  updateUserReliability: async (userId: string, penalty: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      return await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const currentScore = userSnap.data()?.stats?.reliabilityScore ?? 100;
          const newScore = Math.max(0, currentScore - penalty);
          transaction.update(userRef, {
            'stats.reliabilityScore': newScore,
            updatedAt: serverTimestamp()
          });
          return newScore;
        }
        return 100;
      });
    } catch (error) {
      console.error("Güvenilirlik puanı düşürme hatası:", error);
      throw error;
    }
  },

  dismissMatchReview: async (userId: string, matchId: string) => {
    try {
      if (!userId || !matchId) return false;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        dismissedReviews: arrayUnion(matchId),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Maç değerlendirme bildirimi kapatma hatası:", error);
      return false;
    }
  },

  // ==========================================
  // 2. MAÇ İŞLEMLERİ (MATCHES)
  // ==========================================

  createMatch: async (matchData: Omit<MatchModel, 'id'>) => {
    try {
      const matchesRef = collection(db, 'matches');
      const cleanedData = stripUndefined(matchData);
      const docRef = await addDoc(matchesRef, {
        ...cleanedData,
        status: cleanedData.status || 'active',
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...cleanedData };
    } catch (error) {
      console.error("Maç oluşturma hatası:", error);
      throw error;
    }
  },

  getMatches: async (filters?: { city?: string; mode?: string }) => {
    try {
      const matchesRef = collection(db, 'matches');
      let q = query(matchesRef, where('status', '==', 'active'));

      if (filters?.city) {
        q = query(matchesRef, where('status', '==', 'active'), where('city', '==', filters.city));
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchModel));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Maçları çekme hatası:", error);
      return [];
    }
  },

  getPastMatches: async (userId?: string) => {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('status', '==', 'completed'), limit(150));
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchModel));
      
      if (userId) {
        list = list.filter(m => 
          m.organizerId === userId || 
          m.captainAId === userId || 
          m.captainBId === userId || 
          (m.slots && Object.values(m.slots).some(slot => slot?.uid === userId)) ||
          (m.benchA && Array.isArray(m.benchA) && m.benchA.some((b: any) => b?.uid === userId)) ||
          (m.benchB && Array.isArray(m.benchB) && m.benchB.some((b: any) => b?.uid === userId)) ||
          (m.reserves && Array.isArray(m.reserves) && m.reserves.some((r: any) => r?.uid === userId))
        );
      }
      
      return list;
    } catch (error) {
      console.error("Geçmiş maçları çekme hatası:", error);
      return [];
    }
  },

  getMatchById: async (matchId: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const snap = await getDoc(matchRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as MatchModel;
      }
      return null;
    } catch (error) {
      console.error("Maç detayı çekme hatası:", error);
      return null;
    }
  },

  updateMatch: async (matchId: string, data: Partial<MatchModel>) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        ...stripUndefined(data),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Maç güncelleme hatası:", error);
      throw error;
    }
  },

  deleteMatch: async (matchId: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await deleteDoc(matchRef);
      return true;
    } catch (error) {
      console.error("Maç silme hatası:", error);
      throw error;
    }
  },

  subscribeMatch: (matchId: string, callback: (match: MatchModel | null) => void) => {
    const matchRef = doc(db, 'matches', matchId);
    return onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as MatchModel);
      } else {
        callback(null);
      }
    }, (err) => {
      console.error("Canlı maç dinleme hatası:", err);
    });
  },

  joinMatchSlot: async (matchId: string, slotKey: string, player: { uid: string; name: string; avatar?: string; position?: string; joinedAt?: number }) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      let isRosterFull = false;

      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) {
          throw new Error("Maç bulunamadı!");
        }
        const data = matchDoc.data();
        if (data.status && data.status !== 'active') {
          throw new Error("Bu maç aktif değil!");
        }
        if (data.slots && data.slots[slotKey] && data.slots[slotKey].uid && data.slots[slotKey].uid !== player.uid) {
          throw new Error("Mevki zaten dolu!");
        }

        const prevSlotsCount = Object.keys(data.slots || {}).filter(k => data.slots[k]?.uid).length;
        const prevCount = typeof data.joinedPlayersCount === 'number'
          ? data.joinedPlayersCount
          : (prevSlotsCount + (data.benchA?.length || 0) + (data.benchB?.length || 0));

        const isGkSlot = slotKey.includes('KALECI');
        const isTargetExempt = Boolean(data.isGkFree && isGkSlot && !data.isRotatingGk);

        // Oyuncunun mevcut ödeme bilgisini (varsa eski slotundan veya yedek kulübesinden) bul
        let prevPaid = false;
        let prevPaymentStatus: string | undefined = undefined;
        let prevPaymentMethod: string | undefined = undefined;

        if (data.slots) {
          Object.values(data.slots).forEach((s: any) => {
            if (s && s.uid === player.uid) {
              if (s.paymentStatus && s.paymentStatus !== 'exempt') {
                prevPaid = Boolean(s.paid);
                prevPaymentStatus = s.paymentStatus;
                prevPaymentMethod = s.paymentMethod;
              }
            }
          });
        }
        const checkBenchPayment = (benchArr?: any[]) => {
          if (!Array.isArray(benchArr)) return;
          const found = benchArr.find((bp: any) => bp && bp.uid === player.uid);
          if (found && found.paymentStatus && found.paymentStatus !== 'exempt') {
            prevPaid = Boolean(found.paid);
            prevPaymentStatus = found.paymentStatus;
            prevPaymentMethod = found.paymentMethod;
          }
        };
        checkBenchPayment(data.benchA);
        checkBenchPayment(data.benchB);

        const resolvedPaid = isTargetExempt ? true : prevPaid;
        const resolvedStatus = isTargetExempt ? 'exempt' : (prevPaymentStatus || 'unpaid');
        const cleanPlayer = stripUndefined(player);

        const updates: Record<string, any> = {
          [`slots.${slotKey}`]: {
            ...cleanPlayer,
            paid: resolvedPaid,
            paymentStatus: resolvedStatus,
            ...(prevPaymentMethod ? { paymentMethod: prevPaymentMethod } : {}),
            joinedAt: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        };

        // Mevcut slot kopyası üzerinden oyuncunun eski mevkisini temizle ve yeni mevkisini yerleştir
        const currentSlots: Record<string, any> = { ...(data.slots || {}) };
        Object.entries(currentSlots).forEach(([k, s]: [string, any]) => {
          if (s && s.uid === player.uid && k !== slotKey) {
            delete currentSlots[k];
            updates[`slots.${k}`] = deleteField();
          }
        });
        currentSlots[slotKey] = {
          ...cleanPlayer,
          paid: resolvedPaid,
          paymentStatus: resolvedStatus,
        };

        // Yedek listesindeyse veya kulübedeyse (Bench), asil kadroya geçtiği için kaldır
        const cleanReserves = (data.reserves || []).filter((r: any) => r && r.uid !== player.uid);
        const cleanBenchA = (data.benchA || []).filter((p: any) => p && p.uid !== player.uid);
        const cleanBenchB = (data.benchB || []).filter((p: any) => p && p.uid !== player.uid);

        if (cleanReserves.length !== (data.reserves || []).length) {
          updates.reserves = cleanReserves;
        }
        if (cleanBenchA.length !== (data.benchA || []).length) {
          updates.benchA = cleanBenchA;
        }
        if (cleanBenchB.length !== (data.benchB || []).length) {
          updates.benchB = cleanBenchB;
        }

        // joinedPlayersCount değerini gerçek tekil kadro sayısından hesapla (Mükerrer artışı ve sayaç kaymasını önler)
        const activeSlotsCount = Object.keys(currentSlots).filter(k => currentSlots[k]?.uid).length;
        const totalJoined = activeSlotsCount + cleanBenchA.length + cleanBenchB.length;
        updates.joinedPlayersCount = totalJoined;

        const requiredCount = data.totalRequiredPlayers || 14;
        if (prevCount < requiredCount && totalJoined >= requiredCount) {
          isRosterFull = true;
        }

        transaction.update(matchRef, updates);
      });

      if (isRosterFull) {
        await dbService.sendMessage(`match_${matchId}`, {
          senderId: player.uid || 'system',
          senderName: 'Sistem',
          text: '⚽ Kadro tamamlandı, maç oynamaya hazır!',
          type: 'system',
        }).catch(err => console.warn("Sistem mesajı gönderilemedi:", err));
      }

      return true;
    } catch (error) {
      console.error("Mevkiye katılma hatası:", error);
      throw error;
    }
  },

  updateMatchGkFree: async (matchId: string, isGkFree: boolean) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchRef);
        if (!snap.exists()) throw new Error("Maç bulunamadı!");
        const data = snap.data();
        const totalFee = data.totalFee || 2100;
        const modePlayers = parseInt((data.mode || '7v7').split('v')[0], 10) || 7;
        const totalPlayers = modePlayers * 2;
        const payers = (!data.isRotatingGk && isGkFree) ? Math.max(1, totalPlayers - 2) : totalPlayers;
        transaction.update(matchRef, {
          isGkFree,
          fee: Math.round(totalFee / payers),
          updatedAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Kaleci muafiyet güncelleme hatası:", error);
      throw error;
    }
  },

  updateMatchRotatingGk: async (matchId: string, isRotatingGk: boolean) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchRef);
        if (!snap.exists()) throw new Error("Maç bulunamadı!");
        const data = snap.data();
        const totalFee = data.totalFee || 2100;
        const modePlayers = parseInt((data.mode || '7v7').split('v')[0], 10) || 7;
        const totalPlayers = modePlayers * 2;
        const payers = (!isRotatingGk && data.isGkFree) ? Math.max(1, totalPlayers - 2) : totalPlayers;
        transaction.update(matchRef, {
          isRotatingGk,
          fee: Math.round(totalFee / payers),
          updatedAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Kale dönmeli güncelleme hatası:", error);
      throw error;
    }
  },

  toggleTeamRosterPrivacy: async (matchId: string, team: 'A' | 'B', isHidden: boolean) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const field = team === 'A' ? 'teamAHidden' : 'teamBHidden';
      await updateDoc(matchRef, {
        [field]: isHidden,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Kadro gizlilik güncelleme hatası:", error);
      throw error;
    }
  },

  updateTeamFormation: async (matchId: string, team: 'A' | 'B', formation: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const field = team === 'A' ? 'teamAFormation' : 'teamBFormation';
      await updateDoc(matchRef, {
        [field]: formation,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Diziliş formasyon güncelleme hatası:", error);
      throw error;
    }
  },

  leaveMatchSlot: async (matchId: string, slotKey: string, userId?: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      let wasPaid = false;
      let playerName = 'Oyuncu';
      let delegatedNewOrganizer: { uid: string; name: string } | null = null;
      let matchCancelled = false;

      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) {
          throw new Error("Maç bulunamadı!");
        }
        const data = matchDoc.data();
        if (!data.slots) {
          throw new Error("Mevki zaten boş!");
        }

        // Exact match or fallback by user UID or alias key
        let targetKey = slotKey;
        if (!data.slots[targetKey]) {
          const alternateKey = Object.keys(data.slots).find(k => 
            (userId && data.slots[k]?.uid === userId) ||
            k === slotKey.replace(/^[AB]_/, '') ||
            k === `A_${slotKey}` ||
            k === `B_${slotKey}`
          );
          if (alternateKey) {
            targetKey = alternateKey;
          } else {
            throw new Error("Mevki zaten boş!");
          }
        }

        if (userId && data.slots[targetKey]?.uid && data.slots[targetKey].uid !== userId) {
          throw new Error("Bu mevki size ait değil!");
        }
        const slotData = data.slots[targetKey];
        const leavingPlayerUid = slotData?.uid || userId;
        wasPaid = Boolean(slotData?.paid || slotData?.paymentStatus === 'paid' || slotData?.paymentStatus === 'pending_approval');
        playerName = slotData?.name || 'Oyuncu';

        const updates: Record<string, any> = {
          [`slots.${targetKey}`]: deleteField(),
          updatedAt: serverTimestamp()
        };

        // Kalan oyuncuları tespit et (slots, benchA, benchB)
        const remainingSlotPlayers = Object.entries(data.slots || {})
          .filter(([k, s]: [string, any]) => k !== targetKey && s?.uid && s.uid !== leavingPlayerUid)
          .map(([_, s]: [string, any]) => ({ uid: s.uid, name: s.name || 'Oyuncu' }));
        const remainingBenchA = (data.benchA || [])
          .filter((p: any) => p && p.uid && p.uid !== leavingPlayerUid)
          .map((p: any) => ({ uid: p.uid, name: p.name || 'Oyuncu' }));
        const remainingBenchB = (data.benchB || [])
          .filter((p: any) => p && p.uid && p.uid !== leavingPlayerUid)
          .map((p: any) => ({ uid: p.uid, name: p.name || 'Oyuncu' }));

        const allRemainingPlayers = [...remainingSlotPlayers, ...remainingBenchA, ...remainingBenchB];
        updates.joinedPlayersCount = allRemainingPlayers.length;

        // Ayrılan oyuncu maçın organizatörü ise otomatik yetki devri veya maç iptali
        if (data.organizerId === leavingPlayerUid || (userId && data.organizerId === userId)) {
          if (allRemainingPlayers.length > 0) {
            const nextPlayer = allRemainingPlayers[0];
            updates.organizerId = nextPlayer.uid;
            updates.organizer = nextPlayer.name;
            updates.captainAId = nextPlayer.uid;
            updates.captainAName = nextPlayer.name;
            delegatedNewOrganizer = nextPlayer;
          } else {
            updates.status = 'cancelled';
            updates.cancelledAt = new Date().toISOString();
            matchCancelled = true;
          }
        }

        transaction.update(matchRef, updates);
      });

      if (delegatedNewOrganizer) {
        dbService.sendMessage(`match_${matchId}`, {
          text: `👑 Organizatör ayrıldı. Maç yöneticiliği otomatik olarak ${(delegatedNewOrganizer as any).name} adlı oyuncuya devredildi.`,
          senderId: 'system',
          senderName: 'Sistem',
          type: 'system',
        }).catch(() => {});
      } else if (matchCancelled) {
        dbService.sendMessage(`match_${matchId}`, {
          text: `❌ Kadroda oyuncu kalmadığı için maç iptal edildi.`,
          senderId: 'system',
          senderName: 'Sistem',
          type: 'system',
        }).catch(() => {});
      }

      if (wasPaid) {
        // Maç içi sohbete iade bilgilendirmesi gönder
        dbService.sendMessage(`match_${matchId}`, {
          text: `⚠️ ${playerName} (Ödeme yapmıştı) kadrodan ayrıldı. Organizatör tarafından ücret iadesi yapılması gerekir.`,
          senderId: 'system',
          senderName: 'Sistem',
          type: 'system',
        }).catch(() => {});
      }

      return { success: true, wasPaid, playerName };
    } catch (error) {
      console.error("Mevkiden ayrılma hatası:", error);
      throw error;
    }
  },

  saveMatchRating: async (matchId: string, ratingData: { 
    userId: string; 
    rating: number; 
    isMvp?: boolean;
    mvpNominee?: string; 
    comment?: string; 
    ratedPlayerId?: string; 
    ratedPlayerName?: string;
  }) => {
    try {
      const cleanRatingData = stripUndefined(ratingData);
      const targetPlayerId = cleanRatingData.ratedPlayerId;
      const isValidPlayerDoc = Boolean(targetPlayerId && !targetPlayerId.startsWith('slot-'));

      const isNowMvp = Boolean(
        cleanRatingData.isMvp ||
        (targetPlayerId && cleanRatingData.mvpNominee === targetPlayerId) ||
        (cleanRatingData.mvpNominee && cleanRatingData.mvpNominee === cleanRatingData.ratedPlayerName)
      );

      await runTransaction(db, async (transaction) => {
        let isUpdate = false;
        let previousRatingVal = 0;
        let previousWasMvp = false;

        let ratingDocRef = doc(collection(db, 'ratings'));
        let existingSnap: any = null;

        if (cleanRatingData.userId && cleanRatingData.userId !== 'anon' && targetPlayerId) {
          const deterministicId = `${matchId}_${cleanRatingData.userId}_${targetPlayerId}`;
          ratingDocRef = doc(db, 'ratings', deterministicId);
          existingSnap = await transaction.get(ratingDocRef);
        }

        const userRef = isValidPlayerDoc && targetPlayerId ? doc(db, 'users', targetPlayerId) : null;
        const userSnap = userRef ? await transaction.get(userRef) : null;

        if (existingSnap && existingSnap.exists()) {
          isUpdate = true;
          const prevData = existingSnap.data();
          previousRatingVal = typeof prevData.rating === 'number' ? prevData.rating : 0;
          previousWasMvp = Boolean(
            prevData.isMvp ||
            (targetPlayerId && prevData.mvpNominee === targetPlayerId) ||
            (prevData.mvpNominee && prevData.mvpNominee === prevData.ratedPlayerName)
          );
        }

        transaction.set(
          ratingDocRef,
          stripUndefined({
            matchId,
            ...cleanRatingData,
            isMvp: isNowMvp,
            updatedAt: serverTimestamp(),
            ...(!isUpdate ? { createdAt: serverTimestamp() } : {}),
          }),
          { merge: true }
        );

        if (userRef && userSnap && userSnap.exists()) {
          const uData = userSnap.data();
          const currentRating = typeof uData.rating === 'number' ? uData.rating : 5.0;
          const prevCount =
            typeof uData.stats?.ratingsCount === 'number'
              ? uData.stats.ratingsCount
              : typeof uData.stats?.ratingCount === 'number'
                ? uData.stats.ratingCount
                : 0;
          const prevSum =
            typeof uData.stats?.ratingSum === 'number'
              ? uData.stats.ratingSum
              : prevCount > 0
                ? currentRating * prevCount
                : 0;

          let newCount = prevCount;
          let newSum = prevSum;
          if (isUpdate && prevCount > 0) {
            newSum = Math.max(0, prevSum - previousRatingVal + cleanRatingData.rating);
          } else {
            newCount = prevCount + 1;
            newSum = prevSum + cleanRatingData.rating;
          }
          const newRating = Number(Math.max(1, Math.min(10, newSum / Math.max(1, newCount))).toFixed(1));

          // Centilmenlik / Güvenilirlik skoru güncellemesi
          let reliabilityDelta = 0;
          const hasNegativeTag =
            cleanRatingData.comment?.includes('Sert Oynayan') ||
            cleanRatingData.comment?.includes('Bencil') ||
            cleanRatingData.comment?.includes('Koşmuyor');

          if (hasNegativeTag || cleanRatingData.rating < 5) {
            reliabilityDelta = -2;
          } else if (cleanRatingData.comment?.includes('Centilmen / Fair Play') || cleanRatingData.rating >= 8) {
            reliabilityDelta = 1;
          }

          const currentReliability =
            typeof uData.stats?.reliabilityScore === 'number' ? uData.stats.reliabilityScore : 100;
          const newReliability = isUpdate
            ? currentReliability
            : Math.max(50, Math.min(100, currentReliability + reliabilityDelta));

          const currentMvpCount = typeof uData.stats?.mvpCount === 'number' ? uData.stats.mvpCount : 0;
          let newMvpCount = currentMvpCount;
          if (isNowMvp && !previousWasMvp) {
            newMvpCount = currentMvpCount + 1;
          } else if (!isNowMvp && isUpdate && previousWasMvp) {
            newMvpCount = Math.max(0, currentMvpCount - 1);
          }

          transaction.update(userRef, {
            rating: newRating,
            'stats.ratingsCount': newCount,
            'stats.ratingSum': Number(newSum.toFixed(2)),
            'stats.mvpCount': newMvpCount,
            'stats.reliabilityScore': newReliability,
            updatedAt: serverTimestamp(),
          });
        }
      });

      return true;
    } catch (error) {
      console.error("Puan kaydetme hatası:", error);
      throw error;
    }
  },

  updateSlotPayment: async (
    matchId: string, 
    slotKey: string, 
    paid: boolean,
    paymentStatus?: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt',
    paymentMethod?: 'iban' | 'cash'
  ) => {
    try {
      const matchRef = doc(db, 'matches', matchId);

      // Kulübedeki oyuncu ise (BENCH_A_... veya BENCH_B_...)
      if (slotKey.startsWith('BENCH_A_') || slotKey.startsWith('BENCH_B_')) {
        const isTeamA = slotKey.startsWith('BENCH_A_');
        const benchUid = slotKey.replace(isTeamA ? 'BENCH_A_' : 'BENCH_B_', '');
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(matchRef);
          if (!snap.exists()) return;
          const data = snap.data();
          const targetBench = isTeamA ? (data.benchA || []) : (data.benchB || []);
          const updatedBench = targetBench.map((bp: any) => {
            if (bp.uid === benchUid) {
              return {
                ...bp,
                paid,
                ...(paymentStatus !== undefined ? { paymentStatus } : {}),
                ...(paymentMethod !== undefined ? { paymentMethod } : {})
              };
            }
            return bp;
          });
          tx.update(matchRef, {
            [isTeamA ? 'benchA' : 'benchB']: updatedBench,
            updatedAt: serverTimestamp()
          });
        });
        return true;
      }

      const updates: any = {
        [`slots.${slotKey}.paid`]: paid,
        updatedAt: serverTimestamp()
      };
      if (paymentStatus !== undefined) {
        updates[`slots.${slotKey}.paymentStatus`] = paymentStatus;
      }
      if (paymentMethod !== undefined) {
        updates[`slots.${slotKey}.paymentMethod`] = paymentMethod;
      }
      await updateDoc(matchRef, updates);
      return true;
    } catch (error) {
      console.error("Ödeme durumu güncelleme hatası:", error);
      throw error;
    }
  },

  updateMatchOrganizerIban: async (
    matchId: string, 
    ibanData: { organizerIban?: string; organizerIbanName?: string; organizerBankName?: string }
  ) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        ...ibanData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Kaptan IBAN güncelleme hatası:", error);
      throw error;
    }
  },

  joinMatchReserve: async (matchId: string, player: { uid: string; name: string; avatar?: string }) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(matchRef);
        if (!snap.exists()) {
          throw new Error("Maç bulunamadı!");
        }
        const data = snap.data();
        if (data.status && data.status !== 'active') {
          throw new Error("Bu maç aktif değil!");
        }
        const currentReserves = Array.isArray(data.reserves) ? data.reserves : [];
        if (currentReserves.some((r: any) => r && r.uid === player.uid)) {
          return;
        }
        tx.update(matchRef, {
          reserves: [
            ...currentReserves,
            stripUndefined({
              ...player,
              joinedAt: new Date().toISOString()
            })
          ],
          updatedAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Yedek sırasına girme hatası:", error);
      throw error;
    }
  },

  leaveMatchReserve: async (matchId: string, userId: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(matchRef);
        if (snap.exists()) {
          const data = snap.data();
          const updatedReserves = (data.reserves || []).filter((r: any) => r.uid !== userId);
          tx.update(matchRef, { 
            reserves: updatedReserves,
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Yedek sırasından çıkma hatası:", error);
      throw error;
    }
  },

  joinTeamBench: async (
    matchId: string, 
    team: 'A' | 'B', 
    player: { uid: string; name: string; avatar?: string; position?: string; joinedAt?: number }
  ) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) throw new Error("Maç bulunamadı!");
        const data = matchDoc.data();
        if (data.status && data.status !== 'active') {
          throw new Error("Bu maç aktif değil!");
        }
        const benchKey = team === 'A' ? 'benchA' : 'benchB';
        const otherBenchKey = team === 'A' ? 'benchB' : 'benchA';
        const currentBench: BenchPlayer[] = data[benchKey] || [];
        const otherBench: BenchPlayer[] = data[otherBenchKey] || [];

        if (currentBench.some(p => p && p.uid === player.uid)) return;

        let prevPaid = false;
        let prevPaymentStatus: BenchPlayer['paymentStatus'] = 'unpaid';
        let prevPaymentMethod: BenchPlayer['paymentMethod'] = 'cash';

        const updates: Record<string, any> = {
          updatedAt: serverTimestamp()
        };

        // Eski saha slotunu temizle ve ödeme bilgisini koru
        const currentSlots: Record<string, any> = { ...(data.slots || {}) };
        Object.entries(currentSlots).forEach(([k, s]: [string, any]) => {
          if (s && s.uid === player.uid) {
            if (s.paymentStatus && s.paymentStatus !== 'exempt') {
              prevPaid = Boolean(s.paid);
              prevPaymentStatus = s.paymentStatus;
              prevPaymentMethod = s.paymentMethod || 'cash';
            }
            delete currentSlots[k];
            updates[`slots.${k}`] = deleteField();
          }
        });

        const existingOtherBench = otherBench.find(p => p && p.uid === player.uid);
        if (existingOtherBench && existingOtherBench.paymentStatus && existingOtherBench.paymentStatus !== 'exempt') {
          prevPaid = Boolean(existingOtherBench.paid);
          prevPaymentStatus = existingOtherBench.paymentStatus;
          prevPaymentMethod = existingOtherBench.paymentMethod || 'cash';
        }

        const newBenchPlayer: BenchPlayer = {
          uid: player.uid,
          name: player.name,
          avatar: player.avatar || '',
          position: player.position || 'Yedek',
          joinedAt: player.joinedAt || Date.now(),
          paid: prevPaid,
          paymentStatus: prevPaymentStatus,
          paymentMethod: prevPaymentMethod
        };

        const updatedBench = [...currentBench, newBenchPlayer];
        const updatedOtherBench = otherBench.filter(p => p && p.uid !== player.uid);
        const cleanReserves = (data.reserves || []).filter((r: any) => r && r.uid !== player.uid);

        updates[benchKey] = updatedBench;
        updates[otherBenchKey] = updatedOtherBench;
        if (cleanReserves.length !== (data.reserves || []).length) {
          updates.reserves = cleanReserves;
        }

        const activeSlotsCount = Object.keys(currentSlots).filter(k => currentSlots[k]?.uid).length;
        updates.joinedPlayersCount = activeSlotsCount + updatedBench.length + updatedOtherBench.length;

        transaction.update(matchRef, updates);
      });
      return true;
    } catch (error) {
      console.error("Yedek kulübesine katılma hatası:", error);
      throw error;
    }
  },

  assignBenchPlayerToSlot: async (
    matchId: string, 
    team: 'A' | 'B', 
    playerUid: string, 
    targetSlotKey: string
  ) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) throw new Error("Maç bulunamadı!");
        const data = matchDoc.data();
        const benchKey = team === 'A' ? 'benchA' : 'benchB';
        const currentBench: BenchPlayer[] = data[benchKey] || [];
        const benchPlayer = currentBench.find(p => p.uid === playerUid);
        if (!benchPlayer) throw new Error("Oyuncu yedek kulübesinde bulunamadı!");

        const updates: Record<string, any> = {};
        const existingSlotOccupant = data.slots?.[targetSlotKey];

        let updatedBench = currentBench.filter(p => p.uid !== playerUid);
        if (existingSlotOccupant && existingSlotOccupant.uid && existingSlotOccupant.uid !== playerUid) {
          const wasExemptGk = existingSlotOccupant.paymentStatus === 'exempt';
          const returnToBench: BenchPlayer = {
            uid: existingSlotOccupant.uid,
            name: existingSlotOccupant.name,
            avatar: existingSlotOccupant.avatar || '',
            position: existingSlotOccupant.position || 'Yedek',
            joinedAt: existingSlotOccupant.joinedAt || Date.now(),
            paid: wasExemptGk ? false : (existingSlotOccupant.paid ?? false),
            paymentStatus: wasExemptGk ? 'unpaid' : (existingSlotOccupant.paymentStatus ?? 'unpaid'),
            paymentMethod: existingSlotOccupant.paymentMethod ?? 'cash'
          };
          updatedBench.push(returnToBench);
        }

        const isTargetGk = targetSlotKey.includes('KALECI');
        const isTargetExempt = Boolean(data.isGkFree && isTargetGk && !data.isRotatingGk);
        const wasBenchExempt = benchPlayer.paymentStatus === 'exempt';

        updates[benchKey] = updatedBench;
        updates[`slots.${targetSlotKey}`] = {
          uid: benchPlayer.uid,
          name: benchPlayer.name,
          avatar: benchPlayer.avatar || '',
          position: benchPlayer.position || targetSlotKey,
          joinedAt: benchPlayer.joinedAt || Date.now(),
          paid: isTargetExempt ? true : (wasBenchExempt ? false : (benchPlayer.paid ?? false)),
          paymentStatus: isTargetExempt ? 'exempt' : (wasBenchExempt ? 'unpaid' : (benchPlayer.paymentStatus ?? 'unpaid')),
          paymentMethod: benchPlayer.paymentMethod ?? 'cash'
        };
        updates.updatedAt = serverTimestamp();

        transaction.update(matchRef, updates);
      });
      return true;
    } catch (error) {
      console.error("Oyuncuyu sahaya alma hatası:", error);
      throw error;
    }
  },

  moveSlotToBench: async (
    matchId: string, 
    team: 'A' | 'B', 
    slotKey: string
  ) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) throw new Error("Maç bulunamadı!");
        const data = matchDoc.data();
        const slotOccupant = data.slots?.[slotKey];
        if (!slotOccupant) throw new Error("Mevkide oyuncu yok!");

        const benchKey = team === 'A' ? 'benchA' : 'benchB';
        const currentBench: BenchPlayer[] = data[benchKey] || [];
        const wasExemptGk = slotOccupant.paymentStatus === 'exempt';

        const benchPlayer: BenchPlayer = {
          uid: slotOccupant.uid,
          name: slotOccupant.name,
          avatar: slotOccupant.avatar || '',
          position: slotOccupant.position || 'Yedek',
          joinedAt: slotOccupant.joinedAt || Date.now(),
          paid: wasExemptGk ? false : (slotOccupant.paid ?? false),
          paymentStatus: wasExemptGk ? 'unpaid' : (slotOccupant.paymentStatus ?? 'unpaid'),
          paymentMethod: slotOccupant.paymentMethod ?? 'cash'
        };

        const updates: Record<string, any> = {
          [`slots.${slotKey}`]: deleteField(),
          [benchKey]: [...currentBench.filter(p => p.uid !== slotOccupant.uid), benchPlayer],
          updatedAt: serverTimestamp()
        };

        transaction.update(matchRef, updates);
      });
      return true;
    } catch (error) {
      console.error("Oyuncuyu kulübeye alma hatası:", error);
      throw error;
    }
  },

  leaveMatchSquad: async (matchId: string, playerUid: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      let delegatedNewOrganizer: { uid: string; name: string } | null = null;
      let matchCancelled = false;

      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) throw new Error("Maç bulunamadı!");
        const data = matchDoc.data();
        const updates: Record<string, any> = { updatedAt: serverTimestamp() };

        let removed = false;
        if (data.slots) {
          Object.entries(data.slots).forEach(([k, s]: [string, any]) => {
            if (s && s.uid === playerUid) {
              updates[`slots.${k}`] = deleteField();
              removed = true;
            }
          });
        }
        if (data.benchA && data.benchA.some((p: any) => p.uid === playerUid)) {
          updates.benchA = data.benchA.filter((p: any) => p.uid !== playerUid);
          removed = true;
        }
        if (data.benchB && data.benchB.some((p: any) => p.uid === playerUid)) {
          updates.benchB = data.benchB.filter((p: any) => p.uid !== playerUid);
          removed = true;
        }
        if (data.reserves && data.reserves.some((p: any) => p.uid === playerUid)) {
          updates.reserves = data.reserves.filter((p: any) => p.uid !== playerUid);
          removed = true;
        }

        // Kalan oyuncuları tespit et (slots, benchA, benchB)
        const remainingSlotPlayers = Object.values(data.slots || {})
          .filter((s: any) => s && s.uid && s.uid !== playerUid)
          .map((s: any) => ({ uid: s.uid, name: s.name || 'Oyuncu' }));
        const remainingBenchA = (data.benchA || [])
          .filter((p: any) => p && p.uid && p.uid !== playerUid)
          .map((p: any) => ({ uid: p.uid, name: p.name || 'Oyuncu' }));
        const remainingBenchB = (data.benchB || [])
          .filter((p: any) => p && p.uid && p.uid !== playerUid)
          .map((p: any) => ({ uid: p.uid, name: p.name || 'Oyuncu' }));

        const allRemainingPlayers = [...remainingSlotPlayers, ...remainingBenchA, ...remainingBenchB];
        updates.joinedPlayersCount = allRemainingPlayers.length;

        // Ayrılan oyuncu B takımı kaptanı ise B kaptanlığını temizle
        if (data.captainBId === playerUid) {
          updates.captainBId = deleteField();
          updates.captainBName = deleteField();
        }

        // Ayrılan oyuncu maçın organizatörü ise otomatik yetki devri veya maç iptali
        if (data.organizerId === playerUid) {
          if (allRemainingPlayers.length > 0) {
            const nextPlayer = allRemainingPlayers[0];
            updates.organizerId = nextPlayer.uid;
            updates.organizer = nextPlayer.name;
            updates.captainAId = nextPlayer.uid;
            updates.captainAName = nextPlayer.name;
            delegatedNewOrganizer = nextPlayer;
          } else {
            updates.status = 'cancelled';
            updates.cancelledAt = new Date().toISOString();
            matchCancelled = true;
          }
        }

        transaction.update(matchRef, updates);
      });

      if (delegatedNewOrganizer) {
        dbService.sendMessage(`match_${matchId}`, {
          text: `👑 Organizatör ayrıldı. Maç yöneticiliği otomatik olarak ${(delegatedNewOrganizer as any).name} adlı oyuncuya devredildi.`,
          senderId: 'system',
          senderName: 'Sistem',
          type: 'system',
        }).catch(() => {});
      } else if (matchCancelled) {
        dbService.sendMessage(`match_${matchId}`, {
          text: `❌ Kadroda oyuncu kalmadığı için maç iptal edildi.`,
          senderId: 'system',
          senderName: 'Sistem',
          type: 'system',
        }).catch(() => {});
      }

      return true;
    } catch (error) {
      console.error("Kadrodan ayrılma hatası:", error);
      throw error;
    }
  },

  updateMatchScore: async (matchId: string, score: string, formaGoluTeam?: 'A' | 'B' | null) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      
      let shouldUpdateStats = false;
      let teamAPlayers: string[] = [];
      let teamBPlayers: string[] = [];
      let scoreA = 0;
      let scoreB = 0;
      let fromClubId: string | undefined = undefined;
      let toClubId: string | undefined = undefined;

      await runTransaction(db, async (transaction) => {
        const matchSnap = await transaction.get(matchRef);
        if (!matchSnap.exists()) {
          throw new Error("Maç bulunamadı!");
        }

        const data = matchSnap.data();
        const alreadyCompleted = data?.status === 'completed';

        const scoreParts = score.split('-').map(s => parseInt(s.trim(), 10));
        scoreA = !isNaN(scoreParts[0]) ? scoreParts[0] : 0;
        scoreB = !isNaN(scoreParts[1]) ? scoreParts[1] : 0;

        const updates: any = {
          score,
          scoreTeamA: scoreA,
          scoreTeamB: scoreB,
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (formaGoluTeam === null) {
          updates.formaGoluTeam = deleteField();
        } else if (formaGoluTeam) {
          updates.formaGoluTeam = formaGoluTeam;
        }
        transaction.update(matchRef, updates);

        if (!alreadyCompleted) {
          shouldUpdateStats = true;
          fromClubId = data.fromClubId;
          toClubId = data.toClubId;
          const slots = data.slots || {};

          const rawTeamA: string[] = [];
          const rawTeamB: string[] = [];

          Object.entries(slots).forEach(([slotKey, slotData]: [string, any]) => {
            if (slotData && slotData.uid && !String(slotData.uid).startsWith('slot-')) {
              if (slotKey.startsWith('B_')) {
                rawTeamB.push(slotData.uid);
              } else {
                rawTeamA.push(slotData.uid);
              }
            }
          });

          // Kulübedeki (Bench) oyuncuları da dahil et
          if (data.benchA && Array.isArray(data.benchA)) {
            data.benchA.forEach((bp: any) => {
              if (bp?.uid && !String(bp.uid).startsWith('slot-')) rawTeamA.push(bp.uid);
            });
          }
          if (data.benchB && Array.isArray(data.benchB)) {
            data.benchB.forEach((bp: any) => {
              if (bp?.uid && !String(bp.uid).startsWith('slot-')) rawTeamB.push(bp.uid);
            });
          }

          teamAPlayers = Array.from(new Set(rawTeamA));
          teamBPlayers = Array.from(new Set(rawTeamB));
        }
      });

      // Yalnızca maç daha önce tamamlanmamışsa istatistikleri ve puanları artır (mükerrer artışı engelle)
      if (shouldUpdateStats) {
        const updatePromises: Promise<any>[] = [];

        const updatePlayerStats = (uid: string, result: 'win' | 'loss' | 'draw', conceded: number) => {
          const userRef = doc(db, 'users', uid);
          const statUpdates: Record<string, any> = {
            'stats.matchesPlayed': increment(1),
            updatedAt: serverTimestamp()
          };
          if (result === 'win') statUpdates['stats.wins'] = increment(1);
          if (result === 'loss') statUpdates['stats.losses'] = increment(1);
          if (result === 'draw') statUpdates['stats.draws'] = increment(1);
          if (conceded === 0) statUpdates['stats.cleanSheets'] = increment(1);

          updatePromises.push(updateDoc(userRef, statUpdates));
        };

        let teamAWon = false;
        let teamBWon = false;

        if (scoreA > scoreB) {
          teamAWon = true;
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'win', scoreB));
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'loss', scoreA));
        } else if (scoreB > scoreA) {
          teamBWon = true;
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'win', scoreA));
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'loss', scoreB));
        } else if (formaGoluTeam === 'A') {
          teamAWon = true;
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'win', scoreB));
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'loss', scoreA));
        } else if (formaGoluTeam === 'B') {
          teamBWon = true;
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'win', scoreA));
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'loss', scoreB));
        } else {
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'draw', scoreB));
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'draw', scoreA));
        }

        // Kulüp Meydan Okuma Maçlarında Lig Puanı Motoru (varlık kontrolü ve güvenli güncelleme)
        if (fromClubId && toClubId) {
          const fromClubRef = doc(db, 'clubs', fromClubId);
          const toClubRef = doc(db, 'clubs', toClubId);

          if (teamAWon) {
            updatePromises.push(updateDoc(fromClubRef, { points: increment(25), updatedAt: serverTimestamp() }));
          } else if (teamBWon) {
            updatePromises.push(updateDoc(toClubRef, { points: increment(25), updatedAt: serverTimestamp() }));
          } else {
            updatePromises.push(updateDoc(fromClubRef, { points: increment(10), updatedAt: serverTimestamp() }));
            updatePromises.push(updateDoc(toClubRef, { points: increment(10), updatedAt: serverTimestamp() }));
          }
        }

        await Promise.allSettled(updatePromises);
      }
      return true;
    } catch (error) {
      console.error("Maç skoru güncelleme hatası:", error);
      throw error;
    }
  },

  updateMatchTerms: async (matchId: string, joinTerms: number) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        joinTerms,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Maç katılım şartları güncelleme hatası:", error);
      throw error;
    }
  },

  updateTeamJoinTerms: async (matchId: string, team: 'A' | 'B', joinTerms: number) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const field = team === 'A' ? 'teamAJoinTerms' : 'teamBJoinTerms';
      await updateDoc(matchRef, {
        [field]: joinTerms,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error(`Takım ${team} katılım şartları güncelleme hatası:`, error);
      throw error;
    }
  },

  updateMatchCaptainB: async (matchId: string, captainBId: string | null, captainBName: string | null) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const updates: any = {
        updatedAt: serverTimestamp()
      };
      if (captainBId) {
        updates.captainBId = captainBId;
        updates.captainBName = captainBName || 'B Takımı Kaptanı';
      } else {
        updates.captainBId = deleteField();
        updates.captainBName = deleteField();
      }
      await updateDoc(matchRef, updates);
      return true;
    } catch (error) {
      console.error("B Takımı kaptanı güncelleme hatası:", error);
      throw error;
    }
  },

  updateMatchFormatType: async (matchId: string, matchFormatType: 'single_organizer' | 'two_captains') => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        matchFormatType,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Maç format tipi güncelleme hatası:", error);
      throw error;
    }
  },

  sendClubChallenge: async (challengeData: {
    fromClubId?: string;
    fromClubName: string;
    toClubId?: string;
    toClubName: string;
    venue: string;
    date: string;
    senderId: string;
    senderName: string;
  }) => {
    try {
      let toCaptainId: string | undefined = undefined;
      if (challengeData.toClubId) {
        try {
          const clubRef = doc(db, 'clubs', challengeData.toClubId);
          const clubSnap = await getDoc(clubRef);
          if (clubSnap.exists()) {
            const clubData = clubSnap.data() as ClubModel & { leaderId?: string };
            toCaptainId = clubData.captainId || clubData.leaderId;
          }
        } catch (err) {
          console.warn("Hedef kulüp kaptanı bilgisi alınamadı:", err);
        }
      }

      const colRef = collection(db, 'club_challenges');
      const payload = stripUndefined({
        ...challengeData,
        ...(toCaptainId ? { toCaptainId, targetCaptainId: toCaptainId } : {}),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      const docRef = await addDoc(colRef, payload);

      if (toCaptainId) {
        try {
          const notifRef = doc(collection(db, 'users', toCaptainId, 'notifications'));
          await setDoc(notifRef, {
            userId: toCaptainId,
            type: 'club_challenge',
            title: '⚔️ Meydan Okuma Geldi!',
            body: `${challengeData.fromClubName} kulübü size meydan okuyor! Kabul etmek için kulüp sayfanızı ziyaret edin.`,
            challengeId: docRef.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn("Meydan okuma bildirimi gönderilemedi:", err);
        }
      }

      return { id: docRef.id, ...challengeData, ...(toCaptainId ? { toCaptainId } : {}) };
    } catch (error) {
      console.error("Meydan okuma gönderme hatası:", error);
      throw error;
    }
  },

  getIncomingChallenges: async (clubId: string) => {
    try {
      const colRef = collection(db, 'club_challenges');
      const q = query(colRef, where('toClubId', '==', clubId), where('status', '==', 'pending'), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubChallengeModel));
    } catch (error) {
      console.error("Gelen meydan okumalar çekme hatası:", error);
      return [];
    }
  },

  respondToClubChallenge: async (
    challenge: ClubChallengeModel, 
    action: 'accept' | 'reject', 
    currentCaptain: { uid: string; name: string }
  ) => {
    try {
      if (!challenge.id) throw new Error("Meydan okuma ID bulunamadı");
      const chalRef = doc(db, 'club_challenges', challenge.id);

      // Saha ve şehir bilgisini kulüpten/sahadan çözümle
      let resolvedCity = 'İstanbul';
      if (challenge.toClubId) {
        try {
          const toClubSnap = await getDoc(doc(db, 'clubs', challenge.toClubId));
          if (toClubSnap.exists() && toClubSnap.data()?.city) {
            resolvedCity = toClubSnap.data().city;
          }
        } catch {}
      }

      // Göreli tarihi ("Bu Cumartesi 20:00" vb.) açık tarihe dönüştür
      const targetTs = parseTargetTimestamp(challenge.date);
      const targetDateObj = new Date(targetTs);
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      const pad = (n: number) => String(n).padStart(2, '0');
      const startH = targetDateObj.getHours();
      const startM = targetDateObj.getMinutes();
      const endH = (startH + 1) % 24;
      const formattedDateTime = `${days[targetDateObj.getDay()]}, ${targetDateObj.getDate()} ${months[targetDateObj.getMonth()]} ${targetDateObj.getFullYear()}, ${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(startM)}`;

      let createdMatchId = '';

      await runTransaction(db, async (transaction) => {
        const chalSnap = await transaction.get(chalRef);
        if (!chalSnap.exists()) {
          throw new Error("Meydan okuma bulunamadı");
        }
        const chalData = chalSnap.data();
        if (chalData.status !== 'pending') {
          throw new Error("Meydan okuma zaten yanıtlanmış veya süresi dolmuş!");
        }

        if (action === 'reject') {
          transaction.update(chalRef, {
            status: 'rejected',
            respondedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          const newMatchRef = doc(collection(db, 'matches'));
          createdMatchId = newMatchRef.id;

          const matchData: any = {
            arena: challenge.venue || 'Halısaha',
            dateTime: formattedDateTime,
            mode: '7v7',
            status: 'active',
            matchFormatType: 'two_captains',
            city: resolvedCity,
            fee: 150,
            totalFee: 2100,
            totalRequiredPlayers: 14,
            joinedPlayersCount: 2,
            organizer: challenge.senderName,
            organizerId: challenge.senderId,
            captainAId: challenge.senderId,
            captainAName: `${challenge.fromClubName} (Kaptan ${challenge.senderName})`,
            captainBId: currentCaptain.uid,
            captainBName: `${challenge.toClubName} (Kaptan ${currentCaptain.name})`,
            fromClubId: challenge.fromClubId,
            toClubId: challenge.toClubId,
            challengeId: challenge.id,
            slots: {
              A_OS_ORTA: {
                uid: challenge.senderId,
                name: challenge.senderName,
                position: 'OS (Merkez)',
                paid: false,
                paymentStatus: 'unpaid',
                joinedAt: Date.now()
              },
              B_OS_ORTA: {
                uid: currentCaptain.uid,
                name: currentCaptain.name,
                position: 'OS (Merkez)',
                paid: false,
                paymentStatus: 'unpaid',
                joinedAt: Date.now()
              }
            },
            hasReservation: true,
            createdAt: serverTimestamp(),
          };

          transaction.set(newMatchRef, matchData);
          transaction.update(chalRef, {
            status: 'accepted',
            createdMatchId: createdMatchId,
            matchId: createdMatchId,
            respondedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      });

      if (action === 'reject') {
        if (challenge.senderId) {
          const notifRef = doc(collection(db, 'users', challenge.senderId, 'notifications'));
          await setDoc(notifRef, {
            userId: challenge.senderId,
            type: 'club_challenge_rejected',
            title: '❌ Meydan Okuma Reddedildi',
            body: `${challenge.toClubName} kulübü meydan okumanızı geri çevirdi.`,
            read: false,
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }
        return { success: true, action: 'reject' as const };
      }

      if (challenge.senderId && createdMatchId) {
        const notifRef = doc(collection(db, 'users', challenge.senderId, 'notifications'));
        await setDoc(notifRef, {
          userId: challenge.senderId,
          type: 'club_challenge_accepted',
          title: '⚔️ Meydan Okuma Kabul Edildi!',
          body: `${challenge.toClubName} meydan okumanızı kabul etti! Maç odası hazır.`,
          matchId: createdMatchId,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      return { success: true, action: 'accept' as const, matchId: createdMatchId };
    } catch (error) {
      console.error("Meydan okuma yanıtlama hatası:", error);
      throw error;
    }
  },

  sendClubInvite: async (clubId: string, targetUserId: string) => {
    try {
      const clubSnap = await getDoc(doc(db, 'clubs', clubId));
      const clubData = clubSnap.exists() ? clubSnap.data() : null;
      const clubName = clubData?.name || 'Kulüp';

      const notifRef = doc(collection(db, 'users', targetUserId, 'notifications'));
      await setDoc(notifRef, {
        userId: targetUserId,
        type: 'club_invite',
        title: '🛡️ Kulüp Daveti',
        body: `"${clubName}" sizi kulübüne katılmaya davet etti.`,
        clubId: clubId,
        clubName: clubName,
        read: false,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Kulüp daveti gönderme hatası:", error);
      throw error;
    }
  },

  // ==========================================
  // 3. ARAMA VE FİLTRELEME (SEARCH)
  // ==========================================

  searchPlayers: async (criteria: { 
    city?: string; 
    district?: string; 
    position?: string; 
    level?: string;
    minRating?: number;
    maxRating?: number;
    onlyLookingForMatch?: boolean;
    timeFrame?: string;
  }) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(150));
      const snapshot = await getDocs(q);
      let players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (criteria.city) {
        const cityLower = criteria.city.trim().toLocaleLowerCase('tr');
        players = players.filter((p: any) => 
          p.city && p.city.toLocaleLowerCase('tr').includes(cityLower)
        );
      }
      if (criteria.district && criteria.district !== 'Tüm İlçeler') {
        const distLower = criteria.district.trim().toLocaleLowerCase('tr');
        players = players.filter((p: any) => 
          (p.district && p.district.toLocaleLowerCase('tr').includes(distLower)) ||
          (p.preferredDistrict && p.preferredDistrict.toLocaleLowerCase('tr').includes(distLower))
        );
      }
      if (criteria.position) {
        const POSITION_VARIANTS: Record<string, string[]> = {
          'KL': ['KL', 'KALECI', 'KALECİ', 'GK', 'GOALKEEPER'],
          'DF': ['DF', 'DEFANS', 'STOPER', 'BEK', 'CB', 'LB', 'RB', 'DEFENCE'],
          'OS': ['OS', 'ORTA SAHA', 'ORTASAHA', 'CM', 'CAM', 'CDM', 'MIDFIELD'],
          'FV': ['FV', 'FORVET', 'SANTRAFOR', 'KANAT', 'ST', 'RW', 'LW', 'FORWARD'],
        };
        const posList = criteria.position.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (posList.length > 0) {
          players = players.filter((p: any) => {
            if (!p.position) return false;
            const pPos = p.position.toUpperCase();
            return posList.some(targetPos => {
              if (pPos.includes(targetPos)) return true;
              const variants = POSITION_VARIANTS[targetPos];
              if (variants && variants.some(v => pPos.includes(v))) return true;
              return false;
            });
          });
        }
      }
      if ((criteria.minRating !== undefined && criteria.minRating > 0) || (criteria.maxRating !== undefined && criteria.maxRating < 10)) {
        const minVal = criteria.minRating ?? 0;
        const maxVal = criteria.maxRating ?? 10;
        players = players.filter((p: any) => {
          const ratingNum = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating);
          if (isNaN(ratingNum)) return true;
          return ratingNum >= minVal && ratingNum <= maxVal;
        });
      } else if (criteria.level) {
        const matchNumeric = criteria.level.match(/^(\d+(\.\d+)?)/);
        if (matchNumeric && parseFloat(matchNumeric[1]) > 0) {
          const minNum = parseFloat(matchNumeric[1]);
          players = players.filter((p: any) => {
            const ratingNum = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating);
            return !isNaN(ratingNum) && ratingNum >= minNum;
          });
        } else {
          const selectedLevelList = criteria.level.split(',').map(s => s.trim()).filter(Boolean);
          if (selectedLevelList.length > 0) {
            players = players.filter((p: any) => {
              if (p.level && selectedLevelList.includes(p.level)) return true;
              const ratingNum = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating);
              if (!isNaN(ratingNum)) {
                return selectedLevelList.some(lvl => {
                  if (lvl === '0-3.9') return ratingNum >= 0 && ratingNum <= 3.9;
                  if (lvl === '4.0-5.9') return ratingNum >= 4.0 && ratingNum <= 5.9;
                  if (lvl === '6.0-7.9') return ratingNum >= 6.0 && ratingNum <= 7.9;
                  if (lvl === '8.0+' || lvl === '8.0-10') return ratingNum >= 8.0;
                  return false;
                });
              }
              return false;
            });
          }
        }
      }
      const now = Date.now();
      // Süresi geçmiş sinyalleri pasif yap (tüm oyuncular listesinde ve sıralamada aktif gözükmesin)
      players.forEach((p: any) => {
        if (p.isLookingForMatch && p.availableUntil && p.availableUntil < now) {
          p.isLookingForMatch = false;
        }
      });

      if (criteria.onlyLookingForMatch) {
        players = players.filter((p: any) => p.isLookingForMatch === true);
      }
      if (criteria.timeFrame && criteria.timeFrame !== 'Tümü' && criteria.timeFrame !== 'all') {
        const rawFrames = criteria.timeFrame.split(',').map(f => f.toLocaleLowerCase('tr').trim()).filter(Boolean);
        const tfList = rawFrames.filter(f => f !== 'tümü' && f !== 'all');
        if (tfList.length > 0) {
          players = players.filter((p: any) => {
            if (!p.availableDate) return !criteria.onlyLookingForMatch;
            const availLower = p.availableDate.toLocaleLowerCase('tr');
            return tfList.some(tf => availLower.includes(tf));
          });
        }
      }

      // Aktif maç arayan oyuncuları her zaman en üstte göster
      players.sort((a: any, b: any) => {
        if (a.isLookingForMatch && !b.isLookingForMatch) return -1;
        if (!a.isLookingForMatch && b.isLookingForMatch) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      return players;
    } catch (error) {
      console.error("Oyuncu arama hatası:", error);
      return [];
    }
  },

  searchMatches: async (criteria: { 
    city?: string; 
    district?: string; 
    mode?: string; 
    position?: string;
    difficulty?: string; 
    arena?: string; 
    timeFrame?: string;
    hasReservation?: 'all' | 'reserved' | 'no_reservation' | boolean;
  }) => {
    try {
      const matchesRef = collection(db, 'matches');
      let q = query(matchesRef, where('status', '==', 'active'), limit(150));

      const snapshot = await getDocs(q);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchModel));

      if (criteria.city) {
        const cityLower = criteria.city.trim().toLocaleLowerCase('tr');
        list = list.filter(m => m.city && m.city.toLocaleLowerCase('tr').includes(cityLower));
      }
      if (criteria.district && criteria.district !== 'Tüm İlçeler') {
        const distLower = criteria.district.trim().toLocaleLowerCase('tr');
        list = list.filter(m => m.district && m.district.toLocaleLowerCase('tr').includes(distLower));
      }
      if (criteria.mode) {
        list = list.filter(m => m.mode && m.mode.toLowerCase().includes(criteria.mode!.toLowerCase()));
      }
      if (criteria.difficulty) {
        const diffList = criteria.difficulty.split(',').map(d => d.trim().toLocaleLowerCase('tr')).filter(Boolean);
        if (diffList.length > 0) {
          list = list.filter((m: any) => {
            if (!m.difficulty) return true;
            const mDiff = m.difficulty.toLocaleLowerCase('tr');
            return diffList.some(d => mDiff.includes(d));
          });
        }
      }
      if (criteria.position) {
        const POSITION_VARIANTS: Record<string, string[]> = {
          'KL': ['KL', 'KALECI', 'KALECİ', 'GK', 'GOALKEEPER'],
          'DF': ['DF', 'DEFANS', 'STOPER', 'BEK', 'CB', 'LB', 'RB'],
          'OS': ['OS', 'ORTA SAHA', 'ORTASAHA', 'CM', 'CAM', 'CDM'],
          'FV': ['FV', 'FORVET', 'SANTRAFOR', 'KANAT', 'ST', 'RW', 'LW'],
        };
        const posList = criteria.position.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        if (posList.length > 0) {
          list = list.filter((m: any) => {
            const checkSlot = (slot: any) => {
              if (!slot) return false;
              const slotPos = (slot.role || slot.position || '').toUpperCase();
              return posList.some(p => {
                if (slotPos.includes(p)) return true;
                const variants = POSITION_VARIANTS[p];
                return variants && variants.some(v => slotPos.includes(v));
              });
            };
            const hasOpenSlot = m.benchA?.some(checkSlot) || m.benchB?.some(checkSlot);
            const hasReqPos = m.requiredPositions?.some((p: string) => {
              const pUp = p.toUpperCase();
              return posList.some(targetPos => {
                if (pUp.includes(targetPos)) return true;
                const variants = POSITION_VARIANTS[targetPos];
                return variants && variants.some(v => pUp.includes(v));
              });
            });
            return hasOpenSlot || hasReqPos || !m.requiredPositions || m.requiredPositions.length === 0;
          });
        }
      }
      if (criteria.arena && criteria.arena !== 'Tüm Sahalar') {
        const arenaLower = criteria.arena.trim().toLocaleLowerCase('tr');
        list = list.filter(m => m.arena && m.arena.toLocaleLowerCase('tr').includes(arenaLower));
      }
      if (criteria.hasReservation !== undefined && criteria.hasReservation !== 'all') {
        if (criteria.hasReservation === true || criteria.hasReservation === 'reserved') {
          list = list.filter(m => m.hasReservation === true);
        } else if (criteria.hasReservation === false || criteria.hasReservation === 'no_reservation') {
          list = list.filter(m => !m.hasReservation);
        }
      }
      if (criteria.timeFrame && criteria.timeFrame !== 'Tümü' && criteria.timeFrame !== 'all') {
        const rawFrames = criteria.timeFrame.split(',').map(f => f.toLocaleLowerCase('tr').trim()).filter(Boolean);
        const tfList = rawFrames.filter(f => f !== 'tümü' && f !== 'all');
        if (tfList.length > 0) {
          list = list.filter(m => {
            if (!m.dateTime) return false;
            const mLower = m.dateTime.toLocaleLowerCase('tr');

            return tfList.some(tf => {
              const now = new Date();
              if (tf.includes('bugün')) {
                if (mLower.includes('bugün')) return true;
                try {
                  const mTs = parseTargetTimestamp(m.dateTime);
                  const mDate = new Date(mTs);
                  return mDate.toDateString() === now.toDateString();
                } catch {
                  return false;
                }
              }
              if (tf.includes('yarın')) {
                if (mLower.includes('yarın')) return true;
                try {
                  const mTs = parseTargetTimestamp(m.dateTime);
                  const mDate = new Date(mTs);
                  const tmrw = new Date(now);
                  tmrw.setDate(now.getDate() + 1);
                  return mDate.toDateString() === tmrw.toDateString();
                } catch {
                  return false;
                }
              }
              if (tf.includes('hafta sonu') || tf.includes('haftasonu')) {
                if (mLower.includes('cumartesi') || mLower.includes('pazar')) return true;
                try {
                  const mDate = new Date(parseTargetTimestamp(m.dateTime));
                  const day = mDate.getDay();
                  return day === 0 || day === 6;
                } catch {
                  return false;
                }
              }
              // Özel Seçilen Tarih (Örn: "24 Eylül", "19 Eylül 2026", GG.AA.YYYY)
              if (mLower.includes(tf)) return true;
              try {
                const mTs = parseTargetTimestamp(m.dateTime);
                const mDate = new Date(mTs);
                const dayMatch = tf.match(/(\d{1,2})/);
                if (dayMatch) {
                  const targetDay = parseInt(dayMatch[1], 10);
                  if (mDate.getDate() === targetDay) {
                    for (const [monthName, monthIndex] of Object.entries(TURKISH_MONTHS)) {
                      if (tf.includes(monthName)) {
                        return mDate.getMonth() === monthIndex;
                      }
                    }
                    return true;
                  }
                }
              } catch {
                return false;
              }
              return false;
            });
          });
        }
      }


      return list;
    } catch (error) {
      console.error("Maç arama hatası:", error);
      return [];
    }
  },

  // ==========================================
  // 4. MESAJLAŞMA VE SOHBET (CHAT)
  // ==========================================

  getConversations: async (userId: string) => {
    try {
      if (!userId) return [];
      const convRef = collection(db, 'conversations');
      const q = query(convRef, where('participants', 'array-contains', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return list.sort((a: any, b: any) => {
        const timeA = a.lastMessageTime?.toMillis 
          ? a.lastMessageTime.toMillis() 
          : (a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0);
        const timeB = b.lastMessageTime?.toMillis 
          ? b.lastMessageTime.toMillis() 
          : (b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0);
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Sohbetleri çekme hatası:", error);
      return [];
    }
  },

  subscribeConversations: (
    userId: string, 
    callback: (convs: any[]) => void,
    onError?: (error: Error) => void
  ) => {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      convs.sort((a: any, b: any) => {
        const timeA = a.lastMessageTime?.toMillis 
          ? a.lastMessageTime.toMillis() 
          : (a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0);
        const timeB = b.lastMessageTime?.toMillis 
          ? b.lastMessageTime.toMillis() 
          : (b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0);
        return timeB - timeA;
      });
      callback(convs);
    }, (err) => {
      console.error("Canlı sohbet listesi dinleme hatası:", err);
      if (onError) onError(err);
    });
  },

  sendMessage: async (conversationId: string, message: Omit<MessageModel, 'id' | 'createdAt'> & { recipientId?: string; participants?: string[] }) => {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const docRef = doc(messagesRef);
      const convRef = doc(db, 'conversations', conversationId);
      const batch = writeBatch(db);

      const cleanMessage = stripUndefined({
        ...message,
        senderAvatar: message.senderAvatar || '',
        createdAt: serverTimestamp()
      });

      batch.set(docRef, cleanMessage);

      const convData: any = {
        lastMessage: message.text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: message.senderId,
      };

      if (!conversationId.startsWith('match_') && !conversationId.startsWith('club_') && conversationId !== 'general_chat') {
        const cleanId = conversationId.startsWith('dm_') ? conversationId.slice(3) : conversationId;
        let resolvedParticipants: string[] = [];

        if (Array.isArray(message.participants) && message.participants.length >= 2) {
          resolvedParticipants = Array.from(new Set(message.participants.filter(Boolean)));
        } else if (message.recipientId && message.senderId) {
          resolvedParticipants = cleanId.startsWith(message.recipientId)
            ? [message.recipientId, message.senderId]
            : [message.senderId, message.recipientId];
        } else if (message.senderId && cleanId.startsWith(`${message.senderId}_`)) {
          const otherUid = cleanId.slice(message.senderId.length + 1);
          resolvedParticipants = otherUid ? [message.senderId, otherUid] : [message.senderId];
        } else if (message.senderId && cleanId.endsWith(`_${message.senderId}`)) {
          const otherUid = cleanId.slice(0, -(message.senderId.length + 1));
          resolvedParticipants = otherUid ? [otherUid, message.senderId] : [message.senderId];
        } else {
          const parts = cleanId.split('_').filter(Boolean);
          if (message.senderId && !parts.includes(message.senderId)) {
            parts.push(message.senderId);
          }
          resolvedParticipants = Array.from(new Set(parts));
        }

        if (resolvedParticipants.length >= 2) {
          convData.participants = resolvedParticipants;
        } else if (message.senderId) {
          convData.participants = arrayUnion(message.senderId);
        }
      }

      batch.set(convRef, convData, { merge: true });
      await batch.commit();

      return docRef.id;
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      throw error;
    }
  },

  subscribeMessages: (conversationId: string, callback: (messages: MessageModel[]) => void) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
    
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageModel));
      callback(msgs.reverse());
    }, (err) => {
      console.error("Mesaj dinleme hatası:", err);
    });
  },

  // ==========================================
  // 5. KULÜP İŞLEMLERİ (CLUBS)
  // ==========================================

  getClubs: async (criteria?: { city?: string; district?: string; hasReservation?: boolean; timeFrame?: string; difficulty?: string }) => {
    try {
      const clubsRef = collection(db, 'clubs');
      const snapshot = await getDocs(clubsRef);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubModel));

      list = list.filter(c => (c as any).status !== 'deleted');

      if (criteria?.city) {
        const cityLower = criteria.city.trim().toLocaleLowerCase('tr');
        list = list.filter(c => c.city && c.city.toLocaleLowerCase('tr').includes(cityLower));
      }
      if (criteria?.district && criteria.district !== 'Tüm İlçeler') {
        const distLower = criteria.district.trim().toLocaleLowerCase('tr');
        list = list.filter(c => c.district && c.district.toLocaleLowerCase('tr').includes(distLower));
      }
      if (criteria?.difficulty) {
        const diffList = criteria.difficulty.split(',').map(d => d.trim().toLocaleLowerCase('tr')).filter(Boolean);
        if (diffList.length > 0) {
          list = list.filter((c: any) => {
            if (!c.difficulty) return true;
            const cDiff = String(c.difficulty).toLocaleLowerCase('tr');
            return diffList.some(d => cDiff.includes(d));
          });
        }
      }
      if (criteria?.hasReservation !== undefined) {
        list = list.filter(c => c.hasReservation === criteria.hasReservation);
      }
      if (criteria?.timeFrame && criteria.timeFrame !== 'Tümü' && criteria.timeFrame !== 'all') {
        const rawFrames = criteria.timeFrame.split(',').map(f => f.toLocaleLowerCase('tr').trim()).filter(Boolean);
        const tfList = rawFrames.filter(f => f !== 'tümü' && f !== 'all');
        if (tfList.length > 0) {
          list = list.filter(c => !c.availableDate || tfList.some(tf => c.availableDate?.toLocaleLowerCase('tr').includes(tf)));
        }
      }

      // Sahası hazır olan rakipleri öne çıkar
      list.sort((a, b) => {
        if (a.hasReservation && !b.hasReservation) return -1;
        if (!a.hasReservation && b.hasReservation) return 1;
        return (b.points || 0) - (a.points || 0);
      });

      return list;
    } catch (error) {
      console.error("Kulüpleri çekme hatası:", error);
      return [];
    }
  },

  setUserLookingForMatch: async (
    userId: string, 
    isLooking: boolean, 
    availableDateOrDetails?: string | { availableDate?: string; city?: string; district?: string; preferredPitch?: string; availableNote?: string; availableUntil?: number }, 
    preferredDistrict?: string, 
    note?: string
  ) => {
    let dateStr = 'Bugün';
    let cityStr = '';
    let distStr = '';
    let pitchStr = '';
    let noteStr = '';
    let untilTs: number | null = null;

    if (typeof availableDateOrDetails === 'object' && availableDateOrDetails !== null) {
      dateStr = availableDateOrDetails.availableDate || 'Bugün';
      cityStr = availableDateOrDetails.city || '';
      distStr = availableDateOrDetails.district || '';
      pitchStr = availableDateOrDetails.preferredPitch || '';
      noteStr = availableDateOrDetails.availableNote || '';
      untilTs = availableDateOrDetails.availableUntil || null;
    } else {
      dateStr = typeof availableDateOrDetails === 'string' ? availableDateOrDetails : 'Bugün';
      distStr = preferredDistrict || '';
      noteStr = note || '';
    }

    try {
      const userRef = doc(db, 'users', userId);
      const updateData: Record<string, any> = {
        isLookingForMatch: isLooking,
        availableDate: isLooking ? dateStr : deleteField(),
        availableUntil: isLooking ? (untilTs || null) : deleteField(),
        availableDateUpdatedAt: isLooking ? Date.now() : deleteField(),
        preferredDistrict: isLooking ? (distStr || null) : deleteField(),
        preferredPitch: isLooking ? (pitchStr || null) : deleteField(),
        availableNote: isLooking ? (noteStr || null) : deleteField(),
        updatedAt: serverTimestamp()
      };
      if (isLooking && cityStr) {
        updateData.city = cityStr;
      }
      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error("Maç arama durumu güncelleme hatası:", error);
      throw error;
    }
  },

  getClubById: async (clubId: string) => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      const snap = await getDoc(clubRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'deleted') return null;
        return { id: snap.id, ...data } as ClubModel;
      }
      return null;
    } catch (error) {
      console.error("Kulüp detayı çekme hatası:", error);
      return null;
    }
  },

  createClub: async (clubData: Omit<ClubModel, 'id'>) => {
    try {
      const clubsRef = collection(db, 'clubs');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanPrefix = (clubData.name || 'HIV').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'HIV';
      const generatedCode = `${cleanPrefix}-${randSuffix}`;
      const cleanedClubData = stripUndefined(clubData);

      const docRef = await addDoc(clubsRef, {
        ...cleanedClubData,
        ...(cleanedClubData.captainId ? { leaderId: cleanedClubData.captainId } : {}),
        inviteCode: cleanedClubData.inviteCode || generatedCode,
        joinPolicy: cleanedClubData.joinPolicy || 'open',
        points: cleanedClubData.points || 100,
        membersCount: Array.isArray(cleanedClubData.members) && cleanedClubData.members.length > 0 ? cleanedClubData.members.length : 1,
        maxMembers: cleanedClubData.maxMembers || 50,
        level: 1,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, inviteCode: generatedCode, ...cleanedClubData };
    } catch (error) {
      console.error("Kulüp oluşturma hatası:", error);
      throw error;
    }
  },

  joinClubByInviteCode: async (inviteCode: string, userId: string, userName?: string) => {
    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const clubsRef = collection(db, 'clubs');
      const q = query(clubsRef, where('inviteCode', '==', cleanCode), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("Geçersiz davet kodu! Kulüp bulunamadı.");
      }
      const clubDoc = snap.docs[0];
      const clubId = clubDoc.id;
      const clubData = clubDoc.data() as ClubModel & { status?: string };
      if (clubData.status === 'deleted') {
        throw new Error("Geçersiz davet kodu! Kulüp bulunamadı.");
      }

      await dbService.joinClub(clubId, userId, clubData.name, { bypassPolicy: true });
      return { id: clubId, ...clubData };
    } catch (error) {
      console.error("Davet kodu ile katılma hatası:", error);
      throw error;
    }
  },

  updateClubJoinPolicy: async (clubId: string, joinPolicy: 'open' | 'request' | 'invite' | 'closed') => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        joinPolicy,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Kulüp katılım politikası güncelleme hatası:", error);
      throw error;
    }
  },

  requestToJoinClub: async (clubId: string, applicant: { uid: string; name: string; avatar?: string; position?: string; rating?: number }) => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      let captainIdToNotify: string | undefined = undefined;
      let requestAdded = false;

      await runTransaction(db, async (transaction) => {
        const clubSnap = await transaction.get(clubRef);
        if (!clubSnap.exists() || clubSnap.data()?.status === 'deleted') {
          throw new Error("Kulüp bulunamadı");
        }
        const clubData = clubSnap.data() as ClubModel & { leaderId?: string };
        const currentMembers = Array.isArray(clubData.members) ? clubData.members : [];
        if (currentMembers.includes(applicant.uid)) {
          return;
        }

        const existingRequests = Array.isArray(clubData.joinRequests) ? clubData.joinRequests : [];
        if (existingRequests.some((r: any) => r && r.uid === applicant.uid)) {
          return;
        }

        const newReq = stripUndefined({
          ...applicant,
          requestedAt: Date.now()
        });

        transaction.update(clubRef, {
          joinRequests: [...existingRequests, newReq],
          updatedAt: serverTimestamp()
        });

        captainIdToNotify = clubData.captainId || clubData.leaderId;
        requestAdded = true;
      });

      if (requestAdded && captainIdToNotify) {
        const notifRef = doc(collection(db, 'users', captainIdToNotify, 'notifications'));
        await setDoc(notifRef, {
          userId: captainIdToNotify,
          type: 'club_join_request',
          title: 'Yeni Üyelik İsteği',
          body: `${applicant.name} kulübünüze katılmak istiyor.`,
          clubId: clubId,
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      return true;
    } catch (error) {
      console.error("Kulübe katılma isteği hatası:", error);
      throw error;
    }
  },

  respondToJoinRequest: async (clubId: string, applicant: { uid: string; name: string }, action: 'accept' | 'reject') => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      const userRef = doc(db, 'users', applicant.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(clubRef);
        if (!snap.exists() || snap.data()?.status === 'deleted') {
          throw new Error("Kulüp bulunamadı");
        }
        const userSnap = action === 'accept' ? await transaction.get(userRef) : null;
        const cData = snap.data() as ClubModel;
        const filteredRequests = (cData.joinRequests || []).filter(r => r && r.uid !== applicant.uid);

        if (action === 'accept') {
          const currentMembers: string[] = Array.isArray(cData.members) ? cData.members.filter(Boolean) : [];
          const alreadyMember = currentMembers.includes(applicant.uid);
          const maxMembers = cData.maxMembers || 50;

          if (!alreadyMember && currentMembers.length >= maxMembers) {
            throw new Error("Kulüp kapasitesi dolu!");
          }

          const updatedMembers = alreadyMember ? currentMembers : [...currentMembers, applicant.uid];

          transaction.update(clubRef, {
            members: updatedMembers,
            membersCount: updatedMembers.length,
            joinRequests: filteredRequests,
            updatedAt: serverTimestamp()
          });

          const userUpdates = stripUndefined({
            clubId: clubId,
            clubName: cData.name,
            ...(cData.logo ? { clubLogo: cData.logo } : {}),
            updatedAt: serverTimestamp()
          });
          if (userSnap && userSnap.exists()) {
            transaction.update(userRef, userUpdates);
          } else {
            transaction.set(userRef, userUpdates, { merge: true });
          }
        } else {
          transaction.update(clubRef, {
            joinRequests: filteredRequests,
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Katılım isteğini yanıtlama hatası:", error);
      throw error;
    }
  },

  joinClub: async (clubId: string, userId: string, clubName?: string, options?: { bypassPolicy?: boolean }) => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      const userRef = doc(db, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists() || clubDoc.data()?.status === 'deleted') {
          throw new Error("Kulüp bulunamadı!");
        }
        const userDoc = await transaction.get(userRef);

        const data = clubDoc.data();
        const currentMembers: string[] = Array.isArray(data.members) ? data.members.filter(Boolean) : [];
        const alreadyMember = currentMembers.includes(userId);
        const maxMembers = data.maxMembers || 50;

        if (!alreadyMember && !options?.bypassPolicy) {
          const policy = data.joinPolicy || 'open';
          const isOwnerOrCaptain = data.captainId === userId || data.leaderId === userId;
          if (!isOwnerOrCaptain && policy === 'closed') {
            throw new Error("Bu kulüp yeni üye alımına kapalıdır!");
          }
          if (!isOwnerOrCaptain && policy === 'request') {
            throw new Error("Bu kulübe katılmak için katılım isteği göndermelisiniz!");
          }
        }

        if (!alreadyMember && currentMembers.length >= maxMembers) {
          throw new Error("Kulüp kapasitesi dolu!");
        }

        const updatedMembers = alreadyMember ? currentMembers : [...currentMembers, userId];
        const filteredRequests = Array.isArray(data.joinRequests)
          ? data.joinRequests.filter((r: any) => r && r.uid !== userId)
          : undefined;

        transaction.update(clubRef, {
          members: updatedMembers,
          membersCount: updatedMembers.length,
          ...(filteredRequests !== undefined ? { joinRequests: filteredRequests } : {}),
          updatedAt: serverTimestamp()
        });

        const resolvedClubName = clubName || data.name;
        const userUpdates = stripUndefined({
          clubId: clubId,
          ...(resolvedClubName ? { clubName: resolvedClubName } : {}),
          ...(data.logo ? { clubLogo: data.logo } : {}),
          updatedAt: serverTimestamp()
        });

        if (userDoc.exists()) {
          transaction.update(userRef, userUpdates);
        } else {
          transaction.set(userRef, userUpdates, { merge: true });
        }
      });

      return true;
    } catch (error) {
      console.error("Kulübe katılma hatası:", error);
      throw error;
    }
  },

  leaveClub: async (clubId: string, userId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const clubRef = clubId ? doc(db, 'clubs', clubId) : null;
        const userRef = userId ? doc(db, 'users', userId) : null;

        const clubSnap = clubRef ? await transaction.get(clubRef) : null;
        const userSnap = userRef ? await transaction.get(userRef) : null;

        if (clubRef && clubSnap && clubSnap.exists()) {
          const cData = clubSnap.data();
          const currentMembers: string[] = Array.isArray(cData.members) ? cData.members.filter(Boolean) : [];
          const updatedMembers = currentMembers.filter(m => m !== userId);
          transaction.update(clubRef, {
            members: updatedMembers,
            membersCount: updatedMembers.length,
            updatedAt: serverTimestamp()
          });
        }

        if (userRef && userSnap && userSnap.exists()) {
          transaction.update(userRef, {
            clubId: deleteField(),
            clubName: deleteField(),
            clubLogo: deleteField(),
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Kulüpten ayrılma hatası:", error);
      throw error;
    }
  },

  deleteClub: async (clubId: string, captainId: string) => {
    try {
      if (!clubId) return true;
      const clubRef = doc(db, 'clubs', clubId);

      // Kulüp üyelerinin tümünün profilinden kulüp bilgilerini güvenli şekilde temizle
      try {
        const snap = await getDoc(clubRef);
        const rawMembers: string[] = snap.exists() && Array.isArray(snap.data()?.members)
          ? snap.data().members
          : [];
        if (captainId) rawMembers.push(captainId);
        const allMembers = Array.from(new Set(rawMembers.filter(Boolean)));

        await Promise.allSettled(
          allMembers.map((mId) => {
            const uRef = doc(db, 'users', mId);
            return updateDoc(uRef, {
              clubId: deleteField(),
              clubName: deleteField(),
              clubLogo: deleteField(),
              updatedAt: serverTimestamp()
            });
          })
        );
      } catch (err) {
        console.warn("deleteClub üye temizleme hatası:", err);
      }

      // Kulüp dokümanını doğrudan sil
      await deleteDoc(clubRef).catch((e) => console.warn("deleteDoc clubRef warning:", e));
      return true;
    } catch (error) {
      console.error("Kulüp silme hatası:", error);
      throw error;
    }
  },

  transferClubCaptainAndLeave: async (clubId: string, currentCaptainId: string, newCaptainId: string) => {
    try {
      if (!clubId) return true;
      const clubRef = doc(db, 'clubs', clubId);
      const newCapRef = newCaptainId ? doc(db, 'users', newCaptainId) : null;
      const oldCapRef = currentCaptainId ? doc(db, 'users', currentCaptainId) : null;

      await runTransaction(db, async (transaction) => {
        const clubSnap = await transaction.get(clubRef);
        const newCapSnap = newCapRef ? await transaction.get(newCapRef) : null;
        const oldCapSnap = oldCapRef ? await transaction.get(oldCapRef) : null;

        if (clubSnap.exists()) {
          const cData = clubSnap.data();
          const newCapName = (newCapSnap && newCapSnap.exists() && newCapSnap.data()?.name)
            ? newCapSnap.data().name
            : 'Kaptan';
          const currentMembers: string[] = Array.isArray(cData.members) ? cData.members.filter(Boolean) : [];
          const updatedMembers = currentMembers.filter(m => m !== currentCaptainId);
          if (newCaptainId && !updatedMembers.includes(newCaptainId)) {
            updatedMembers.push(newCaptainId);
          }

          transaction.update(clubRef, {
            captainId: newCaptainId,
            leaderId: newCaptainId,
            captainName: newCapName,
            members: updatedMembers,
            membersCount: updatedMembers.length,
            updatedAt: serverTimestamp()
          });
        }

        if (oldCapRef && oldCapSnap && oldCapSnap.exists()) {
          transaction.update(oldCapRef, {
            clubId: deleteField(),
            clubName: deleteField(),
            clubLogo: deleteField(),
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("Kaptanlık devredip ayrılma hatası:", error);
      throw error;
    }
  },

  updateClubDetails: async (clubId: string, updates: Record<string, any>) => {
    try {
      if (!clubId) throw new Error("Kulüp ID gereklidir!");
      const clubRef = doc(db, 'clubs', clubId);
      const allowedFields = [
        'name',
        'desc',
        'description',
        'city',
        'district',
        'availableDate',
        'difficulty',
        'rank',
        'hasReservation',
        'reservationDetails',
        'venueName',
        'logo',
        'color',
        'joinPolicy',
        'maxMembers'
      ];
      const cleanUpdates: Record<string, any> = {
        updatedAt: serverTimestamp()
      };
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          cleanUpdates[key] = updates[key];
        }
      }
      // 'description' girildiyse 'desc' ile de senkronize tut
      if (cleanUpdates.description && !cleanUpdates.desc) {
        cleanUpdates.desc = cleanUpdates.description;
      } else if (cleanUpdates.desc && !cleanUpdates.description) {
        cleanUpdates.description = cleanUpdates.desc;
      }

      await updateDoc(clubRef, cleanUpdates);
      return true;
    } catch (error) {
      console.error("Kulüp detaylarını güncelleme hatası:", error);
      throw error;
    }
  },

  markAllNotificationsRead: async (userId: string) => {
    try {
      if (!userId) return false;
      const batch = writeBatch(db);
      
      // 1. Alt koleksiyon: users/{userId}/notifications
      const subNotifsRef = collection(db, 'users', userId, 'notifications');
      const subSnap = await getDocs(query(subNotifsRef, where('read', '==', false)));
      subSnap.forEach((d) => {
        batch.update(d.ref, { read: true, updatedAt: serverTimestamp() });
      });

      // 2. Kök koleksiyon: notifications (userId == userId)
      const rootNotifsRef = collection(db, 'notifications');
      const rootSnap = await getDocs(query(rootNotifsRef, where('userId', '==', userId), where('read', '==', false)));
      rootSnap.forEach((d) => {
        batch.update(d.ref, { read: true, updatedAt: serverTimestamp() });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Tüm bildirimleri okundu işaretleme hatası:", error);
      return false;
    }
  },

  clearAllNotifications: async (userId: string) => {
    try {
      if (!userId) return false;
      const batch = writeBatch(db);

      // 1. Alt koleksiyon: users/{userId}/notifications
      const subNotifsRef = collection(db, 'users', userId, 'notifications');
      const subSnap = await getDocs(subNotifsRef);
      subSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      // 2. Kök koleksiyon: notifications (userId == userId)
      const rootNotifsRef = collection(db, 'notifications');
      const rootSnap = await getDocs(query(rootNotifsRef, where('userId', '==', userId)));
      rootSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Tüm bildirimleri temizleme hatası:", error);
      return false;
    }
  },

  cleanupUserData: async (userId: string) => {
    try {
      if (!userId) return false;

      // 1. Kullanıcının üye veya kaptan olduğu kulüpleri temizle
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;
        let clubId = userData?.clubId;

        // Kullanıcının üye veya kaptan olduğu kulübü kontrol et
        if (!clubId) {
          const clubsRef = collection(db, 'clubs');
          const captainQuery = query(clubsRef, where('captainId', '==', userId), limit(1));
          const captainSnap = await getDocs(captainQuery);
          if (!captainSnap.empty) {
            clubId = captainSnap.docs[0].id;
          } else {
            const memberQuery = query(clubsRef, where('members', 'array-contains', userId), limit(1));
            const memberSnap = await getDocs(memberQuery);
            if (!memberSnap.empty) {
              clubId = memberSnap.docs[0].id;
            }
          }
        }

        if (clubId) {
          const clubRef = doc(db, 'clubs', clubId);
          const clubSnap = await getDoc(clubRef);
          if (clubSnap.exists()) {
            const clubData = clubSnap.data() as ClubModel;
            const isCaptain = clubData.captainId === userId;
            const otherMembers = (clubData.members || []).filter(m => m && m !== userId);

            if (isCaptain) {
              if (otherMembers.length > 0) {
                // Kaptanlığı diğer bir üyeye devret ve ayrıl
                await dbService.transferClubCaptainAndLeave(clubId, userId, otherMembers[0]).catch(e => console.warn('Kaptan devir uyarısı:', e));
              } else {
                // Kulüpte başka üye kalmadığı için kulübü sil
                await dbService.deleteClub(clubId, userId).catch(e => console.warn('Kulüp silme uyarısı:', e));
              }
            } else {
              // Sıradan üye olarak ayrıl
              await dbService.leaveClub(clubId, userId).catch(e => console.warn('Kulüpten ayrılma uyarısı:', e));
            }
          }
        }
      } catch (clubErr) {
        console.warn("Kullanıcı kulüp temizleme uyarısı:", clubErr);
      }

      // 2. Aktif maçlardaki mevki (slot), yedek kulübesi (bench) ve yedek sırası (reserves) kayıtlarını temizle
      try {
        const matchesRef = collection(db, 'matches');
        const activeMatchesQuery = query(matchesRef, where('status', '==', 'active'), limit(150));
        const activeMatchesSnap = await getDocs(activeMatchesQuery);

        for (const mDoc of activeMatchesSnap.docs) {
          const mData = mDoc.data() as MatchModel;
          const isInSlots = mData.slots && Object.values(mData.slots).some(s => s?.uid === userId);
          const isInBenchA = Array.isArray(mData.benchA) && mData.benchA.some((bp: any) => bp?.uid === userId);
          const isInBenchB = Array.isArray(mData.benchB) && mData.benchB.some((bp: any) => bp?.uid === userId);
          const isInReserves = Array.isArray(mData.reserves) && mData.reserves.some((r: any) => r?.uid === userId);
          const isOrganizer = mData.organizerId === userId;

          if (isInSlots || isInBenchA || isInBenchB || isInReserves || isOrganizer) {
            await dbService.leaveMatchSquad(mDoc.id, userId).catch(e => console.warn(`Maç ${mDoc.id} kadro temizleme uyarısı:`, e));
          }
        }
      } catch (matchErr) {
        console.warn("Kullanıcı aktif maçlar temizleme uyarısı:", matchErr);
      }

      // 3. Kullanıcının tüm bildirimlerini temizle
      try {
        await dbService.clearAllNotifications(userId).catch(e => console.warn("Bildirim temizleme uyarısı:", e));
      } catch (notifErr) {
        console.warn("Kullanıcı bildirim temizleme uyarısı:", notifErr);
      }

      return true;
    } catch (error) {
      console.error("cleanupUserData genel hatası:", error);
      throw error;
    }
  },

  // ==========================================
  // 6. TESİS & HALISAHA PUANLAMA (PITCH REVIEWS)
  // ==========================================

  getPitchReviews: async (pitchName: string) => {
    try {
      const reviewsRef = collection(db, 'pitch_reviews');
      const q = query(reviewsRef, where('pitchName', '==', pitchName), limit(50));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PitchReviewModel));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Tesis yorumları çekme hatası:", error);
      return [];
    }
  },

  savePitchReview: async (pitchName: string, review: Omit<PitchReviewModel, 'id' | 'createdAt' | 'pitchName'>) => {
    try {
      const reviewsRef = collection(db, 'pitch_reviews');
      if (review.userId && review.userId !== 'anon') {
        const q = query(reviewsRef, where('pitchName', '==', pitchName), where('userId', '==', review.userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existingDoc = snap.docs[0];
          await updateDoc(existingDoc.ref, {
            ...review,
            updatedAt: serverTimestamp()
          });
          return { id: existingDoc.id, pitchName, ...review };
        }
      }
      const docRef = await addDoc(reviewsRef, {
        pitchName,
        ...review,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, pitchName, ...review };
    } catch (error) {
      console.error("Tesis yorumu kaydetme hatası:", error);
      throw error;
    }
  },

  addPitchReview: async (pitchName: string, review: Omit<PitchReviewModel, 'id' | 'createdAt' | 'pitchName'>) => {
    return dbService.savePitchReview(pitchName, review);
  },

  deletePitchReview: async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'pitch_reviews', reviewId);
      await deleteDoc(reviewRef);
      return true;
    } catch (error) {
      console.error("Tesis yorumu silme hatası:", error);
      throw error;
    }
  },

  // ─── TESİS BİLGİ DÜZELTME / ÖNERİSİ ───
  submitPitchProposal: async (proposal: Omit<PitchProposalModel, 'id' | 'createdAt' | 'status'>) => {
    try {
      const proposalsRef = collection(db, 'pitch_proposals');
      const docRef = await addDoc(proposalsRef, {
        ...proposal,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, status: 'pending', ...proposal };
    } catch (error) {
      console.error("Saha önerisi gönderme hatası:", error);
      throw error;
    }
  },

  // ==========================================
  // 7. ÖZEL HALISAHA YÖNETİMİ & SENKRONİZASYON (PITCHES)
  // ==========================================

  getCustomPitches: async (): Promise<CustomPitchModel[]> => {
    try {
      const pitchesRef = collection(db, 'pitches');
      const snapshot = await getDocs(pitchesRef);
      return snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CustomPitchModel))
        .filter((pitch: any) => pitch.status !== 'deleted');
    } catch (error) {
      console.error("Özel sahaları çekme hatası:", error);
      return [];
    }
  },

  subscribeCustomPitches: (
    callback: (pitches: CustomPitchModel[]) => void, 
    onError?: (error: Error) => void
  ) => {
    try {
      const pitchesRef = collection(db, 'pitches');
      return onSnapshot(pitchesRef, (snapshot) => {
        const list = snapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CustomPitchModel))
          .filter((pitch: any) => pitch.status !== 'deleted');
        callback(list);
      }, (err) => {
        console.error("Özel sahalar canlı dinleme hatası:", err);
        if (onError) onError(err);
      });
    } catch (error: any) {
      console.error("Özel sahalar dinleme başlatma hatası:", error);
      if (onError) onError(error);
      return () => {};
    }
  },

  // ==========================================
  // 8. PLATFORM BAKIM MODU & AYARLAR (SETTINGS)
  // ==========================================

  getPlatformSettings: async (): Promise<PlatformSettingsModel> => {
    try {
      const settingsRef = doc(db, 'settings', 'platform');
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        return snap.data() as PlatformSettingsModel;
      }
      return { maintenance: false };
    } catch (error) {
      console.error("Platform ayarları çekme hatası:", error);
      return { maintenance: false };
    }
  },

  subscribePlatformSettings: (
    callback: (settings: PlatformSettingsModel) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      const settingsRef = doc(db, 'settings', 'platform');
      return onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as PlatformSettingsModel);
        } else {
          callback({ maintenance: false });
        }
      }, (err) => {
        console.error("Platform ayarları canlı dinleme hatası:", err);
        if (onError) onError(err);
      });
    } catch (error: any) {
      console.error("Platform ayarları dinleme başlatma hatası:", error);
      if (onError) onError(error);
      return () => {};
    }
  }
};
