import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { appAlert } from '@/services/appAlert';

export interface NotificationItem {
  id: string;
  type: 'match' | 'chat' | 'alert' | 'reminder';
  title: string;
  message: string;
  time: string;
  createdAt?: any;
  read: boolean;
  route?: string | { pathname: string; params?: Record<string, any> };
}

const formatRelativeTime = (rawTime: any): string => {
  if (!rawTime) return 'Az önce';
  let date: Date;
  if (typeof rawTime?.toDate === 'function') {
    date = rawTime.toDate();
  } else if (rawTime instanceof Date) {
    date = rawTime;
  } else if (typeof rawTime === 'number') {
    date = new Date(rawTime);
  } else if (typeof rawTime === 'string') {
    date = new Date(rawTime);
  } else {
    return 'Az önce';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Az önce';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Az önce';
  } else if (diffMin < 60) {
    return `${diffMin} dk önce`;
  } else if (diffHour < 24) {
    return `${diffHour} saat önce`;
  } else if (diffDay < 7) {
    return `${diffDay} gün önce`;
  } else {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}.${m}`;
  }
};

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const [firestoreNotifs, setFirestoreNotifs] = useState<NotificationItem[]>([]);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setFirestoreNotifs([]);
      return;
    }
    if (!visible) return;
    try {
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: NotificationItem[] = snapshot.docs.map(d => {
          const data = d.data();
          const ALLOWED_PREFIXES = ['/(tabs)', '/match-room', '/my-club', '/rate-match', '/chat-detail', '/conversations', '/profile', '/settings'];
          const rawRoute = typeof data.route === 'string' && ALLOWED_PREFIXES.some(p => data.route.startsWith(p))
            ? data.route
            : '/(tabs)';
          let resolvedRoute: string | { pathname: string; params?: Record<string, any> } = rawRoute;
          if (data.type === 'club_invite' && data.clubId) {
            resolvedRoute = { pathname: '/my-club', params: { clubId: data.clubId } };
          } else if (data.type === 'club_challenge' || data.type === 'club_join_request') {
            resolvedRoute = '/my-club';
          } else if (data.type === 'club_challenge_accepted' && data.matchId) {
            resolvedRoute = { pathname: '/match-room', params: { matchId: data.matchId } };
          }
          return {
            id: d.id,
            type: data.type === 'club_challenge' ? 'alert' : data.type === 'club_invite' || data.type === 'club_challenge_accepted' ? 'match' : 'reminder',
            title: data.title || 'BİLDİRİM',
            message: data.body || data.message || '',
            time: formatRelativeTime(data.createdAt),
            createdAt: data.createdAt,
            read: Boolean(data.read),
            route: resolvedRoute,
          };
        });
        setFirestoreNotifs(items);
      }, (err) => {
        console.warn('Bildirim dinleme hatası:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Bildirim bağlantı hatası:', e);
    }
  }, [visible, user?.uid]);

  const activeNotifs = firestoreNotifs;

  const markAllRead = async () => {
    const unreadIds = firestoreNotifs.filter(n => !n.read).map(n => n.id);
    setFirestoreNotifs(prev => prev.map(n => ({ ...n, read: true })));
    const currentUserId = user?.uid;
    if (currentUserId && unreadIds.length > 0) {
      try {
        for (let i = 0; i < unreadIds.length; i += 450) {
          const batch = writeBatch(db);
          unreadIds.slice(i, i + 450).forEach(id => {
            batch.update(doc(db, 'users', currentUserId, 'notifications', id), { read: true });
          });
          await batch.commit();
        }
      } catch (e) {
        console.warn('Tümünü okundu işaretleme hatası:', e);
      }
    }
  };

  const clearAll = () => {
    const toDelete = [...firestoreNotifs];
    if (toDelete.length === 0) return;

    appAlert.confirm(
      'Bildirimleri Temizle',
      'Tüm bildirimler kalıcı olarak silinecek. Emin misiniz?',
      async () => {
        const currentUserId = user?.uid;
        setFirestoreNotifs([]);
        if (currentUserId && toDelete.length > 0) {
          try {
            for (let i = 0; i < toDelete.length; i += 450) {
              const batch = writeBatch(db);
              toDelete.slice(i, i + 450).forEach(n => {
                batch.delete(doc(db, 'users', currentUserId, 'notifications', n.id));
              });
              await batch.commit();
            }
          } catch (e) {
            console.warn('Bildirimleri temizleme hatası:', e);
            setFirestoreNotifs(toDelete);
            appAlert.alert('Hata', 'Bildirimler temizlenirken bir sorun oluştu.');
          }
        }
      },
      { confirmText: 'Evet, Temizle', cancelText: 'Vazgeç', destructive: true }
    );
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

  const handleItemPress = async (item: NotificationItem) => {
    setFirestoreNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    const currentUserId = user?.uid;
    if (currentUserId && firestoreNotifs.some(n => n.id === item.id)) {
      try {
        await updateDoc(doc(db, 'users', currentUserId, 'notifications', item.id), { read: true });
      } catch (e) {
        console.warn('Okundu işaretleme hatası:', e);
      }
    }
    const targetRoute = item.route;
    onClose();
    if (targetRoute) {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        try {
          router.push(targetRoute as any);
        } catch (e) {
          console.warn('Navigation error:', e);
        }
      }, 150);
    } else {
      appAlert.alert(item.title, item.message);
    }
  };

  const unreadCount = activeNotifs.filter(n => !n.read).length;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onClose={onClose} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
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
            <View style={styles.headerRightRow}>
              {activeNotifs.length > 0 && (
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.headerActionBtn} 
                    onPress={markAllRead}
                    activeOpacity={0.7}
                    accessibilityLabel="Tümünü Okundu Yap"
                  >
                    <MaterialIcons name="done-all" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerActionBtn} 
                    onPress={clearAll}
                    activeOpacity={0.7}
                    accessibilityLabel="Temizle"
                  >
                    <MaterialIcons name="delete-sweep" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Row */}
          {activeNotifs.length > 0 && (
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
            {activeNotifs.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="notifications-off" size={48} color={theme.surfaceContainerHighest} />
                <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
              </View>
            ) : (
              activeNotifs.map((item) => {
                const iconInfo = getItemIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                    activeOpacity={0.8}
                    onPress={() => handleItemPress(item)}
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
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
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
