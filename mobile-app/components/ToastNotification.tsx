import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Fonts, ThemeColors } from '@/constants/theme';

export interface ToastMessage {
  id: string;
  type: 'match' | 'chat' | 'alert' | 'reminder' | 'success';
  title: string;
  message: string;
  time?: string;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles(theme, insets.top);

  const translateY = useSharedValue(-120);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 250 }, (isFinished) => {
      if (isFinished) {
        runOnJS(onDismiss)();
      }
    });
  }, [translateY, onDismiss]);

  useEffect(() => {
    if (toast) {
      // Slide down animation with bounciness
      translateY.value = withSpring(16, { damping: 12, stiffness: 100, mass: 0.8 });

      // Auto dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [toast, translateY, hideToast]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'match':
        return { name: 'sports-soccer', color: theme.primary };
      case 'chat':
        return { name: 'chat', color: theme.secondary };
      case 'alert':
        return { name: 'warning', color: theme.error };
      case 'reminder':
        return { name: 'alarm', color: theme.warning };
      case 'success':
        return { name: 'check-circle', color: theme.success };
      default:
        return { name: 'notifications', color: theme.primary };
    }
  };

  const iconInfo = getIcon();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={hideToast}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}20` }]}>
          <MaterialIcons name={iconInfo.name as any} size={20} color={iconInfo.color} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: iconInfo.color }]}>{toast.title}</Text>
            <Text style={styles.timeText}>{toast.time || 'Az önce'}</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={2}>{toast.message}</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={hideToast} accessibilityLabel="Kapat" accessibilityRole="button">
          <MaterialIcons name="close" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const useStyles = (theme: ThemeColors, topInset: number) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: Math.max(topInset, 16),
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },
  messageText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
