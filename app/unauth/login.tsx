import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';


export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  (async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (status !== 'granted') {
        const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = requestedStatus;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Para recibir alertas, por favor habilita las notificaciones en la configuración.'
        );
      }
    }
  })();
}, []);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    const success = await login(email, password);

    setIsLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Credenciales incorrectas o error en servidor');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/HydrAI_Logo.png")}
          style={styles.reactLogo}
        />
      }
      headerHeight={150}
    >
      <ThemedView style={styles.containerLogo}>
        <Image
          source={require("@/assets/images/HydrAI_label.png")}
          style={styles.hydrAILogo}
          resizeMode="contain"
        />
      </ThemedView>
      <ThemedView style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Correo o Usuario"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Cargando...' : 'Ingresar'}
          </Text>
        </TouchableOpacity>

      

        {/* Navegar al registro */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push('/unauth/register')}
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1f2226',
    borderRadius: 15,
  },
  containerLogo: {
    width: 300,
    height: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reactLogo: {
    width: 150,
    height: 150,
  },
  hydrAILogo: {
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    backgroundColor: Colors.dark.inputColor,
    color: '#ffffff',
    borderColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 18,
  },
  button: {
    backgroundColor: Colors.dark.secondaryColor,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    marginTop: 15,
    color: '#fffff',
    fontSize: 12,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.dark.secondaryColor,
    fontSize: 16,
    fontWeight: '600',
  },
});
