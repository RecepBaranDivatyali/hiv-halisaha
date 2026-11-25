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
  writeBatch,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

function isPlainObject(val) {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

export function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item));
  }
  if (isPlainObject(value)) {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        cleaned[key] = stripUndefined(val);
      }
    }
    return cleaned;
  }
  return value;
}

export function generateInviteCode(clubName = 'HIV') {
  const cleanPrefix =
    (clubName || 'HIV')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'HIV';
  const paddedPrefix = cleanPrefix.padEnd(3, 'X');
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${paddedPrefix}-${randSuffix}`;
}

function getTimestampMillis(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  return 0;
}

function syncPitchPriceFields(payload, fallbackObj = {}) {
  const canonicalFee =
    payload.hourlyFee ??
    payload.price ??
    payload.hourlyRateNormal ??
    payload.pricePerHour ??
    fallbackObj.hourlyFee ??
    fallbackObj.price ??
    fallbackObj.hourlyRateNormal ??
    fallbackObj.pricePerHour;

  if (canonicalFee !== undefined && canonicalFee !== null && canonicalFee !== '') {
    const numFee = Number(canonicalFee);
    if (!Number.isNaN(numFee)) {
      payload.hourlyFee = numFee;
      payload.price = numFee;
      payload.hourlyRateNormal = numFee;
      payload.pricePerHour = numFee;
    }
  }

  const canonicalSubFee =
    payload.subscriberFee ??
    payload.hourlyRateSubscriber ??
    fallbackObj.subscriberFee ??
    fallbackObj.hourlyRateSubscriber;

  if (canonicalSubFee !== undefined && canonicalSubFee !== null && canonicalSubFee !== '') {
    const numSub = Number(canonicalSubFee);
    if (!Number.isNaN(numSub)) {
      payload.subscriberFee = numSub;
      payload.hourlyRateSubscriber = numSub;
    }
  }

  return payload;
}

function removeUserFromBenchData(benchData, userId) {
  if (!benchData) return { changed: false, value: benchData };
  if (Array.isArray(benchData)) {
    const filtered = benchData.filter((item) => {
      if (!item) return false;
      if (typeof item === 'string') return item !== userId;
      return item.uid !== userId && item.id !== userId;
    });
    return { changed: filtered.length !== benchData.length, value: filtered };
  }
  if (typeof benchData === 'object') {
    let changed = false;
    const next = { ...benchData };
    for (const [k, v] of Object.entries(next)) {
      if (k === userId || (v && typeof v === 'object' && (v.uid === userId || v.id === userId))) {
        delete next[k];
        changed = true;
      }
    }
    return { changed, value: next };
  }
  return { changed: false, value: benchData };
}

export const adminDbService = {
  // ─── MAÇ YÖNETİMİ ───
  async getMatches() {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status !== 'deleted');
    } catch (e) {
      console.error('Maçları getirme hatası:', e);
      return [];
    }
  },

  subscribeMatches(callback) {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const matches = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((m) => m.status !== 'deleted');
          callback(matches);
        },
        (error) => {
          console.error('Maç abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Maç abonelik başlatma hatası:', e);
      return () => {};
    }
  },

  async createMatch(matchData) {
    const matchRef = doc(collection(db, 'matches'));
    const newMatch = stripUndefined({
      id: matchRef.id,
      ...matchData,
      status: matchData.status || 'active',
      joinedPlayersCount: matchData.joinedPlayersCount ?? 0,
      totalRequiredPlayers: matchData.totalRequiredPlayers || 14,
      slots: matchData.slots || {},
      createdAt: serverTimestamp(),
    });
    await setDoc(matchRef, newMatch);
    return newMatch;
  },

  async updateMatch(matchId, data) {
    const matchRef = doc(db, 'matches', matchId);
    const payload = stripUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(matchRef, payload);
  },

  async deleteMatch(matchId) {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, { status: 'deleted', deletedAt: serverTimestamp() });
  },

  // ─── KULLANICI / OYUNCU YÖNETİMİ ───
  async getUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.status !== 'deleted' && !u.isDeleted);
    } catch (e) {
      console.error('Kullanıcıları getirme hatası:', e);
      return [];
    }
  },

  subscribeUsers(callback) {
    try {
      const q = query(collection(db, 'users'));
      return onSnapshot(
        q,
        (snap) => {
          const users = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.status !== 'deleted' && !u.isDeleted);
          callback(users);
        },
        (error) => {
          console.error('Kullanıcı abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Kullanıcı abonelik hatası:', e);
      return () => {};
    }
  },

  async updateUser(uid, data) {
    const userRef = doc(db, 'users', uid);
    const payload = stripUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(userRef, payload);
  },

  async updateUserRole(uid, role) {
    if (role !== 'user' && role !== 'admin') {
      throw new Error('Geçersiz kullanıcı rolü: sadece "user" veya "admin" olabilir.');
    }
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp(),
    });

    // Keep dedicated admins/{uid} collection clean when demoting to user
    if (role === 'user') {
      try {
        await deleteDoc(doc(db, 'admins', uid));
      } catch {
        // Ignore if doc does not exist
      }
    }
  },

  async toggleUserBan(uid, currentStatus, banReason = '') {
    const userRef = doc(db, 'users', uid);
    const nextBanned = !currentStatus;
    const payload = stripUndefined({
      isBanned: nextBanned,
      banReason: nextBanned ? (banReason || '').trim() : '',
      updatedAt: serverTimestamp(),
    });
    await updateDoc(userRef, payload);
  },

  async deleteUser(userId) {
    // 1. Clean up club references (members array & captain/leader fields)
    try {
      const clubsSnap = await getDocs(collection(db, 'clubs'));
      const clubUpdates = [];

      clubsSnap.docs.forEach((clubDoc) => {
        const club = clubDoc.data() || {};
        if (club.status === 'deleted') return;

        const members = Array.isArray(club.members) ? club.members : [];
        const filteredMembers = members.filter((m) => {
          if (!m) return false;
          if (typeof m === 'string') return m !== userId;
          return m.uid !== userId && m.id !== userId;
        });

        const memberRemoved = filteredMembers.length !== members.length;
        const isCaptain = club.captainId === userId;
        const isLeader = club.leaderId === userId;

        if (memberRemoved || isCaptain || isLeader) {
          const updateData = {
            updatedAt: serverTimestamp(),
          };
          if (memberRemoved) {
            updateData.members = filteredMembers;
            updateData.membersCount = filteredMembers.length;
          }
          if (isCaptain) {
            updateData.captainId = '';
            updateData.captainName = 'Atanmadı';
          }
          if (isLeader) {
            updateData.leaderId = '';
          }
          clubUpdates.push({ ref: clubDoc.ref, data: updateData });
        }
      });

      for (let i = 0; i < clubUpdates.length; i += 400) {
        const batch = writeBatch(db);
        clubUpdates.slice(i, i + 400).forEach(({ ref, data }) => {
          batch.update(ref, stripUndefined(data));
        });
        await batch.commit();
      }
    } catch (clubErr) {
      console.error('Kullanıcı kulüp referans temizleme hatası:', clubErr);
    }

    // 2. Clean up match references (slots, benchA, benchB, reserves)
    try {
      const matchesSnap = await getDocs(collection(db, 'matches'));
      const matchUpdates = [];

      matchesSnap.docs.forEach((matchDoc) => {
        const match = matchDoc.data() || {};
        if (match.status === 'deleted') return;

        let changed = false;
        const updateData = {};

        const slots = match.slots || {};
        const nextSlots = { ...slots };
        for (const [slotKey, player] of Object.entries(slots)) {
          if (player && typeof player === 'object' && (player.uid === userId || player.id === userId)) {
            delete nextSlots[slotKey];
            changed = true;
          }
        }
        if (changed) {
          updateData.slots = nextSlots;
          const validCount = Object.values(nextSlots).filter(
            (v) => v && typeof v === 'object'
          ).length;
          updateData.joinedPlayersCount = validCount;
        }

        for (const benchKey of ['benchA', 'benchB', 'reserves']) {
          const res = removeUserFromBenchData(match[benchKey], userId);
          if (res.changed) {
            updateData[benchKey] = res.value;
            changed = true;
          }
        }

        if (changed) {
          updateData.updatedAt = serverTimestamp();
          matchUpdates.push({ ref: matchDoc.ref, data: updateData });
        }
      });

      for (let i = 0; i < matchUpdates.length; i += 400) {
        const batch = writeBatch(db);
        matchUpdates.slice(i, i + 400).forEach(({ ref, data }) => {
          batch.update(ref, stripUndefined(data));
        });
        await batch.commit();
      }
    } catch (matchErr) {
      console.error('Kullanıcı maç referans temizleme hatası:', matchErr);
    }

    // 3. Remove from admins/{uid} if present
    try {
      await deleteDoc(doc(db, 'admins', userId));
    } catch {
      // Ignore if not present
    }

    // 4. Mark user profile deleted, banned, and clear PII / club fields so Auth session cannot bypass ban
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: true,
      isDeleted: true,
      status: 'deleted',
      role: 'user',
      banReason: 'Hesap yönetici tarafından silindi',
      name: 'Silinen Kullanıcı',
      email: '',
      phone: deleteField(),
      avatar: deleteField(),
      clubId: deleteField(),
      clubName: deleteField(),
      clubLogo: deleteField(),
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // ─── HESAP SİLME TALEPLERİ (DELETION REQUESTS) ───
  async getDeletionRequests() {
    try {
      const snap = await getDocs(collection(db, 'deletion_requests'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
    } catch (e) {
      console.error('Silme taleplerini getirme hatası:', e);
      return [];
    }
  },

  subscribeDeletionRequests(callback) {
    try {
      const q = query(collection(db, 'deletion_requests'));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
          callback(list);
        },
        (error) => {
          console.error('Silme talepleri abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Silme talepleri abonelik hatası:', e);
      return () => {};
    }
  },

  async resolveDeletionRequest(id, status, adminNote = '') {
    const reqRef = doc(db, 'deletion_requests', id);
    const payload = stripUndefined({
      status,
      ...(adminNote ? { adminNote: adminNote.trim() } : {}),
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(reqRef, payload);
  },

  // ─── KULÜP YÖNETİMİ ───
  async getClubs() {
    try {
      const snap = await getDocs(collection(db, 'clubs'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.status !== 'deleted');
    } catch (e) {
      console.error('Kulüpleri getirme hatası:', e);
      return [];
    }
  },

  subscribeClubs(callback) {
    try {
      const q = query(collection(db, 'clubs'));
      return onSnapshot(
        q,
        (snap) => {
          const clubs = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((c) => c.status !== 'deleted');
          callback(clubs);
        },
        (error) => {
          console.error('Kulüp abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Kulüp abonelik hatası:', e);
      return () => {};
    }
  },

  async createClub(clubData) {
    const clubRef = doc(collection(db, 'clubs'));
    const members = Array.isArray(clubData.members) ? clubData.members : [];
    const membersCount =
      clubData.membersCount !== undefined ? Number(clubData.membersCount) : members.length;
    const syncedDesc = (clubData.desc ?? clubData.description ?? '').trim();

    const newClub = stripUndefined({
      id: clubRef.id,
      ...clubData,
      desc: syncedDesc,
      description: syncedDesc,
      members,
      membersCount,
      inviteCode: clubData.inviteCode || generateInviteCode(clubData.name),
      points: Number(clubData.points) || 100,
      joinPolicy: clubData.joinPolicy || 'open',
      captainId: clubData.captainId || '',
      captainName: clubData.captainName || 'H.İ.V. Yönetim',
      maxMembers: Number(clubData.maxMembers) || 50,
      level: Number(clubData.level) || 1,
      createdAt: serverTimestamp(),
    });
    await setDoc(clubRef, newClub);
    return newClub;
  },

  async updateClub(clubId, data) {
    const clubRef = doc(db, 'clubs', clubId);
    const updatePayload = { ...data };
    if (updatePayload.desc !== undefined && updatePayload.description === undefined) {
      updatePayload.description = updatePayload.desc;
    } else if (updatePayload.description !== undefined && updatePayload.desc === undefined) {
      updatePayload.desc = updatePayload.description;
    }
    await updateDoc(
      clubRef,
      stripUndefined({
        ...updatePayload,
        updatedAt: serverTimestamp(),
      })
    );
  },

  async deleteClub(clubId) {
    const clubRef = doc(db, 'clubs', clubId);
    const clubSnap = await getDoc(clubRef);

    const candidateUids = new Set();
    if (clubSnap.exists()) {
      const clubData = clubSnap.data() || {};
      const members = Array.isArray(clubData.members) ? clubData.members : [];
      members.forEach((m) => {
        if (typeof m === 'string' && m.trim()) {
          candidateUids.add(m.trim());
        } else if (m && typeof m === 'object') {
          const uid = m.uid || m.id;
          if (typeof uid === 'string' && uid.trim()) candidateUids.add(uid.trim());
        }
      });
      if (typeof clubData.captainId === 'string' && clubData.captainId.trim()) {
        candidateUids.add(clubData.captainId.trim());
      }
      if (typeof clubData.leaderId === 'string' && clubData.leaderId.trim()) {
        candidateUids.add(clubData.leaderId.trim());
      }
    }

    // Also find any user docs referencing this clubId directly
    try {
      const membersQuery = query(collection(db, 'users'), where('clubId', '==', clubId));
      const membersSnap = await getDocs(membersQuery);
      membersSnap.docs.forEach((d) => candidateUids.add(d.id));
    } catch (qErr) {
      console.warn('Kulüp üyelerini sorgulama uyarısı:', qErr);
    }

    // Verify which user docs exist before batch update
    const existingUserRefs = [];
    await Promise.all(
      Array.from(candidateUids).map(async (uid) => {
        try {
          const uRef = doc(db, 'users', uid);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            existingUserRefs.push(uRef);
          }
        } catch {
          // Skip invalid or inaccessible doc
        }
      })
    );

    // Clear club fields on member user profiles in chunks
    for (let i = 0; i < existingUserRefs.length; i += 400) {
      const batch = writeBatch(db);
      existingUserRefs.slice(i, i + 400).forEach((uRef) => {
        batch.update(uRef, {
          clubId: deleteField(),
          clubName: deleteField(),
          clubLogo: deleteField(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }

    // Finally mark club as deleted
    await updateDoc(clubRef, {
      status: 'deleted',
      members: [],
      membersCount: 0,
      deletedAt: serverTimestamp(),
    });
  },

  // ─── HALISAHA / TESİS YÖNETİMİ ───
  async getPitches() {
    try {
      const snap = await getDocs(collection(db, 'pitches'));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.status !== 'deleted');
    } catch (e) {
      console.error('Halısahaları getirme hatası:', e);
      return [];
    }
  },

  subscribePitches(callback) {
    try {
      const q = query(collection(db, 'pitches'));
      return onSnapshot(
        q,
        (snap) => {
          const pitches = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.status !== 'deleted');
          callback(pitches);
        },
        (error) => {
          console.error('Halısaha abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Halısaha abonelik hatası:', e);
      return () => {};
    }
  },

  async createPitch(pitchData) {
    const pitchRef = doc(collection(db, 'pitches'));
    const payload = syncPitchPriceFields({
      id: pitchRef.id,
      ...pitchData,
      rating: Number(pitchData.rating) || 5.0,
      reviewsCount: Number(pitchData.reviewsCount) || 0,
      active: true,
      createdAt: serverTimestamp(),
    });
    const cleaned = stripUndefined(payload);
    await setDoc(pitchRef, cleaned);
    return cleaned;
  },

  async updatePitch(pitchId, data) {
    const pitchRef = doc(db, 'pitches', pitchId);
    const updateData = syncPitchPriceFields({ ...data });
    const cleaned = stripUndefined({
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    await setDoc(pitchRef, cleaned, { merge: true });
  },

  async deletePitch(pitchId) {
    const pitchRef = doc(db, 'pitches', pitchId);
    await updateDoc(pitchRef, { status: 'deleted', deletedAt: serverTimestamp() });
  },

  // ─── KULLANICI SAHA ÖNERİLERİ & DÜZELTMELERİ ───
  async getPitchProposals() {
    try {
      const snap = await getDocs(collection(db, 'pitch_proposals'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Önerileri getirme hatası:', e);
      return [];
    }
  },

  subscribePitchProposals(callback) {
    try {
      const q = query(collection(db, 'pitch_proposals'));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(list);
        },
        (error) => {
          console.error('Öneriler abonelik hatası:', error);
        }
      );
    } catch (e) {
      console.error('Öneriler abonelik hatası:', e);
      return () => {};
    }
  },

  async approvePitchProposal(proposalId, pitchId, proposedData, proposalMeta = null) {
    const proposalRef = doc(db, 'pitch_proposals', proposalId);

    // Load proposal metadata if caller did not pass it
    let fullProposal = proposalMeta;
    if (!fullProposal) {
      const propSnap = await getDoc(proposalRef);
      fullProposal = propSnap.exists() ? propSnap.data() : {};
    }

    const originalData = fullProposal?.originalData || {};
    const targetPitchId = pitchId || fullProposal?.pitchId;
    const pitchRef = targetPitchId
      ? doc(db, 'pitches', targetPitchId)
      : doc(collection(db, 'pitches'));

    const mergedPayload = syncPitchPriceFields(
      {
        ...originalData,
        ...proposedData,
        id: pitchRef.id,
        name: proposedData?.name || originalData.name || fullProposal?.pitchName || '',
        city: proposedData?.city || originalData.city || fullProposal?.city || '',
        district: proposedData?.district || originalData.district || fullProposal?.district || '',
        active: true,
        status: 'active',
        updatedAt: serverTimestamp(),
      },
      originalData
    );

    await setDoc(pitchRef, stripUndefined(mergedPayload), { merge: true });

    await updateDoc(proposalRef, {
      status: 'approved',
      resolvedAt: serverTimestamp(),
    });
  },

  async rejectPitchProposal(proposalId) {
    const proposalRef = doc(db, 'pitch_proposals', proposalId);
    await updateDoc(proposalRef, {
      status: 'rejected',
      resolvedAt: serverTimestamp(),
    });
  },
};
