import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface WeatherAlertCardProps {
  city?: string;
  temp?: string;
  rainRisk?: number;
  condition?: string;
  isOpenField?: boolean;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'ankara': { lat: 39.9334, lon: 32.8597 },
  'izmir': { lat: 38.4192, lon: 27.1287 },
  'bursa': { lat: 40.1828, lon: 29.0667 },
  'antalya': { lat: 36.8841, lon: 30.7056 },
  'adana': { lat: 37.0000, lon: 35.3213 },
  'trabzon': { lat: 41.0027, lon: 39.7168 },
  'eskişehir': { lat: 39.7767, lon: 30.5206 },
  'eskisehir': { lat: 39.7767, lon: 30.5206 },
  'samsun': { lat: 41.2867, lon: 36.3300 },
  'gaziantep': { lat: 37.0662, lon: 37.3833 },
  'konya': { lat: 37.8667, lon: 32.4833 },
};

function getWeatherInfo(code: number): { condition: string; rainRisk: number; icon: string } {
  if (code === 0) return { condition: 'Açık / Güneşli', rainRisk: 5, icon: 'wb-sunny' };
  if (code === 1 || code === 2) return { condition: 'Az Bulutlu', rainRisk: 15, icon: 'wb-cloudy' };
  if (code === 3) return { condition: 'Parçalı Bulutlu', rainRisk: 25, icon: 'cloud' };
  if (code === 45 || code === 48) return { condition: 'Sisli', rainRisk: 30, icon: 'filter-drama' };
  if (code >= 51 && code <= 57) return { condition: 'Çiseleyen Yağmur', rainRisk: 65, icon: 'grain' };
  if (code >= 61 && code <= 67) return { condition: 'Yağmurlu', rainRisk: 80, icon: 'water-drop' };
  if (code >= 71 && code <= 77) return { condition: 'Kar Yağışlı', rainRisk: 75, icon: 'ac-unit' };
  if (code >= 80 && code <= 82) return { condition: 'Sağanak Yağış', rainRisk: 90, icon: 'grain' };
  if (code >= 95) return { condition: 'Gök Gürültülü Fırtına', rainRisk: 95, icon: 'flash-on' };
  return { condition: 'Bulutlu', rainRisk: 30, icon: 'cloud' };
}

export const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({
  city = 'İstanbul',
  temp,
  rainRisk,
  condition,
  isOpenField = true,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);

  const [currentTemp, setCurrentTemp] = useState(temp || '18°C');
  const [currentRainRisk, setCurrentRainRisk] = useState(rainRisk ?? 25);
  const [currentCondition, setCurrentCondition] = useState(condition || 'Parçalı Bulutlu');
  const [currentIcon, setCurrentIcon] = useState('cloud');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If explicit props were passed, use them
    if (temp && rainRisk !== undefined && condition) {
      setCurrentTemp(temp);
      setCurrentRainRisk(rainRisk);
      setCurrentCondition(condition);
      return;
    }

    let isMounted = true;
    const fetchLiveWeather = async () => {
      try {
        setLoading(true);
        const cityKey = city.toLowerCase().trim();
        const coords = CITY_COORDS[cityKey] || CITY_COORDS['istanbul'];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        
        if (data?.current && isMounted) {
          const t = `${Math.round(data.current.temperature_2m)}°C`;
          const wInfo = getWeatherInfo(data.current.weather_code);
          setCurrentTemp(t);
          setCurrentRainRisk(wInfo.rainRisk);
          setCurrentCondition(wInfo.condition);
          setCurrentIcon(wInfo.icon);
        }
      } catch (err) {
        // Fallback default
        if (isMounted) {
          setCurrentTemp('19°C');
          setCurrentRainRisk(20);
          setCurrentCondition('Parçalı Bulutlu');
          setCurrentIcon('cloud');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveWeather();
    return () => { isMounted = false; };
  }, [city, temp, rainRisk, condition]);

  const handleWeatherAdvice = () => {
    Alert.alert(
      `🌤️ ${city} Canlı Hava Durumu`,
      `Şu an ${city}'de hava ${currentTemp} ve ${currentCondition.toLowerCase()} (%${currentRainRisk} yağış olasılığı).\n\n• Saha Tipi: ${isOpenField ? 'Açık Saha' : 'Kapalı Saha'}\n• Tavsiye: ${isOpenField ? (currentRainRisk > 50 ? 'Yağış riski yüksek! Çim kramponu ve yağmurluk almayı unutmayın.' : 'Hava futbol için gayet elverişli. Keyifli maçlar!') : 'Tesis kapalı olduğu için maç hava şartlarından etkilenmeyecektir.'}`,
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handleWeatherAdvice}>
      <View style={styles.leftRow}>
        <View style={styles.iconBox}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.secondary} />
          ) : (
            <MaterialIcons name={currentIcon as any} size={20} color={theme.secondary} />
          )}
        </View>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.cityName}>{city}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.tempText}>{currentTemp}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.conditionText}>{currentCondition} (%{currentRainRisk})</Text>
          </View>
          <Text style={styles.subText}>
            {isOpenField ? (currentRainRisk > 50 ? '⚠️ Açık Saha — Krampon & Yağmurluk Alın!' : '☀️ Açık Saha — Futbol İçin İdeal Hava') : '✅ Kapalı Saha — Hava Şartlarından Etkilenmez'}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cityName: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.secondary },
  tempText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  dot: { color: theme.textMuted, fontSize: 12 },
  conditionText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.secondary },
  subText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, marginTop: 2 },
});
