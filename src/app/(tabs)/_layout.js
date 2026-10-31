import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

function TabGlyph({ glyph, color }) {
  return <Text style={{ color, fontSize: 19, fontWeight: '700' }}>{glyph}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color }) => <TabGlyph glyph="⌂" color={color} /> }}
      />
      <Tabs.Screen
        name="calendario"
        options={{ title: 'Calendário', tabBarIcon: ({ color }) => <TabGlyph glyph="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="avisos"
        options={{ title: 'Avisos', tabBarIcon: ({ color }) => <TabGlyph glyph="◉" color={color} /> }}
      />
    </Tabs>
  );
}
