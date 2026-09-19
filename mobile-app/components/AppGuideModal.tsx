import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions, 
  TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { AppModal as Modal } from '@/components/AppModal';

interface AppGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface GuideSlide {
  step: string;
  icon: string;
  color: string;
  badge: string;
  title: string;
  desc: string;
  tip: string;
}

export const GUIDE_SLIDES: GuideSlide[] = [
  {
    step: '01',
    icon: 'sports-soccer',
    color: '#22c55e',
    badge: 'REZERVASYON & MAÇLAR',
    title: 'MAÇ OLUŞTUR & REZERVASYON ESNEKLİĞİ',
    desc: 'Sahan hazırsa "Sahası Hazır" olarak maç aç. Saha tutulmadıysa veya saat esnekse "Saha Aranıyor" diyerek ilanını yayınla, sahası olan rakiplerle anında eşleş!',
    tip: '💡 Tesis listesinden seçim yapabilir veya istediğin ilçede saha arayabilirsin.',
  },
  {
    step: '02',
    icon: 'radar',
    color: '#38bdf8',
    badge: 'OYUNCU RADARI',
    title: 'MAÇ ARIYORUM SİNYALİ (BEACON)',
    desc: 'Canın maç mı istedi? "Bugün veya Yarın Maç Arıyorum" sinyalini yak! Eksik oyuncusu olan kaptanlar seni hemen kadroya alsın ya da arama ekranından maç arayanları tek tıkla transfer et.',
    tip: '💡 Kaptanlara özel not ve oynamak istediğin mevkileri belirtebilirsin.',
  },
  {
    step: '03',
    icon: 'view-quilt',
    color: '#a855f7',
    badge: 'KADRO & DİZİLİŞ',
    title: '2D TAKTİK SAHA & MEVKİİNİ SEÇ',
    desc: 'Maç Odasındaki interaktif sahada takımının dizilişini (1-2-3-1, 1-3-2 vb.) belirle. Kaleci, Defans, Orta Saha veya Forvet mevkiine geç. Sol sekmede Takım Sohbeti, sağ sekmede Genel Sohbet ile taktik konuş!',
    tip: '💡 Kaptanlar dizilişi değiştirebilir ve oyuncu mevkilerini ayarlayabilir.',
  },
  {
    step: '04',
    icon: 'sports-mma',
    color: '#f59e0b',
    badge: 'KULÜP & MEYDAN OKUMA',
    title: 'KULÜP KUR & RAKİP BUL',
    desc: 'Kendi halısaha takımını kur, amblemini ve formanı seç. Rakip arama ekranında tarihine ve rezervasyon durumuna göre denk takımları bul, meydan oku ve maça davet et!',
    tip: '💡 Takım başarımları kazanın ve haftalık kulüp liginde zirveye oynayın.',
  },
  {
    step: '05',
    icon: 'credit-card',
    color: '#06b6d4',
    badge: 'ŞEFFAF ÖDEME',
    title: 'KOMİSYONSUZ DOĞRUDAN ÖDEME',
    desc: 'Uygulamada komisyon kesilmez, cüzdanda para birikmez. Kaptanın IBAN\'ına ya da doğrudan halısaha işletmesine ödemeni güvenle yap; maç odasında ödeme durumunu anında gör!',
    tip: '💡 Kimse sahada para toplamak veya para üstü aramakla uğraşmaz.',
  },
  {
    step: '06',
    icon: 'military-tech',
    color: '#eab308',
    badge: 'FAIR PLAY & MVP',
    title: 'MAÇI DEĞERLENDİR & GÜVENİLİRLİK',
    desc: 'Maç bitince ana ekrandan hızlıca maçı ve oyuncuları değerlendir, maçın MVP\'sini seç. Son anda maça gelmeyen "flaker"lar güvenilirlik skoruyla elenir, dürüst oyuncular parlar!',
    tip: '💡 Her maç sonu 9:16 Instagram Story maç kartını oluşturup paylaşabilirsin.',
  },
];

export const AppGuideModal: React.FC<AppGuideModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const modalInnerWidth = Math.min(width - 48, 360);
  const styles = useStyles(theme, modalInnerWidth);

  const [currentIdx, setCurrentIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIdx(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible]);

  if (!visible) return null;

  const currentSlide = GUIDE_SLIDES[currentIdx];

  const goToSlide = (idx: number) => {
    if (idx < 0 || idx >= GUIDE_SLIDES.length) return;
    setCurrentIdx(idx);
    scrollRef.current?.scrollTo({ x: idx * modalInnerWidth, animated: true });
  };

  const handleNext = () => {
    if (currentIdx < GUIDE_SLIDES.length - 1) {
      goToSlide(currentIdx + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      goToSlide(currentIdx - 1);
    }
  };

  const handleClose = () => {
    setCurrentIdx(0);
    onClose();
  };

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    if (modalInnerWidth > 0) {
      const idx = Math.round(x / modalInnerWidth);
      if (idx >= 0 && idx < GUIDE_SLIDES.length && idx !== currentIdx) {
        setCurrentIdx(idx);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <MaterialIcons name="menu-book" size={20} color={theme.primary} />
                  <Text style={styles.headerTitle} numberOfLines={1}>H.İ.V. NASIL KULLANILIR?</Text>
                </View>
                <View style={styles.headerRightActions}>
                  <TouchableOpacity style={styles.skipBtn} onPress={handleClose} activeOpacity={0.7}>
                    <Text style={styles.skipBtnText}>KAPAT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
                    <MaterialIcons name="close" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sub-header: Step Badge & Category */}
              <View style={styles.subHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    ADIM {currentSlide.step} / {String(GUIDE_SLIDES.length).padStart(2, '0')}
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: `${currentSlide.color}20`, borderColor: `${currentSlide.color}50` }]}>
                  <Text style={[styles.categoryBadgeText, { color: currentSlide.color }]}>
                    {currentSlide.badge}
                  </Text>
                </View>
              </View>

              {/* Horizontal Swipeable Slides */}
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                style={{ width: modalInnerWidth }}
                contentContainerStyle={{ width: modalInnerWidth * GUIDE_SLIDES.length }}
              >
                {GUIDE_SLIDES.map((slide) => (
                  <View key={slide.step} style={[styles.slideContainer, { width: modalInnerWidth }]}>
                    <View style={[styles.iconCircle, { backgroundColor: `${slide.color}18`, borderColor: slide.color }]}>
                      <MaterialIcons name={slide.icon as any} size={36} color={slide.color} />
                    </View>

                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideDesc}>{slide.desc}</Text>

                    <View style={styles.tipBox}>
                      <Text style={styles.tipText}>{slide.tip}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Clickable Pagination Dots */}
              <View style={styles.dotsRow}>
                {GUIDE_SLIDES.map((s, idx) => (
                  <TouchableOpacity
                    key={s.step}
                    onPress={() => goToSlide(idx)}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    style={[
                      styles.dot,
                      idx === currentIdx && { backgroundColor: currentSlide.color, width: 22 },
                    ]}
                  />
                ))}
              </View>

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
                  style={[styles.nextBtn, { backgroundColor: currentSlide.color }]} 
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIdx === GUIDE_SLIDES.length - 1 ? 'ANLADIM, BAŞLA' : 'İLERLE'}
                  </Text>
                  <MaterialIcons
                    name={currentIdx === GUIDE_SLIDES.length - 1 ? 'check-circle' : 'chevron-right'}
                    size={18}
                    color="#090B10"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const useStyles = (theme: any, modalInnerWidth: number) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 20 
  },
  modalContent: { 
    width: modalInnerWidth,
    backgroundColor: theme.surface, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.borderSubtle,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 10,
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  closeBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: theme.surfaceContainerHighest, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  stepBadge: { 
    backgroundColor: theme.surfaceContainerHighest, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
  },
  stepBadgeText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 9, 
    color: theme.textMuted, 
    letterSpacing: 1 
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  slideContainer: { 
    paddingHorizontal: 18, 
    paddingTop: 10,
    paddingBottom: 12, 
    alignItems: 'center',
  },
  iconCircle: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    marginBottom: 12,
  },
  slideTitle: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 14, 
    color: theme.text, 
    textAlign: 'center', 
    marginBottom: 8,
    lineHeight: 19,
    letterSpacing: 0.3,
  },
  slideDesc: { 
    fontFamily: Fonts.body, 
    fontSize: 12, 
    color: theme.textMuted, 
    textAlign: 'center', 
    lineHeight: 18, 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tipBox: {
    width: '100%',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  tipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: theme.text,
    lineHeight: 16,
    textAlign: 'center',
  },
  dotsRow: { 
    flexDirection: 'row', 
    gap: 6, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: theme.surfaceContainerHighest,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    gap: 10,
    backgroundColor: theme.surface,
  },
  prevBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: theme.surfaceContainerHighest,
  },
  prevBtnText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 11, 
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  nextBtn: { 
    flex: 2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    height: 40, 
    borderRadius: 10, 
  },
  nextBtnText: { 
    fontFamily: Fonts.headlineBold, 
    fontSize: 12, 
    color: '#090B10', 
    letterSpacing: 0.5,
    fontWeight: '800',
  },
});
