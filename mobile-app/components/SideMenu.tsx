import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Image, Animated, Alert, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
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
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'PROFİL', icon: 'person', route: '/(tabs)/profile', active: true },
    { label: 'NASIL KULLANILIR?', icon: 'help', action: 'guide' },
    { label: 'AYARLAR', icon: 'settings', route: '/settings' },
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
        {/* Drawer comes FIRST so it's on the LEFT */}
        <Animated.View style={styles.drawer}>
          {/* Close Button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* User Profile */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: user?.avatar }} 
                  style={styles.avatar} 
                />
              </View>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>{user?.level}</Text></View>
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
            }}>
              <Text style={styles.logoutLabel}>ÇIKIŞ YAP</Text>
              <MaterialIcons name="logout" size={20} color={theme.error} />
            </TouchableOpacity>
            
            <View style={styles.brandRow}>
              <Text style={styles.brandNoir}>H.İ.V.</Text>
              <Text style={styles.version}>v1.0.0 — Halısahaya İhtiyacım Var</Text>
            </View>
          </View>
        </Animated.View>

        {/* Backdrop comes SECOND so it fills the right side */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  drawer: { width: 320, height: '100%', paddingVertical: 40, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, alignItems: 'flex-end', marginBottom: 20 },
  closeBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceContainerHighest },
  profileSection: { paddingHorizontal: 24, marginBottom: 40 },
  avatarWrapper: { position: 'relative', width: 90, height: 90, marginBottom: 16 },
  avatarBorder: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, padding: 4, borderColor: theme.primary },
  avatar: { width: '100%', height: '100%', borderRadius: 40 },
  proBadge: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.primary },
  proBadgeText: { color: '#000', fontSize: 10, fontFamily: Fonts.headlineBold, fontStyle: 'italic' },
  profileText: { gap: 4 },
  userName: { fontSize: 24, fontFamily: Fonts.headlineBold, letterSpacing: -1, color: theme.text },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: theme.surfaceContainerHighest },
  levelBadgeText: { fontSize: 10, fontFamily: Fonts.headlineBold, color: theme.primary },
  memberText: { fontSize: 9, fontFamily: Fonts.headlineBold, letterSpacing: 1, color: theme.textMuted },
  nav: { flex: 1, paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: theme.borderSubtle, borderBottomColor: theme.borderSubtle },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 18, paddingHorizontal: 24 },
  navLabel: { fontSize: 14, fontFamily: Fonts.headlineBold, letterSpacing: 2 },
  footer: { padding: 24, gap: 32 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 12, borderWidth: 1, backgroundColor: theme.surface, borderColor: `${theme.error}33` },
  logoutLabel: { fontSize: 14, fontFamily: Fonts.headlineBold, letterSpacing: 2, color: theme.error },
  brandRow: { alignItems: 'center', gap: 4 },
  brandNoir: { fontSize: 20, fontFamily: Fonts.headlineBold, fontStyle: 'italic', letterSpacing: -1, opacity: 0.4, color: theme.primary },
  version: { fontSize: 9, fontFamily: Fonts.headlineBold, letterSpacing: 1.5, opacity: 0.5, color: theme.textMuted },
  soonBadge: { marginLeft: 'auto', backgroundColor: `${theme.secondary}26`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  soonBadgeText: { fontSize: 8, fontFamily: Fonts.headlineBold, color: theme.secondary, letterSpacing: 1 },
});
