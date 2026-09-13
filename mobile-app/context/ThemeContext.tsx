import React, { createContext, useContext, useState, useEffect } from 'react';
import { Themes, ThemeType, ThemeColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { Themes as THEMES };

export interface ThemeContextType {
  theme: ThemeColors;
  themeType: ThemeType;
  currentTheme: ThemeType;
  isDark: boolean;
  setThemeType: (type: ThemeType) => void;
  setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('dark-neon');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme && Object.keys(Themes).includes(savedTheme)) {
          setThemeType(savedTheme as ThemeType);
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const handleSetThemeType = async (type: ThemeType) => {
    setThemeType(type);
    try {
      await AsyncStorage.setItem('app_theme', type);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  if (!isLoaded) return null;

  const currentThemeColors = Themes[themeType] || Themes['dark-neon'];

  return (
    <ThemeContext.Provider
      value={{
        theme: currentThemeColors,
        themeType,
        currentTheme: themeType,
        isDark: currentThemeColors.isDark,
        setThemeType: handleSetThemeType,
        setTheme: handleSetThemeType,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
