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

const TURKISH_MONTHS_REGEX = new RegExp(
  '(\\d{1,2})\\s+(' + Object.keys(TURKISH_MONTHS).join('|') + ')(?:\\s+(\\d{4}))?',
  'i'
);

/**
 * Verilen serbest metinli halısaha tarih/saat bilgisini timestamp değerine dönüştürür.
 * Desteklenen örnekler:
 * - "Salı, 15 Eylül 2026, 22:00 - 23:00"
 * - "15 Eylül 2026, 21:00"
 * - "15.11.2026, 21:00"
 * - "Bugün, 22:00"
 * - "Yarın, 19:00"
 * - "21:00"
 */
export function parseTargetTimestamp(dateTime?: string, targetHours: number = 2): number {
  const defaultFuture = Date.now() + (targetHours * 3600 + 30 * 60) * 1000;
  if (!dateTime || typeof dateTime !== 'string') return defaultFuture;

  const now = new Date();
  const lower = dateTime.toLocaleLowerCase('tr-TR').replace(/\u0307/g, '').trim();

  // Saat bilgisini çek (HH:mm) ve doğrula
  const timeMatch = dateTime.match(/(\d{1,2}):(\d{2})/);
  const rawHour = timeMatch ? parseInt(timeMatch[1], 10) : 21;
  const rawMinute = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  const isValidTime = rawHour >= 0 && rawHour <= 23 && rawMinute >= 0 && rawMinute <= 59;
  const hour = isValidTime ? rawHour : 21;
  const minute = isValidTime ? rawMinute : 0;

  // 1. Standart Türk noktalı/tireli/eğik çizgili tarih formatı (GG.AA.YYYY, GG/AA/YYYY veya GG-AA-YYYY)
  // ABD MM/DD/YYYY yorumlamasını önlemek için new Date(dateTime) kontrolünden ÖNCE çalışır.
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateTime.trim())) {
    const dotDateMatch = dateTime.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (dotDateMatch) {
      if (!isValidTime) return defaultFuture;
      const day = parseInt(dotDateMatch[1], 10);
      const month = parseInt(dotDateMatch[2], 10) - 1; // 0-indexed ay
      const year = parseInt(dotDateMatch[3], 10);
      const d = new Date(year, month, day, hour, minute, 0, 0);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      ) {
        return d.getTime();
      }
      return defaultFuture;
    }
  }

  // 2. Katı ISO 8601 formatı kontrolü (YYYY-MM-DD veya YYYY-MM-DDTHH:mm)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})/.test(dateTime.trim())) {
    const isoMatch = dateTime.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const checkDate = new Date(year, month, day);
      if (
        checkDate.getFullYear() === year &&
        checkDate.getMonth() === month &&
        checkDate.getDate() === day &&
        isValidTime
      ) {
        const directDate = new Date(dateTime.trim());
        if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2020) {
          return directDate.getTime();
        }
      }
    }
    return defaultFuture;
  }

  if (
    lower.includes('bugün') ||
    lower.includes('bugun') ||
    lower.includes('bu akşam') ||
    lower.includes('bu aksam') ||
    lower.includes('bu gece')
  ) {
    const d = new Date();
    if (hour >= 0 && hour < 4 && now.getHours() >= 12) {
      d.setDate(d.getDate() + 1);
    }
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
  const dateMatch = lower.match(TURKISH_MONTHS_REGEX);
  if (dateMatch) {
    if (!isValidTime) return defaultFuture;
    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLocaleLowerCase('tr-TR').replace(/\u0307/g, '');
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();

    if (TURKISH_MONTHS[monthName] !== undefined) {
      const month = TURKISH_MONTHS[monthName];
      const d = new Date(year, month, day, hour, minute, 0, 0);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      ) {
        // Aralık -> Ocak yıl geçişi: Yıl belirtilmemişse ve tarih >180 gün gerideyse gelecek yıla sar
        if (!dateMatch[3] && now.getTime() - d.getTime() > 180 * 24 * 60 * 60 * 1000) {
          d.setFullYear(year + 1);
        }
        return d.getTime();
      }
      return defaultFuture;
    }
  }

  // 3.5. Göreli gün ifadeleri ("Bu Cumartesi 20:00", "Bu Pazar 21:00", "Gelecek Hafta İçi 21:00" vb.)
  const WEEKDAYS: Record<string, number> = {
    pazartesi: 1,
    pazar: 0,
    salı: 2,
    sali: 2,
    çarşamba: 3,
    carsamba: 3,
    perşembe: 4,
    persembe: 4,
    cumartesi: 6,
    cuma: 5,
  };

  for (const [dayName, targetDow] of Object.entries(WEEKDAYS)) {
    if (lower.includes(dayName)) {
      const d = new Date();
      const currentDow = d.getDay();
      let diff = (targetDow - currentDow + 7) % 7;
      if (diff === 0) {
        const candidate = new Date();
        candidate.setHours(hour, minute, 0, 0);
        if (candidate.getTime() <= Date.now()) {
          diff = 7;
        }
      }
      d.setDate(d.getDate() + diff);
      d.setHours(hour, minute, 0, 0);
      return d.getTime();
    }
  }

  if (lower.includes('gelecek hafta') || lower.includes('hafta içi') || lower.includes('hafta ici')) {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    // Hafta sonuna denk gelirse Pazartesiye kaydır
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  // 4. Sadece saat girilmişse
  if (timeMatch && isValidTime) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
  }

  return defaultFuture;
}

/**
 * Verilen maç tarih/saat metninden maçın bitiş timestamp'ini hesaplar.
 * Örnek: "30 Eylül 2026, 21:00 - 22:00" -> 22:00 timestamp'i
 */
export function getMatchEndTimestamp(dateTime?: string): number {
  const startTs = parseTargetTimestamp(dateTime);
  if (!dateTime || typeof dateTime !== 'string') {
    return startTs + 60 * 60 * 1000;
  }

  // İki saat aralığı varsa ("21:00 - 22:00" gibi), ikinci saat maçın bitiş dakikasıdır
  const times = dateTime.match(/(\d{1,2}):(\d{2})/g);
  if (times && times.length >= 2) {
    const parts = times[1].split(':');
    const endH = parseInt(parts[0], 10);
    const endM = parseInt(parts[1], 10);
    if (endH >= 0 && endH <= 23 && endM >= 0 && endM <= 59) {
      const d = new Date(startTs);
      // Gece yarısı geçişi (örn: 23:00 - 00:00 veya 23:30 - 23:00)
      if (endH < d.getHours() || (endH === d.getHours() && endM <= d.getMinutes())) {
        d.setDate(d.getDate() + 1);
      }
      d.setHours(endH, endM, 0, 0);
      return d.getTime();
    }
  }

  // Aralık belirtilmemişse standart 60 dakika sonra biter
  return startTs + 60 * 60 * 1000;
}

/**
 * Maçın bitiş dakikasının gelip gelmediğini kontrol eder.
 * Bitiş saati ve dakikası geldiğinde veya geçtiğinde true döner.
 */
export function isMatchEnded(dateTime?: string): boolean {
  if (!dateTime) return false;
  return Date.now() >= getMatchEndTimestamp(dateTime);
}

/**
 * Maçın sona erip ermediğini belirler.
 * Maçın bitiş dakikası geldiğinde maç geçmiş kabul edilir.
 */
export function isMatchPast(dateTime?: string): boolean {
  if (!dateTime) return false;
  return isMatchEnded(dateTime);
}

/**
 * Maçın şu anda canlı olarak oynanıp oynanmadığını kontrol eder (başlangıç ile bitiş arası).
 */
export function isMatchLive(dateTime?: string): boolean {
  if (!dateTime) return false;
  const startTs = parseTargetTimestamp(dateTime);
  const endTs = getMatchEndTimestamp(dateTime);
  const now = Date.now();
  return now >= startTs && now < endTs;
}
