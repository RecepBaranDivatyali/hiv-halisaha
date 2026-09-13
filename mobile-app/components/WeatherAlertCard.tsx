import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface WeatherAlertCardProps {
  temp?: string;
  rainRisk?: number;
  condition?: string;
  isOpenField?: boolean;
}

export const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({
  temp = '14°C',
  rainRisk = 85,
  condition = 'Sağanak Yağış Riski',
  isOpenField = false,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const handleWeatherAdvice = () => {
    Alert.alert(
      '🌧️ Hava Durumu & Saha Tavsiyesi',
      `Maç saatinde %${rainRisk} oranında ${condition.toLowerCase()} bekleniyor.\n\n• Saha Tipi: ${isOpenField ? 'Açık Saha' : 'Kapalı Saha'}\n• Tavsiye: ${isOpenField ? 'Açık saha maçı olduğu için yedek krampon ve yağmurluk almayı unutmayın.' : 'Tesis kapalı olduğu için maç hava şartlarından etkilenmeyecektir.'}`,
      [{ text: 'Anladım', style: 'default' }]
    );
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handleWeatherAdvice}>
      <View style={styles.leftRow}>
        <View style={styles.iconBox}>
          <MaterialIcons name="grain" size={20} color={theme.secondary} />
        </View>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.tempText}>{temp}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.conditionText}>{condition} (%{rainRisk})</Text>
          </View>
          <Text style={styles.subText}>
            {isOpenField ? '⚠️ Açık Saha — Krampon & Yağmurluk Alın!' : '✅ Kapalı Saha — Hava Şartlarından Etkilenmez'}
          </Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.secondary} />
    </TouchableOpacity>
  );
};

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${theme.secondary}1A`,
    borderWidth: 1,
    borderColor: `${theme.secondary}4D`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.secondary}26`, alignItems: 'center', justifyContent: 'center' },
  infoCol: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tempText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  dot: { color: theme.textMuted, fontSize: 12 },
  conditionText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.secondary },
  subText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
});
