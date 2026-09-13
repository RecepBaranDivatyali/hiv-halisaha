import React, { createContext, useContext, useState, useEffect } from 'react';

const PlayerAuthContext = createContext();

const DEFAULT_PLAYERS = [
  {
    uid: 'player_kerem',
    name: 'Kerem A.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    position: 'Sol Kanat / Forvet',
    city: 'İstanbul',
    district: 'Beşiktaş',
    rating: 4.9,
    trustScore: 98,
    level: 7,
    matchesPlayed: 34,
    wins: 26,
    goals: 42,
    clubName: 'CYBER TITANS',
    clubId: '1'
  },
  {
    uid: 'player_baris',
    name: 'Barış A.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    position: 'Sağ Kanat',
    city: 'İstanbul',
    district: 'Kadıköy',
    rating: 4.8,
    trustScore: 95,
    level: 6,
    matchesPlayed: 28,
    wins: 20,
    goals: 19,
    clubName: 'INFERNO SQUAD',
    clubId: '2'
  },
  {
    uid: 'player_kaleci',
    name: 'Volkan D.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    position: 'Kaleci (KL)',
    city: 'İstanbul',
    district: 'Şişli',
    rating: 4.95,
    trustScore: 100,
    level: 9,
    matchesPlayed: 52,
    wins: 38,
    goals: 1,
    clubName: 'ICE BREAKERS',
    clubId: '3'
  }
];

export function PlayerAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hiv_player_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PLAYERS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hiv_player_profile', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  const updateProfile = (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const switchPlayer = (playerIndex) => {
    if (DEFAULT_PLAYERS[playerIndex]) {
      setCurrentUser(DEFAULT_PLAYERS[playerIndex]);
    }
  };

  return (
    <PlayerAuthContext.Provider value={{
      currentUser,
      updateProfile,
      switchPlayer,
      availableDemoPlayers: DEFAULT_PLAYERS
    }}>
      {children}
    </PlayerAuthContext.Provider>
  );
}

export function usePlayerAuth() {
  const context = useContext(PlayerAuthContext);
  if (!context) {
    throw new Error('usePlayerAuth must be used within PlayerAuthProvider');
  }
  return context;
}
