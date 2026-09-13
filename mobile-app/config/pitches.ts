export interface SubFieldInfo {
  id: string;
  name: string; // e.g. "1. Saha", "2. Saha", "A Sahası", "Tek Saha"
  surface: 'Suni Çim' | 'Hibrit Çim' | 'Kapalı Saha';
}

export interface PitchDatabaseItem {
  id: string;
  city: string;
  district: string;
  name: string;
  rating: number;
  isPopular?: boolean;
  subFields: SubFieldInfo[];
}

export const PITCH_DATABASE: PitchDatabaseItem[] = [
  // Ankara Pitches
  {
    id: 'ank-1',
    city: 'Ankara',
    district: 'Dikmen',
    name: 'Dikmen Merkez Halı Saha',
    rating: 4.8,
    isPopular: true,
    subFields: [
      { id: 'f-1', name: '1. Saha (Büyük)', surface: 'Suni Çim' },
      { id: 'f-2', name: '2. Saha (Orta)', surface: 'Kapalı Saha' },
      { id: 'f-3', name: '3. Saha (Küçük)', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-2',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Çankaya Spor Kompleksi',
    rating: 4.7,
    isPopular: true,
    subFields: [
      { id: 'f-4', name: 'A Sahası', surface: 'Suni Çim' },
      { id: 'f-5', name: 'B Sahası', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-3',
    city: 'Ankara',
    district: 'Batıkent',
    name: 'Batıkent Arena',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'f-6', name: 'Tek Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-4',
    city: 'Ankara',
    district: 'Ümitköy',
    name: 'Ümitköy Halı Saha',
    rating: 4.9,
    isPopular: true,
    subFields: [
      { id: 'f-7', name: '1. Saha', surface: 'Hibrit Çim' },
      { id: 'f-8', name: '2. Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-5',
    city: 'Ankara',
    district: 'Keçiören',
    name: 'Keçiören Parkı Tesisleri',
    rating: 4.5,
    isPopular: true,
    subFields: [
      { id: 'f-9', name: 'Ana Saha', surface: 'Suni Çim' },
    ],
  },

  // İstanbul Pitches
  {
    id: 'ist-1',
    city: 'İstanbul',
    district: 'Beşiktaş',
    name: 'Beşiktaş Arena',
    rating: 4.9,
    isPopular: true,
    subFields: [
      { id: 'f-10', name: 'A Sahası (Ana)', surface: 'Suni Çim' },
      { id: 'f-11', name: 'B Sahası', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-2',
    city: 'İstanbul',
    district: 'Kadıköy',
    name: 'Kadıköy Parkı',
    rating: 4.8,
    isPopular: true,
    subFields: [
      { id: 'f-12', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'f-13', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ist-3',
    city: 'İstanbul',
    district: 'Maslak',
    name: 'Powerleague Arena',
    rating: 4.8,
    isPopular: true,
    subFields: [
      { id: 'f-14', name: 'A Sahası', surface: 'Hibrit Çim' },
      { id: 'f-15', name: 'B Sahası', surface: 'Kapalı Saha' },
      { id: 'f-16', name: 'C Sahası', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ist-4',
    city: 'İstanbul',
    district: 'Ataşehir',
    name: 'Santra Halı Saha',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'f-17', name: 'Tek Saha', surface: 'Suni Çim' },
    ],
  },
];
