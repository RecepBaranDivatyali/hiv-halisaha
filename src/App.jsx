import React, { Component, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ShieldAlert, LogOut, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { auth, db } from './services/firebase';
import { verifyAdminUser } from './constants/admin';
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Panel ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#070A10] p-6 text-white">
          <div className="w-full max-w-md rounded-3xl border border-[#ff7351]/30 bg-[#0E1017] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff7351]/15 text-[#ff7351]">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-montserrat text-xl font-black text-white">
              Beklenmeyen Bir Hata Oluştu
            </h2>
            <p className="mt-2 text-xs text-white/60 leading-relaxed">
              Görünüm veya pencere işlenirken bir sorun meydana geldi. Panelin geri kalanı güvende.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 rounded-xl border border-white/5 bg-[#171A24] p-3 text-left font-mono text-[11px] text-[#ff7351] break-words">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8eff71] px-5 py-2.5 text-xs font-black uppercase text-[#064200] transition hover:brightness-110"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tekrar Dene</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10"
              >
                <span>Sayfayı Yenile</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // ─── Auth State for Admin Panel ───
  const [adminUser, setAdminUser] = useState(null);
  const [unauthorizedUser, setUnauthorizedUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (user) {
        try {
          const isAuthorized = await verifyAdminUser(user, db);
          if (!active) return;

          if (isAuthorized) {
            setAdminUser(user);
            setUnauthorizedUser(null);
          } else {
            // Do NOT auto-signOut! Same-origin PWA player session must stay intact unless user chooses to switch.
            setAdminUser(null);
            setUnauthorizedUser(user);
          }
        } catch (err) {
          console.error('Admin yetki kontrolü hatası:', err);
          if (!active) return;
          setAdminUser(null);
          setUnauthorizedUser(user);
        }
      } else {
        setAdminUser(null);
        setUnauthorizedUser(null);
      }

      setAuthLoading(false);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      setAdminUser(null);
      setUnauthorizedUser(null);
    } catch (e) {
      console.error('Çıkış hatası:', e);
    } finally {
      setSigningOut(false);
    }
  };

  const handleBackToMobileApp = () => {
    window.location.href = '/';
  };

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

  // Logged in as a regular player on the same origin -> prompt cleanly without killing their PWA session
  if (!adminUser && unauthorizedUser) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#070A10] p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#ff7351]/25 bg-[#0E1017]/95 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff7351]/30 bg-[#ff7351]/10 text-[#ff7351]">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="font-montserrat text-xl font-black text-white">
            Bu hesap yönetici yetkisine sahip değil
          </h1>
          <p className="mt-2 text-xs text-white/60 leading-relaxed">
            Şu anda <span className="font-bold text-white">{unauthorizedUser.email || 'bir oyuncu hesabı'}</span> ile oturum açık.
            Ana uygulamadaki oturumunuzu kaybetmemek için otomatik çıkış yapılmadı.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8eff71] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_25px_rgba(142,255,113,0.2)] transition hover:brightness-110 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{signingOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap ve Yönetici Hesabıyla Gir'}</span>
            </button>

            <button
              type="button"
              onClick={handleBackToMobileApp}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Uygulamaya Dön (/)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <ErrorBoundary>
        <AdminLoginPage
          onLoginSuccess={(user) => {
            setUnauthorizedUser(null);
            setAdminUser(user);
          }}
          onBackToPlayer={handleBackToMobileApp}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardContent
        adminUser={adminUser}
        onLogout={handleLogout}
        onBackToPlayer={handleBackToMobileApp}
      />
    </ErrorBoundary>
  );
}

function DashboardContent({ adminUser, onLogout, onBackToPlayer }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [pitchSubTab, setPitchSubTab] = useState('pitches');
  const [userSubTab, setUserSubTab] = useState('users');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick modals — store ID only so modal reflects live Firestore updates
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.id === selectedMatchId) || null
    : null;

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [m, u, c, p, pr, dr] = await Promise.all([
        adminDbService.getMatches(),
        adminDbService.getUsers(),
        adminDbService.getClubs(),
        adminDbService.getPitches(),
        adminDbService.getPitchProposals(),
        adminDbService.getDeletionRequests(),
      ]);
      if (m) setMatches(m);
      if (u) setUsers(u);
      if (c) setClubs(c);
      if (p) setPitches(p);
      if (pr) setProposals(pr);
      if (dr) setDeletionRequests(dr);
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real-time subscriptions only (no duplicate mount loadAllData fetch)
  useEffect(() => {
    const unsubMatches = adminDbService.subscribeMatches((newMatches) => {
      setMatches(newMatches || []);
    });

    const unsubUsers = adminDbService.subscribeUsers((newUsers) => {
      setUsers(newUsers || []);
    });

    const unsubClubs = adminDbService.subscribeClubs((newClubs) => {
      setClubs(newClubs || []);
    });

    const unsubPitches = adminDbService.subscribePitches((newPitches) => {
      setPitches(newPitches || []);
    });

    const unsubProposals = adminDbService.subscribePitchProposals((newProposals) => {
      setProposals(newProposals || []);
    });

    const unsubDeletions = adminDbService.subscribeDeletionRequests((newReqs) => {
      setDeletionRequests(newReqs || []);
    });

    return () => {
      if (unsubMatches) unsubMatches();
      if (unsubUsers) unsubUsers();
      if (unsubClubs) unsubClubs();
      if (unsubPitches) unsubPitches();
      if (unsubProposals) unsubProposals();
      if (unsubDeletions) unsubDeletions();
    };
  }, []);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
  };

  const handleNavigateToProposals = () => {
    setPitchSubTab('proposals');
    setActiveTab('pitches');
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
  };

  const handleNavigateToDeletions = () => {
    setUserSubTab('deletions');
    setActiveTab('users');
    setSearchQuery('');
    setIsMobileSidebarOpen(false);
  };

  const getPageInfo = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'GENEL BAKIŞ & ANALİTİK',
          subtitle: 'H.İ.V. Halısaha canlı operasyon ve metrik özeti',
          quickActionLabel: 'Yeni Maç Aç',
          onQuickAction: () => setIsCreateMatchOpen(true),
        };
      case 'matches':
        return {
          title: 'MAÇ YÖNETİMİ',
          subtitle: 'Halısaha maç ilanları, kadro durumları ve saatler',
          quickActionLabel: 'Yeni Maç Oluştur',
          onQuickAction: () => setIsCreateMatchOpen(true),
        };
      case 'users':
        return {
          title: 'OYUNCULAR & KULLANICILAR',
          subtitle: 'Kayıtlı futbolcu profilleri, roller, güvenilirlik ve silme talepleri',
          quickActionLabel: null,
          onQuickAction: null,
        };
      case 'clubs':
        return {
          title: 'KULÜPLER & LİG TABLOSU',
          subtitle: 'Halısaha takımları, puan durumları ve kadro limitleri',
          quickActionLabel: null,
          onQuickAction: null,
        };
      case 'pitches':
        return {
          title: 'HALISAHALAR & TESİSLER',
          subtitle: 'Anlaşmalı spor tesisleri, saatlik ücretler ve öneriler',
          quickActionLabel: null,
          onQuickAction: null,
        };
      case 'settings':
        return {
          title: 'SİSTEM AYARLARI',
          subtitle: 'Firebase bulut parametreleri ve platform kuralları',
          quickActionLabel: null,
          onQuickAction: null,
        };
      default:
        return { title: 'DASHBOARD', subtitle: '' };
    }
  };

  const pageInfo = getPageInfo();
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const pendingProposalsCount = pendingProposals.length;
  const pendingDeletions = deletionRequests.filter((r) => !r.status || r.status === 'pending');
  const pendingDeletionsCount = pendingDeletions.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A10] text-white font-sans selection:bg-[#8eff71] selection:text-[#064200]">
      {/* Left Sidebar (desktop fixed + mobile slide-over drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        counts={{
          matches: matches.length,
          users: users.length,
          clubs: clubs.length,
          pitches: pitches.length,
          pendingProposals: pendingProposalsCount,
          pendingDeletions: pendingDeletionsCount,
        }}
        adminUser={adminUser}
        onLogout={onLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          quickActionLabel={pageInfo.quickActionLabel}
          onQuickAction={pageInfo.onQuickAction}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBackToPlayer={onBackToPlayer}
          pendingProposals={pendingProposals}
          pendingProposalsCount={pendingProposalsCount}
          pendingDeletionsCount={pendingDeletionsCount}
          onNavigateToPitches={handleNavigateToProposals}
          onNavigateToDeletions={handleNavigateToDeletions}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#070A10]">
          <ErrorBoundary onReset={() => setSelectedMatchId(null)}>
            {activeTab === 'overview' && (
              <OverviewView
                matches={matches}
                users={users}
                clubs={clubs}
                pitches={pitches}
                pendingProposalsCount={pendingProposalsCount}
                onSelectMatch={(m) => setSelectedMatchId(m?.id || null)}
                onOpenCreateMatch={() => setIsCreateMatchOpen(true)}
              />
            )}

            {activeTab === 'matches' && (
              <MatchManager
                matches={matches}
                pitches={pitches}
                onRefresh={loadAllData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'users' && (
              <UserManager
                users={users}
                deletionRequests={deletionRequests}
                currentAdminUid={adminUser?.uid}
                activeSubTab={userSubTab}
                onSubTabChange={setUserSubTab}
                onRefresh={loadAllData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'clubs' && (
              <ClubManager
                clubs={clubs}
                onRefresh={loadAllData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'pitches' && (
              <PitchManager
                pitches={pitches}
                proposals={proposals}
                activeSubTab={pitchSubTab}
                onSubTabChange={setPitchSubTab}
                onRefresh={loadAllData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <ErrorBoundary onReset={() => setIsCreateMatchOpen(false)}>
        <CreateMatchModal
          isOpen={isCreateMatchOpen}
          onClose={() => setIsCreateMatchOpen(false)}
          onSuccess={loadAllData}
          pitches={pitches}
        />
      </ErrorBoundary>

      <ErrorBoundary onReset={() => setSelectedMatchId(null)}>
        <MatchDetailModal
          match={selectedMatch}
          isOpen={Boolean(selectedMatch)}
          onClose={() => setSelectedMatchId(null)}
          onUpdate={loadAllData}
        />
      </ErrorBoundary>
    </div>
  );
}
