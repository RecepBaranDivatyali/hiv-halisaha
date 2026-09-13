import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbService, MatchModel } from '@/services/dbService';

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
      // 1. Önce önbellekten hızlıca getir
      const cached = await AsyncStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        setMatches(JSON.parse(cached));
      }

      // 2. Firestore'dan güncel aktif ve geçmiş maçları çek
      const [remoteMatches, remotePast] = await Promise.all([
        dbService.getMatches(),
        dbService.getPastMatches()
      ]);

      if (remoteMatches && remoteMatches.length > 0) {
        setMatches(remoteMatches as MatchItemFull[]);
        await AsyncStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(remoteMatches));
      } else if (!cached) {
        setMatches([]);
      }

      if (remotePast) {
        setPastMatches(remotePast as MatchItemFull[]);
      }
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

      const payload: Omit<MatchModel, 'id'> = {
        arena: newMatchData.arena || 'Halı Saha',
        city: newMatchData.city || 'İstanbul',
        district: newMatchData.district || 'Merkez',
        dateTime: newMatchData.dateTime || `${newMatchData.dateStr || 'Bugün'}, ${newMatchData.timeSlot || '21:00'}`,
        mode: newMatchData.mode || '7v7',
        fee: newMatchData.fee || 150,
        totalFee: newMatchData.totalFee || 2100,
        isSubscription: !!newMatchData.isSubscription,
        organizer: userProfile?.name || 'Siz (Kaptan)',
        organizerId: userProfile?.uid || '',
        joinedPlayersCount: 1,
        totalRequiredPlayers: totalPlayers,
        status: 'active',
        slots: {
          KL_1: {
            uid: userProfile?.uid || 'host',
            name: userProfile?.name || 'Kaptan (Siz)',
            avatar: userProfile?.avatar || '',
            position: 'KL',
            paid: false,
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

  return { matches, pastMatches, addMatch, loading, reloadMatches: loadMatches };
}
