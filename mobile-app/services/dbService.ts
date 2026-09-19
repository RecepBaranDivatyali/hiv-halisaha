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
  increment,
  runTransaction,
  writeBatch,
  serverTimestamp,
  deleteField,
  deleteDoc
} from 'firebase/firestore';

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
  joinTerms?: number;
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
      paid?: boolean;
      paymentStatus?: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt';
      paymentMethod?: 'iban' | 'cash';
    } | null;
  };
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

export interface MessageModel {
  id?: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: any;
}

export const dbService = {
  // ==========================================
  // 1. KULLANICI PROFİL İŞLEMLERİ (USERS)
  // ==========================================
  
  createUserProfile: async (userId: string, data: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...data,
        createdAt: serverTimestamp(),
        stats: {
          goals: 0,
          assists: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          mvpCount: 0,
          reliabilityScore: 100,
          cleanSheets: 0,
        }
      }, { merge: true });
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

  updateUserProfile: async (userId: string, data: Partial<any>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      throw error;
    }
  },

  updateUserReliability: async (userId: string, penalty: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentScore = userSnap.data()?.stats?.reliabilityScore ?? 100;
        const newScore = Math.max(0, currentScore - penalty);
        await updateDoc(userRef, {
          'stats.reliabilityScore': newScore,
          updatedAt: serverTimestamp()
        });
        return newScore;
      }
      return 100;
    } catch (error) {
      console.error("Güvenilirlik puanı düşürme hatası:", error);
      throw error;
    }
  },

  // ==========================================
  // 2. MAÇ İŞLEMLERİ (MATCHES)
  // ==========================================

  createMatch: async (matchData: Omit<MatchModel, 'id'>) => {
    try {
      const matchesRef = collection(db, 'matches');
      const docRef = await addDoc(matchesRef, {
        ...matchData,
        status: matchData.status || 'active',
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...matchData };
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
      const q = query(matchesRef, where('status', '==', 'completed'), limit(20));
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchModel));
      
      if (userId) {
        list = list.filter(m => m.organizerId === userId || (m.slots && Object.values(m.slots).some(slot => slot?.uid === userId)));
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
        ...data,
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

  joinMatchSlot: async (matchId: string, slotKey: string, player: { uid: string; name: string; avatar?: string; position?: string }) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) {
          throw new Error("Maç bulunamadı!");
        }
        const data = matchDoc.data();
        if (data.slots && data.slots[slotKey] && data.slots[slotKey].uid && data.slots[slotKey].uid !== player.uid) {
          throw new Error("Mevki zaten dolu!");
        }

        const updates: Record<string, any> = {
          [`slots.${slotKey}`]: {
            ...player,
            paid: data.slots?.[slotKey]?.paid ?? false,
            paymentStatus: data.slots?.[slotKey]?.paymentStatus ?? 'unpaid',
            joinedAt: serverTimestamp()
          }
        };

        // Eğer kullanıcı maçta daha önce başka bir mevkideyse, eski mevkisini otomatik temizle
        let countDelta = 1;
        if (data.slots) {
          Object.entries(data.slots).forEach(([k, s]: [string, any]) => {
            if (s && s.uid === player.uid) {
              if (k !== slotKey) {
                updates[`slots.${k}`] = deleteField();
                countDelta = 0; // Mevki değiştirdi, toplam kişi sayısı artmaz
              } else {
                countDelta = 0; // Zaten bu mevkide
              }
            }
          });
        }

        // Yedek listesindeyse, asil kadroya geçtiği için yedekten kaldır
        if (data.reserves && Array.isArray(data.reserves)) {
          const filtered = data.reserves.filter((r: any) => r.uid !== player.uid);
          if (filtered.length !== data.reserves.length) {
            updates.reserves = filtered;
          }
        }

        if (countDelta !== 0) {
          updates.joinedPlayersCount = increment(countDelta);
        }

        transaction.update(matchRef, updates);
      });
      return true;
    } catch (error) {
      console.error("Mevkiye katılma hatası:", error);
      throw error;
    }
  },

  updateMatchGkFree: async (matchId: string, isGkFree: boolean) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        isGkFree,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Kaleci muafiyet güncelleme hatası:", error);
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
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) {
          throw new Error("Maç bulunamadı!");
        }
        const data = matchDoc.data();
        if (!data.slots || !data.slots[slotKey]) {
          throw new Error("Mevki zaten boş!");
        }
        if (userId && data.slots[slotKey].uid !== userId) {
          throw new Error("Bu mevki size ait değil!");
        }
        transaction.update(matchRef, {
          [`slots.${slotKey}`]: deleteField(),
          joinedPlayersCount: increment(-1)
        });
      });
      return true;
    } catch (error) {
      console.error("Mevkiden ayrılma hatası:", error);
      throw error;
    }
  },

  saveMatchRating: async (matchId: string, ratingData: { userId: string; rating: number; mvpNominee?: string; comment?: string; ratedPlayerId?: string; ratedPlayerName?: string }) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      await addDoc(ratingsRef, {
        matchId,
        ...ratingData,
        createdAt: serverTimestamp()
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
      await updateDoc(matchRef, {
        reserves: arrayUnion({
          ...player,
          joinedAt: new Date().toISOString()
        })
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
      const snap = await getDoc(matchRef);
      if (snap.exists()) {
        const data = snap.data();
        const updatedReserves = (data.reserves || []).filter((r: any) => r.uid !== userId);
        await updateDoc(matchRef, { reserves: updatedReserves });
      }
      return true;
    } catch (error) {
      console.error("Yedek sırasından çıkma hatası:", error);
      throw error;
    }
  },

  updateMatchScore: async (matchId: string, score: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);

      await updateDoc(matchRef, {
        score,
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Update player profile statistics (matchesPlayed, wins, losses, draws)
      if (matchSnap.exists()) {
        const data = matchSnap.data();
        const slots = data.slots || {};
        
        const scoreParts = score.split('-').map(s => parseInt(s.trim(), 10));
        const scoreA = !isNaN(scoreParts[0]) ? scoreParts[0] : 0;
        const scoreB = !isNaN(scoreParts[1]) ? scoreParts[1] : 0;
        
        const teamAPlayers: string[] = [];
        const teamBPlayers: string[] = [];
        
        Object.entries(slots).forEach(([slotKey, slotData]: [string, any]) => {
          if (slotData && slotData.uid) {
            if (slotKey.startsWith('B_')) {
              teamBPlayers.push(slotData.uid);
            } else {
              teamAPlayers.push(slotData.uid);
            }
          }
        });

        const batch = writeBatch(db);
        
        const updatePlayerStats = (uid: string, result: 'win' | 'loss' | 'draw') => {
          const userRef = doc(db, 'users', uid);
          batch.set(userRef, {
            stats: {
              matchesPlayed: increment(1),
              ...(result === 'win' ? { wins: increment(1) } : {}),
              ...(result === 'loss' ? { losses: increment(1) } : {}),
              ...(result === 'draw' ? { draws: increment(1) } : {}),
            }
          }, { merge: true });
        };

        if (scoreA > scoreB) {
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'win'));
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'loss'));
        } else if (scoreB > scoreA) {
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'win'));
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'loss'));
        } else {
          teamAPlayers.forEach(uid => updatePlayerStats(uid, 'draw'));
          teamBPlayers.forEach(uid => updatePlayerStats(uid, 'draw'));
        }

        await batch.commit().catch(err => console.warn("Profil istatistikleri batch güncelleme hatası:", err));
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
      const colRef = collection(db, 'club_challenges');
      const docRef = await addDoc(colRef, {
        ...challengeData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...challengeData };
    } catch (error) {
      console.error("Meydan okuma gönderme hatası:", error);
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
    onlyLookingForMatch?: boolean;
    timeFrame?: string;
  }) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(50));
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
        players = players.filter((p: any) => p.position && p.position.toUpperCase().includes(criteria.position!.toUpperCase()));
      }
      if (criteria.level) {
        players = players.filter((p: any) => p.level === criteria.level);
      }
      if (criteria.onlyLookingForMatch) {
        players = players.filter((p: any) => p.isLookingForMatch === true);
      }
      if (criteria.timeFrame && criteria.timeFrame !== 'Tümü' && criteria.timeFrame !== 'all') {
        const tf = criteria.timeFrame.toLocaleLowerCase('tr').trim();
        players = players.filter((p: any) => {
          if (!p.availableDate) return !criteria.onlyLookingForMatch;
          return p.availableDate.toLocaleLowerCase('tr').includes(tf);
        });
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
    difficulty?: string; 
    arena?: string; 
    timeFrame?: string;
    hasReservation?: 'all' | 'reserved' | 'no_reservation' | boolean;
  }) => {
    try {
      const matchesRef = collection(db, 'matches');
      let q = query(matchesRef, where('status', '==', 'active'), limit(50));

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
        list = list.filter(m => m.mode === criteria.mode);
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
        const tf = criteria.timeFrame.toLocaleLowerCase('tr').trim();
        if (tf.includes('bugün')) {
          list = list.filter(m => m.dateTime && m.dateTime.toLocaleLowerCase('tr').includes('bugün'));
        } else if (tf.includes('yarın')) {
          list = list.filter(m => m.dateTime && m.dateTime.toLocaleLowerCase('tr').includes('yarın'));
        } else if (tf.includes('hafta sonu') || tf.includes('haftasonu')) {
          list = list.filter(m => {
            if (!m.dateTime) return false;
            const mLower = m.dateTime.toLocaleLowerCase('tr');
            if (mLower.includes('cumartesi') || mLower.includes('pazar')) return true;
            try {
              const mDate = new Date(parseTargetTimestamp(m.dateTime));
              const day = mDate.getDay();
              return day === 0 || day === 6;
            } catch {
              return false;
            }
          });
        } else {
          // Özel Seçilen Tarih (Örn: "24 Eylül", "19 Eylül 2026", GG.AA.YYYY)
          list = list.filter(m => {
            if (!m.dateTime) return false;
            const mLower = m.dateTime.toLocaleLowerCase('tr');
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
              // yoksay
            }
            return false;
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
      const convRef = collection(db, 'conversations');
      const q = query(convRef, where('participants', 'array-contains', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Sohbetleri çekme hatası:", error);
      return [];
    }
  },

  sendMessage: async (conversationId: string, message: Omit<MessageModel, 'id' | 'createdAt'>) => {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const docRef = doc(messagesRef);
      
      const convRef = doc(db, 'conversations', conversationId);
      
      const batch = writeBatch(db);
      
      batch.set(docRef, {
        ...message,
        createdAt: serverTimestamp()
      });

      batch.set(convRef, {
        lastMessage: message.text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: message.senderId,
      }, { merge: true });

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

  getClubs: async (criteria?: { city?: string; district?: string; hasReservation?: boolean; timeFrame?: string }) => {
    try {
      const clubsRef = collection(db, 'clubs');
      const snapshot = await getDocs(clubsRef);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubModel));

      if (criteria?.city) {
        const cityLower = criteria.city.trim().toLocaleLowerCase('tr');
        list = list.filter(c => c.city && c.city.toLocaleLowerCase('tr').includes(cityLower));
      }
      if (criteria?.district && criteria.district !== 'Tüm İlçeler') {
        const distLower = criteria.district.trim().toLocaleLowerCase('tr');
        list = list.filter(c => c.district && c.district.toLocaleLowerCase('tr').includes(distLower));
      }
      if (criteria?.hasReservation !== undefined) {
        list = list.filter(c => c.hasReservation === criteria.hasReservation);
      }
      if (criteria?.timeFrame && criteria.timeFrame !== 'Tümü' && criteria.timeFrame !== 'all') {
        const tf = criteria.timeFrame.toLocaleLowerCase('tr').trim();
        list = list.filter(c => !c.availableDate || c.availableDate.toLocaleLowerCase('tr').includes(tf));
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
    availableDateOrDetails?: string | { availableDate?: string; district?: string; availableNote?: string }, 
    preferredDistrict?: string, 
    note?: string
  ) => {
    let dateStr = 'Bugün';
    let distStr = '';
    let noteStr = '';

    if (typeof availableDateOrDetails === 'object' && availableDateOrDetails !== null) {
      dateStr = availableDateOrDetails.availableDate || 'Bugün';
      distStr = availableDateOrDetails.district || '';
      noteStr = availableDateOrDetails.availableNote || '';
    } else {
      dateStr = availableDateOrDetails || 'Bugün';
      distStr = preferredDistrict || '';
      noteStr = note || '';
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isLookingForMatch: isLooking,
        availableDate: isLooking ? dateStr : deleteField(),
        preferredDistrict: isLooking ? (distStr || null) : deleteField(),
        availableNote: isLooking ? (noteStr || null) : deleteField(),
        updatedAt: serverTimestamp()
      });
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
        return { id: snap.id, ...snap.data() } as ClubModel;
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
      const docRef = await addDoc(clubsRef, {
        ...clubData,
        points: clubData.points || 100,
        membersCount: 1,
        maxMembers: clubData.maxMembers || 50,
        level: 1,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...clubData };
    } catch (error) {
      console.error("Kulüp oluşturma hatası:", error);
      throw error;
    }
  },

  joinClub: async (clubId: string, userId: string, clubName?: string) => {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      const userRef = doc(db, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists()) {
          throw new Error("Kulüp bulunamadı!");
        }
        
        const data = clubDoc.data();
        const membersCount = data.membersCount || 0;
        const maxMembers = data.maxMembers || 50;

        if (membersCount >= maxMembers) {
          throw new Error("Kulüp kapasitesi dolu!");
        }

        transaction.update(clubRef, {
          members: arrayUnion(userId),
          membersCount: increment(1)
        });

        transaction.update(userRef, {
          clubId: clubId,
          ...(clubName ? { clubName } : {})
        });
      });

      return true;
    } catch (error) {
      console.error("Kulübe katılma hatası:", error);
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

  addPitchReview: async (pitchName: string, review: Omit<PitchReviewModel, 'id' | 'createdAt' | 'pitchName'>) => {
    try {
      const reviewsRef = collection(db, 'pitch_reviews');
      const docRef = await addDoc(reviewsRef, {
        pitchName,
        ...review,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, pitchName, ...review };
    } catch (error) {
      console.error("Tesis yorumu ekleme hatası:", error);
      throw error;
    }
  }
};
