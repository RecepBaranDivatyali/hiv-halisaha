import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Alert, Platform, Linking, ScrollView } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/context/ThemeContext';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onOpenGuide?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, onOpenGuide }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(visible);
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setIsOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setIsOpen(false);
      });
    }
  }, [visible]);

  const menuItems = [
    { label: 'PROFİL', icon: 'person', route: '/(tabs)/profile', active: pathname?.includes('profile') },
    { label: 'NASIL KULLANILIR?', icon: 'help', action: 'guide' },
    { label: 'AYARLAR', icon: 'settings', route: '/settings', active: pathname?.includes('settings') },
    { label: 'YÖNETİCİ PANELİ', icon: 'admin-panel-settings', action: 'admin' },
    { label: 'BİLDİRİMLER', icon: 'notifications', route: null, soon: true },
  ];

  const handleNavigate = (item: typeof menuItems[0]) => {
    if (item.action === 'guide') {
      onClose();
      if (onOpenGuide) onOpenGuide();
      return;
    }
    if (item.action === 'admin') {
      onClose();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/admin';
      } else {
        Linking.openURL('https://hiv-halisaha.vercel.app/admin');
      }
      return;
    }
    if (item.soon) {
      Alert.alert('Yakında!', 'Bu özellik yakında eklenecek.', [{ text: 'Tamam' }]);
      return;
    }
    if (item.route) {
      router.push(item.route as any);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Fullscreen Backdrop (Dark Veil) */}
        <Animated.View style={[styles.backdropWrapper, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose} 
            accessibilityLabel="Menüyü Kapat"
          />
        </Animated.View>

        {/* Drawer Slides Smoothly from LEFT */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            contentContainerStyle={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View>
              {/* Close Button */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Kapat">
                  <MaterialIcons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* User Profile */}
              <View style={styles.profileSection}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarBorder}>
                    <Image 
                      source={{ uri: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG' }} 
                      style={styles.avatar} 
                    />
                  </View>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                </View>
                <View style={styles.profileText}>
                  <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Kullanıcı'}</Text>
                  <View style={styles.levelRow}>
                    <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>{user?.level || 'Amatör'}</Text></View>
                    <Text style={styles.memberText}>H.İ.V. MENTER</Text>
                  </View>
                </View>
              </View>

              {/* Navigation */}
              <View style={styles.nav}>
                {menuItems.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.navItem, item.active && { backgroundColor: theme.surface, borderLeftWidth: 3, borderLeftColor: theme.primary }]}
                    onPress={() => handleNavigate(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={18} 
                      color={item.active || item.action === 'guide' ? theme.primary : theme.textMuted} 
                    />
                    <Text style={[styles.navLabel, { color: item.active || item.action === 'guide' ? theme.primary : theme.textMuted }]}>
                      {item.label}
                    </Text>
                    {item.soon && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>YAKINDA</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
                try {
                  await logout();
                  onClose();
                  router.replace('/login');
                } catch {
                  Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
                }
              }} activeOpacity={0.8}>
                <Text style={styles.logoutLabel}>ÇIKIŞ YAP</Text>
                <MaterialIcons name="logout" size={18} color={theme.error} />
              </TouchableOpacity>
              
              <View style={styles.brandRow}>
                <Text style={styles.brandNoir}>H.İ.V.</Text>
                <Text style={styles.version}>v1.0.0 — Halısahaya İhtiyacım Var</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    position: 'relative',
  },
  backdropWrapper: { 
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawer: { 
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 270, 
    maxWidth: '75%', 
    height: '100%', 
    backgroundColor: theme.background,
    borderRightWidth: 1,
    borderRightColor: `${theme.border}33`,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  header: { paddingHorizontal: 16, alignItems: 'flex-end', marginBottom: 6, marginTop: 4 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceContainerHighest },
  profileSection: { paddingHorizontal: 16, marginBottom: 14 },
  avatarWrapper: { position: 'relative', width: 54, height: 54, marginBottom: 8 },
  avatarBorder: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, padding: 2, borderColor: theme.primary },
  avatar: { width: '100%', height: '100%', borderRadius: 25 },
  proBadge: { position: 'absolute', bottom: -2, right: -2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, backgroundColor: theme.primary },
  proBadgeText: { color: '#000', fontSize: 8, fontFamily: Fonts.headlineBold, fontStyle: 'italic' },
  profileText: { gap: 2 },
  userName: { fontSize: 16, fontFamily: Fonts.headlineBold, letterSpacing: -0.3, color: theme.text },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  levelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.surfaceContainerHighest },
  levelBadgeText: { fontSize: 9, fontFamily: Fonts.headlineBold, color: theme.primary },
  memberText: { fontSize: 8, fontFamily: Fonts.headlineBold, letterSpacing: 0.8, color: theme.textMuted },
  nav: { 
    paddingVertical: 6, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderTopColor: theme.borderSubtle, 
    borderBottomColor: theme.borderSubtle,
    gap: 2,
  },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 4 },
  navLabel: { fontSize: 11, fontFamily: Fonts.headlineBold, letterSpacing: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, backgroundColor: theme.surface, borderColor: `${theme.error}33` },
  logoutLabel: { fontSize: 11, fontFamily: Fonts.headlineBold, letterSpacing: 1, color: theme.error },
  brandRow: { alignItems: 'center', gap: 2 },
  brandNoir: { fontSize: 13, fontFamily: Fonts.headlineBold, fontStyle: 'italic', letterSpacing: -0.5, opacity: 0.4, color: theme.primary },
  version: { fontSize: 8, fontFamily: Fonts.headlineBold, letterSpacing: 0.8, opacity: 0.5, color: theme.textMuted },
  soonBadge: { marginLeft: 'auto', backgroundColor: `${theme.secondary}26`, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  soonBadgeText: { fontSize: 8, fontFamily: Fonts.headlineBold, color: theme.secondary, letterSpacing: 0.5 },
});
