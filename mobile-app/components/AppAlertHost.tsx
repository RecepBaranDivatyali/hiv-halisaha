import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AppModal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { appAlert, AppAlertRequest } from '@/services/appAlert';

type AlertButtonLike = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export const AppAlertHost: React.FC = () => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [request, setRequest] = useState<AppAlertRequest | null>(null);

  useEffect(() => {
    const unsubscribe = appAlert.subscribe((nextRequest) => {
      setRequest(nextRequest);
    });
    return unsubscribe;
  }, []);

  const handleDismissOrCancel = useCallback(() => {
    if (!request) return;
    if ((request as any).cancelable === false) return;
    const buttons: AlertButtonLike[] = Array.isArray(request.buttons) ? request.buttons : [];
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    appAlert.dismiss();
    if (cancelBtn?.onPress) {
      cancelBtn.onPress();
    }
  }, [request]);

  const handleButtonPress = useCallback((btn: AlertButtonLike) => {
    const callback = btn.onPress;
    appAlert.dismiss();
    if (callback) {
      callback();
    }
  }, []);

  if (!request) return null;

  const buttons: AlertButtonLike[] =
    Array.isArray(request.buttons) && request.buttons.length > 0
      ? request.buttons
      : [{ text: 'Tamam', style: 'default' }];

  const isMultiOptionSheet = buttons.length >= 3;
  const hasDestructive = buttons.some((b) => b.style === 'destructive');

  return (
    <AppModal
      visible={Boolean(request)}
      transparent
      animationType="fade"
      zIndex={110000}
      onClose={handleDismissOrCancel}
      onRequestClose={handleDismissOrCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDismissOrCancel}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: hasDestructive ? `${theme.error}1F` : `${theme.primary}1F`,
                  borderColor: hasDestructive ? `${theme.error}55` : `${theme.primary}55`,
                },
              ]}
            >
              <MaterialIcons
                name={hasDestructive ? 'warning-amber' : isMultiOptionSheet ? 'list-alt' : 'info-outline'}
                size={22}
                color={hasDestructive ? theme.error : theme.primary}
              />
            </View>
            <Text style={styles.title}>{request.title}</Text>
          </View>

          {/* Message */}
          {Boolean(request.message) && (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.message}>{request.message}</Text>
            </ScrollView>
          )}

          {/* Buttons: Dikey şık liste (1, 2, 3, 5+ buton desteği) */}
          <ScrollView
            style={styles.buttonsScroll}
            contentContainerStyle={styles.buttonsList}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimarySolid = !isDestructive && !isCancel && (!isMultiOptionSheet || idx === 0);

              return (
                <TouchableOpacity
                  key={`${btn.text}-${idx}`}
                  style={[
                    styles.actionBtn,
                    isDestructive && styles.actionBtnDestructive,
                    isCancel && styles.actionBtnCancel,
                    !isDestructive && !isCancel && (isPrimarySolid ? styles.actionBtnPrimary : styles.actionBtnOption),
                  ]}
                  activeOpacity={0.82}
                  onPress={() => handleButtonPress(btn)}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      isDestructive && styles.actionBtnTextDestructive,
                      isCancel && styles.actionBtnTextCancel,
                      !isDestructive && !isCancel && (isPrimarySolid ? styles.actionBtnTextPrimary : styles.actionBtnTextOption),
                    ]}
                    numberOfLines={2}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </AppModal>
  );
};

const useStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 368,
      maxHeight: '86%',
      backgroundColor: theme.surface,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 24,
      gap: 14,
    },
    header: {
      alignItems: 'center',
      gap: 10,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    title: {
      fontFamily: Fonts.headlineBold,
      fontSize: 16,
      color: theme.text,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    messageScroll: {
      maxHeight: 220,
    },
    messageScrollContent: {
      paddingHorizontal: 2,
    },
    message: {
      fontFamily: Fonts.body,
      fontSize: 13.5,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    buttonsScroll: {
      maxHeight: 300,
    },
    buttonsList: {
      gap: 9,
      paddingTop: 2,
    },
    actionBtn: {
      width: '100%',
      minHeight: 46,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnPrimary: {
      backgroundColor: theme.primary,
    },
    actionBtnOption: {
      backgroundColor: `${theme.primary}1A`,
      borderWidth: 1,
      borderColor: `${theme.primary}66`,
    },
    actionBtnDestructive: {
      backgroundColor: `${theme.error}1F`,
      borderWidth: 1.5,
      borderColor: theme.error,
    },
    actionBtnCancel: {
      backgroundColor: theme.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionBtnText: {
      fontFamily: Fonts.headlineBold,
      fontSize: 13.5,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    actionBtnTextPrimary: {
      color: theme.onPrimary,
    },
    actionBtnTextOption: {
      color: theme.primary,
    },
    actionBtnTextDestructive: {
      color: theme.error,
    },
    actionBtnTextCancel: {
      color: theme.textMuted,
    },
  });

export default AppAlertHost;
