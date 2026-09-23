import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';

interface PitchReviewModalProps {
  pitchName?: string;
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_REVIEWS = [
  { 
    id: '1', 
    name: 'Ahmet K.', 
    rating: 4.8, 
    criteria: { turf: 5, showers: 5, lighting: 5, parking: 4 },
    comment: 'Zemin harika! Krampon kaymıyor, soyunma odaları tertemiz ve sıcak su var.', 
    date: '3 gün önce', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKH5OYGgw6kyLLpH5wMB9LQxlysnBPQOzGlTYgCblgjVquca3KkOX5eAQ0rqvOjVr9qEQGj-yP235XnroUuyzg7ZsmyIXWpDnxXISTalw3NzTDuw_ZmQX-Ne1hFDC0eysnPT4qZ1-8DGKiHIfmwdX8oJRjOJuuspWloG3YJSs7bU4_nXnrmNdlVphCmkNnCmyMAplXu8T0BShbsk-UUGhVj3_acb9UxRLlDA44DPG15QZILO7eSCKY16cXOu2I3DQjKW4ccIolcKzm' 
  },
  { 
    id: '2', 
    name: 'Sercan B.', 
    rating: 4.3, 
    criteria: { turf: 4, showers: 4, lighting: 5, parking: 4 },
    comment: 'Işıklandırma akşam maçlarında mükemmel. Otopark biraz dar ama sorunsuz.', 
    date: 'Geçen hafta', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4lFsV0XR6nZWh-Yz-LkjJwfk7GsSSS-BSYugdoVtbu593_7FbtX4_cgRbFIzS3L75J2b3-8G6DHFbJuKj8OiPD4k2FVjKeknv2UGrTH69Wk7Ah0gv4MQJ9Vu6yvnafQVEEBQxaUXwU6fLxN5faXUl8puhH-eL5iPRSR-l6s_mPI7uFbCLcr7tRC8OhRZC3b-nGDSPAMWudV0AGFKrFQ9_pUCJYJRUdC4ODwJyvcvYixPhiy1a17jhPgmSVxj7Qo3fxzpOqNaw1kt' 
  },
];

export const PitchReviewModal: React.FC<PitchReviewModalProps> = ({ pitchName = 'Beşiktaş Arena', visible, onClose }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);
  const [reviews, setReviews] = useState<any[]>(SAMPLE_REVIEWS);
  const [surfaceRating, setSurfaceRating] = useState(5);
  const [showerRating, setShowerRating] = useState(5);
  const [lightingRating, setLightingRating] = useState(5);
  const [parkingRating, setParkingRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myReview = reviews.find(r => r.userId && user?.uid && r.userId === user.uid);

  useEffect(() => {
    if (visible && pitchName) {
      setLoading(true);
      dbService.getPitchReviews(pitchName).then((remoteReviews) => {
        if (remoteReviews && remoteReviews.length > 0) {
          const mapped = remoteReviews.map(r => ({
            id: r.id || Date.now().toString(),
            userId: r.userId,
            name: r.userName || 'Halısaha Oyuncusu',
            rating: r.rating || 5,
            criteria: r.criteria,
            comment: r.comment,
            date: 'Yeni',
            avatar: r.userAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKH5OYGgw6kyLLpH5wMB9LQxlysnBPQOzGlTYgCblgjVquca3KkOX5eAQ0rqvOjVr9qEQGj-yP235XnroUuyzg7ZsmyIXWpDnxXISTalw3NzTDuw_ZmQX-Ne1hFDC0eysnPT4qZ1-8DGKiHIfmwdX8oJRjOJuuspWloG3YJSs7bU4_nXnrmNdlVphCmkNnCmyMAplXu8T0BShbsk-UUGhVj3_acb9UxRLlDA44DPG15QZILO7eSCKY16cXOu2I3DQjKW4ccIolcKzm',
          }));
          setReviews([...mapped, ...SAMPLE_REVIEWS]);
        }
      }).catch(err => {
        console.error('Tesis yorumları yüklenemedi:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [visible, pitchName]);

  const liveFormAverage = ((surfaceRating + showerRating + lightingRating + parkingRating) / 4).toFixed(1);

  const handleOpenEdit = () => {
    if (myReview) {
      setSurfaceRating(myReview.criteria?.turf ?? 5);
      setShowerRating(myReview.criteria?.showers ?? 5);
      setLightingRating(myReview.criteria?.lighting ?? 5);
      setParkingRating(myReview.criteria?.parking ?? 5);
      setUserComment(myReview.comment || '');
    }
    setShowAddForm(true);
  };

  const handleAddReview = async () => {
    setSubmitting(true);
    try {
      const avgNum = parseFloat(liveFormAverage);
      const criteriaObj = {
        turf: surfaceRating,
        showers: showerRating,
        lighting: lightingRating,
        parking: parkingRating,
      };

      const finalComment = userComment.trim();
      const reviewPayload = {
        pitchName,
        userId: user?.uid || 'anon',
        userName: user?.name || 'Siz (Oyuncu)',
        userAvatar: user?.avatar,
        rating: avgNum,
        criteria: criteriaObj,
        comment: finalComment,
      };
      await dbService.savePitchReview(pitchName, reviewPayload);

      const newRev = {
        id: myReview?.id || Date.now().toString(),
        userId: user?.uid,
        name: user?.name || 'Siz (Oyuncu)',
        rating: avgNum,
        criteria: criteriaObj,
        comment: finalComment,
        date: myReview ? 'Az önce (Güncellendi)' : 'Az önce',
        avatar: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmL5Hz5EJOWErh6AR8u9TjkJdGlp59VyudXCdt-0qrvris37DncsucN9d3WVAIfgM0woMTEEk-pP8Q5RGlqgm2JhZvt-QpZW6zMs29QUq1PnXZDgQhkS0v8jkJHRHGJRg114RpCo09yyL_w7PmiICIU-dlZ4qsb21WWDvr2QDUXk82sNqxgNK--BOb1nRROMskro5IlO--TYYeuXDPeznabVwYIaZ1BOChS3YuHQ98iMHna5Lv975P8F01HCX7lhZDzEKnS1YIpUHG',
      };
      setReviews(prev => [newRev, ...prev.filter(r => !(r.userId && user?.uid && r.userId === user.uid))]);
      setUserComment('');
      setShowAddForm(false);
      Alert.alert(myReview ? '✅ Değerlendirme Güncellendi' : '✅ Değerlendirme Kaydedildi', myReview ? 'Tesis puanınız başarıyla güncellendi.' : 'Tesis puanınız başarıyla kaydedildi.');
    } catch (e) {
      console.error('Yorum ekleme hatası:', e);
      Alert.alert('Hata', 'Değerlendirmeniz kaydedilirken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.8';

  const avgSurface = reviews.some(r => r.criteria?.turf)
    ? (reviews.reduce((sum, r) => sum + (r.criteria?.turf || r.rating || 5), 0) / reviews.length).toFixed(1)
    : (parseFloat(averageRating) > 4.5 ? '4.9' : averageRating);

  const avgShower = reviews.some(r => r.criteria?.showers)
    ? (reviews.reduce((sum, r) => sum + (r.criteria?.showers || r.rating || 4.5), 0) / reviews.length).toFixed(1)
    : '4.7';

  const avgLighting = reviews.some(r => r.criteria?.lighting)
    ? (reviews.reduce((sum, r) => sum + (r.criteria?.lighting || r.rating || 5), 0) / reviews.length).toFixed(1)
    : averageRating;

  const avgParking = reviews.some(r => r.criteria?.parking)
    ? (reviews.reduce((sum, r) => sum + (r.criteria?.parking || r.rating || 4), 0) / reviews.length).toFixed(1)
    : '4.5';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Tap outside backdrop to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="stadium" size={24} color={theme.primary} />
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle} numberOfLines={1}>{pitchName.toUpperCase()}</Text>
                <Text style={styles.headerSub}>TESİS PUANLARI & DEĞERLENDİRMELER</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Overall Score Banner */}
            <View style={styles.scoreBanner}>
              <View style={styles.scoreLeft}>
                <Text style={styles.bigScore}>{averageRating}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialIcons key={s} name="star" size={16} color={theme.primary} />
                  ))}
                </View>
                <Text style={styles.totalCount}>{reviews.length} Değerlendirme</Text>
              </View>

              {/* Criteria Bars */}
              <View style={styles.criteriaRight}>
                {[
                  { label: '⚽ Zemin', val: avgSurface },
                  { label: '🚿 Duş / Soyunma', val: avgShower },
                  { label: '💡 Işıklandırma', val: avgLighting },
                  { label: '🚗 Otopark', val: avgParking },
                ].map((crit, i) => (
                  <View key={i} style={styles.critRow}>
                    <Text style={styles.critLabel}>{crit.label}</Text>
                    <Text style={styles.critVal}>{crit.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Add Review Button Toggle / Already Reviewed Card */}
            {!showAddForm ? (
              myReview ? (
                <View style={styles.alreadyReviewedBox}>
                  <View style={styles.alreadyReviewedInfo}>
                    <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alreadyReviewedTitle}>Bu tesisi değerlendirdiniz</Text>
                      <Text style={styles.alreadyReviewedSub}>Puanınızı veya yorumunuzu dilediğiniz zaman güncelleyebilirsiniz.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.editMyReviewBtn} onPress={handleOpenEdit} activeOpacity={0.8}>
                    <MaterialIcons name="edit" size={15} color={theme.onPrimary} />
                    <Text style={styles.editMyReviewBtnText}>DÜZENLE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addReviewToggleBtn} onPress={() => setShowAddForm(true)} activeOpacity={0.8}>
                  <MaterialIcons name="rate-review" size={18} color={theme.onPrimary} />
                  <Text style={styles.addReviewToggleText}>DEĞERLENDİRME YAZ</Text>
                </TouchableOpacity>
              )
            ) : (
              /* Add Review Form */
              <View style={styles.addFormBox}>
                <View style={styles.addFormHeader}>
                  <Text style={styles.addFormTitle}>{myReview ? 'DEĞERLENDİRMENİZİ DÜZENLEYİN' : 'TESİSİ KATEGORİLERE GÖRE PUANLA'}</Text>
                  <View style={styles.liveScoreBadge}>
                    <MaterialIcons name="star" size={16} color="#f59e0b" />
                    <Text style={styles.liveScoreText}>Ort: {liveFormAverage}</Text>
                  </View>
                </View>

                {/* 4 Category Star Selectors */}
                <View style={styles.categoriesBox}>
                  {[
                    { key: 'surface', label: '⚽ Zemin', val: surfaceRating, set: setSurfaceRating },
                    { key: 'shower', label: '🚿 Duş / Soyunma', val: showerRating, set: setShowerRating },
                    { key: 'lighting', label: '💡 Işıklandırma', val: lightingRating, set: setLightingRating },
                    { key: 'parking', label: '🚗 Otopark', val: parkingRating, set: setParkingRating },
                  ].map((cat) => (
                    <View key={cat.key} style={styles.catRatingRow}>
                      <Text style={styles.catRatingLabel}>{cat.label}</Text>
                      <View style={styles.starRowSelector}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity 
                            key={star} 
                            onPress={() => cat.set(star)} 
                            hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                          >
                            <MaterialIcons 
                              name={star <= cat.val ? "star" : "star-border"} 
                              size={22} 
                              color={star <= cat.val ? "#f59e0b" : theme.borderSubtle} 
                            />
                          </TouchableOpacity>
                        ))}
                        <Text style={styles.catScoreVal}>{cat.val}.0</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TextInput
                  style={styles.commentInput}
                  placeholder="Zemin, soyunma odası veya tesis hakkında yorum yapın (İsteğe bağlı)..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  value={userComment}
                  onChangeText={setUserComment}
                />
                <View style={styles.addFormActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelBtnText}>İPTAL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.submitReviewBtn, submitting && { opacity: 0.6 }]} onPress={handleAddReview} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color={theme.onPrimary} />
                    ) : (
                      <Text style={styles.submitReviewBtnText}>{myReview ? `GÜNCELLE (${liveFormAverage} ★)` : `YAYINLA (${liveFormAverage} ★)`}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reviews List */}
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>OYUNCU YORUMLARI</Text>
              {[...reviews].sort((a, b) => {
                const aIsMe = Boolean(a.userId && user?.uid && a.userId === user.uid);
                const bIsMe = Boolean(b.userId && user?.uid && b.userId === user.uid);
                if (aIsMe) return -1;
                if (bIsMe) return 1;
                return 0;
              }).map((rev) => {
                const isMine = Boolean(rev.userId && user?.uid && rev.userId === user.uid);
                return (
                  <View key={rev.id} style={[styles.reviewCard, isMine && styles.myReviewCard]}>
                    <Image source={{ uri: rev.avatar }} style={styles.revAvatar} />
                    <View style={styles.revContent}>
                      <View style={styles.revHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={[styles.revName, isMine && { color: theme.primary }]}>{rev.name}</Text>
                          {isMine && (
                            <View style={styles.myPill}>
                              <Text style={styles.myPillText}>SİZİN YORUMUNUZ</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.revDate}>{rev.date}</Text>
                          {isMine && (
                            <TouchableOpacity onPress={handleOpenEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.pencilTouch}>
                              <MaterialIcons name="edit" size={16} color={theme.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View style={styles.revStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialIcons 
                            key={s} 
                            name="star" 
                            size={12} 
                            color={s <= Math.round(rev.rating || 5) ? theme.primary : theme.surfaceContainerHighest} 
                          />
                        ))}
                        <Text style={styles.revStarScore}>{(rev.rating || 5).toFixed?.(1) ?? rev.rating}</Text>
                      </View>

                      {rev.criteria && (
                        <View style={styles.revCriteriaPills}>
                          {rev.criteria.turf != null && <Text style={styles.revCritPill}>⚽ {rev.criteria.turf}</Text>}
                          {rev.criteria.showers != null && <Text style={styles.revCritPill}>🚿 {rev.criteria.showers}</Text>}
                          {rev.criteria.lighting != null && <Text style={styles.revCritPill}>💡 {rev.criteria.lighting}</Text>}
                          {rev.criteria.parking != null && <Text style={styles.revCritPill}>🚗 {rev.criteria.parking}</Text>}
                        </View>
                      )}

                      {Boolean(rev.comment) && <Text style={styles.revComment}>{rev.comment}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom Close Button so user can easily exit from the bottom too */}
            <TouchableOpacity style={styles.bottomCloseBtn} onPress={onClose} activeOpacity={0.8}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
              <Text style={styles.bottomCloseBtnText}>KAPAT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: theme.background, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '90%', 
    paddingBottom: 20 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1, 
    marginRight: 10 
  },
  headerTextCol: { flex: 1 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 15, color: theme.text, letterSpacing: -0.3 },
  headerSub: { fontFamily: Fonts.body, fontSize: 9, color: theme.primary, fontWeight: 'bold', letterSpacing: 0.8 },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: theme.surfaceContainerHighest, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  body: { padding: 20, gap: 18 },
  scoreBanner: { 
    flexDirection: 'row', 
    backgroundColor: theme.surface, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: theme.border, 
    alignItems: 'center' 
  },
  scoreLeft: { 
    alignItems: 'center', 
    paddingRight: 16, 
    borderRightWidth: 1, 
    borderRightColor: theme.border 
  },
  bigScore: { fontFamily: Fonts.headlineBold, fontSize: 34, color: theme.primary, fontStyle: 'italic', lineHeight: 38 },
  starRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalCount: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  criteriaRight: { flex: 1, paddingLeft: 14, gap: 6 },
  critRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critLabel: { fontFamily: Fonts.body, fontSize: 11, color: theme.text },
  critVal: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.primary },
  addReviewToggleBtn: { 
    backgroundColor: theme.primary, 
    paddingVertical: 13, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  addReviewToggleText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.onPrimary, letterSpacing: 1 },
  addFormBox: { 
    backgroundColor: theme.surfaceContainer, 
    borderRadius: 14, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: `${theme.primary}4D`, 
    gap: 12 
  },
  addFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addFormTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.text, letterSpacing: 0.5 },
  liveScoreBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(245, 158, 11, 0.15)', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8 
  },
  liveScoreText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: '#f59e0b' },
  categoriesBox: { backgroundColor: theme.surface, borderRadius: 10, padding: 12, gap: 10 },
  catRatingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catRatingLabel: { fontFamily: Fonts.headline, fontSize: 12, color: theme.text },
  starRowSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starTouch: { padding: 2 },
  catScoreVal: { fontFamily: Fonts.headlineBold, fontSize: 12, color: '#f59e0b', width: 24, textAlign: 'right' },
  commentInput: { 
    backgroundColor: theme.surface, 
    borderRadius: 8, 
    padding: 12, 
    color: theme.text, 
    fontFamily: Fonts.body, 
    fontSize: 13, 
    height: 70, 
    textAlignVertical: 'top' 
  },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.surfaceContainerHighest },
  cancelBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.textMuted },
  submitReviewBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.primary },
  submitReviewBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.onPrimary },
  alreadyReviewedBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  alreadyReviewedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alreadyReviewedTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.primary,
  },
  alreadyReviewedSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  editMyReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editMyReviewBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.onPrimary,
  },
  reviewsSection: { gap: 12 },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 12, color: `${theme.primary}CC`, letterSpacing: 1.5 },
  reviewCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.borderSubtle },
  myReviewCard: {
    borderColor: `${theme.primary}80`,
    borderWidth: 1.5,
    backgroundColor: `${theme.primary}0D`,
  },
  myPill: {
    backgroundColor: `${theme.primary}25`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myPillText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  pencilTouch: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: `${theme.primary}20`,
  },
  revAvatar: { width: 36, height: 36, borderRadius: 18 },
  revContent: { flex: 1 },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revName: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  revDate: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted },
  revStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginVertical: 4 },
  revStarScore: { fontFamily: Fonts.bodyBold, fontSize: 10, color: theme.primary, marginLeft: 4 },
  revCriteriaPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  revCritPill: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, backgroundColor: theme.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  revComment: { fontFamily: Fonts.body, fontSize: 12, color: theme.textMuted, lineHeight: 16, marginTop: 2 },
  bottomCloseBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 12, 
    borderRadius: 10, 
    backgroundColor: theme.surfaceContainerHighest, 
    marginTop: 8 
  },
  bottomCloseBtnText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.textMuted, letterSpacing: 0.5 },
});
