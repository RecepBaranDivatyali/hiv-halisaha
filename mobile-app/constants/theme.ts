export type ThemeType = 'dark-neon' | 'dark-cyber' | 'dark-inferno' | 'light-emerald' | 'light-ocean';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  tertiary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  onSurface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  border: string;
  borderSubtle: string;
  icon: string;
  isDark: boolean;
}

export const Themes: Record<ThemeType, ThemeColors> = {
  'dark-neon': {
    isDark: true,
    primary: '#8eff71',       // Neon Yeşil
    onPrimary: '#064200',     // Neon Yeşil üstü koyu yeşil metin
    secondary: '#6e9bff',     // Mavi
    onSecondary: '#001a4d',
    tertiary: '#88f6ff',      // Cam Göbeği
    error: '#ff7351',         // Kırmızımsı
    success: '#8eff71',
    warning: '#ffb703',
    info: '#6e9bff',
    text: '#ffffff',
    textMuted: '#adaaaa',
    background: '#0e0e0e',
    surface: '#131313',
    onSurface: '#ffffff',
    surfaceContainer: '#1a1919',
    surfaceContainerHigh: '#201f1f',
    surfaceContainerHighest: '#262626',
    border: '#484847',
    borderSubtle: 'rgba(72,72,71,0.15)',
    icon: '#adaaaa',
  },
  'dark-cyber': {
    isDark: true,
    primary: '#00f0ff',       // Siber Mavi
    onPrimary: '#002538',     // Siber Mavi üstü koyu metin
    secondary: '#ff003c',     // Siber Kırmızı
    onSecondary: '#ffffff',
    tertiary: '#fcee0a',      // Siber Sarı
    error: '#ff003c',
    success: '#00f0ff',
    warning: '#fcee0a',
    info: '#00f0ff',
    text: '#ffffff',
    textMuted: '#8a94a6',
    background: '#050a15',    // Koyu Lacivert
    surface: '#0a101f',
    onSurface: '#ffffff',
    surfaceContainer: '#0e1526',
    surfaceContainerHigh: '#131c33',
    surfaceContainerHighest: '#1a2642',
    border: '#2a3a5a',
    borderSubtle: 'rgba(42,58,90,0.15)',
    icon: '#8a94a6',
  },
  'dark-inferno': {
    isDark: true,
    primary: '#ff4d00',       // Lav Turuncusu
    onPrimary: '#380c00',     // Lav Turuncusu üstü koyu metin
    secondary: '#ffb703',     // Altın Sarısı
    onSecondary: '#332000',
    tertiary: '#fb8500',      // Açık Turuncu
    error: '#d90429',
    success: '#ffb703',
    warning: '#fb8500',
    info: '#ffb703',
    text: '#ffffff',
    textMuted: '#a39b98',
    background: '#0a0505',    // Koyu Bordo/Siyah
    surface: '#120a0a',
    onSurface: '#ffffff',
    surfaceContainer: '#1a0e0e',
    surfaceContainerHigh: '#241414',
    surfaceContainerHighest: '#2e1a1a',
    border: '#4a2b2b',
    borderSubtle: 'rgba(74,43,43,0.15)',
    icon: '#a39b98',
  },
  'light-emerald': {
    isDark: false,
    primary: '#059669',       // Zümrüt Yeşili
    onPrimary: '#ffffff',     // Zümrüt Yeşili üstü beyaz metin
    secondary: '#2563eb',     // Mavi
    onSecondary: '#ffffff',
    tertiary: '#0d9488',      // Turkuaz
    error: '#ef4444',
    success: '#059669',
    warning: '#f59e0b',
    info: '#2563eb',
    text: '#111827',
    textMuted: '#6b7280',
    background: '#f9fafb',    // Çok açık gri
    surface: '#ffffff',
    onSurface: '#111827',
    surfaceContainer: '#f3f4f6',
    surfaceContainerHigh: '#e5e7eb',
    surfaceContainerHighest: '#d1d5db',
    border: '#e5e7eb',
    borderSubtle: 'rgba(229,231,235,0.5)',
    icon: '#6b7280',
  },
  'light-ocean': {
    isDark: false,
    primary: '#0284c7',       // Okyanus Mavisi
    onPrimary: '#ffffff',     // Okyanus Mavisi üstü beyaz metin
    secondary: '#0ea5e9',     // Açık Mavi
    onSecondary: '#ffffff',
    tertiary: '#0284c7',
    error: '#ef4444',
    success: '#0284c7',
    warning: '#f59e0b',
    info: '#0ea5e9',
    text: '#0f172a',
    textMuted: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    onSurface: '#0f172a',
    surfaceContainer: '#f1f5f9',
    surfaceContainerHigh: '#e2e8f0',
    surfaceContainerHighest: '#cbd5e1',
    border: '#e2e8f0',
    borderSubtle: 'rgba(226,232,240,0.5)',
    icon: '#64748b',
  },
};

export const THEMES = Themes;
export const Colors = Themes;

export const Fonts = {
  headline: 'Lexend',
  body: 'Manrope',
  label: 'Lexend',
  headlineBold: 'LexendBold',
  bodySemiBold: 'ManropeSemiBold',
  bodyBold: 'ManropeBold',
  rounded: 'Lexend',
  mono: 'Manrope',
};
