import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export const adminDbService = {
  // ─── MAÇ YÖNETİMİ ───
  async getMatches() {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.status !== 'deleted');
    } catch (e) {
      console.error('Maçları getirme hatası:', e);
      return [];
    }
  },

  subscribeMatches(callback) {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const matches = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.status !== 'deleted');
        callback(matches);
      }, (error) => {
        console.error('Maç abonelik hatası:', error);
      });
    } catch (e) {
      console.error('Maç abonelik başlatma hatası:', e);
      return () => {};
    }
  },

  async createMatch(matchData) {
    const matchRef = doc(collection(db, 'matches'));
    const newMatch = {
      id: matchRef.id,
      ...matchData,
      status: matchData.status || 'open',
      joinedPlayersCount: matchData.joinedPlayersCount || 1,
      totalRequiredPlayers: matchData.totalRequiredPlayers || 14,
      slots: matchData.slots || {},
      createdAt: serverTimestamp(),
    };
    await setDoc(matchRef, newMatch);
    return newMatch;
  },

  async updateMatch(matchId, data) {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteMatch(matchId) {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, { status: 'deleted', deletedAt: serverTimestamp() });
  },

  // ─── KULLANICI / OYUNCU YÖNETİMİ ───
  async getUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Kullanıcıları getirme hatası:', e);
      return [];
    }
  },

  subscribeUsers(callback) {
    try {
      const q = query(collection(db, 'users'));
      return onSnapshot(q, (snap) => {
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(users);
      });
    } catch (e) {
      console.error('Kullanıcı abonelik hatası:', e);
      return () => {};
    }
  },

  async updateUser(uid, data) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async toggleUserBan(uid, currentStatus) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isBanned: !currentStatus,
      updatedAt: serverTimestamp()
    });
  },

  // ─── KULÜP YÖNETİMİ ───
  async getClubs() {
    try {
      const snap = await getDocs(collection(db, 'clubs'));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.status !== 'deleted');
    } catch (e) {
      console.error('Kulüpleri getirme hatası:', e);
      return [];
    }
  },

  subscribeClubs(callback) {
    try {
      const q = query(collection(db, 'clubs'));
      return onSnapshot(q, (snap) => {
        const clubs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.status !== 'deleted');
        callback(clubs);
      });
    } catch (e) {
      console.error('Kulüp abonelik hatası:', e);
      return () => {};
    }
  },

  async createClub(clubData) {
    const clubRef = doc(collection(db, 'clubs'));
    const newClub = {
      id: clubRef.id,
      ...clubData,
      membersCount: clubData.membersCount || 1,
      maxMembers: clubData.maxMembers || 50,
      points: clubData.points || 1000,
      level: clubData.level || 1,
      createdAt: serverTimestamp()
    };
    await setDoc(clubRef, newClub);
    return newClub;
  },

  async updateClub(clubId, data) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteClub(clubId) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, { status: 'deleted', deletedAt: serverTimestamp() });
  },

  // ─── HALISAHA / TESİS YÖNETİMİ ───
  async getPitches() {
    try {
      const snap = await getDocs(collection(db, 'pitches'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.status !== 'deleted');
      return list;
    } catch (e) {
      console.error('Halısahaları getirme hatası:', e);
      return [];
    }
  },

  subscribePitches(callback) {
    try {
      const q = query(collection(db, 'pitches'));
      return onSnapshot(q, (snap) => {
        const pitches = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.status !== 'deleted');
        callback(pitches);
      });
    } catch (e) {
      console.error('Halısaha abonelik hatası:', e);
      return () => {};
    }
  },

  async createPitch(pitchData) {
    const pitchRef = doc(collection(db, 'pitches'));
    const newPitch = {
      id: pitchRef.id,
      ...pitchData,
      rating: pitchData.rating || 5.0,
      reviewsCount: pitchData.reviewsCount || 0,
      active: true,
      createdAt: serverTimestamp()
    };
    await setDoc(pitchRef, newPitch);
    return newPitch;
  },

  async updatePitch(pitchId, data) {
    const pitchRef = doc(db, 'pitches', pitchId);
    await setDoc(pitchRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  async deletePitch(pitchId) {
    const pitchRef = doc(db, 'pitches', pitchId);
    await updateDoc(pitchRef, { status: 'deleted', deletedAt: serverTimestamp() });
  },

  // ─── KULLANICI SAHA ÖNERİLERİ & DÜZELTMELERİ ───
  async getPitchProposals() {
    try {
      const snap = await getDocs(collection(db, 'pitch_proposals'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Önerileri getirme hatası:', e);
      return [];
    }
  },

  subscribePitchProposals(callback) {
    try {
      const q = query(collection(db, 'pitch_proposals'));
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(list);
      });
    } catch (e) {
      console.error('Öneriler abonelik hatası:', e);
      return () => {};
    }
  },

  async approvePitchProposal(proposalId, pitchId, proposedData) {
    // 1. Update or create pitch in pitches collection
    const pitchRef = doc(db, 'pitches', pitchId);
    await setDoc(pitchRef, {
      ...proposedData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Mark proposal as approved
    const proposalRef = doc(db, 'pitch_proposals', proposalId);
    await updateDoc(proposalRef, {
      status: 'approved',
      resolvedAt: serverTimestamp()
    });
  },

  async rejectPitchProposal(proposalId) {
    const proposalRef = doc(db, 'pitch_proposals', proposalId);
    await updateDoc(proposalRef, {
      status: 'rejected',
      resolvedAt: serverTimestamp()
    });
  }
};
