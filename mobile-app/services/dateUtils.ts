/**
 * H.İ.V. Halısaha - Tarih ve Saat Ayrıştırma Yardımcı Fonksiyonları
 */

export const TURKISH_MONTHS: Record<string, number> = {
  ocak: 0,
  subat: 1,
  şubat: 1,
  mart: 2,
  nisan: 3,
  mayis: 4,
  mayıs: 4,
  haziran: 5,
  temmuz: 6,
  agustos: 7,
  ağustos: 7,
  eylul: 8,
  eylül: 8,
  ekim: 9,
  kasim: 10,
  kasım: 10,
  aralik: 11,
  aralık: 11,
};

/**
 * Verilen serbest metinli halısaha tarih/saat bilgisini timestamp değerine dönüştürür.
 * Desteklenen örnekler:
 * - "Salı, 15 Eylül 2026, 22:00 - 23:00"
 * - "15 Eylül 2026, 21:00"
 * - "Bugün, 22:00"
 * - "Yarın, 19:00"
 * - "21:00"
 */
export function parseTargetTimestamp(dateTime?: string, targetHours: number = 2): number {
  const defaultFuture = Date.now() + (targetHours * 3600 + 30 * 60) * 1000;
  if (!dateTime) return defaultFuture;

  const now = new Date();
  const lower = dateTime.toLowerCase().trim();

  // 1. Standart ISO veya tarih formatı kontrolü
  const directDate = new Date(dateTime);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2020) {
    return directDate.getTime();
  }

  // 2. Saat bilgisini çek (HH:mm)
  const timeMatch = dateTime.match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 21;
  const minute = timeMatch ? parseInt(timeMatch[2], 10) : 0;

  if (lower.includes('bugün') || lower.includes('bugun')) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  if (lower.includes('yarın') || lower.includes('yarin')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  // 3. "15 Eylül 2026" veya "15 Eylül" deseni
  const dateMatch = lower.match(/(\d{1,2})\s+([a-zçğıöşü]+)(?:\s+(\d{4}))?/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLowerCase();
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();

    if (TURKISH_MONTHS[monthName] !== undefined) {
      const month = TURKISH_MONTHS[monthName];
      const d = new Date(year, month, day, hour, minute, 0, 0);
      if (!isNaN(d.getTime())) {
        return d.getTime();
      }
    }
  }

  // 4. Sadece saat girilmişse
  if (timeMatch) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  return defaultFuture;
}

/**
 * Maçın sona erip ermediğini belirler.
 * Halısaha maçları genellikle 60 dakikadır; 75 dakika sonrasında maç geçmiş kabul edilir.
 */
export function isMatchPast(dateTime?: string): boolean {
  if (!dateTime) return false;
  const targetTimestamp = parseTargetTimestamp(dateTime);
  const now = Date.now();
  return now > (targetTimestamp + 75 * 60 * 1000);
}

/**
 * Maçın şu anda canlı olarak oynanıp oynanmadığını kontrol eder (0 - 75 dk arası).
 */
export function isMatchLive(dateTime?: string): boolean {
  if (!dateTime) return false;
  const targetTimestamp = parseTargetTimestamp(dateTime);
  const now = Date.now();
  return now >= targetTimestamp && now <= (targetTimestamp + 75 * 60 * 1000);
}
