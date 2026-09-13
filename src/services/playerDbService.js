import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  runTransaction,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

export const playerDbService = {
  // ─── MAÇLARI DİNLEME VE GETİRME ───
  subscribeMatches(callback) {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const matches = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.status !== 'deleted');
        callback(matches);
      }, (err) => {
        console.error('Maç abonelik hatası:', err);
      });
    } catch (e) {
      console.error('Maç dinleme başlatılamadı:', e);
      return () => {};
    }
  },

  subscribeMatch(matchId, callback) {
    try {
      const ref = doc(db, 'matches', matchId);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() });
        } else {
          callback(null);
        }
      }, (err) => {
        console.error('Tekil maç dinleme hatası:', err);
      });
    } catch (e) {
      console.error('Tekil maç dinleme başlatılamadı:', e);
      return () => {};
    }
  },

  // ─── MAÇ OLUŞTURMA ───
  async createMatch(matchData, organizer) {
    const matchRef = doc(collection(db, 'matches'));
    const mode = matchData.mode || '7v7';
    const num = parseInt(mode.split('v')[0], 10) || 7;
    const totalRequired = num * 2;
    const fee = Number(matchData.fee) || 150;
    const totalFee = Number(matchData.totalFee) || (fee * totalRequired);

    // Initial slots with organizer taking slot_0
    const initialSlots = {};
    for (let i = 0; i < totalRequired; i++) {
      const slotKey = `slot_${i}`;
      if (i === 0) {
        initialSlots[slotKey] = {
          uid: organizer?.uid || 'player_1',
          name: organizer?.name || 'Kaptan',
          avatar: organizer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          position: 'Orta Saha'
        };
      } else {
        initialSlots[slotKey] = null;
      }
    }

    const newMatch = {
      id: matchRef.id,
      arena: matchData.arena || 'Beşiktaş Arena',
      city: matchData.city || 'İstanbul',
      district: matchData.district || 'Beşiktaş',
      dateTime: matchData.dateTime || 'Bugün, 21:00',
      mode: mode,
      fee: fee,
      totalFee: totalFee,
      organizer: organizer?.name || 'Kaptan',
      organizerId: organizer?.uid || 'player_1',
      joinedPlayersCount: 1,
      totalRequiredPlayers: totalRequired,
      status: 'open',
      slots: initialSlots,
      isSubscription: !!matchData.isSubscription,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(matchRef, newMatch);
    return newMatch;
  },

  // ─── KADRO SLOT İŞLEMLERİ (RACE-CONDITION KORUMALI) ───
  async joinMatchSlot(matchId, slotKey, player) {
    const matchRef = doc(db, 'matches', matchId);
    return await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists()) {
        throw new Error('Maç bulunamadı.');
      }
      const data = matchDoc.data();
      const currentSlot = data.slots?.[slotKey];
      if (currentSlot && currentSlot.uid && currentSlot.uid !== player.uid) {
        throw new Error('Bu mevki az önce başka bir oyuncu tarafından dolduruldu.');
      }

      const updatedSlots = { ...(data.slots || {}) };
      const wasEmpty = !updatedSlots[slotKey];
      updatedSlots[slotKey] = {
        uid: player.uid,
        name: player.name,
        avatar: player.avatar || '',
        position: player.position || 'Oyuncu'
      };

      transaction.update(matchRef, {
        slots: updatedSlots,
        joinedPlayersCount: wasEmpty ? increment(1) : (data.joinedPlayersCount || 1),
        updatedAt: serverTimestamp()
      });
      return true;
    });
  },

  async leaveMatchSlot(matchId, slotKey, playerUid) {
    const matchRef = doc(db, 'matches', matchId);
    return await runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists()) {
        throw new Error('Maç bulunamadı.');
      }
      const data = matchDoc.data();
      const currentSlot = data.slots?.[slotKey];
      if (!currentSlot) return true;

      // Only owner or admin can remove
      if (currentSlot.uid && currentSlot.uid !== playerUid) {
        throw new Error('Yalnızca kendi mevkisinden ayrılabilirsiniz.');
      }

      const updatedSlots = { ...(data.slots || {}) };
      delete updatedSlots[slotKey];

      const currentCount = data.joinedPlayersCount || 1;
      transaction.update(matchRef, {
        slots: updatedSlots,
        joinedPlayersCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp()
      });
      return true;
    });
  },

  // ─── MAÇ ODASI CANLI SOHBET ───
  subscribeMatchMessages(matchRoomId, callback) {
    try {
      const q = query(
        collection(db, 'conversations', matchRoomId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(msgs);
      }, (err) => {
        console.error('Sohbet abonelik hatası:', err);
      });
    } catch (e) {
      console.error('Sohbet başlatılamadı:', e);
      return () => {};
    }
  },

  async sendMatchMessage(matchRoomId, messageData) {
    const messagesCol = collection(db, 'conversations', matchRoomId, 'messages');
    const newMsgRef = doc(messagesCol);
    const convRef = doc(db, 'conversations', matchRoomId);

    const batch = writeBatch(db);
    batch.set(newMsgRef, {
      ...messageData,
      id: newMsgRef.id,
      createdAt: serverTimestamp()
    });

    batch.set(convRef, {
      lastMessage: messageData.text,
      lastSender: messageData.senderName,
      updatedAt: serverTimestamp(),
      type: 'match_chat'
    }, { merge: true });

    await batch.commit();
  },

  // ─── KULÜPLERİ GETİRME VE KATILMA ───
  async getClubs() {
    try {
      const snap = await getDocs(collection(db, 'clubs'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.status !== 'deleted');
      return list;
    } catch (e) {
      console.error('Kulüpler yüklenemedi:', e);
      return [];
    }
  },

  subscribeClubs(callback) {
    try {
      const q = query(collection(db, 'clubs'));
      return onSnapshot(q, (snap) => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.status !== 'deleted');
        callback(list);
      });
    } catch (e) {
      console.error('Kulüp aboneliği başlatılamadı:', e);
      return () => {};
    }
  },

  async createClub(clubData, user) {
    const ref = doc(collection(db, 'clubs'));
    const newClub = {
      id: ref.id,
      name: clubData.name,
      desc: clubData.desc || 'H.İ.V. Ligi Resmi Halısaha Takımı',
      city: clubData.city || 'İstanbul',
      points: Number(clubData.points) || 1200,
      level: Number(clubData.level) || 1,
      membersCount: 1,
      maxMembers: Number(clubData.maxMembers) || 50,
      leaderId: user.uid,
      leaderName: user.name,
      color: clubData.color || '#8eff71',
      members: [{ uid: user.uid, name: user.name, avatar: user.avatar || '', role: 'Kaptan' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, newClub);
    return newClub;
  },

  async joinClub(clubId, user) {
    const clubRef = doc(db, 'clubs', clubId);
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(clubRef);
      if (!snap.exists()) throw new Error('Kulüp bulunamadı.');
      const data = snap.data();
      if ((data.membersCount || 0) >= (data.maxMembers || 50)) {
        throw new Error('Bu kulüp maksimum üye kapasitesine ulaşmıştır.');
      }
      const members = data.members || [];
      if (members.some(m => m.uid === user.uid)) {
        throw new Error('Zaten bu kulübün üyesisiniz.');
      }
      members.push({ uid: user.uid, name: user.name, avatar: user.avatar || '', role: 'Oyuncu' });
      transaction.update(clubRef, {
        members: members,
        membersCount: increment(1),
        updatedAt: serverTimestamp()
      });
      return true;
    });
  },

  // ─── HALISAHA / TESİSLER ───
  async getPitches() {
    try {
      const snap = await getDocs(collection(db, 'pitches'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.status !== 'deleted');
      if (list.length > 0) return list;

      // Varsayılan zengin tesis listesi
      return [
        { id: '1', name: 'Beşiktaş Arena', city: 'İstanbul', district: 'Beşiktaş', surface: 'Suni Çim (Hibrit)', pricePerHour: 2200, rating: 4.8, reviewsCount: 42, features: ['Otopark', 'Duş & Soyunma', 'Kamera Kaydı', 'Tribün'] },
        { id: '2', name: 'Kadıköy Spor Parkı', city: 'İstanbul', district: 'Kadıköy', surface: 'Kapalı Suni Çim', pricePerHour: 1900, rating: 4.6, reviewsCount: 28, features: ['Isıtmalı', 'Kafeterya', 'Servis'] },
        { id: '3', name: 'Santra Halı Saha', city: 'İstanbul', district: 'Şişli', surface: 'Açık Saha (Geniş)', pricePerHour: 1750, rating: 4.4, reviewsCount: 19, features: ['Aydınlatma', 'Soyunma Odası'] },
        { id: '4', name: 'Çankaya Mega Pitch', city: 'Ankara', district: 'Çankaya', surface: 'Suni Çim (FIFA Pro)', pricePerHour: 2000, rating: 4.9, reviewsCount: 56, features: ['VAR Sistemi', 'Canlı Yayın', 'Otopark'] },
        { id: '5', name: 'Bornova Olimpia Saha', city: 'İzmir', district: 'Bornova', surface: 'Doğal Çim Hibrit', pricePerHour: 2100, rating: 4.7, reviewsCount: 34, features: ['Kafeterya', 'Otopark', 'Duş'] }
      ];
    } catch (e) {
      console.error('Halısahalar yüklenemedi:', e);
      return [];
    }
  }
};
