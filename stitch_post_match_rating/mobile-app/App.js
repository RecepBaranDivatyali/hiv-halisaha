import { StatusBar } from 'expo-status-bar';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFonts, Lexend_700Bold, Lexend_900Black } from '@expo-google-fonts/lexend';
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';

SplashScreen.preventAutoHideAsync().catch(() => {});

const COLORS = {
  bg: '#0e0e0e',
  card: '#131313',
  cardHigh: '#262626',
  surfaceContainer: '#1a1919',
  text: '#ffffff',
  muted: '#adaaaa',
  primary: '#8eff71',
  primaryDim: '#2ff801',
  secondary: '#6e9bff',
  tertiary: '#88f6ff',
  error: '#ff7351',
  line: 'rgba(72, 72, 71, 0.25)',
  onPrimaryFixed: '#064200',
  outline: '#767575',
};

const CLUB_HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC3MVNrk_A5soV9sjZ6eFdSSMdjMV9NUGMkeg0JpoALuL7V0qThv1vVZV0EfYbH2y_7Ak_vJtTfyxfATi_sBpwwaYVPmswbgBqcONCXJ_puXKtL7YI08J6rNG-fbA8MiqT2oGZNBQCmcMa7Hy364Rn0UFOOw43Lqw76FVhO3yxhwjNv0VEqrxxGvC3R3BPoD4En3wmnGnmj4N4z5CvcYx8dqYnZedYSczvtTK728xHTTwVBdrzStfIw7i7i1C50n55y3vZCd8Az9dLL';

const PROFILE_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD4hbENQjPa5K4IPRbacjZSrUZHdHhNFKuHssqPfE4QQWMxCHmnb5UFSDiu5HImiXtKyoxGBVD0V6pIVjETW5LUqWy7-hdE9kl2uGTHdRMf6BTV-BgnU9KFkpQVpTT3o_FIxdHrL7MFtXDe4PkI4LXp74wyoE0IntiIJnxnoXaP0THmgCf483Q6Jgj-7_gj7_v3HvxBUsCjENNE_LrSUK0jNe02C_mjmjAzyulwh6Zc3XhD61ur2b3nR-MLrDe43Ak_N6tuURvhI0H-';

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG';

const DRAWER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOIkKOuoHcyga_G9gCECIz6NjKN0iWAfLZP-V5kNW7lInbWhWNrPwtoTf9kUMmyJRbutAvflYpwrB52iCU1wuGK4Wmx5R09TrYfjRAwl4vrWqomRB5VFfSnaDIKKjRMN71IT0dwvNFFaHrx5bpk3Op3eOC7yLEwkjz0gDfkyNyDOn2VfulCLzOJnoSGFYUifBcCHtV7osos8dkzXKQ0jF3f5sVEkvIDot2XzrqSCRsI65YG_MdJPKO8YS6LSMc9Fp_G3b89wtXCKGd';

const CAPTAIN_PITCH_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEgY_XdNWMIj9yAYPG31RfO-rUvIt9prSpOqQHShIufOnkDbrYIlyKE5OZY68gsCgDSnwxHtMW-j19KupMZmC1tNOq2QEesdu0Hh1zinr1P_g8cyWt1cHFNPGGmiuhIZPaOmTY8ssYbYKbbtC1nP9RVOEgPKgWBYWiA4E6WPsGYKqCpqU3aMljt6lAwmwmmFRefyWbWiaAfQTMPcUlEPjZEzau9MIBiNfLMhzwyqoMX1Po75F4qVfsV9hLp3_uervSUefQPNM33cr';

const TABS = [
  { key: 'Ana Sayfa', label: 'Ana Sayfa', icon: 'home', lib: 'mi' },
  { key: 'Arama', label: 'Arama', icon: 'search', lib: 'mi' },
  { key: 'Maclar', label: 'Maçlar', icon: 'soccer', lib: 'mci' },
  { key: 'Kulupler', label: 'Kulüpler', icon: 'account-group', lib: 'mci' },
  { key: 'Profil', label: 'Profil', icon: 'person', lib: 'mi' },
];

const SUB_SCREENS = new Set(['Mac Odasi', 'Mac Sonrasi']);

function tabHighlightForScreen(screen) {
  if (SUB_SCREENS.has(screen)) return 'Maclar';
  return screen;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Lexend_900Black,
    Lexend_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [stack, setStack] = useState(['Maclar']);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  const screen = stack[stack.length - 1];
  const canGoBack = stack.length > 1;
  const activeTab = tabHighlightForScreen(screen);

  const push = useCallback((name) => {
    setStack((s) => [...s, name]);
  }, []);

  const pop = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const goTab = useCallback((name) => {
    setMenuOpen(false);
    setStack([name]);
  }, []);

  const content = useMemo(() => {
    if (screen === 'Arama') return <SearchScreen goTab={goTab} />;
    if (screen === 'Mac Odasi') return <MatchRoomScreen push={push} />;
    if (screen === 'Mac Sonrasi') return <RateScreen goTab={goTab} />;
    if (screen === 'Kulupler') return <ClubsScreen />;
    if (screen === 'Profil') return <ProfileScreen />;
    if (screen === 'Ana Sayfa') return <HomeScreen goTab={goTab} />;
    return <MatchesScreen push={push} />;
  }, [screen, push, goTab]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      <AppHeader
        screen={screen}
        canGoBack={canGoBack}
        onBack={pop}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} goTab={goTab} />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>

      {screen === 'Maclar' && (
        <Pressable style={styles.fab} android_ripple={{ color: 'rgba(0,0,0,0.2)' }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGrad}
          >
            <MaterialIcons name="add" size={32} color={COLORS.onPrimaryFixed} />
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.bottomNav}>
        {TABS.map((item) => {
          const selected = activeTab === item.key;
          const iconColor = selected ? COLORS.primary : COLORS.muted;
          const Icon =
            item.lib === 'mci' ? (
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={iconColor}
              />
            ) : (
              <MaterialIcons name={item.icon} size={24} color={iconColor} />
            );
          return (
            <Pressable
              key={item.key}
              style={[styles.tabButton, selected && styles.tabButtonActive]}
              onPress={() => goTab(item.key)}
            >
              {Icon}
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function AppHeader({ screen, canGoBack, onBack, onOpenMenu }) {
  const searchHeader = screen === 'Arama' && !canGoBack;
  const fidelityMatch = screen === 'Mac Odasi' || screen === 'Mac Sonrasi';

  if (searchHeader) {
    return (
      <View style={styles.topBar}>
        <MaterialIcons name="search" size={26} color={COLORS.muted} />
        <Text style={styles.headerAramaTitle}>ARAMA</Text>
        <View style={{ width: 26 }} />
      </View>
    );
  }

  if (fidelityMatch) {
    const menuColor = screen === 'Mac Odasi' ? COLORS.primary : COLORS.muted;
    return (
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable hitSlop={12} style={styles.iconBtn} onPress={onOpenMenu}>
            <MaterialIcons name="menu" size={28} color={menuColor} />
          </Pressable>
          <Text style={styles.logo}>KINETIC NOIR</Text>
        </View>
        <Pressable hitSlop={12} style={styles.notifWrap}>
          <MaterialIcons name="notifications" size={28} color={COLORS.muted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {canGoBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={26} color={COLORS.primary} />
          </Pressable>
        ) : (
          <Pressable hitSlop={12} style={styles.iconBtn} onPress={onOpenMenu}>
            <MaterialIcons name="menu" size={28} color={COLORS.primary} />
          </Pressable>
        )}
        <Text style={styles.logo}>KINETIC NOIR</Text>
      </View>
      <Pressable hitSlop={12} style={styles.notifWrap}>
        <MaterialIcons name="notifications" size={28} color={COLORS.muted} />
        {screen === 'Kulupler' && !canGoBack ? <View style={styles.notifDot} /> : null}
      </Pressable>
    </View>
  );
}

function MenuDrawer({ visible, onClose, goTab }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Pressable style={styles.drawerDismiss} onPress={onClose} />
        <View style={styles.drawerPanel}>
          <Pressable style={styles.drawerCloseFab} onPress={onClose}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </Pressable>
          <View style={styles.drawerProfile}>
            <View style={styles.drawerAvatarWrap}>
              <Image source={{ uri: DRAWER_AVATAR }} style={styles.drawerAvatar} />
              <View style={styles.drawerProBadge}>
                <Text style={styles.drawerProText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.drawerName}>Alex Striker</Text>
            <View style={styles.drawerMetaRow}>
              <Text style={styles.drawerLevelPill}>Level 42</Text>
              <Text style={styles.drawerMember}>Kinetic Member</Text>
            </View>
          </View>
          <View style={styles.drawerNav}>
            <Pressable style={styles.drawerNavItemActive} onPress={() => { goTab('Profil'); onClose(); }}>
              <MaterialIcons name="person" size={22} color={COLORS.primary} />
              <Text style={styles.drawerNavTextActive}>Profile</Text>
            </Pressable>
            <Pressable style={styles.drawerNavItem}>
              <MaterialIcons name="settings" size={22} color={COLORS.muted} />
              <Text style={styles.drawerNavText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.drawerNavItem}>
              <MaterialIcons name="notifications" size={22} color={COLORS.muted} />
              <Text style={styles.drawerNavText}>Notifications</Text>
            </Pressable>
            <Pressable style={styles.drawerNavItem}>
              <MaterialIcons name="help-outline" size={22} color={COLORS.muted} />
              <Text style={styles.drawerNavText}>Help</Text>
            </Pressable>
          </View>
          <View style={styles.drawerFooter}>
            <Pressable style={styles.drawerLogout}>
              <Text style={styles.drawerLogoutText}>Logout</Text>
              <MaterialIcons name="logout" size={20} color={COLORS.error} />
            </Pressable>
            <Text style={styles.drawerBrand}>VOLT KINETIC</Text>
            <Text style={styles.drawerVersion}>v 2.4.0 - Engine Noir</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HomeScreen({ goTab }) {
  return (
    <View style={styles.homeWrap}>
      <Text style={styles.homeDashKicker}>ÖZET</Text>
      <Text style={styles.homeDashTitle}>Ana ekran</Text>
      <Text style={styles.homeDashSub}>
        Navigasyon menüsünden profil ve ayarlara ulaş; hızlı geçişler için alttaki sekmeleri kullan.
      </Text>
      <View style={styles.homeSkeletonRow}>
        <View style={styles.homeSkeletonTitle} />
      </View>
      <View style={styles.homeGrid2}>
        <Pressable style={styles.homeSkelCardPri} onPress={() => goTab('Maclar')} />
        <Pressable style={styles.homeSkelCard} onPress={() => goTab('Arama')} />
      </View>
      <Pressable style={styles.homeSkelBlock} onPress={() => goTab('Kulupler')} />
      <Pressable style={styles.homeSkelBlock} onPress={() => goTab('Profil')} />
      <Text style={styles.homeDashHint}>
        (Tasarım referansı: navigasyon çizimindeki ana ekran iskeleti — gri bloklar ve ızgara.)
      </Text>
    </View>
  );
}

const SEARCH_TABS = [
  { key: 'mac', label: 'Maç' },
  { key: 'oyuncu', label: 'Oyuncu' },
  { key: 'rakip', label: 'Rakip' },
];

const POS_KEYS = [
  { id: 'KL', sub: 'Kaleci' },
  { id: 'DF', sub: 'Defans' },
  { id: 'OS', sub: 'Orta Saha' },
  { id: 'FV', sub: 'Forvet' },
];

const LEVEL_OPTS = ['-3.9', '4.0-5.9', '6.0-7.9', '8.0+'];
const DIFF_OPTS = ['Eğlence', 'Düşük', 'Orta', 'Yüksek'];

function FilterDropdownRow({ kicker, value }) {
  return (
    <View style={styles.filterRow}>
      <View>
        <Text style={styles.filterKicker}>{kicker}</Text>
        <Text style={styles.filterValue}>{value}</Text>
      </View>
      <MaterialIcons name="expand-more" size={22} color={COLORS.muted} />
    </View>
  );
}

function SearchScreen({ goTab }) {
  const [tab, setTab] = useState('mac');
  const [remember, setRemember] = useState(true);
  const [pos, setPos] = useState('KL');
  const [level, setLevel] = useState('-3.9');
  const [difficulty, setDifficulty] = useState('Eğlence');

  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchTabs}>
        {SEARCH_TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.searchTabBtn, on && styles.searchTabBtnOn]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.searchTabText, on && styles.searchTabTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.searchSectionKicker}>KONUM FİLTRELERİ</Text>
      <FilterDropdownRow kicker="Şehir" value="İstanbul" />
      <FilterDropdownRow kicker="İlçe" value="Beşiktaş" />
      <FilterDropdownRow kicker="Saha" value="Powerleague" />

      {(tab === 'mac' || tab === 'oyuncu') && (
        <>
          <Text style={[styles.searchSectionKicker, styles.searchSectionSpaced]}>POZİSYON İHTİYACI</Text>
          <View style={styles.posGrid}>
            {POS_KEYS.map((p) => {
              const on = pos === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.posCell, on && styles.posCellOn]}
                  onPress={() => setPos(p.id)}
                >
                  <Text style={[styles.posId, on && styles.posIdOn]}>{p.id}</Text>
                  <Text style={[styles.posSub, on && styles.posSubOn]}>{p.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {tab === 'oyuncu' && (
        <>
          <Text style={[styles.searchSectionKicker, styles.searchSectionSpaced]}>OYUNCU SEVİYESİ</Text>
          <View style={styles.levelGrid}>
            {LEVEL_OPTS.map((lv) => {
              const on = level === lv;
              return (
                <Pressable
                  key={lv}
                  style={[styles.levelCell, on && styles.levelCellOn]}
                  onPress={() => setLevel(lv)}
                >
                  <Text style={[styles.levelText, on && styles.levelTextOn]}>{lv}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {tab === 'rakip' && (
        <>
          <Text style={[styles.searchSectionKicker, styles.searchSectionSpaced]}>ZORLUK SEVİYESİ</Text>
          <View style={styles.levelGrid}>
            {DIFF_OPTS.map((d) => {
              const on = difficulty === d;
              return (
                <Pressable
                  key={d}
                  style={[styles.levelCell, on && styles.levelCellOn]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.levelText, on && styles.levelTextOn]}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.rememberCard}>
        <View>
          <Text style={styles.rememberTitle}>AYARLARI KAYDET</Text>
          <Text style={styles.rememberSub}>Beni Hatırla</Text>
        </View>
        <Switch
          value={remember}
          onValueChange={setRemember}
          trackColor={{ false: COLORS.cardHigh, true: COLORS.primary }}
          thumbColor="#fff"
        />
      </View>

      <Pressable onPress={() => goTab('Maclar')} style={styles.searchCtaWrap}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.searchCta}
        >
          <Text style={styles.searchCtaText}>ARAMAYI BAŞLAT</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function MatchesScreen({ push }) {
  const [segment, setSegment] = useState('aktif');

  return (
    <View style={styles.matchesWrap}>
      <View style={styles.matchesHeaderRow}>
        <Text style={styles.matchesTitle}>MAÇLARIM</Text>
        <Pressable style={styles.filterButton}>
          <MaterialIcons name="tune" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <Pressable
          style={[styles.segmentBtn, segment === 'aktif' && styles.segmentBtnActive]}
          onPress={() => setSegment('aktif')}
        >
          <Text style={[styles.segmentText, segment === 'aktif' && styles.segmentTextActive]}>
            AKTİF MAÇLARIM
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, segment === 'gecmis' && styles.segmentBtnActive]}
          onPress={() => setSegment('gecmis')}
        >
          <Text style={[styles.segmentText, segment === 'gecmis' && styles.segmentTextActive]}>
            GEÇMİŞ MAÇLAR
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.matchCard, { borderLeftColor: COLORS.primary }]}
        onPress={() => push('Mac Odasi')}
      >
        <View style={styles.matchTagWrap}>
          <Text style={styles.matchTagPrimary}>KATILIYORUM</Text>
        </View>
        <View style={styles.matchRow}>
          <View style={styles.matchIconBox}>
            <MaterialCommunityIcons name="soccer" size={30} color={COLORS.primary} />
          </View>
          <View style={styles.matchTextCol}>
            <Text style={styles.matchPlace}>Beşiktaş Arena</Text>
            <Text style={styles.matchMeta}>Bugün, 21:00 • 7v7 Karma</Text>
          </View>
        </View>
        <View style={styles.matchBottom}>
          <View>
            <Text style={styles.matchState}>KADRO TAMAM</Text>
            <Text style={styles.matchInfo}>Hazırlan: 45dk kaldı</Text>
          </View>
          <View style={styles.matchAction}>
            <Text style={styles.matchActionText}>DETAY</Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={[styles.matchCard, { borderLeftColor: COLORS.secondary }]}
        onPress={() => push('Mac Odasi')}
      >
        <View style={styles.matchTagWrap}>
          <Text style={styles.matchTagSecondary}>İstek BEKLEMEDE</Text>
        </View>
        <View style={styles.matchRow}>
          <View style={styles.matchIconBox}>
            <MaterialIcons name="stadium" size={30} color={COLORS.secondary} />
          </View>
          <View style={styles.matchTextCol}>
            <Text style={styles.matchPlace}>Kadıköy Parkı</Text>
            <Text style={styles.matchMeta}>Yarın, 20:00 • 6v6 Erkek</Text>
          </View>
        </View>
        <View style={styles.matchBottom}>
          <View>
            <Text style={styles.matchState}>1 EKİSİK VAR</Text>
            <Text style={styles.matchInfo}>Seviye: Orta-İleri</Text>
          </View>
          <View style={styles.matchAction}>
            <Text style={styles.matchActionText}>DETAY</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function PitchAddSlot({ label }) {
  return (
    <View style={styles.pitchSlotCol}>
      <View style={styles.pitchDashed}>
        <MaterialIcons name="add" size={22} color="rgba(142,255,113,0.45)" />
      </View>
      {label ? <Text style={styles.pitchSlotLabel}>{label}</Text> : null}
    </View>
  );
}

function PitchFormation() {
  return (
    <View style={styles.pitchField}>
      <View style={styles.pitchFieldBorder} />
      <View style={styles.pitchMid} />
      <View style={styles.pitchCircle} />
      <Pressable style={styles.kaleDonmeli}>
        <MaterialIcons name="swap-horiz" size={16} color={COLORS.primary} />
        <Text style={styles.kaleDonmeliText}>KALE DÖNMELİ</Text>
      </Pressable>
      <View style={styles.pitchRows}>
        <View style={styles.pitchRowSingle}>
          <PitchAddSlot label="FORVET" />
        </View>
        <View style={styles.pitchRowTriple}>
          <PitchAddSlot />
          <View style={styles.pitchSlotCol}>
            <View style={styles.pitchFilled}>
              <Image source={{ uri: CAPTAIN_PITCH_IMG }} style={styles.pitchFilledImg} />
              <View style={styles.pitchNumBadge}>
                <Text style={styles.pitchNumText}>10</Text>
              </View>
            </View>
            <Text style={styles.pitchCaptainLabel}>KAPTAN</Text>
          </View>
          <PitchAddSlot />
        </View>
        <View style={styles.pitchRowDouble}>
          <PitchAddSlot />
          <PitchAddSlot />
        </View>
        <View style={styles.pitchRowSingle}>
          <PitchAddSlot label="KALECİ" />
        </View>
      </View>
    </View>
  );
}

const ROOM_PLAYERS = [
  {
    name: 'Kaptan_Sarı',
    role: 'KAPTAN • ORTA SAHA',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNzncu4O8Q9Fze38zbwjoVhAFiYVPFCsNPHDn-sVDPtFUGG8OX9JUn_mJIxVNAytLL8_qPrRgU_poFez_-cIT0S7NWnInJbxIp32ZZdU3Tzu9xo21_GMmG_MUJ4kwdTj6FxoatdzdhQ7cWRttmDPWTLqYlp2o3273KrufkpEl-QU-ig9dwfxqFKiuUdnGtLbceV0sUqS0jCrckk6uiNNlWMNdcWu-iiEZQIlh9o1w4GUX9P4UTyHsMMI0DYpOdDaTKtxb21k8apAhf',
    captain: true,
  },
  {
    name: 'Ege_Def',
    role: 'DEFANS',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4lFsV0XR6nZWh-Yz-LkjJwfk7GsSS-BSYugdoVtbu593_7FbtX4_cgRbFIzS3L75J2b3-8G6DHFbJuKj8OiPD4k2FVjKeknv2UGrTH69Wk7Ah0gv4MQJ9Vu6yvnafQVEEBQxaUXwU6fLxN5faXUl8puhH-eL5iPRSR-l6s_mPI7uFbCLcr7tRC8OhRZC3b-nGDSPAMWudV0AGFKrFQ9_pUCJYJRUdC4ODwJyvcvYixPhiy1a17jhPgmSVxj7Qo3fxzpOqNaw1kt',
  },
  {
    name: 'Hizli_Forvet',
    role: 'FORVET',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8zUJF1Saqr9vLfmCBr4mZal8zP8AG7YdNQ_Lf2JplpOnr78Db0YoR09stWCBd3EU4PCu5JipiLrx1GaYJr8_b52MaKj3NC3J_pZLpJhpXa8vnfxpsouclJZYdJ0wsntODI7Lnj3l0QUJjjWpjtRTaoqRNhG7MzslLrfaCZ-ccXxdM6WnoEetlcVuU0G0x3XSkP64nOJ5B32iF9c3wUN-NoUF9hH60ZkKko2tyY2QmOYOYlcnRzBQMMiG-W1yx8zjjM_-8LL_TnFW-',
  },
];

function MatchRoomScreen({ push }) {
  const [joinRule, setJoinRule] = useState('davet');

  return (
    <View style={styles.section}>
      <View style={styles.roomCard}>
        <View style={styles.roomCardHead}>
          <View style={styles.roomTitleRow}>
            <View style={styles.primaryBar} />
            <Text style={styles.roomTitle}>SAHA DİZİLİMİ (7V7)</Text>
          </View>
          <Pressable style={styles.macAyarlari}>
            <MaterialIcons name="settings" size={16} color={COLORS.text} />
            <Text style={styles.macAyarlariText}>MAÇ AYARLARI</Text>
          </Pressable>
        </View>

        <View style={styles.pitchWrap}>
          <PitchFormation />
        </View>

        <View style={styles.joinSplit}>
          <View style={styles.joinTerms}>
            <Text style={styles.joinTermsTitle}>MAÇA KATILMA ŞARTLARI</Text>
            <Pressable style={styles.radioRow} onPress={() => setJoinRule('davet')}>
              <View style={[styles.radioOuter, joinRule === 'davet' && styles.radioOuterOn]}>
                {joinRule === 'davet' ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>Davetle Katılma</Text>
            </Pressable>
            <Pressable style={styles.radioRow} onPress={() => setJoinRule('istek')}>
              <View style={[styles.radioOuter, joinRule === 'istek' && styles.radioOuterOn]}>
                {joinRule === 'istek' ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>İstekle Katılma</Text>
            </Pressable>
            <Pressable style={styles.radioRow} onPress={() => setJoinRule('kapali')}>
              <View style={[styles.radioOuter, joinRule === 'kapali' && styles.radioOuterOn]}>
                {joinRule === 'kapali' ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>Katılma Kapalı</Text>
            </Pressable>
          </View>
          <View style={styles.joinCtaCol}>
            <Pressable style={styles.sartlariOnayla}>
              <Text style={styles.sartlariOnaylaText}>ŞARTLARI ONAYLA</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.roomPlayersCard}>
        <View style={styles.roomPlayersHead}>
          <View style={styles.secondaryBar} />
          <Text style={styles.roomPlayersTitle}>MEVCUT OYUNCULAR</Text>
        </View>
        {ROOM_PLAYERS.map((pl) => (
          <View
            key={pl.name}
            style={[styles.roomPlayerRow, pl.captain && styles.roomPlayerRowCaptain]}
          >
            <Image source={{ uri: pl.avatar }} style={styles.roomPlayerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.roomPlayerName}>{pl.name}</Text>
              <Text style={styles.roomPlayerRole}>{pl.role}</Text>
            </View>
            {pl.captain ? (
              <MaterialIcons name="star" size={22} color={COLORS.primary} />
            ) : (
              <MaterialIcons name="logout" size={20} color={COLORS.muted} />
            )}
          </View>
        ))}
        <Text style={styles.roomPlayerCount}>3 / 14 OYUNCU KATILDI</Text>
      </View>

      <View style={styles.chatCard}>
        <View style={styles.chatHead}>
          <MaterialIcons name="chat" size={20} color={COLORS.secondary} />
          <Text style={styles.chatTitle}>MAÇ SOHBETİ</Text>
          <View style={styles.chatLiveDot} />
        </View>
        <View style={styles.chatBubbleBlock}>
          <Text style={styles.chatAuthor}>Kaptan_Sarı</Text>
          <View style={styles.chatBubble}>
            <Text style={styles.chatText}>Selam beyler, 7v7 için hazır mıyız?</Text>
          </View>
        </View>
        <View style={[styles.chatBubbleBlock, styles.chatBubbleRight]}>
          <Text style={styles.chatAuthorSecondary}>Ben</Text>
          <View style={styles.chatBubbleMine}>
            <Text style={styles.chatText}>Hazırız kaptan, dizilişi bekliyoruz.</Text>
          </View>
        </View>
        <View style={styles.chatBubbleBlock}>
          <Text style={styles.chatAuthorMuted}>Ege_Def</Text>
          <View style={styles.chatBubble}>
            <Text style={styles.chatText}>Ben defansta kalıyorum yine.</Text>
          </View>
        </View>
        <View style={styles.chatInputRow}>
          <TextInput
            placeholder="Mesaj yazın..."
            placeholderTextColor={COLORS.muted}
            style={styles.chatInput}
          />
          <Pressable style={styles.chatSend}>
            <MaterialIcons name="send" size={18} color={COLORS.onPrimaryFixed} />
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => push('Mac Sonrasi')}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roomRateCta}
        >
          <Text style={styles.roomRateCtaText}>MAÇI BİTİR VE PUANLA</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const TAGS = [
  'Paslaşmayı Seven',
  'Centilmen / Fair Play',
  'Teknik',
  'Mücadeleci',
  'Bencil',
  'Sert Oynayan',
  'Koşmuyor',
];

const PLAYER_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zN4BMEVqYUF3QeCqfMmUKmw5cBXxBSRW3VsxvUV-KXfxcfUNy6Y82Uw5RqW42gjFGsQrYA81GzfjxHDInaql-eBPtBAeWIzYvIo5IstQNOYNqQ8g3WQjb_WA4gUlWI3jtxS0-dZvcC5Az1uvxxCDgdHFIH9RwA7ZsebYxmMiF16BfI2i_Ms9TkF9YUXKDArXyw9YMuFV1_yUlUT27aKrZhO--9EpUrIuSs9PmeIxM6YUFzjuQBP3bjtPS29-G09qbUuQ9_U0i825';

function RateScreen({ goTab }) {
  const [rating, setRating] = useState(8);
  const [selected, setSelected] = useState(() => new Set(['Centilmen / Fair Play']));

  function toggleTag(t) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  return (
    <View style={styles.section}>
      <View style={styles.ratePlayerRow}>
        <View>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: PLAYER_IMG }} style={styles.avatarSq} />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>#10</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.playerName}>KEREM AKTÜRKOĞLU</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Maç Sonu Değerlendirmesi</Text>
          </View>
        </View>
      </View>

      <View style={styles.ratingCard}>
        <View style={styles.ratingCardHead}>
          <Text style={styles.ratingCardTitle}>PERFORMANS PUANI</Text>
          <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={0.5}
          value={rating}
          onValueChange={setRating}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.cardHigh}
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Kötü</Text>
          <Text style={styles.sliderLabel}>Ortalama</Text>
          <Text style={styles.sliderLabel}>Efsanevi</Text>
        </View>
      </View>

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>ÖZEL GERİ BİLDİRİM</Text>
        <View style={styles.tagWrap}>
          {TAGS.map((t) => {
            const on = selected.has(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggleTag(t)}
                style={[styles.tag, on && styles.tagOn]}
              >
                <Text style={[styles.tagText, on && styles.tagTextOn]}>{t}</Text>
                {on ? (
                  <MaterialIcons name="check-circle" size={16} color={COLORS.onPrimaryFixed} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={() => goTab('Maclar')}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitBtn}
        >
          <Text style={styles.submitBtnText}>DEĞERLENDİRMEYİ GÖNDER</Text>
          <MaterialIcons name="east" size={22} color={COLORS.onPrimaryFixed} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function ClubsScreen() {
  const [q, setQ] = useState('');
  return (
    <View style={styles.clubsWrap}>
      <Text style={styles.clubsKicker}>ELİT LİG</Text>
      <Text style={styles.clubsHero1}>KÜRESEL</Text>
      <Text style={styles.clubsHero2}>KULÜPLER</Text>
      <View style={styles.clubsStatCard}>
        <Text style={styles.clubsStatKicker}>AKTİF OYUNCULAR</Text>
        <Text style={styles.clubsStatVal}>12,482</Text>
      </View>

      <View style={styles.vanguardCard}>
        <ImageBackground source={{ uri: CLUB_HERO_IMG }} style={styles.vanguardBg} imageStyle={styles.vanguardBgImg}>
          <View style={styles.vanguardOverlay} />
          <View style={styles.vanguardInner}>
            <View style={styles.vanguardShield}>
              <MaterialIcons name="shield" size={48} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.vanguardTags}>
                <Text style={styles.vanguardTagPri}>ŞAMPİYON</Text>
                <Text style={styles.vanguardTagSec}>SEZON 04</Text>
              </View>
              <Text style={styles.vanguardName}>VANGUARD FC</Text>
              <View style={styles.vanguardGrid}>
                <View>
                  <Text style={styles.vgLabel}>KULÜP PUANI</Text>
                  <Text style={styles.vgValSecondary}>24.8K</Text>
                </View>
                <View>
                  <Text style={styles.vgLabel}>ÜYELER</Text>
                  <Text style={styles.vgVal}>48/50</Text>
                </View>
                <View>
                  <Text style={styles.vgLabel}>GALİBİYET</Text>
                  <Text style={styles.vgVal}>1.2k</Text>
                </View>
                <View>
                  <Text style={styles.vgLabel}>SEVİYE</Text>
                  <Text style={styles.vgValPrimary}>99</Text>
                </View>
              </View>
            </View>
          </View>
          <Pressable style={styles.vanguardJoinWrap}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vanguardJoin}
            >
              <Text style={styles.vanguardJoinText}>KULÜBE KATIL</Text>
              <MaterialIcons name="bolt" size={20} color={COLORS.onPrimaryFixed} />
            </LinearGradient>
          </Pressable>
        </ImageBackground>
      </View>

      <View style={styles.clubSearchWrap}>
        <MaterialIcons name="search" size={22} color={COLORS.muted} style={styles.clubSearchIcon} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Kulüp ara..."
          placeholderTextColor={COLORS.muted}
          style={styles.clubSearchInput}
        />
      </View>

      <View style={styles.clubListHead}>
        <View style={styles.clubListTitleRow}>
          <View style={styles.clubListBar} />
          <Text style={styles.clubListTitle}>ÖNE ÇIKAN KULÜPLER</Text>
        </View>
        <Pressable style={styles.filterIconBtn}>
          <MaterialIcons name="filter-list" size={22} color={COLORS.muted} />
        </Pressable>
      </View>

      <View style={styles.clubBentoCard}>
        <View style={styles.clubBentoTop}>
          <View style={styles.clubIconBoxSecondary}>
            <MaterialCommunityIcons name="rocket-launch" size={28} color={COLORS.secondary} />
          </View>
          <Text style={styles.clubRank}>#2 SIRALAMA</Text>
        </View>
        <Text style={styles.clubBentoName}>CYBER TITANS</Text>
        <Text style={styles.clubBentoDesc}>Hız ve veri odaklı elit futbol topluluğu.</Text>
        <View style={styles.clubBentoFoot}>
          <Text style={styles.clubDetailCta}>DETAYLAR</Text>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
        </View>
      </View>

      <View style={[styles.clubBentoCard, { borderLeftColor: COLORS.error }]}>
        <View style={styles.clubBentoTop}>
          <View style={[styles.clubIconBoxSecondary, { borderColor: 'rgba(255,115,81,0.3)' }]}>
            <MaterialIcons name="local-fire-department" size={28} color={COLORS.error} />
          </View>
          <Text style={styles.clubRank}>YENİ</Text>
        </View>
        <Text style={styles.clubBentoName}>INFERNO SQUAD</Text>
        <Text style={styles.clubBentoDesc}>Agresif oyun tarzı ve durdurulamaz forvetler.</Text>
        <View style={styles.clubBentoFoot}>
          <Text style={styles.clubDetailCta}>DETAYLAR</Text>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.lbHead}>
        <MaterialIcons name="leaderboard" size={22} color={COLORS.primary} />
        <Text style={styles.lbTitle}>LİDERLİK TABLOSU</Text>
      </View>
      <View style={styles.lbCard}>
        <View style={styles.lbRowHighlight}>
          <Text style={styles.lbNum}>01</Text>
          <View style={styles.lbShieldSmall}>
            <MaterialIcons name="shield" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.lbMid}>
            <Text style={styles.lbName}>VANGUARD FC</Text>
            <Text style={styles.lbMeta}>24,850 PK</Text>
          </View>
          <MaterialIcons name="trending-up" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.lbRow}>
          <Text style={styles.lbNumMuted}>02</Text>
          <View style={styles.lbIconBox}>
            <MaterialCommunityIcons name="rocket-launch" size={18} color={COLORS.secondary} />
          </View>
          <View style={styles.lbMid}>
            <Text style={[styles.lbName, styles.lbNameMuted]}>CYBER TITANS</Text>
            <Text style={styles.lbMeta}>22,120 PK</Text>
          </View>
          <MaterialIcons name="remove" size={18} color={COLORS.muted} />
        </View>
        <View style={styles.lbRow}>
          <Text style={styles.lbNumMuted}>03</Text>
          <View style={styles.lbIconBox}>
            <MaterialIcons name="stars" size={18} color={COLORS.primaryDim} />
          </View>
          <View style={styles.lbMid}>
            <Text style={[styles.lbName, styles.lbNameMuted]}>NOVA KINGS</Text>
            <Text style={styles.lbMeta}>19,400 PK</Text>
          </View>
          <MaterialIcons name="trending-down" size={18} color={COLORS.error} />
        </View>
        <View style={styles.lbRow}>
          <Text style={styles.lbNumMuted}>04</Text>
          <View style={styles.lbIconBox}>
            <MaterialIcons name="security" size={18} color={COLORS.tertiary} />
          </View>
          <View style={styles.lbMid}>
            <Text style={[styles.lbName, styles.lbNameMuted]}>IRON WALL</Text>
            <Text style={styles.lbMeta}>18,200 PK</Text>
          </View>
          <MaterialIcons name="trending-up" size={18} color={COLORS.primary} />
        </View>
        <Pressable style={styles.lbFooterBtn}>
          <Text style={styles.lbFooterBtnText}>TÜM SIRALAMAYI GÖR</Text>
        </Pressable>
      </View>

      <View style={styles.clubCreateCard}>
        <View style={styles.clubCreateInner}>
          <Text style={styles.clubCreateTitle}>KENDİ KULÜBÜNÜ KUR</Text>
          <Text style={styles.clubCreateBody}>
            Takımını topla, rakiplerini alt et ve global sıralamada yerini al.
          </Text>
          <Pressable style={styles.clubCreateCta}>
            <Text style={styles.clubCreateCtaText}>ŞİMDİ OLUŞTUR</Text>
          </Pressable>
        </View>
        <MaterialIcons name="groups" size={120} color="rgba(6,66,0,0.12)" style={styles.clubCreateWatermark} />
      </View>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.profileWrap}>
      <View style={styles.profileHero}>
        <ImageBackground source={{ uri: PROFILE_BG }} style={styles.profileHeroBg} imageStyle={styles.profileHeroBgImg}>
          <View style={styles.profileHeroFade} />
          <View style={styles.profileHeroContent}>
            <View style={styles.profileAvatarRing}>
              <Image source={{ uri: PROFILE_AVATAR }} style={styles.profileAvatar} />
              <View style={styles.profileLvlBadge}>
                <Text style={styles.profileLvlText}>LVL 42</Text>
              </View>
            </View>
            <Text style={styles.profileRole}>FORVET • SOL KANAT</Text>
            <Text style={styles.profileName}>ARDA GÜLER</Text>
            <View style={styles.profileChips}>
              <View style={styles.profileChip}>
                <MaterialIcons name="place" size={14} color={COLORS.secondary} />
                <Text style={styles.profileChipText}>İSTANBUL</Text>
              </View>
              <View style={styles.profileChip}>
                <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                <Text style={styles.profileChipText}>DOĞRULANMIŞ</Text>
              </View>
            </View>
            <View style={styles.profileScoreCard}>
              <View>
                <Text style={styles.profileScoreKicker}>GENEL PUAN</Text>
                <View style={styles.profileScoreRow}>
                  <Text style={styles.profileScoreBig}>8.7</Text>
                  <Text style={styles.profileScoreSlash}>/10</Text>
                </View>
              </View>
              <View style={styles.profileStarBox}>
                <MaterialIcons name="star" size={28} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.profileBars}>
              {[0.4, 0.6, 0.8, 0.9, 1].map((h, i) => (
                <View key={i} style={[styles.profileBar, { flex: 1, height: 36 * h }]} />
              ))}
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.warnCard}>
        <MaterialIcons name="warning" size={22} color={COLORS.error} />
        <View style={{ flex: 1 }}>
          <Text style={styles.warnTitle}>GÜVENİLİRLİK UYARISI</Text>
          <Text style={styles.warnBody}>
            Son 3 maçta 1 kez geç kaldınız. Güvenilirlik puanınız %88&apos;e düştü. Art arda 2 maçta
            sorunsuz katılım puanınızı eski haline getirir.
          </Text>
        </View>
      </View>

      <View style={styles.profileSecTitleRow}>
        <View style={styles.profileSecBar} />
        <Text style={styles.profileSecTitleText}>SEZON İSTATİSTİKLERİ</Text>
      </View>
      <View style={styles.statGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>GOL</Text>
          <Text style={styles.statValPrimary}>24</Text>
          <MaterialCommunityIcons name="soccer" size={56} color="rgba(255,255,255,0.06)" style={styles.statWatermark} />
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>ASİST</Text>
          <Text style={styles.statValSecondary}>12</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>MAÇ</Text>
          <Text style={styles.statValTertiary}>18</Text>
        </View>
        <View style={[styles.statCell, styles.statCellMvp]}>
          <Text style={styles.statLabel}>MVP</Text>
          <Text style={styles.statValWhite}>5</Text>
        </View>
      </View>

      <View style={styles.profileSecTitleRow}>
        <View style={[styles.profileSecBar, { backgroundColor: COLORS.secondary }]} />
        <Text style={styles.profileSecTitleText}>BAŞARILAR</Text>
      </View>
      <View style={styles.achieveRow}>
        <View style={styles.achievePill}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDim]} style={styles.achieveIconGrad}>
            <MaterialIcons name="bolt" size={16} color={COLORS.onPrimaryFixed} />
          </LinearGradient>
          <View>
            <Text style={styles.achieveTitle}>Haftada 3+ Maç</Text>
            <Text style={styles.achieveSub}>Kondisyon Canavari</Text>
          </View>
        </View>
        <View style={styles.achievePill}>
          <View style={[styles.achieveIconGrad, { backgroundColor: COLORS.secondary }]}>
            <MaterialIcons name="calendar-today" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.achieveTitle}>100 Maç Ayarlama</Text>
            <Text style={styles.achieveSub}>Sadık Organizatör</Text>
          </View>
        </View>
      </View>

      <View style={styles.lastMatchesHead}>
        <Text style={styles.profileSecTitlePlain}>SON MACLAR</Text>
        <Text style={styles.lastMatchesLink}>TÜMÜNÜ GÖR</Text>
      </View>
      <View style={styles.lastMatchRow}>
        <View style={[styles.lastMatchStripe, { backgroundColor: COLORS.primary }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.lastMatchMeta}>12 OCAK • KAMPUS ARENA</Text>
          <Text style={styles.lastMatchTitle}>FC SHARDS VS DARK KNIGHTS</Text>
        </View>
        <View style={styles.lastMatchScoreCol}>
          <Text style={styles.lastMatchScoreLbl}>SKOR</Text>
          <Text style={styles.lastMatchScore}>5 - 2</Text>
        </View>
        <View style={styles.thumbBox}>
          <MaterialIcons name="thumb-up" size={18} color={COLORS.primary} />
        </View>
      </View>
      <View style={styles.lastMatchRow}>
        <View style={[styles.lastMatchStripe, { backgroundColor: COLORS.error }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.lastMatchMeta}>08 OCAK • OLYMPIC TURF</Text>
          <Text style={styles.lastMatchTitle}>CITY BOYS VS FC SHARDS</Text>
        </View>
        <View style={styles.lastMatchScoreCol}>
          <Text style={styles.lastMatchScoreLbl}>SKOR</Text>
          <Text style={[styles.lastMatchScore, { color: COLORS.error }]}>1 - 4</Text>
        </View>
        <View style={styles.thumbBox}>
          <MaterialIcons name="thumb-down" size={18} color={COLORS.error} />
        </View>
      </View>
    </View>
  );
}

function ActionCard({ title, description, cta = 'Ac', onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{cta}</Text>
      </View>
    </Pressable>
  );
}

function InfoCard({ text }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#101010',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 2 },
  logo: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  page: { padding: 16, paddingBottom: 120 },
  section: { gap: 12 },
  matchesWrap: { gap: 14 },
  matchesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  matchesTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 36,
    fontStyle: 'italic',
    letterSpacing: -1.2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 6,
    flexDirection: 'row',
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.cardHigh,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  segmentText: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  segmentTextActive: { color: COLORS.primary },
  matchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  matchTextCol: { flex: 1, minWidth: 0 },
  matchTagWrap: { position: 'absolute', top: 12, right: 12 },
  matchTagPrimary: {
    backgroundColor: 'rgba(142,255,113,0.2)',
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  matchTagSecondary: {
    backgroundColor: 'rgba(110,155,255,0.2)',
    color: COLORS.secondary,
    fontFamily: 'Lexend_900Black',
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  matchIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPlace: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 17,
    textTransform: 'uppercase',
  },
  matchMeta: { color: COLORS.muted, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  matchBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  matchState: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  matchInfo: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  matchAction: {
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.45)',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
  },
  matchActionText: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
  },
  rateBanner: {
    marginTop: 4,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(142,255,113,0.35)',
  },
  rateBannerTitle: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  rateBannerSub: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: 6 },
  screenTitle: { color: COLORS.text, fontFamily: 'Lexend_900Black', fontSize: 26 },
  subtitle: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 14, marginBottom: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTextWrap: { flex: 1, gap: 4 },
  cardTitle: { color: COLORS.text, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  cardDesc: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 18 },
  cta: {
    backgroundColor: COLORS.cardHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaText: { color: COLORS.primary, fontFamily: 'Lexend_700Bold', fontSize: 12 },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  infoText: { color: COLORS.text, fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  roomCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.15)',
  },
  roomCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(72,72,71,0.12)',
  },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBar: { width: 4, height: 22, backgroundColor: COLORS.primary, borderRadius: 2 },
  roomTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  macAyarlari: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  macAyarlariText: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  pitchWrap: { paddingHorizontal: 12, paddingBottom: 12 },
  pitchField: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    aspectRatio: 4 / 3,
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(142,255,113,0.2)',
    overflow: 'hidden',
  },
  pitchFieldBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 14,
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.1)',
    borderRadius: 6,
  },
  pitchMid: {
    position: 'absolute',
    left: '50%',
    top: 14,
    bottom: 14,
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(142,255,113,0.1)',
  },
  pitchCircle: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.1)',
    left: '50%',
    top: '50%',
    marginLeft: -64,
    marginTop: -64,
  },
  kaleDonmeli: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(142,255,113,0.35)',
  },
  kaleDonmeliText: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  pitchRows: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  pitchRowSingle: { flexDirection: 'row', justifyContent: 'center' },
  pitchRowDouble: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 28 },
  pitchRowTriple: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 12 },
  pitchSlotCol: { alignItems: 'center', width: 64 },
  pitchDashed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.4)',
    backgroundColor: 'rgba(38,38,38,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchFilled: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(142,255,113,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  pitchFilledImg: { width: '100%', height: '100%' },
  pitchNumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchNumText: { color: COLORS.onPrimaryFixed, fontFamily: 'Lexend_700Bold', fontSize: 10 },
  pitchSlotLabel: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  pitchCaptainLabel: {
    marginTop: 4,
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  joinSplit: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: 'rgba(72,72,71,0.12)',
  },
  joinTerms: { padding: 18, flex: 1 },
  joinTermsTitle: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  radioLine: { color: COLORS.text, fontFamily: 'Manrope_600SemiBold', fontSize: 14, marginBottom: 6 },
  radioLineMuted: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 14, marginBottom: 6 },
  ratePlayerRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 8 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.2)',
  },
  avatarSq: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.2)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  avatarBadgeText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 13,
    fontStyle: 'italic',
  },
  playerName: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  liveLabel: {
    color: COLORS.muted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  ratingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 22,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginTop: 8,
  },
  ratingCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  ratingCardTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  ratingBig: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 48,
    fontStyle: 'italic',
    lineHeight: 48,
  },
  slider: { width: '100%', height: 36 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 22,
    marginTop: 12,
  },
  feedbackTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.35)',
  },
  tagOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
  },
  tagTextOn: { color: COLORS.onPrimaryFixed },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  submitBtnText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 16,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(142,255,113,0.25)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  fabGrad: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(72,72,71,0.15)',
    minHeight: 80,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabButtonActive: { backgroundColor: '#131313' },
  tabLabel: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: COLORS.primary, fontFamily: 'Lexend_900Black' },
  tabIconFilled: { opacity: 1 },

  headerAramaTitle: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 20,
    letterSpacing: 1,
  },
  notifWrap: { position: 'relative', padding: 2 },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },

  homeWrap: { gap: 16 },
  homeDashKicker: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 3,
  },
  homeDashTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 28,
    fontStyle: 'italic',
  },
  homeDashSub: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 21 },
  homeSkeletonRow: { marginTop: 8 },
  homeSkeletonTitle: {
    height: 30,
    width: 180,
    backgroundColor: COLORS.cardHigh,
    borderRadius: 6,
  },
  homeGrid2: { flexDirection: 'row', gap: 14, marginTop: 8 },
  homeSkelCardPri: {
    flex: 1,
    height: 150,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  homeSkelCard: {
    flex: 1,
    height: 150,
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  homeSkelBlock: {
    height: 200,
    backgroundColor: COLORS.cardHigh,
    borderRadius: 14,
    marginTop: 12,
  },
  homeDashHint: {
    color: COLORS.muted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    opacity: 0.75,
  },

  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawerDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)' },
  drawerPanel: {
    width: '84%',
    maxWidth: 320,
    alignSelf: 'stretch',
    backgroundColor: COLORS.bg,
    paddingTop: 48,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(72,72,71,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 0 },
  },
  drawerCloseFab: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerProfile: { paddingHorizontal: 12, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(72,72,71,0.1)' },
  drawerAvatarWrap: { position: 'relative', alignSelf: 'flex-start' },
  drawerAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardHigh,
  },
  drawerProBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  drawerProText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 9,
    fontStyle: 'italic',
  },
  drawerName: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    marginTop: 12,
  },
  drawerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  drawerLevelPill: {
    backgroundColor: COLORS.cardHigh,
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  drawerMember: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drawerNav: { flexGrow: 1, paddingVertical: 20, gap: 4 },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  drawerNavItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  drawerNavText: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerNavTextActive: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerFooter: { marginTop: 'auto', paddingBottom: 28, paddingHorizontal: 12 },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,115,81,0.25)',
  },
  drawerLogoutText: {
    color: COLORS.error,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerBrand: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 28,
    opacity: 0.35,
  },
  drawerVersion: {
    color: COLORS.outline,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
  },

  searchWrap: { gap: 12, paddingBottom: 24 },
  searchTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardHigh,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  searchTabBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  searchTabBtnOn: { backgroundColor: COLORS.primary },
  searchTabText: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
  },
  searchTabTextOn: { color: COLORS.onPrimaryFixed },
  searchSectionKicker: {
    color: COLORS.primaryDim,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.9,
    marginTop: 8,
  },
  searchSectionSpaced: { marginTop: 20 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.2)',
  },
  filterKicker: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  filterValue: { color: COLORS.text, fontFamily: 'Manrope_600SemiBold', fontSize: 16, marginTop: 4 },
  posGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  posCell: {
    width: '22%',
    aspectRatio: 1,
    minWidth: 72,
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posCellOn: {
    backgroundColor: 'rgba(142,255,113,0.12)',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  posId: { color: COLORS.text, fontFamily: 'Lexend_900Black', fontSize: 18 },
  posIdOn: { color: COLORS.primary },
  posSub: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 7,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  posSubOn: { color: COLORS.primary },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelCell: {
    width: '47%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.25)',
    alignItems: 'center',
  },
  levelCellOn: {
    backgroundColor: 'rgba(142,255,113,0.12)',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  levelText: { color: COLORS.text, fontFamily: 'Lexend_700Bold', fontSize: 13, textTransform: 'uppercase' },
  levelTextOn: { color: COLORS.primary },
  rememberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  rememberTitle: { color: COLORS.text, fontFamily: 'Lexend_700Bold', fontSize: 14 },
  rememberSub: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 12, marginTop: 4 },
  searchCtaWrap: { marginTop: 16 },
  searchCta: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  searchCtaText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 16,
    letterSpacing: 2,
  },

  secondaryBar: { width: 4, height: 20, backgroundColor: COLORS.secondary, borderRadius: 2 },
  joinCtaCol: { paddingHorizontal: 18, paddingBottom: 18 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: { color: COLORS.muted, fontFamily: 'Manrope_600SemiBold', fontSize: 14, flex: 1 },
  sartlariOnayla: {
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: COLORS.cardHigh,
    borderWidth: 1,
    borderColor: 'rgba(142,255,113,0.35)',
    alignItems: 'center',
  },
  sartlariOnaylaText: { color: COLORS.primary, fontFamily: 'Lexend_700Bold', fontSize: 15 },
  roomPlayersCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.12)',
    overflow: 'hidden',
  },
  roomPlayersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(72,72,71,0.12)',
  },
  roomPlayersTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  roomPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardHigh,
  },
  roomPlayerRowCaptain: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  roomPlayerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card },
  roomPlayerName: { color: COLORS.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  roomPlayerRole: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  roomPlayerCount: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(72,72,71,0.12)',
  },
  chatCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.12)',
    paddingBottom: 10,
    minHeight: 220,
  },
  chatHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(72,72,71,0.12)',
  },
  chatTitle: { color: COLORS.text, fontFamily: 'Lexend_700Bold', fontSize: 13, flex: 1 },
  chatLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  chatBubbleBlock: { paddingHorizontal: 12, paddingTop: 10 },
  chatBubbleRight: { alignItems: 'flex-end' },
  chatAuthor: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  chatAuthorSecondary: {
    color: COLORS.secondary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    marginBottom: 4,
    marginRight: 4,
  },
  chatAuthorMuted: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  chatBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: COLORS.cardHigh,
    padding: 10,
    borderRadius: 10,
    borderTopLeftRadius: 2,
  },
  chatBubbleMine: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: 'rgba(110,155,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(110,155,255,0.25)',
    padding: 10,
    borderRadius: 10,
    borderTopRightRadius: 2,
  },
  chatText: { color: COLORS.text, fontFamily: 'Manrope_400Regular', fontSize: 12 },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.cardHigh,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
  },
  chatSend: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomRateCta: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  roomRateCtaText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 14,
    letterSpacing: 1,
  },

  clubsWrap: { gap: 14 },
  clubsKicker: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 4,
  },
  clubsHero1: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    lineHeight: 38,
  },
  clubsHero2: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    lineHeight: 38,
  },
  clubsStatCard: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  clubsStatKicker: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  clubsStatVal: { color: COLORS.text, fontFamily: 'Lexend_900Black', fontSize: 26, marginTop: 4 },
  vanguardCard: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  vanguardBg: { minHeight: 280 },
  vanguardBgImg: { borderRadius: 14 },
  vanguardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,14,14,0.75)',
  },
  vanguardInner: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    alignItems: 'center',
  },
  vanguardShield: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vanguardTags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  vanguardTagPri: {
    backgroundColor: COLORS.primary,
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  vanguardTagSec: {
    backgroundColor: COLORS.cardHigh,
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    letterSpacing: 1,
  },
  vanguardName: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 28,
    fontStyle: 'italic',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  vanguardGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  vgLabel: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  vgVal: { color: COLORS.text, fontFamily: 'Lexend_900Black', fontSize: 20, marginTop: 2 },
  vgValSecondary: { color: COLORS.secondary, fontFamily: 'Lexend_900Black', fontSize: 20, marginTop: 2 },
  vgValPrimary: { color: COLORS.primary, fontFamily: 'Lexend_900Black', fontSize: 20, marginTop: 2 },
  vanguardJoinWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  vanguardJoin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  vanguardJoinText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 13,
    letterSpacing: 2,
  },
  clubSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.35)',
    paddingHorizontal: 12,
  },
  clubSearchIcon: { marginRight: 4 },
  clubSearchInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    paddingVertical: 12,
  },
  clubListHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  clubListTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clubListBar: { width: 4, height: 28, backgroundColor: COLORS.primary },
  clubListTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    letterSpacing: 2,
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubBentoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#0f6df3',
  },
  clubBentoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  clubIconBoxSecondary: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(110,155,255,0.2)',
  },
  clubRank: { color: COLORS.muted, fontFamily: 'Lexend_700Bold', fontSize: 10 },
  clubBentoName: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  clubBentoDesc: {
    color: COLORS.muted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  clubBentoFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  clubDetailCta: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },
  lbHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  lbTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 16,
    letterSpacing: 2,
  },
  lbCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  lbRowHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(142,255,113,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 12,
  },
  lbNum: { color: COLORS.primary, fontFamily: 'Lexend_900Black', fontSize: 22, fontStyle: 'italic', width: 36 },
  lbNumMuted: { color: COLORS.muted, fontFamily: 'Lexend_900Black', fontSize: 18, width: 36 },
  lbShieldSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  lbName: { color: COLORS.text, fontFamily: 'Manrope_700Bold', fontSize: 14 },
  lbMeta: { color: COLORS.muted, fontFamily: 'Lexend_700Bold', fontSize: 10, marginTop: 2 },
  lbMid: { flex: 1 },
  lbIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbNameMuted: { color: COLORS.muted },
  lbFooterBtn: { paddingVertical: 16, alignItems: 'center' },
  lbFooterBtnText: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },
  clubCreateCard: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  clubCreateInner: { zIndex: 1, maxWidth: 280 },
  clubCreateTitle: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  clubCreateBody: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
    opacity: 0.95,
  },
  clubCreateCta: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: COLORS.onPrimaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clubCreateCtaText: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 10,
    letterSpacing: 2,
  },
  clubCreateWatermark: { position: 'absolute', bottom: -16, right: -16 },

  profileWrap: { gap: 14 },
  profileHero: { borderRadius: 14, overflow: 'hidden', minHeight: 420 },
  profileHeroBg: { width: '100%', minHeight: 420, justifyContent: 'flex-end' },
  profileHeroBgImg: { opacity: 0.35 },
  profileHeroFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,14,14,0.88)',
  },
  profileHeroContent: { padding: 20, alignItems: 'center' },
  profileAvatarRing: { position: 'relative', marginBottom: 12 },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardHigh,
  },
  profileLvlBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  profileLvlText: {
    color: COLORS.onPrimaryFixed,
    fontFamily: 'Lexend_900Black',
    fontSize: 12,
    fontStyle: 'italic',
  },
  profileRole: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  profileName: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 32,
    fontStyle: 'italic',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  profileChips: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  profileChipText: { color: COLORS.text, fontFamily: 'Lexend_700Bold', fontSize: 10, letterSpacing: 1 },
  profileScoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 300,
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(26,25,25,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(142,255,113,0.2)',
  },
  profileScoreKicker: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 2,
  },
  profileScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  profileScoreBig: { color: COLORS.text, fontFamily: 'Lexend_900Black', fontSize: 52, lineHeight: 52 },
  profileScoreSlash: { color: COLORS.primary, fontFamily: 'Lexend_700Bold', fontSize: 22 },
  profileStarBox: {
    backgroundColor: 'rgba(142,255,113,0.2)',
    padding: 10,
    borderRadius: 10,
  },
  profileBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    width: '100%',
    maxWidth: 300,
    marginTop: 10,
    height: 40,
  },
  profileBar: {
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    alignSelf: 'flex-end',
    opacity: 0.9,
  },
  warnCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(185,41,2,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,115,81,0.25)',
  },
  warnTitle: {
    color: COLORS.error,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  warnBody: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: 6, lineHeight: 19 },
  profileSecTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  profileSecBar: { width: 4, height: 22, backgroundColor: COLORS.primary, borderRadius: 2 },
  profileSecTitleText: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 18,
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  profileSecTitlePlain: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 18,
    fontStyle: 'italic',
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: {
    width: '47%',
    minHeight: 110,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  statCellMvp: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  statLabel: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },
  statValPrimary: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    zIndex: 1,
  },
  statValSecondary: {
    color: COLORS.secondary,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    zIndex: 1,
  },
  statValTertiary: {
    color: COLORS.tertiary,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    zIndex: 1,
  },
  statValWhite: {
    color: COLORS.text,
    fontFamily: 'Lexend_900Black',
    fontSize: 40,
    fontStyle: 'italic',
    zIndex: 1,
  },
  statWatermark: { position: 'absolute', right: -8, bottom: -8 },
  achieveRow: { gap: 10 },
  achievePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardHigh,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.2)',
  },
  achieveIconGrad: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveTitle: { color: COLORS.text, fontFamily: 'Lexend_700Bold', fontSize: 12 },
  achieveSub: { color: COLORS.muted, fontFamily: 'Manrope_400Regular', fontSize: 10, marginTop: 2 },
  lastMatchesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  lastMatchesLink: {
    color: COLORS.primary,
    fontFamily: 'Lexend_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142,255,113,0.35)',
    paddingBottom: 2,
  },
  lastMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  lastMatchStripe: { width: 4, alignSelf: 'stretch' },
  lastMatchMeta: {
    color: COLORS.muted,
    fontFamily: 'Lexend_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 10,
    marginLeft: 12,
  },
  lastMatchTitle: {
    color: COLORS.text,
    fontFamily: 'Lexend_700Bold',
    fontSize: 13,
    marginLeft: 12,
    marginBottom: 10,
  },
  lastMatchScoreCol: { alignItems: 'center', paddingHorizontal: 10 },
  lastMatchScoreLbl: { color: COLORS.muted, fontFamily: 'Lexend_700Bold', fontSize: 10 },
  lastMatchScore: {
    color: COLORS.primary,
    fontFamily: 'Lexend_900Black',
    fontSize: 18,
    fontStyle: 'italic',
    marginTop: 2,
  },
  thumbBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.cardHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
