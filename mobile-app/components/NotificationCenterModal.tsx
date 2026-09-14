import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export interface NotificationItem {
  id: string;
  type: 'match' | 'chat' | 'alert' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_NOTIFS: NotificationItem[] = [
  { id: '1', type: 'reminder', title: 'MAÇ GÜNÜ UYARISI', message: 'Beşiktaş Arena maçınıza 2 saat kaldı! Sağanak yağış riski var, yağmurluk almayı unutmayın.', time: '10dk önce', read: false },
  { id: '2', type: 'chat', title: 'YENİ SOHBET MESAJI', message: 'Kaptan_Sarı: "Beyler kırmızı formalarla geliyoruz, unutmayın!"', time: '45dk önce', read: false },
  { id: '3', type: 'alert', title: 'KADRO GÜNCELLEMESİ', message: 'Ege_Def kadrodan ayrıldı. Defans mevkii boşaldı, maça oyuncu çağırabilirsiniz.', time: '2 saat önce', read: true },
  { id: '4', type: 'match', title: 'ÖDEME ONAYLANDI', message: '150 ₺ kapora ödemeniz 3D Secure ile başarıyla kaydedildi.', time: 'Dün', read: true },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [notifs, setNotifs] = useState<NotificationItem[]>(DEFAULT_NOTIFS);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifs([]);
  };

  const getItemIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'match':
        return { name: 'sports-soccer', color: theme.primary };
      case 'chat':
        return { name: 'chat', color: theme.secondary };
      case 'alert':
        return { name: 'warning', color: theme.error };
      case 'reminder':
        return { name: 'alarm', color: '#ffb703' };
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="notifications-active" size={24} color={theme.primary} />
              <View>
                <Text style={styles.headerTitle}>BİLDİRİM MERKEZİ</Text>
                <Text style={styles.headerSub}>{unreadCount > 0 ? `${unreadCount} Okunmamış Bildirim` : 'Tüm Bildirimler Okundu'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Action Row */}
          {notifs.length > 0 && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionLink} onPress={markAllRead}>
                <MaterialIcons name="done-all" size={16} color={theme.primary} />
                <Text style={styles.actionLinkText}>Tümünü Okundu İşaretle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionLink} onPress={clearAll}>
                <MaterialIcons name="delete-sweep" size={16} color={theme.error} />
                <Text style={[styles.actionLinkText, { color: theme.error }]}>Temizle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications List */}
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {notifs.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="notifications-off" size={48} color={theme.surfaceContainerHighest} />
                <Text style={styles.emptyText}>Henüz bildirimiz yok</Text>
              </View>
            ) : (
              notifs.map((item) => {
                const iconInfo = getItemIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                      Alert.alert(item.title, item.message);
                    }}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}20` }]}>
                      <MaterialIcons name={iconInfo.name as any} size={20} color={iconInfo.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: iconInfo.color }]}>{item.title}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.primary, fontStyle: 'italic', letterSpacing: -0.5 },
  headerSub: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
  actionLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLinkText: { fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontWeight: 'bold' },
  body: { padding: 24, gap: 12 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: theme.textMuted },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.borderSubtle, position: 'relative' },
  notifCardUnread: { backgroundColor: theme.surfaceContainer, borderColor: `${theme.primary}4D` },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, letterSpacing: 0.5 },
  notifTime: { fontFamily: Fonts.body, fontSize: 9, color: theme.textMuted },
  notifMessage: { fontFamily: Fonts.body, fontSize: 12, color: theme.text, lineHeight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, position: 'absolute', top: 14, right: 14 },
});
