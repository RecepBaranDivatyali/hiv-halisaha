import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/overview/OverviewView';
import { MatchManager } from './components/matches/MatchManager';
import { UserManager } from './components/users/UserManager';
import { ClubManager } from './components/clubs/ClubManager';
import { PitchManager } from './components/pitches/PitchManager';
import { SettingsView } from './components/settings/SettingsView';
import { CreateMatchModal } from './components/matches/CreateMatchModal';
import { MatchDetailModal } from './components/matches/MatchDetailModal';
import { adminDbService } from './services/adminDbService';

export default function App() {
  // ─── Auth State for Admin Panel ───
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdminUser(null);
    } catch (e) {
      console.error('Çıkış hatası:', e);
    }
  };

  const handleBackToMobileApp = () => {
    window.location.href = '/';
  };

  // ─── YÖNETİCİ PANELİ (GİRİŞ KORUMALI) ───
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070A10]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8eff71]/20 border-t-[#8eff71]" />
          <p className="text-xs font-bold text-white/40">Yönetici oturumu doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLoginPage
        onLoginSuccess={(user) => setAdminUser(user)}
        onBackToPlayer={handleBackToMobileApp}
      />
    );
  }

  return (
    <DashboardContent
      adminUser={adminUser}
      onLogout={handleLogout}
      onBackToPlayer={handleBackToMobileApp}
    />
  );
}

function DashboardContent({ adminUser, onLogout, onBackToPlayer }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick modals
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [m, u, c, p] = await Promise.all([
        adminDbService.getMatches(),
        adminDbService.getUsers(),
        adminDbService.getClubs(),
        adminDbService.getPitches()
      ]);
      if (m) setMatches(m);
      if (u) setUsers(u);
      if (c) setClubs(c);
      if (p) setPitches(p);
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const unsubMatches = adminDbService.subscribeMatches((newMatches) => {
      setMatches(newMatches || []);
    });

    const unsubUsers = adminDbService.subscribeUsers((newUsers) => {
      setUsers(newUsers || []);
    });

    const unsubClubs = adminDbService.subscribeClubs((newClubs) => {
      setClubs(newClubs || []);
    });

    return () => {
      if (unsubMatches) unsubMatches();
      if (unsubUsers) unsubUsers();
      if (unsubClubs) unsubClubs();
    };
  }, []);

  const getPageInfo = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'GENEL BAKIŞ & ANALİTİK',
          subtitle: 'H.İ.V. Halısaha canlı operasyon ve metrik özeti',
          quickActionLabel: 'Yeni Maç Aç',
          onQuickAction: () => setIsCreateMatchOpen(true)
        };
      case 'matches':
        return {
          title: 'MAÇ YÖNETİMİ',
          subtitle: 'Halısaha maç ilanları, kadro durumları ve saatler',
          quickActionLabel: 'Yeni Maç Oluştur',
          onQuickAction: () => setIsCreateMatchOpen(true)
        };
      case 'users':
        return {
          title: 'OYUNCULAR & KULLANICILAR',
          subtitle: 'Kayıtlı futbolcu profilleri, istatistikler ve güvenilirlik puanları',
          quickActionLabel: null,
          onQuickAction: null
        };
      case 'clubs':
        return {
          title: 'KULÜPLER & LİG TABLOSU',
          subtitle: 'Halısaha takımları, puan durumları ve kadro limitleri',
          quickActionLabel: null,
          onQuickAction: null
        };
      case 'pitches':
        return {
          title: 'HALISAHALAR & TESİSLER',
          subtitle: 'Anlaşmalı spor tesisleri, saatlik ücretler ve puanlar',
          quickActionLabel: null,
          onQuickAction: null
        };
      case 'settings':
        return {
          title: 'SİSTEM AYARLARI',
          subtitle: 'Firebase bulut parametreleri ve platform kuralları',
          quickActionLabel: null,
          onQuickAction: null
        };
      default:
        return { title: 'DASHBOARD', subtitle: '' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A10] text-white font-sans selection:bg-[#8eff71] selection:text-[#064200]">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          matches: matches.length,
          users: users.length,
          clubs: clubs.length,
          pitches: pitches.length
        }}
        adminUser={adminUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          quickActionLabel={pageInfo.quickActionLabel}
          onQuickAction={pageInfo.onQuickAction}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onBackToPlayer={onBackToPlayer}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#070A10]">
          {activeTab === 'overview' && (
            <OverviewView
              matches={matches}
              users={users}
              clubs={clubs}
              pitches={pitches}
              onSelectMatch={(m) => setSelectedMatch(m)}
              onOpenCreateMatch={() => setIsCreateMatchOpen(true)}
            />
          )}

          {activeTab === 'matches' && (
            <MatchManager
              matches={matches}
              pitches={pitches}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'users' && (
            <UserManager
              users={users}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'clubs' && (
            <ClubManager
              clubs={clubs}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'pitches' && (
            <PitchManager
              pitches={pitches}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <CreateMatchModal
        isOpen={isCreateMatchOpen}
        onClose={() => setIsCreateMatchOpen(false)}
        onSuccess={loadAllData}
        pitches={pitches}
      />

      <MatchDetailModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onUpdate={loadAllData}
      />
    </div>
  );
}
