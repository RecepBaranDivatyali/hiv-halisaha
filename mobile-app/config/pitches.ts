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

  // ─── ANKARA ────────────────────────────────────────────────────────────────

  {
    id: 'ank-odtu',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'ODTÜ Halı Saha Tesisleri',
    rating: 4.8,
    isPopular: true,
    subFields: [
      { id: 'odtu-1', name: '1. Saha (Stadyum Yanı)', surface: 'Suni Çim' },
      { id: 'odtu-2', name: '2. Saha (Yurtlar Yanı)', surface: 'Suni Çim' },
      { id: 'odtu-3', name: 'Kapalı Spor Salonu Sahası', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-hacettepe-beytepe',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Hacettepe Üniversitesi Beytepe Halı Saha',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'hac-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'hac-2', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-bilkent',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Bilkent Üniversitesi Spor Tesisleri',
    rating: 4.7,
    isPopular: true,
    subFields: [
      { id: 'bil-1', name: 'Ana Halı Saha', surface: 'Suni Çim' },
      { id: 'bil-2', name: 'Kapalı Salon Sahası', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-anka-park',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Ankapark Halı Saha',
    rating: 4.5,
    subFields: [
      { id: 'ankapark-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'ankapark-2', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-gonul-bahcesi',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Gönül Bahçesi Halı Saha',
    rating: 4.4,
    subFields: [
      { id: 'gonul-1', name: 'Tek Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-anittepe',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Anıttepe Kapalı Spor Tesisleri (AKS)',
    rating: 4.7,
    isPopular: true,
    subFields: [
      { id: 'anit-1', name: 'Ana Kapalı Saha', surface: 'Kapalı Saha' },
      { id: 'anit-2', name: 'Açık Halı Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-baglica',
    city: 'Ankara',
    district: 'Çankaya',
    name: 'Bağlıca Halı Saha',
    rating: 4.3,
    subFields: [
      { id: 'bag-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'bag-2', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-etimesgut-belediye',
    city: 'Ankara',
    district: 'Etimesgut',
    name: 'Etimesgut Belediyesi Spor Tesisleri',
    rating: 4.4,
    subFields: [
      { id: 'etim-1', name: 'Ana Saha', surface: 'Suni Çim' },
      { id: 'etim-2', name: 'Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-sincan-belediye',
    city: 'Ankara',
    district: 'Sincan',
    name: 'Sincan Belediyesi Kapalı Spor Salonu',
    rating: 4.3,
    subFields: [
      { id: 'sincan-1', name: 'Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-kecioren-stadyum',
    city: 'Ankara',
    district: 'Keçiören',
    name: 'Keçiören Stadyumu Halı Saha',
    rating: 4.2,
    subFields: [
      { id: 'kec-1', name: 'Ana Saha', surface: 'Suni Çim' },
      { id: 'kec-2', name: 'Yan Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-batikent-bel',
    city: 'Ankara',
    district: 'Yenimahalle',
    name: 'Batıkent Belediye Spor Tesisleri',
    rating: 4.4,
    subFields: [
      { id: 'batik-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'batik-2', name: '2. Saha (Kapalı)', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-eryaman-elit',
    city: 'Ankara',
    district: 'Etimesgut',
    name: 'Eryaman Elit Halı Saha',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'ery-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'ery-2', name: '2. Saha', surface: 'Hibrit Çim' },
      { id: 'ery-3', name: 'Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ank-mamak-spor',
    city: 'Ankara',
    district: 'Mamak',
    name: 'Mamak Spor Tesisleri Halı Saha',
    rating: 4.1,
    subFields: [
      { id: 'mam-1', name: 'Tek Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-pursaklar-bel',
    city: 'Ankara',
    district: 'Pursaklar',
    name: 'Pursaklar Belediyesi Halı Saha',
    rating: 4.2,
    subFields: [
      { id: 'purs-1', name: 'Ana Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ank-kahramankazan',
    city: 'Ankara',
    district: 'Kazan',
    name: 'Kazan Belediyesi Spor Tesisleri',
    rating: 4.3,
    subFields: [
      { id: 'kaz-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'kaz-2', name: '2. Saha', surface: 'Kapalı Saha' },
    ],
  },

  // ─── İSTANBUL ──────────────────────────────────────────────────────────────

  {
    id: 'ist-macka',
    city: 'İstanbul',
    district: 'Beşiktaş',
    name: 'Maçka Spor Tesisleri',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'mac-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'mac-2', name: '2. Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-galatasaray-adasi',
    city: 'İstanbul',
    district: 'Beşiktaş',
    name: 'Galatasaray Adası Spor Tesisleri',
    rating: 4.8,
    isPopular: true,
    subFields: [
      { id: 'gal-1', name: 'Kuzeybatı Sahası', surface: 'Suni Çim' },
      { id: 'gal-2', name: 'İç Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-fenerbahce-kalamis',
    city: 'İstanbul',
    district: 'Kadıköy',
    name: 'Fenerbahçe Kalamış Spor Tesisleri',
    rating: 4.9,
    isPopular: true,
    subFields: [
      { id: 'fb-1', name: '1. Saha (Deniz Tarafı)', surface: 'Suni Çim' },
      { id: 'fb-2', name: '2. Saha', surface: 'Suni Çim' },
      { id: 'fb-3', name: 'Kapalı Salon', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-uskudar-bel',
    city: 'İstanbul',
    district: 'Üsküdar',
    name: 'Üsküdar Belediyesi Spor Tesisleri',
    rating: 4.4,
    subFields: [
      { id: 'usk-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'usk-2', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ist-maltepe-bel',
    city: 'İstanbul',
    district: 'Maltepe',
    name: 'Maltepe Sahil Halı Saha',
    rating: 4.5,
    subFields: [
      { id: 'malt-1', name: 'Ana Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ist-pendik-bel',
    city: 'İstanbul',
    district: 'Pendik',
    name: 'Pendik Belediyesi Spor Tesisleri',
    rating: 4.3,
    subFields: [
      { id: 'pen-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'pen-2', name: '2. Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-bagcilar-bel',
    city: 'İstanbul',
    district: 'Bağcılar',
    name: 'Bağcılar Belediyesi Olimpik Tesisleri',
    rating: 4.5,
    isPopular: true,
    subFields: [
      { id: 'bag-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'bag-2', name: '2. Saha', surface: 'Hibrit Çim' },
      { id: 'bag-3', name: 'Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-sariyer-bel',
    city: 'İstanbul',
    district: 'Sarıyer',
    name: 'Sarıyer Belediyesi Halı Saha',
    rating: 4.4,
    subFields: [
      { id: 'sar-1', name: 'Ana Saha', surface: 'Suni Çim' },
      { id: 'sar-2', name: 'Arka Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'ist-sisli-bel',
    city: 'İstanbul',
    district: 'Şişli',
    name: 'Şişli Belediyesi Fulya Tesisleri',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'sis-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'sis-2', name: '2. Saha (Kapalı)', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'ist-umraniye-bel',
    city: 'İstanbul',
    district: 'Ümraniye',
    name: 'Ümraniye Belediyesi Spor Tesisleri',
    rating: 4.4,
    subFields: [
      { id: 'umr-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'umr-2', name: '2. Saha', surface: 'Suni Çim' },
    ],
  },

  // ─── İZMİR ─────────────────────────────────────────────────────────────────

  {
    id: 'izm-karatas',
    city: 'İzmir',
    district: 'Konak',
    name: 'Karataş Halı Saha',
    rating: 4.4,
    subFields: [
      { id: 'karat-1', name: 'Tek Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'izm-bornova-ege',
    city: 'İzmir',
    district: 'Bornova',
    name: 'Ege Üniversitesi Spor Tesisleri',
    rating: 4.6,
    isPopular: true,
    subFields: [
      { id: 'ege-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'ege-2', name: '2. Saha', surface: 'Suni Çim' },
      { id: 'ege-3', name: 'Kapalı Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'izm-karsiyaka-bel',
    city: 'İzmir',
    district: 'Karşıyaka',
    name: 'Karşıyaka Belediyesi Halı Saha',
    rating: 4.5,
    subFields: [
      { id: 'kar-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'kar-2', name: '2. Saha', surface: 'Kapalı Saha' },
    ],
  },
  {
    id: 'izm-alsancak-deu',
    city: 'İzmir',
    district: 'Konak',
    name: 'Dokuz Eylül Üniversitesi Halı Saha',
    rating: 4.3,
    subFields: [
      { id: 'deu-1', name: 'Ana Saha', surface: 'Suni Çim' },
    ],
  },
  {
    id: 'izm-bayrakli-bel',
    city: 'İzmir',
    district: 'Bayraklı',
    name: 'Bayraklı Belediyesi Spor Tesisleri',
    rating: 4.4,
    subFields: [
      { id: 'bay-1', name: '1. Saha', surface: 'Suni Çim' },
      { id: 'bay-2', name: '2. Saha', surface: 'Hibrit Çim' },
    ],
  },
];
