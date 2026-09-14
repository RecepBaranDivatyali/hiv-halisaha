import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image, Animated, Alert, Platform, Linking, ScrollView } from 'react-native';
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Drawer comes FIRST so it's on the LEFT of the phone screen */}
        <Animated.View style={styles.drawer}>
          <ScrollView
            contentContainerStyle={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View>
              {/* Close Button */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Kapat">
                  <MaterialIcons name="close" size={22} color={theme.text} />
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
                    style={[styles.navItem, item.active && { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: theme.primary }]}
                    onPress={() => handleNavigate(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name={item.icon as any} 
                      size={20} 
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
                <MaterialIcons name="logout" size={20} color={theme.error} />
              </TouchableOpacity>
              
              <View style={styles.brandRow}>
                <Text style={styles.brandNoir}>H.İ.V.</Text>
                <Text style={styles.version}>v1.0.0 — Halısahaya İhtiyacım Var</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Backdrop comes SECOND so it fills the right side */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  drawer: { 
    width: '82%', 
    maxWidth: 320, 
    height: '100%', 
    backgroundColor: theme.background,
    borderRightWidth: 1,
    borderRightColor: `${theme.border}33`,
  },
  drawerScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  header: { paddingHorizontal: 20, alignItems: 'flex-end', marginBottom: 12 },
  closeBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceContainerHighest },
  profileSection: { paddingHorizontal: 20, marginBottom: 20 },
  avatarWrapper: { position: 'relative', width: 76, height: 76, marginBottom: 12 },
  avatarBorder: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, padding: 3, borderColor: theme.primary },
  avatar: { width: '100%', height: '100%', borderRadius: 35 },
  proBadge: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.primary },
  proBadgeText: { color: '#000', fontSize: 9, fontFamily: Fonts.headlineBold, fontStyle: 'italic' },
  profileText: { gap: 3 },
  userName: { fontSize: 20, fontFamily: Fonts.headlineBold, letterSpacing: -0.5, color: theme.text },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  levelBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.surfaceContainerHighest },
  levelBadgeText: { fontSize: 10, fontFamily: Fonts.headlineBold, color: theme.primary },
  memberText: { fontSize: 9, fontFamily: Fonts.headlineBold, letterSpacing: 1, color: theme.textMuted },
  nav: { 
    paddingVertical: 8, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderTopColor: theme.borderSubtle, 
    borderBottomColor: theme.borderSubtle,
    gap: 2,
  },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginHorizontal: 6 },
  navLabel: { fontSize: 13, fontFamily: Fonts.headlineBold, letterSpacing: 1.5 },
  footer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, backgroundColor: theme.surface, borderColor: `${theme.error}33` },
  logoutLabel: { fontSize: 13, fontFamily: Fonts.headlineBold, letterSpacing: 1.5, color: theme.error },
  brandRow: { alignItems: 'center', gap: 2 },
  brandNoir: { fontSize: 16, fontFamily: Fonts.headlineBold, fontStyle: 'italic', letterSpacing: -0.5, opacity: 0.4, color: theme.primary },
  version: { fontSize: 9, fontFamily: Fonts.headlineBold, letterSpacing: 1, opacity: 0.5, color: theme.textMuted },
  soonBadge: { marginLeft: 'auto', backgroundColor: `${theme.secondary}26`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  soonBadgeText: { fontSize: 8, fontFamily: Fonts.headlineBold, color: theme.secondary, letterSpacing: 0.5 },
});
