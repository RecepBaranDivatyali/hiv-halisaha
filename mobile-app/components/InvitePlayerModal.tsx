import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';
import { db } from '@/services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface InvitePlayerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      dbService.searchPlayers({}).then((res) => {
        const otherPlayers = res.filter((p: any) => p.id && (!user?.uid || p.id !== user.uid));
        setPlayers(otherPlayers);
      }).catch(err => {
        console.error('Oyuncu listesi yükleme hatası:', err);
        setPlayers([]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [visible, user?.uid]);

  const filteredPlayers = players.filter(p => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const posMatch = (p.position || '').toLowerCase().includes(q);
    return nameMatch || posMatch;
  });

  const handleInvite = async (player: any) => {
    if (!user?.clubId) {
      Alert.alert('Hata', 'Kulüp bilginiz bulunamadı.');
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'users', player.id, 'notifications'), {
        type: 'club_invite',
        clubId: user.clubId,
        clubName: user.clubName || 'Kulüp',
        read: false,
        createdAt: serverTimestamp(),
      });
      setInvitedIds(prev => [...prev, player.id]);
      Alert.alert('✅ Davet Gönderildi', `${player.name || 'Oyuncu'} kullanıcısına kulüp daveti iletildi.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Davet gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="person-add" size={24} color={theme.secondary} />
              <Text style={styles.headerTitle}>OYUNCU DAVET ET</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="İsim veya pozisyon ile ara..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Players List */}
            <ScrollView contentContainerStyle={styles.playersList} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : filteredPlayers.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                  <MaterialIcons name="person-search" size={48} color={theme.surfaceContainerHighest} />
                  <Text style={{ fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.textMuted }}>
                    {searchQuery ? 'Aramanızla eşleşen oyuncu bulunamadı' : 'Davet edilebilecek kayıtlı oyuncu yok'}
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, textAlign: 'center' }}>
                    Sisteme kayıtlı diğer futbolcular burada listelenir.
                  </Text>
                </View>
              ) : (
                filteredPlayers.map((player) => {
                  const isInvited = invitedIds.includes(player.id);
                  const avatarUri = player.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKH5OYGgw6kyLLpH5wMB9LQxlysnBPQOzGlTYgCblgjVquca3KkOX5eAQ0rqvOjVr9qEQGj-yP235XnroUuyzg7ZsmyIXWpDnxXISTalw3NzTDuw_ZmQX-Ne1hFDC0eysnPT4qZ1-8DGKiHIfmwdX8oJRjOJuuspWloG3YJSs7bU4_nXnrmNdlVphCmkNnCmyMAplXu8T0BShbsk-UUGhVj3_acb9UxRLlDA44DPG15QZILO7eSCKY16cXOu2I3DQjKW4ccIolcKzm';
                  const posName = player.position || 'OYUNCU';
                  const lvlName = player.stats?.matchesPlayed != null ? `${player.stats.matchesPlayed} Maç` : (player.rating ? `${player.rating} ★` : 'Aktif');

                  return (
                    <View key={player.id} style={styles.playerCard}>
                      <Image source={{ uri: avatarUri }} style={styles.playerAvatar} />
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name || 'Halısaha Oyuncusu'}</Text>
                        <View style={styles.playerSubRow}>
                          <Text style={styles.playerPos}>{posName}</Text>
                          <Text style={styles.playerDot}>•</Text>
                          <Text style={styles.playerLvl}>{lvlName}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.inviteBtn, isInvited && styles.inviteBtnSent]}
                        disabled={isInvited}
                        onPress={() => handleInvite(player)}
                      >
                        <Text style={[styles.inviteBtnText, isInvited && styles.inviteBtnTextSent]}>
                          {isInvited ? 'GÖNDERİLDİ' : 'DAVET ET'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.secondary, fontStyle: 'italic', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, gap: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceContainer, borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: theme.text },
  playersList: { gap: 12 },
  playerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  playerAvatar: { width: 44, height: 44, borderRadius: 22 },
  playerInfo: { flex: 1 },
  playerName: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  playerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  playerPos: { fontFamily: Fonts.body, fontSize: 11, color: theme.primary, fontWeight: 'bold' },
  playerDot: { fontSize: 10, color: theme.textMuted },
  playerLvl: { fontFamily: Fonts.body, fontSize: 11, color: theme.textMuted },
  inviteBtn: { backgroundColor: theme.secondary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  inviteBtnSent: { backgroundColor: theme.surfaceContainerHighest },
  inviteBtnText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.background, letterSpacing: 0.5 },
  inviteBtnTextSent: { color: theme.primary },
});
