import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface PitchReviewModalProps {
  pitchName?: string;
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_REVIEWS = [
  { id: '1', name: 'Ahmet K.', rating: 5, comment: 'Zemin harika! Krampon kaymıyor, soyunma odaları tertemiz ve sıcak su var.', date: '3 gün önce', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKH5OYGgw6kyLLpH5wMB9LQxlysnBPQOzGlTYgCblgjVquca3KkOX5eAQ0rqvOjVr9qEQGj-yP235XnroUuyzg7ZsmyIXWpDnxXISTalw3NzTDuw_ZmQX-Ne1hFDC0eysnPT4qZ1-8DGKiHIfmwdX8oJRjOJuuspWloG3YJSs7bU4_nXnrmNdlVphCmkNnCmyMAplXu8T0BShbsk-UUGhVj3_acb9UxRLlDA44DPG15QZILO7eSCKY16cXOu2I3DQjKW4ccIolcKzm' },
  { id: '2', name: 'Sercan B.', rating: 4, comment: 'Işıklandırma akşam maçlarında mükemmel. Otopark biraz dar ama sorunsuz.', date: 'Geçen hafta', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4lFsV0XR6nZWh-Yz-LkjJwfk7GsSSS-BSYugdoVtbu593_7FbtX4_cgRbFIzS3L75J2b3-8G6DHFbJuKj8OiPD4k2FVjKeknv2UGrTH69Wk7Ah0gv4MQJ9Vu6yvnafQVEEBQxaUXwU6fLxN5faXUl8puhH-eL5iPRSR-l6s_mPI7uFbCLcr7tRC8OhRZC3b-nGDSPAMWudV0AGFKrFQ9_pUCJYJRUdC4ODwJyvcvYixPhiy1a17jhPgmSVxj7Qo3fxzpOqNaw1kt' },
];

export const PitchReviewModal: React.FC<PitchReviewModalProps> = ({ pitchName = 'Beşiktaş Arena', visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddReview = () => {
    if (!userComment.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir yorum yazın.');
      return;
    }
    const newRev = {
      id: Date.now().toString(),
      name: 'Siz (Oyuncu)',
      rating: userRating,
      comment: userComment.trim(),
      date: 'Az önce',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG',
    };
    setReviews([newRev, ...reviews]);
    setUserComment('');
    setShowAddForm(false);
    Alert.alert('✅ Yorum Yayınlandı', 'Tesis değerlendirmeniz kaydedildi.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="stadium" size={24} color={theme.primary} />
              <View>
                <Text style={styles.headerTitle}>{pitchName.toUpperCase()}</Text>
                <Text style={styles.headerSub}>TESİS PUANLARI & DEĞERLENDİRMELER</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Overall Score Banner */}
            <View style={styles.scoreBanner}>
              <View style={styles.scoreLeft}>
                <Text style={styles.bigScore}>4.8</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialIcons key={s} name="star" size={16} color={theme.primary} />
                  ))}
                </View>
                <Text style={styles.totalCount}>48 Değerlendirme</Text>
              </View>

              {/* Criteria Bars */}
              <View style={styles.criteriaRight}>
                {[
                  { label: '⚽ Zemin', val: '4.9' },
                  { label: '🚿 Duş / Soyunma', val: '4.7' },
                  { label: '💡 Işıklandırma', val: '4.8' },
                  { label: '🚗 Otopark', val: '4.5' },
                ].map((crit, i) => (
                  <View key={i} style={styles.critRow}>
                    <Text style={styles.critLabel}>{crit.label}</Text>
                    <Text style={styles.critVal}>{crit.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Add Review Button Toggle */}
            {!showAddForm ? (
              <TouchableOpacity style={styles.addReviewToggleBtn} onPress={() => setShowAddForm(true)}>
                <MaterialIcons name="rate-review" size={18} color={theme.onPrimary} />
                <Text style={styles.addReviewToggleText}>DEĞERLENDİRME YAZ</Text>
              </TouchableOpacity>
            ) : (
              /* Add Review Form */
              <View style={styles.addFormBox}>
                <Text style={styles.addFormTitle}>TESİSİ PUANLA</Text>
                <View style={styles.starSelectRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                      <MaterialIcons name="star" size={28} color={star <= userRating ? theme.primary : theme.surfaceContainerHighest} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Zemin, soyunma odası veya tesis hakkında yorum yapın..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  value={userComment}
                  onChangeText={setUserComment}
                />
                <View style={styles.addFormActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelBtnText}>İPTAL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitReviewBtn} onPress={handleAddReview}>
                    <Text style={styles.submitReviewBtnText}>YAYINLA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reviews List */}
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>OYUNCU YORUMLARI</Text>
              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <Image source={{ uri: rev.avatar }} style={styles.revAvatar} />
                  <View style={styles.revContent}>
                    <View style={styles.revHeader}>
                      <Text style={styles.revName}>{rev.name}</Text>
                      <Text style={styles.revDate}>{rev.date}</Text>
                    </View>
                    <View style={styles.revStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialIcons key={s} name="star" size={12} color={s <= rev.rating ? theme.primary : theme.surfaceContainerHighest} />
                      ))}
                    </View>
                    <Text style={styles.revComment}>{rev.comment}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, letterSpacing: -0.5 },
  headerSub: { fontFamily: Fonts.body, fontSize: 9, color: theme.primary, fontWeight: 'bold', letterSpacing: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, gap: 20 },
  scoreBanner: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  scoreLeft: { alignItems: 'center', paddingRight: 18, borderRightWidth: 1, borderRightColor: theme.border },
  bigScore: { fontFamily: Fonts.headlineBold, fontSize: 36, color: theme.primary, fontStyle: 'italic', lineHeight: 40 },
  starRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalCount: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  criteriaRight: { flex: 1, paddingLeft: 16, gap: 6 },
  critRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critLabel: { fontFamily: Fonts.body, fontSize: 11, color: theme.text },
  critVal: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary },
  addReviewToggleBtn: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addReviewToggleText: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.onPrimary, letterSpacing: 1 },
  addFormBox: { backgroundColor: theme.surfaceContainer, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: `${theme.primary}4D`, gap: 12 },
  addFormTitle: { fontFamily: Fonts.headlineBold, fontSize: 14, color: theme.text },
  starSelectRow: { flexDirection: 'row', gap: 8 },
  commentInput: { backgroundColor: theme.surface, borderRadius: 8, padding: 12, color: theme.text, fontFamily: Fonts.body, fontSize: 13, height: 70, textAlignVertical: 'top' },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.surfaceContainerHighest },
  cancelBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.textMuted },
  submitReviewBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.primary },
  submitReviewBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.onPrimary },
  reviewsSection: { gap: 12 },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: `${theme.primary}CC`, letterSpacing: 1.5 },
  reviewCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  revAvatar: { width: 36, height: 36, borderRadius: 18 },
  revContent: { flex: 1 },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revName: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  revDate: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  revStars: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  revComment: { fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, lineHeight: 16 },
});
