import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı', headerShown: false }} />
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: `${theme.primary}1A`,
              borderColor: `${theme.primary}4D`,
            },
          ]}
        >
          <MaterialIcons name="sports-soccer" size={48} color={theme.primary} />
        </View>

        <Text style={[styles.codeText, { color: theme.primary }]}>404</Text>
        <Text style={[styles.title, { color: theme.text }]}>Sayfa Bulunamadı</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          Aradığınız sayfa kaldırılmış, taşınmış veya geçersiz bir bağlantıya sahip olabilir.
          Maçlara ve kulüplere devam etmek için ana sayfaya dönebilirsiniz.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)')}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <MaterialIcons name="home" size={20} color={theme.onPrimary} />
          <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontFamily: Fonts.headline,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 210,
  },
  buttonText: {
    fontFamily: Fonts.headlineBold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
