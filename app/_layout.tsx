import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        if (isAuthenticated) {
          await router.replace('/(tabs)');
        } else {
          await router.replace('/unauth/login');
        }
      } finally {
        setIsNavigating(false);
      }
    };

    redirect();
  }, [isAuthenticated]);

  if (isNavigating) {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white', 
          zIndex: 1000,
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SamsungSans-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Slot />
        <AuthRedirect />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
