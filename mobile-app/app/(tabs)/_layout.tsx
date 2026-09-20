import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: `${theme.border}26`,
          // Android'de beyaz çizgiyi engellemek için elevation ve shadow sıfırla
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          height: 76,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabel: ({ color, children }) => (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 11,
              color,
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            {children}
          </Text>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Arama',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Maçlar',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="sports-soccer" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Kulüpler',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
