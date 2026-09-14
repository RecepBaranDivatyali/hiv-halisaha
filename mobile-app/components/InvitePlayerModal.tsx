import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface InvitePlayerModalProps {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_PLAYERS = [
  { id: '1', name: 'Emre K.', position: 'KALECİ', level: 'LVL 42', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKH5OYGgw6kyLLpH5wMB9LQxlysnBPQOzGlTYgCblgjVquca3KkOX5eAQ0rqvOjVr9qEQGj-yP235XnroUuyzg7ZsmyIXWpDnxXISTalw3NzTDuw_ZmQX-Ne1hFDC0eysnPT4qZ1-8DGKiHIfmwdX8oJRjOJuuspWloG3YJSs7bU4_nXnrmNdlVphCmkNnCmyMAplXu8T0BShbsk-UUGhVj3_acb9UxRLlDA44DPG15QZILO7eSCKY16cXOu2I3DQjKW4ccIolcKzm' },
  { id: '2', name: 'Mert Y.', position: 'DEFANS', level: 'LVL 38', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4lFsV0XR6nZWh-Yz-LkjJwfk7GsSSS-BSYugdoVtbu593_7FbtX4_cgRbFIzS3L75J2b3-8G6DHFbJuKj8OiPD4k2FVjKeknv2UGrTH69Wk7Ah0gv4MQJ9Vu6yvnafQVEEBQxaUXwU6fLxN5faXUl8puhH-eL5iPRSR-l6s_mPI7uFbCLcr7tRC8OhRZC3b-nGDSPAMWudV0AGFKrFQ9_pUCJYJRUdC4ODwJyvcvYixPhiy1a17jhPgmSVxj7Qo3fxzpOqNaw1kt' },
  { id: '3', name: 'Canberk T.', position: 'ORTA SAHA', level: 'LVL 45', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8zUJF1Saqr9vLfmCBr4mZal8zP8AG7YdNQ_Lf2JplpOnr78Db0YoR09stWCBd3EU4PCu5JipiLrx1GaYJr8_b52MaKj3NC3J_pZLpJhpXa8vnfxpsouclJZYdJ0wsntODI7Lnj3l0QUJjjWpjtRTaoqRNhG7MzslLrfaCZ-ccXxdM6WnoEetlcVuU0G0x3XSkP64nOJ5B32iF9c3wUN-NoUF9hH60ZkKko2tyY2QmOYOYlcnRzBQMMiG-W1yx8zjjM_-8LL_TnFW-' },
];

export const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const filteredPlayers = SAMPLE_PLAYERS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = (player: typeof SAMPLE_PLAYERS[0]) => {
    setInvitedIds(prev => [...prev, player.id]);
    Alert.alert('✅ Davet Gönderildi', `${player.name} oyuncusuna kulüp daveti iletildi.`);
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
              {filteredPlayers.map((player) => {
                const isInvited = invitedIds.includes(player.id);
                return (
                  <View key={player.id} style={styles.playerCard}>
                    <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <View style={styles.playerSubRow}>
                        <Text style={styles.playerPos}>{player.position}</Text>
                        <Text style={styles.playerDot}>•</Text>
                        <Text style={styles.playerLvl}>{player.level}</Text>
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
              })}
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
