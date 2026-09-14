import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { AppModal as Modal } from '@/components/AppModal';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { Bouncable } from '@/components/Bouncable';
import { useTheme } from '@/context/ThemeContext';

interface DirectPaymentModalProps {
  amount?: number;
  matchTitle?: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DirectPaymentModal: React.FC<DirectPaymentModalProps> = ({
  amount = 150,
  matchTitle = 'Beşiktaş Arena Halısaha Maçı',
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePay = () => {
    if (!cardNumber || !expiry || !cvc) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm kart bilgilerini doldurun.');
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setCardName('');
      Alert.alert(
        '💳 Ödeme Başarılı!',
        `${amount} ₺ tutarındaki ödemeniz 3D Secure ile doğrudan işletmeye aktarıldı. Uygulamada bakiye tutulmaz.`,
        [
          {
            text: 'Tamam',
            onPress: () => {
              if (onSuccess) onSuccess();
              onClose();
            },
          },
        ]
      );
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="credit-card" size={24} color={theme.primary} />
              <View>
                <Text style={styles.headerTitle}>DOĞRUDAN ÖDEME</Text>
                <Text style={styles.headerSub}>3D SECURE GÜVENLİ ÖDEME</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Amount Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>ÖDENECEK TUTAR</Text>
              <Text style={styles.summaryAmount}>{amount} ₺</Text>
              <Text style={styles.summaryMatch}>{matchTitle}</Text>
              <View style={styles.noWalletBadge}>
                <MaterialIcons name="security" size={12} color={theme.primary} />
                <Text style={styles.noWalletText}>Komisyonsuz • Direkt İşletmeye Aktarılır</Text>
              </View>
            </View>

            {/* Card Inputs */}
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Kart Üzerindeki İsim"
                  placeholderTextColor={theme.textMuted}
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="credit-card" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Kart Numarası (____ ____ ____ ____)"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
              </View>

              <View style={styles.row2Col}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <MaterialIcons name="date-range" size={18} color={theme.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="AA/YY"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    maxLength={5}
                    value={expiry}
                    onChangeText={setExpiry}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <MaterialIcons name="lock" size={18} color={theme.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="CVC / CVV"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    value={cvc}
                    onChangeText={setCvc}
                  />
                </View>
              </View>
            </View>

            {/* Security Guarantee Note */}
            <View style={styles.securityNote}>
              <MaterialIcons name="verified-user" size={16} color={theme.secondary} />
              <Text style={styles.securityNoteText}>
                256-bit SSL ve 3D Secure ile korunan direkt POS işlemi.
              </Text>
            </View>
          </ScrollView>

          {/* Submit */}
          <View style={styles.footer}>
            <Bouncable style={styles.payBtn} onPress={handlePay} disabled={loading}>
              {loading ? (
                <Text style={styles.payBtnText}>İŞLENİYOR...</Text>
              ) : (
                <Text style={styles.payBtnText}>ÖDEMEYİ TAMAMLA</Text>
              )}
            </Bouncable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.text, letterSpacing: -0.5 },
  headerSub: { fontFamily: Fonts.body, fontSize: 9, color: theme.primary, fontWeight: 'bold', letterSpacing: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 24, gap: 20 },
  summaryCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: `${theme.primary}4D`, gap: 4 },
  summaryLabel: { fontFamily: Fonts.headlineBold, fontSize: 10, color: theme.textMuted, letterSpacing: 1.5 },
  summaryAmount: { fontFamily: Fonts.headlineBold, fontSize: 36, color: theme.primary, fontStyle: 'italic' },
  summaryMatch: { fontFamily: Fonts.body, fontSize: 13, color: theme.text },
  noWalletBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.primary}1A`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  noWalletText: { fontFamily: Fonts.body, fontSize: 10, color: theme.primary, fontWeight: 'bold' },
  formGroup: { gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surfaceContainer, borderRadius: 12, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: theme.border },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 14, color: theme.text },
  row2Col: { flexDirection: 'row', gap: 12 },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${theme.secondary}1A`, padding: 12, borderRadius: 10 },
  securityNoteText: { fontFamily: Fonts.body, fontSize: 11, color: theme.secondary, flex: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  payBtn: { backgroundColor: theme.primary, height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  payBtnText: { fontFamily: Fonts.headlineBold, fontSize: 16, color: theme.onPrimary, fontStyle: 'italic', letterSpacing: 1 },
});
