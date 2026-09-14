import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { AppModal as Modal } from '@/components/AppModal';

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

  useEffect(() => {
    if (visible) {
      setCurrentIdx(0);
    }
  }, [visible]);

  if (!visible) return null;

  const slide = GUIDE_SLIDES[currentIdx];

  const handleNext = () => {
    if (currentIdx < GUIDE_SLIDES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(0);
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleClose = () => {
    setCurrentIdx(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="help-outline" size={20} color={theme.primary} />
              <Text style={styles.headerTitle} numberOfLines={1}>H.İ.V. NASIL KULLANILIR?</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>ADIM {slide.step} / 05</Text>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: `${slide.color}20`, borderColor: slide.color }]}>
              <MaterialIcons name={slide.icon as any} size={38} color={slide.color} />
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
                    idx === currentIdx && { backgroundColor: slide.color, width: 20 },
                  ]}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {currentIdx > 0 ? (
              <TouchableOpacity style={styles.prevBtn} onPress={handlePrev} activeOpacity={0.8}>
                <MaterialIcons name="chevron-left" size={18} color={theme.textMuted} />
                <Text style={styles.prevBtnText}>ÖNCEKİ</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity 
              style={[styles.nextBtn, { backgroundColor: slide.color }]} 
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {currentIdx === GUIDE_SLIDES.length - 1 ? 'BAŞLA' : 'İLERLE'}
              </Text>
              <MaterialIcons
                name={currentIdx === GUIDE_SLIDES.length - 1 ? 'check' : 'chevron-right'}
                size={18}
                color="#090B10"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 20 
  },
  modalContent: { 
    width: '100%', 
    maxWidth: 358, 
    backgroundColor: theme.surface, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    flex: 1, 
    marginRight: 8 
  },
  headerTitle: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 13, 
    color: theme.primary, 
    fontStyle: 'italic', 
    letterSpacing: 0.5 
  },
  closeBtn: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: theme.surfaceContainerHighest, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  body: { 
    paddingHorizontal: 18, 
    paddingVertical: 18, 
    alignItems: 'center' 
  },
  stepBadge: { 
    backgroundColor: theme.surfaceContainerHighest, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 14 
  },
  stepBadgeText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 10, 
    color: theme.textMuted, 
    letterSpacing: 1 
  },
  iconCircle: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    marginBottom: 14 
  },
  slideTitle: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 15, 
    color: theme.text, 
    textAlign: 'center', 
    marginBottom: 8,
    lineHeight: 20,
    letterSpacing: 0.3 
  },
  slideDesc: { 
    fontFamily: Fonts.body, 
    fontSize: 12, 
    color: theme.textMuted, 
    textAlign: 'center', 
    lineHeight: 18, 
    marginBottom: 16,
    paddingHorizontal: 4 
  },
  dotsRow: { 
    flexDirection: 'row', 
    gap: 6, 
    alignItems: 'center' 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: theme.surfaceContainerHighest 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    gap: 10,
    backgroundColor: theme.surface 
  },
  prevBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    height: 42, 
    borderRadius: 12, 
    backgroundColor: theme.surfaceContainerHighest 
  },
  prevBtnText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 11, 
    color: theme.textMuted,
    letterSpacing: 0.5 
  },
  nextBtn: { 
    flex: 2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    height: 42, 
    borderRadius: 12 
  },
  nextBtnText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 12, 
    color: '#090B10', 
    letterSpacing: 0.5,
    fontWeight: '800' 
  },
});
