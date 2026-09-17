import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/dbService';

interface MatchPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  matchId: string;
  matchTitle?: string;
  amount?: number;
  isGoalkeeper?: boolean;
  isGkFree?: boolean;
  organizerName?: string;
  organizerIban?: string;
  organizerIbanName?: string;
  organizerBankName?: string;
  userSlotKey?: string | null;
  currentStatus?: 'paid' | 'pending_approval' | 'unpaid' | 'cash_on_pitch' | 'exempt';
  onSuccess?: (newStatus: 'pending_approval' | 'cash_on_pitch') => void;
}

export const MatchPaymentModal: React.FC<MatchPaymentModalProps> = ({
  visible,
  onClose,
  matchId,
  matchTitle = 'Halısaha Maçı',
  amount = 150,
  isGoalkeeper = false,
  isGkFree = false,
  organizerName = 'Kaptan',
  organizerIban = '',
  organizerIbanName = '',
  organizerBankName = '',
  userSlotKey,
  currentStatus = 'unpaid',
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles(theme);

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isExempt = isGoalkeeper && isGkFree;

  // Format IBAN for clean display
  const formatIban = (iban: string) => {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCopyIban = async () => {
    if (!organizerIban) return;
    const clean = organizerIban.replace(/\s+/g, '').toUpperCase();
    await Clipboard.setStringAsync(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNotifyIbanPayment = async () => {
    if (!userSlotKey) {
      Alert.alert('Kadroda Değilsiniz', 'Ödeme bildirebilmek için önce sahada bir mevkiye katılmalısınız.');
      return;
    }

    setSubmitting(true);
    try {
      await dbService.updateSlotPayment(matchId, userSlotKey, false, 'pending_approval', 'iban');

      // Send automatic message to match room chat
      const senderName = user?.name || 'Oyuncu';
      await dbService.sendMessage(`match_${matchId}`, {
        senderId: user?.uid || 'anon',
        senderName: senderName,
        senderAvatar: user?.avatar,
        text: `💸 [Ödeme]: ${senderName}, ${amount} ₺ maç ücretini kaptanın IBAN'ına gönderdiğini bildirdi (Onay Bekliyor).`
      });

      if (onSuccess) onSuccess('pending_approval');

      Alert.alert(
        '✓ Bildirim Gönderildi!',
        `Kaptana ödemeyi FAST ile gönderdiğiniz bildirildi.\n\nKaptan banka hesabını kontrol edip onayladığında kadro durumunuz yeşil "ÖDENDİ" olacaktır.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    } catch (e) {
      console.error('Ödeme bildirme hatası:', e);
      Alert.alert('Hata', 'Ödeme bildirimi iletilirken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCashOnPitch = async () => {
    if (!userSlotKey) {
      Alert.alert('Kadroda Değilsiniz', 'Ödeme tercihi bildirebilmek için önce sahada bir mevkiye katılmalısınız.');
      return;
    }

    setSubmitting(true);
    try {
      await dbService.updateSlotPayment(matchId, userSlotKey, false, 'cash_on_pitch', 'cash');

      // Send automatic message to match room chat
      const senderName = user?.name || 'Oyuncu';
      await dbService.sendMessage(`match_${matchId}`, {
        senderId: user?.uid || 'anon',
        senderName: senderName,
        senderAvatar: user?.avatar,
        text: `💵 [Nakit]: ${senderName}, maç ücretini (${amount} ₺) sahada elden nakit ödeyeceğini belirtti.`
      });

      if (onSuccess) onSuccess('cash_on_pitch');

      Alert.alert(
        '✓ Tercih Kaydedildi',
        `Maç ücretini sahada elden nakit ödeyeceğiniz kaydedildi. Maç öncesi kaptana ödemeyi teslim etmeyi unutmayın.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    } catch (e) {
      console.error('Nakit tercihi kaydetme hatası:', e);
      Alert.alert('Hata', 'Nakit tercihi kaydedilirken bir sorun oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="sports-soccer" size={24} color={theme.primary} />
              <View>
                <Text style={styles.headerTitle}>MAÇ ÜCRETİ & ÖDEME</Text>
                <Text style={styles.headerSub}>KAPTANA FAST YA DA SAHADA NAKİT</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Kapat" accessibilityRole="button">
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Amount Summary */}
            <View style={[styles.summaryCard, isExempt && styles.summaryCardExempt]}>
              <Text style={styles.summaryLabel}>
                {isExempt ? 'KALECİ ÜCRET MUAFİYETİ' : 'ÖDENECEK KİŞİ BAŞI PAY'}
              </Text>
              <Text style={[styles.summaryAmount, isExempt && { color: theme.secondary }]}>
                {isExempt ? '0 ₺' : `${amount} ₺`}
              </Text>
              <Text style={styles.summaryMatch} numberOfLines={1}>{matchTitle}</Text>
              <View style={styles.badgeRow}>
                <MaterialIcons name="verified-user" size={13} color={theme.primary} />
                <Text style={styles.badgeText}>
                  {isExempt 
                    ? 'Bu maçta kalecilerden ücret alınmamaktadır.' 
                    : 'Uygulama aracı ücreti almaz • Doğrudan Kaptana'}
                </Text>
              </View>
            </View>

            {isExempt ? (
              <View style={styles.exemptInfoBox}>
                <MaterialIcons name="sports-handball" size={32} color={theme.secondary} />
                <Text style={styles.exemptInfoTitle}>Ödeme Yapmanıza Gerek Yok!</Text>
                <Text style={styles.exemptInfoDesc}>
                  Organizatör kaleciler için ücret muafiyeti tanımladı. İyi kurtarışlar dileriz! 🧤
                </Text>
              </View>
            ) : (
              <>
                {/* 1. SEÇENEK: KAPTANIN IBAN'INA GÖNDER */}
                <View style={styles.sectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="account-balance" size={20} color={theme.primary} />
                    <Text style={styles.sectionTitle}>1. KAPTANIN IBAN'INA GÖNDER (FAST)</Text>
                  </View>

                  {organizerIban ? (
                    <View style={styles.ibanCard}>
                      <View style={styles.ibanTopRow}>
                        <View>
                          <Text style={styles.bankLabel}>Banka</Text>
                          <Text style={styles.bankValue}>{organizerBankName || 'Banka Hesabı'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.bankLabel}>Hesap Sahibi</Text>
                          <Text style={styles.bankValue}>{organizerIbanName || organizerName || 'Kaptan'}</Text>
                        </View>
                      </View>

                      <View style={styles.ibanNumberBox}>
                        <Text style={styles.ibanNumberText} selectable>
                          {formatIban(organizerIban)}
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={[styles.copyIbanBtn, copied && styles.copyIbanBtnDone]} 
                        onPress={handleCopyIban}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name={copied ? "check" : "content-copy"} size={16} color={copied ? theme.onPrimary : theme.background} />
                        <Text style={[styles.copyIbanText, copied && { color: theme.onPrimary }]}>
                          {copied ? 'IBAN KOPYALANDI!' : 'IBAN\'I KOPYALA'}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.tipBox}>
                        <MaterialIcons name="info-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.tipText}>
                          FAST ile gönderirken açıklama kısmına <Text style={{ color: theme.primary, fontWeight: 'bold' }}>"{user?.name || 'Adınız'}"</Text> yazmayı unutmayın.
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={[styles.notifyBtn, submitting && { opacity: 0.7 }]}
                        onPress={handleNotifyIbanPayment}
                        disabled={submitting}
                        activeOpacity={0.85}
                      >
                        <MaterialIcons name="send" size={16} color={theme.background} />
                        <Text style={styles.notifyBtnText}>
                          {submitting ? 'İLETİLİYOR...' : 'ÖDEMEYİ GÖNDERDİM (KAPTANA BİLDİR)'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.noIbanBox}>
                      <MaterialIcons name="info-outline" size={24} color={theme.textMuted} />
                      <Text style={styles.noIbanTitle}>Kaptan Henüz IBAN Girmemiş</Text>
                      <Text style={styles.noIbanSub}>
                        Kaptan {organizerName} henüz maç için IBAN tanımlamamış. Maç sohbetinden IBAN isteyebilir veya sahada nakit ödeyebilirsiniz.
                      </Text>
                    </View>
                  )}
                </View>

                {/* 2. SEÇENEK: SAHADA NAKİT ÖDEME */}
                <View style={styles.sectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="payments" size={20} color={theme.secondary} />
                    <Text style={styles.sectionTitle}>2. SAHADA ELDEN ÖDE</Text>
                  </View>
                  <Text style={styles.cashDesc}>
                    Maç saatinde sahaya geldiğinizde {amount} ₺ nakit olarak doğrudan kaptana elden teslim edebilirsiniz.
                  </Text>

                  <TouchableOpacity 
                    style={[styles.cashBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSelectCashOnPitch}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="handshake" size={18} color={theme.secondary} />
                    <Text style={styles.cashBtnText}>
                      SAHADA NAKİT ÖDEYECEĞİM
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.primary,
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainerHighest,
  },
  body: {
    padding: 20,
    gap: 18,
  },
  summaryCard: {
    backgroundColor: `${theme.primary}12`,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${theme.primary}30`,
  },
  summaryCardExempt: {
    backgroundColor: `${theme.secondary}12`,
    borderColor: `${theme.secondary}30`,
  },
  summaryLabel: {
    fontFamily: Fonts.headlineBold,
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 1,
  },
  summaryAmount: {
    fontFamily: Fonts.headlineBold,
    fontSize: 34,
    color: theme.primary,
    marginVertical: 4,
  },
  summaryMatch: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: `${theme.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.primary,
  },
  exemptInfoBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: theme.surfaceContainerHighest,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  exemptInfoTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 16,
    color: theme.text,
  },
  exemptInfoDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionBox: {
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.text,
    letterSpacing: 0.5,
  },
  ibanCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  ibanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: theme.textMuted,
  },
  bankValue: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
  },
  ibanNumberBox: {
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    alignItems: 'center',
  },
  ibanNumberText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    color: theme.primary,
    letterSpacing: 1,
  },
  copyIbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyIbanBtnDone: {
    backgroundColor: theme.secondary,
  },
  copyIbanText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tipText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    flex: 1,
    lineHeight: 15,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  notifyBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.background,
    letterSpacing: 0.5,
  },
  noIbanBox: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 6,
  },
  noIbanTitle: {
    fontFamily: Fonts.headlineBold,
    fontSize: 13,
    color: theme.text,
  },
  noIbanSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  cashDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 17,
  },
  cashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${theme.secondary}20`,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.secondary,
  },
  cashBtnText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 12,
    color: theme.secondary,
    letterSpacing: 0.5,
  },
});
