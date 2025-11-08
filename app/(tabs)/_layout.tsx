import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons, Octicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const iconColor = "#1cb3ff";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,

        tabBarBackground: () => (
       
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        ),

        tabBarStyle: {
          backgroundColor: "#232b2cff", 
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
          overflow: 'hidden', 
          borderTopWidth: 0, 
          position: 'absolute', 
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 10, 
          shadowColor: '#000', 
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
        },

        tabBarItemStyle: {
          paddingVertical: 6,
        },

        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => <MaterialIcons name="home" size={32} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="registro"
        options={{
          title: 'Registros',
          tabBarIcon: () => <Octicons name="graph" size={32} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'Sensores',
          tabBarIcon: () => <MaterialIcons name="sensors" size={32} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: () => <MaterialIcons name="account-circle" size={32} color={iconColor} />,
        }}
      />
    </Tabs>
  );
}
