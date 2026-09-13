import { Themes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Themes['light-emerald']
) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const activeTheme = colorScheme === 'light' ? Themes['light-emerald'] : Themes['dark-neon'];
    return activeTheme[colorName];
  }
}
