import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { Bouncable } from '@/components/Bouncable';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { completeOnboarding } = useAuth();
  const { width } = useWindowDimensions();
  const styles = useStyles(theme, width);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const slides = [
    {
      id: '1',
      title: 'TAKIMINI KUR',
      subtitle: 'Kendi kulübünü yarat, logonu seç ve arkadaşlarını davet et. Efsane bir kadro oluştur!',
      icon: 'shield',
      color: theme.primary,
    },
    {
      id: '2',
      title: 'MAÇINI BUL',
      subtitle: 'Bölgendeki açık maçlara katıl veya kendi maç ilanını oluştur. Asla yedekte kalma.',
      icon: 'manage-search',
      color: theme.secondary,
    },
    {
      id: '3',
      title: 'SAHAYA İN',
      subtitle: 'Rakiplerine meydan oku, maç sonu değerlendirmeleri yap ve liderlik tablosuna tırman.',
      icon: 'sports-soccer',
      color: theme.tertiary,
    },
  ];

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setCurrentIndex(index);
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Animated.View entering={FadeInDown.delay(index * 200).springify()} style={[styles.iconBox, { backgroundColor: `${slide.color}15`, borderColor: `${slide.color}30` }]}>
              <MaterialIcons name={slide.icon as any} size={80} color={slide.color} />
            </Animated.View>
            <Animated.View entering={FadeInRight.delay(index * 200 + 200).springify()} style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination & Actions */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
                { backgroundColor: currentIndex === index ? theme.primary : theme.border }
              ]}
            />
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} accessibilityLabel="Atla" accessibilityRole="button">
            <Text style={styles.skipText}>ATLA</Text>
          </TouchableOpacity>
          <Bouncable 
            style={styles.nextBtn} 
            onPress={() => {
              if (currentIndex === slides.length - 1) {
                handleFinish();
              } else {
                scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
              }
            }}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex === slides.length - 1 ? 'HEMEN BAŞLA' : 'İLERLE →'}
            </Text>
          </Bouncable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = (theme: any, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconBox: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.headlineBold,
    fontSize: 32,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    padding: 12,
  },
  skipText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.textMuted,
  },
  nextBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.onPrimary,
  },
});
