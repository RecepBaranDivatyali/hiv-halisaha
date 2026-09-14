import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface AppGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

const GUIDE_SLIDES = [
  {
    step: '01',
    icon: 'sports-soccer',
    color: '#8eff71',
    title: 'MAÇ İLANI OLUŞTUR & 2D KADRO',
    desc: 'Kendi halısaha maçını saniyeler içinde oluştur, kisi başı ücreti ve eksik pozisyonları (Kaleci, Defans vb.) belirle. Maç Odasındaki 2D yeşil sahaya girip mevkiini seç!',
  },
  {
    step: '02',
    icon: 'emoji-events',
    color: '#ffb703',
    title: 'MVP OYLAMASI & BAŞARIM ROZETLERİ',
    desc: 'Maç bittiğinde maçın en iyisini (MVP) aday göster. Gollerini ve asistlerini profilindeki özel başarım rozetleriyle taçlandır!',
  },
  {
    step: '03',
    icon: 'credit-card',
    color: '#6e9bff',
    title: 'KOMİSYONSUZ DOĞRUDAN ÖDEME',
    desc: 'Uygulamada para tutulmaz veya cüzdan birikmez. Maça katılırken iyzico/PayTR 3D Secure doğrudan kart ödemesi ile tutar direkt halısaha işletmesine iletilir.',
  },
  {
    step: '04',
    icon: 'verified-user',
    color: '#88f6ff',
    title: 'GÜVENİLİRLİK & ANTİ-FLAKER SİSTEMİ',
    desc: 'Sahte istatistikleri ve maça son anda gelmeyenleri engelleyen Güvenilirlik Skoru (%98). Yarı yolda bırakan oyuncuların profilinde kırmızı uyarı belirir.',
  },
  {
    step: '05',
    icon: 'camera-alt',
    color: '#ff7351',
    title: 'INSTAGRAM STORY MAÇ KARTI',
    desc: 'Maç sonuçlarını ve MVP görselini 9:16 formatında neon Instagram Story kartına dönüştürüp tek tıkla sosyal medyada veya grupta paylaş!',
  },
];

export const AppGuideModal: React.FC<AppGuideModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [currentIdx, setCurrentIdx] = useState(0);

  const slide = GUIDE_SLIDES[currentIdx];

  const handleNext = () => {
    if (currentIdx < GUIDE_SLIDES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="help-outline" size={24} color={theme.primary} />
              <Text style={styles.headerTitle}>H.İ.V. NASIL KULLANILIR?</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>ADIM {slide.step} / 05</Text>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: `${slide.color}20`, borderColor: slide.color }]}>
              <MaterialIcons name={slide.icon as any} size={48} color={slide.color} />
            </View>

            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {GUIDE_SLIDES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentIdx && { backgroundColor: slide.color, width: 24 },
                  ]}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {currentIdx > 0 ? (
              <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                <MaterialIcons name="chevron-left" size={20} color={theme.textMuted} />
                <Text style={styles.prevBtnText}>ÖNCEKİ</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: slide.color }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx === GUIDE_SLIDES.length - 1 ? 'HARİKA, ANLADIM!' : 'SONRAKİ'}
              </Text>
              <MaterialIcons
                name={currentIdx === GUIDE_SLIDES.length - 1 ? 'check' : 'chevron-right'}
                size={20}
                color={theme.onPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 380, backgroundColor: theme.background, borderRadius: 24, paddingBottom: 20, borderWidth: 1, borderColor: theme.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.primary, fontStyle: 'italic', letterSpacing: -0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, alignItems: 'center' },
  stepBadge: { backgroundColor: theme.surfaceContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 16 },
  stepBadgeText: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.textMuted, letterSpacing: 1 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 20 },
  slideTitle: { fontFamily: Fonts.headlineBold, fontSize: 18, color: theme.text, textAlign: 'center', marginBottom: 10 },
  slideDesc: { fontFamily: Fonts.body, fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.surfaceContainerHighest },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  prevBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, borderRadius: 12, backgroundColor: theme.surfaceContainer },
  prevBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.textMuted },
  nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12 },
  nextBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.onPrimary, letterSpacing: 0.5 },
});
