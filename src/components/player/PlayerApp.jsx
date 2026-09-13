import React, { useState, useEffect } from 'react';
import { PlayerAuthProvider } from '../../context/PlayerAuthContext';
import { PlayerLayout } from './PlayerLayout';
import { DeviceFrame } from '../simulator/DeviceFrame';
import { HomeView } from './home/HomeView';
import { MatchesView } from './matches/MatchesView';
import { ClubsView } from './clubs/ClubsView';
import { PitchesView } from './pitches/PitchesView';
import { ProfileView } from './profile/ProfileView';
import { MatchRoomModal } from './matchRoom/MatchRoomModal';
import { PlayerCreateMatchModal } from './createMatch/PlayerCreateMatchModal';
import { playerDbService } from '../../services/playerDbService';

function PlayerAppContent({ onOpenAdminPanel }) {
  const [activeTab, setActiveTab] = useState('home');
  const [matches, setMatches] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [selectedPitchForMatch, setSelectedPitchForMatch] = useState(null);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);

  // Subscribe to real-time matches
  useEffect(() => {
    const unsubMatches = playerDbService.subscribeMatches((data) => {
      setMatches(data || []);
    });

    const unsubClubs = playerDbService.subscribeClubs((data) => {
      setClubs(data || []);
    });

    return () => {
      unsubMatches();
      unsubClubs();
    };
  }, []);

  const handleOpenCreateMatch = (pitch = null) => {
    setSelectedPitchForMatch(pitch);
    setIsCreateMatchOpen(true);
  };

  return (
    <DeviceFrame
      isSimulatorMode={isSimulatorMode}
      onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
    >
      <PlayerLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateMatch={() => handleOpenCreateMatch(null)}
        onOpenAdminPanel={onOpenAdminPanel}
        isSimulatorMode={isSimulatorMode}
        onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
      >
        {activeTab === 'home' && (
          <HomeView
            matches={matches}
            clubs={clubs}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onOpenCreateMatch={() => handleOpenCreateMatch(null)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            matches={matches}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onOpenCreateMatch={() => handleOpenCreateMatch(null)}
          />
        )}

        {activeTab === 'clubs' && (
          <ClubsView
            clubs={clubs}
            onRefresh={() => playerDbService.getClubs().then(setClubs)}
          />
        )}

        {activeTab === 'pitches' && (
          <PitchesView
            onOpenCreateMatch={handleOpenCreateMatch}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView />
        )}
      </PlayerLayout>

      {/* ─── MODALS ─── */}
      <MatchRoomModal
        matchId={selectedMatch?.id}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      <PlayerCreateMatchModal
        isOpen={isCreateMatchOpen}
        onClose={() => {
          setIsCreateMatchOpen(false);
          setSelectedPitchForMatch(null);
        }}
        initialPitch={selectedPitchForMatch}
        onSuccess={() => {
          setActiveTab('matches');
        }}
      />
    </DeviceFrame>
  );
}

export function PlayerApp({ onOpenAdminPanel }) {
  return (
    <PlayerAuthProvider>
      <PlayerAppContent onOpenAdminPanel={onOpenAdminPanel} />
    </PlayerAuthProvider>
  );
}
