import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { parseTargetTimestamp } from '@/services/dateUtils';

interface WeatherAlertCardProps {
  city?: string;
  district?: string;
  arena?: string;
  dateTime?: string;
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

const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  // Ankara
  'çankaya': { lat: 39.9045, lon: 32.8617 },
  'cankaya': { lat: 39.9045, lon: 32.8617 },
  'yenimahalle': { lat: 39.9702, lon: 32.7950 },
  'keçiören': { lat: 40.0076, lon: 32.8624 },
  'kecioren': { lat: 40.0076, lon: 32.8624 },
  'etimesgut': { lat: 39.9498, lon: 32.6756 },
  'mamak': { lat: 39.9428, lon: 32.9125 },
  'gölbaşı': { lat: 39.7915, lon: 32.8086 },
  'golbasi': { lat: 39.7915, lon: 32.8086 },
  'sincan': { lat: 39.9583, lon: 32.5772 },
  'altındağ': { lat: 39.9419, lon: 32.8543 },
  'altindag': { lat: 39.9419, lon: 32.8543 },

  // İstanbul
  'beşiktaş': { lat: 41.0422, lon: 29.0067 },
  'besiktas': { lat: 41.0422, lon: 29.0067 },
  'kadıköy': { lat: 40.9917, lon: 29.0270 },
  'kadikoy': { lat: 40.9917, lon: 29.0270 },
  'şişli': { lat: 41.0602, lon: 28.9877 },
  'sisli': { lat: 41.0602, lon: 28.9877 },
  'üsküdar': { lat: 41.0267, lon: 29.0156 },
  'uskudar': { lat: 41.0267, lon: 29.0156 },
  'bakırköy': { lat: 40.9782, lon: 28.8724 },
  'bakirkoy': { lat: 40.9782, lon: 28.8724 },
  'maltepe': { lat: 40.9250, lon: 29.1308 },
  'sarıyer': { lat: 41.1664, lon: 29.0494 },
  'sariyer': { lat: 41.1664, lon: 29.0494 },
  'ataşehir': { lat: 40.9833, lon: 29.1167 },
  'atasehir': { lat: 40.9833, lon: 29.1167 },
  'beykoz': { lat: 41.1278, lon: 29.1006 },
  'pendik': { lat: 40.8756, lon: 29.2331 },
  'fatih': { lat: 41.0186, lon: 28.9398 },
  'ümraniye': { lat: 41.0256, lon: 29.1167 },
  'umraniye': { lat: 41.0256, lon: 29.1167 },
  'kartal': { lat: 40.8900, lon: 29.1931 },
  'kağıthane': { lat: 41.0811, lon: 28.9731 },
  'kagithane': { lat: 41.0811, lon: 28.9731 },
  'başakşehir': { lat: 41.0944, lon: 28.8028 },
  'basaksehir': { lat: 41.0944, lon: 28.8028 },
  'beylikdüzü': { lat: 41.0019, lon: 28.6419 },
  'beylikduzu': { lat: 41.0019, lon: 28.6419 },

  // İzmir
  'bornova': { lat: 38.4697, lon: 27.2198 },
  'konak': { lat: 38.4192, lon: 27.1287 },
  'karşıyaka': { lat: 38.4559, lon: 27.1122 },
  'karsiyaka': { lat: 38.4559, lon: 27.1122 },
  'buca': { lat: 38.3881, lon: 27.1772 },
  'alsancak': { lat: 38.4382, lon: 27.1423 },
  'bayraklı': { lat: 38.4628, lon: 27.1692 },
  'bayrakli': { lat: 38.4628, lon: 27.1692 },
  'çiğli': { lat: 38.4950, lon: 27.0583 },
  'cigli': { lat: 38.4950, lon: 27.0583 },
  'balçova': { lat: 38.3897, lon: 27.0456 },
  'balcova': { lat: 38.3897, lon: 27.0456 },

  // Bursa
  'nilüfer': { lat: 40.2136, lon: 28.9833 },
  'nilufer': { lat: 40.2136, lon: 28.9833 },
  'osmangazi': { lat: 40.1885, lon: 29.0610 },
  'yıldırım': { lat: 40.1917, lon: 29.0917 },
  'yildirim': { lat: 40.1917, lon: 29.0917 },

  // Antalya
  'muratpaşa': { lat: 36.8874, lon: 30.7074 },
  'muratpasa': { lat: 36.8874, lon: 30.7074 },
  'konyaaltı': { lat: 36.8778, lon: 30.6358 },
  'konyaalti': { lat: 36.8778, lon: 30.6358 },
  'kepez': { lat: 36.9317, lon: 30.6861 },

  // Eskişehir
  'tepebaşı': { lat: 39.7917, lon: 30.5083 },
  'tepebasi': { lat: 39.7917, lon: 30.5083 },
  'odunpazarı': { lat: 39.7583, lon: 30.5250 },
  'odunpazari': { lat: 39.7583, lon: 30.5250 },
};

const SPECIFIC_VENUE_COORDS: Record<string, { lat: number; lon: number }> = {
  'odtu': { lat: 39.8913, lon: 32.7844 },
  'odtü': { lat: 39.8913, lon: 32.7844 },
  'hacettepe': { lat: 39.8667, lon: 32.7333 },
  'bilkent': { lat: 39.8692, lon: 32.7500 },
  'çilekli': { lat: 41.0772, lon: 29.0221 },
  'cilekli': { lat: 41.0772, lon: 29.0221 },
  'kalamış': { lat: 40.9786, lon: 29.0433 },
  'kalamis': { lat: 40.9786, lon: 29.0433 },
  'galatasaray': { lat: 41.0667, lon: 29.0417 },
  'anadoluhisarı': { lat: 41.0833, lon: 29.0667 },
  'anadoluhisari': { lat: 41.0833, lon: 29.0667 },
};

function resolveCoordinates(arenaStr?: string, distStr?: string, cityStr?: string): { lat: number; lon: number; locationName: string } {
  // 1. Belirli bilinen tesis eşleşmesi (Örn: ODTÜ, Çilekli vb.)
  if (arenaStr) {
    const aLower = arenaStr.toLowerCase();
    for (const [key, coords] of Object.entries(SPECIFIC_VENUE_COORDS)) {
      if (aLower.includes(key)) {
        return { ...coords, locationName: arenaStr.split('—')[0].trim() };
      }
    }
  }

  // 2. İlçe koordinatı eşleşmesi (Örn: Çankaya, Beşiktaş, Bornova, Nilüfer)
  if (distStr) {
    const dLower = distStr.toLowerCase().trim();
    if (DISTRICT_COORDS[dLower]) {
      return { ...DISTRICT_COORDS[dLower], locationName: `${distStr}, ${cityStr || ''}`.trim() };
    }
  }

  // 3. Şehir merkez koordinatı eşleşmesi
  if (cityStr) {
    const cLower = cityStr.toLowerCase().trim();
    if (CITY_COORDS[cLower]) {
      return { ...CITY_COORDS[cLower], locationName: cityStr };
    }
  }

  // Fallback: İstanbul
  return { ...CITY_COORDS['istanbul'], locationName: cityStr || 'İstanbul' };
}

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
  district,
  arena,
  dateTime,
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
  const [isHourlyForecast, setIsHourlyForecast] = useState(false);
  const [matchTimeLabel, setMatchTimeLabel] = useState<string>('');
  const [resolvedLocationName, setResolvedLocationName] = useState<string>(city);
  const [usedCoords, setUsedCoords] = useState<{ lat: number; lon: number }>({ lat: 41.0082, lon: 28.9784 });

  useEffect(() => {
    if (temp && rainRisk !== undefined && condition) {
      setCurrentTemp(temp);
      setCurrentRainRisk(rainRisk);
      setCurrentCondition(condition);
      return;
    }

    let isMounted = true;
    const fetchForecast = async () => {
      try {
        setLoading(true);
        // 1. Tesis / İlçe / Şehir seviyesinde hassas GPS koordinatı çözümleme
        const coords = resolveCoordinates(arena, district, city);
        if (isMounted) {
          setUsedCoords(coords);
          setResolvedLocationName(coords.locationName);
        }

        // 2. Open-Meteo Saatlik ve Anlık Tahmin Sorgusu (16 günlük saatlik veri)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=16&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        if (!isMounted) return;

        // 3. Maç Tarihi ve Saati Hedeflemesi
        const targetTs = parseTargetTimestamp(dateTime);
        const targetDate = new Date(targetTs);

        // Hedef saat formatı: YYYY-MM-DDTHH:00
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const targetHourStr = `${yyyy}-${mm}-${dd}T${hh}:00`;

        let bestIndex = -1;
        if (data?.hourly?.time && Array.isArray(data.hourly.time)) {
          bestIndex = data.hourly.time.indexOf(targetHourStr);

          // Tam saat bulunamadıysa zaman damgasına en yakın saati seç
          if (bestIndex === -1) {
            let minDiff = Infinity;
            for (let i = 0; i < data.hourly.time.length; i++) {
              const itemTs = new Date(data.hourly.time[i]).getTime();
              const diff = Math.abs(itemTs - targetTs);
              if (diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
              }
            }
          }
        }

        // 4. Maç gün ve saatine özel tahmin bulunduysa uygula
        if (bestIndex !== -1 && data?.hourly?.temperature_2m?.[bestIndex] !== undefined) {
          const tVal = `${Math.round(data.hourly.temperature_2m[bestIndex])}°C`;
          const rRisk = data.hourly.precipitation_probability ? (data.hourly.precipitation_probability[bestIndex] ?? 0) : 0;
          const wCode = data.hourly.weather_code ? (data.hourly.weather_code[bestIndex] ?? 0) : 0;
          const wInfo = getWeatherInfo(wCode);

          const daysTR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
          const monthsTR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
          const formattedLabel = `${targetDate.getDate()} ${monthsTR[targetDate.getMonth()]} ${daysTR[targetDate.getDay()]}, ${hh}:${String(targetDate.getMinutes()).padStart(2, '0')}`;

          setCurrentTemp(tVal);
          setCurrentRainRisk(rRisk);
          setCurrentCondition(wInfo.condition);
          setCurrentIcon(wInfo.icon);
          setIsHourlyForecast(true);
          setMatchTimeLabel(formattedLabel);
        } else if (data?.current) {
          // Maç çok ileri tarihteyse (16 günden fazla) veya bulunamadıysa anlık hava durumuna fallback yap
          const t = `${Math.round(data.current.temperature_2m)}°C`;
          const wInfo = getWeatherInfo(data.current.weather_code);
          setCurrentTemp(t);
          setCurrentRainRisk(wInfo.rainRisk);
          setCurrentCondition(wInfo.condition);
          setCurrentIcon(wInfo.icon);
          setIsHourlyForecast(false);
          setMatchTimeLabel(dateTime || 'Canlı');
        }
      } catch (err) {
        console.log('Hava durumu çekme hatası:', err);
        if (isMounted) {
          setCurrentTemp('19°C');
          setCurrentRainRisk(15);
          setCurrentCondition('Parçalı Bulutlu');
          setCurrentIcon('cloud');
          setIsHourlyForecast(false);
          setMatchTimeLabel(dateTime || 'Bugün');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchForecast();
    return () => { isMounted = false; };
  }, [city, district, arena, dateTime, temp, rainRisk, condition]);

  const handleWeatherAdvice = () => {
    const locTitle = resolvedLocationName || (district ? `${district}, ${city}` : city);
    Alert.alert(
      `🌤️ ${locTitle} Maç Saati Hava Durumu`,
      `🏟️ Tesis / Saha: ${arena || locTitle}\n📍 Konum: ${resolvedLocationName} (${usedCoords.lat.toFixed(4)}, ${usedCoords.lon.toFixed(4)})\n⏰ Maç Saati: ${matchTimeLabel || dateTime || 'Canlı'}\n\n🌡️ Beklenen Sıcaklık: ${currentTemp}\n🌧️ Yağış İhtimali: %${currentRainRisk}\n☁️ Durum: ${currentCondition}\n\n• Saha Tipi: ${isOpenField ? 'Açık Saha' : 'Kapalı Saha'}\n• Tavsiye: ${
        isOpenField 
          ? (currentRainRisk > 50 
              ? 'Maç saatinde yağış bekleniyor! Islak zemin için çim kramponu ve yağmurluk almanızı öneririz.' 
              : 'Maç saatinde hava futbol oynamak için gayet elverişli. Keyifli maçlar!') 
          : 'Tesis kapalı olduğu için maç hava şartlarından etkilenmeyecektir.'
      }`,
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  const displayLocation = district 
    ? `${district.toUpperCase()}, ${city.toUpperCase()}` 
    : city.toUpperCase();

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
            <Text style={styles.cityName}>{displayLocation}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.tempText}>{currentTemp}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.conditionText}>{currentCondition} (%{currentRainRisk})</Text>
          </View>
          <View style={styles.subRow}>
            {isHourlyForecast && (
              <View style={styles.matchTimeTag}>
                <MaterialIcons name="schedule" size={10} color={theme.secondary} />
                <Text style={styles.matchTimeTagText}>Maç Saati</Text>
              </View>
            )}
            <Text style={styles.subText} numberOfLines={1}>
              {isOpenField 
                ? (currentRainRisk > 50 
                    ? '⚠️ Yağış Riski Var — Krampon & Yağmurluk Alın!' 
                    : '☀️ Futbol İçin İdeal Hava Şartları') 
                : '✅ Kapalı Saha — Hava Şartlarından Etkilenmez'}
            </Text>
          </View>
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
  cityName: { fontFamily: Fonts.headlineBold, fontSize: 12, color: theme.secondary, letterSpacing: 0.2 },
  tempText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: theme.text },
  dot: { color: theme.textMuted, fontSize: 12 },
  conditionText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: theme.secondary },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  matchTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${theme.secondary}26`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  matchTimeTagText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 9,
    color: theme.secondary,
    letterSpacing: 0.3,
  },
  subText: { fontFamily: Fonts.body, fontSize: 10, color: theme.textMuted, flex: 1 },
});
