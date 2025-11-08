import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL_LOCAL } from '@/urls/urls';


const API_BASE_URL = API_URL_LOCAL;

type Ajuste = {
  id: number;
  personas: number | null;
  usuario: number | null;
};

type UsuarioData = {
  id: number;
  username: string | null;
  email: string | null;
  password: string | null;
  ajustes: Ajuste[];
};

export default function AccountScreen() {
  const { token, id, logout } = useAuth();

  const [usuarioData, setUsuarioData] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(false);

 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsuario = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al obtener usuario');
      const data: UsuarioData = await res.json();
      setUsuarioData(data);
      setUsername(data.username || '');
      setEmail(data.email || '');
      setPassword(data.password || '')
      setAjustes(data.ajustes);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuario();
  }, []);

  const saveUserData = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Error', 'El username y el email no pueden estar vacíos');
      return;
    }
    try {
      const body: any = { username, email };
      if (password.trim()) body.password = password;

      const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al actualizar usuario');
      Alert.alert('Éxito', 'Datos de usuario actualizados');
      setPassword('');
      fetchUsuario();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const saveAjuste = async (ajuste: Ajuste) => {
    if (!ajuste.personas || ajuste.personas < 1) {
      Alert.alert('Error', 'El número de personas debe ser mayor o igual a 1');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/ajustes/${ajuste.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personas: ajuste.personas }),
      });
      if (!res.ok) throw new Error('Error al actualizar ajuste');
      Alert.alert('Éxito', 'Ajuste actualizado');
      fetchUsuario();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onChangePersonas = (id: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setAjustes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, personas: num } : a))
    );
  };

  const renderAjuste = (ajuste: Ajuste) => (
    <View key={ajuste.id} style={styles.card}>
     
      <View style={styles.personasRow}>
        <ThemedText style={styles.label}>Personas:</ThemedText>
        <TextInput
          style={styles.inputNumber}
          keyboardType="numeric"
          value={ajuste.personas?.toString() || ''}
          onChangeText={(val) => onChangePersonas(ajuste.id, val)}
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => saveAjuste(ajuste)}
        >
          <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: Colors.dark.headerSecondary, dark: Colors.dark.headerSecondary }}
      headerImage={
        <IconSymbol
          size={310}
          color=""
          name="person"
          style={styles.headerImage}
        />
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Tu cuenta
          </ThemedText>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.dark.secondaryColor} />
          ) : (
            <>
              {/* Username */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.label}>Username:</ThemedText>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Email */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.label}>Email:</ThemedText>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputRow}>
                <ThemedText style={styles.label}>Contraseña:</ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Contraseña"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={saveUserData}>
                <ThemedText style={styles.buttonText}>
                  Guardar usuario
                </ThemedText>
              </TouchableOpacity>

              <ThemedText type="title" style={styles.ajustesTitle}>
                Ajustes
              </ThemedText>

              {ajustes.length > 0 ? ajustes.map(renderAjuste) : (
                <ThemedText>No hay ajustes.</ThemedText>
              )}
            </>
          )}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <ThemedText style={styles.logoutButtonText}>Salir de la app</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
        

      </KeyboardAvoidingView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#FF4C4C',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    maxWidth: 200
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutContainer:{
    alignItems: 'center'
  },

  headerImage: {
    color: Colors.dark.secondaryColor,
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    marginBottom: 15,
  },
  ajustesTitle: {
    marginTop: 30,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    width: 100,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.inputColor,
    color: '#ffffff',
    borderColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.dark.secondaryColor,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#687076',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
  },
  ajusteLabel: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  personasRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputNumber: {
    backgroundColor: Colors.dark.inputColor,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    width: 70,
    marginRight: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.dark.secondaryColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  passwordContainer: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.dark.inputColor,
  borderRadius: 8,
  paddingHorizontal: 10,
},
eyeButton: {
  marginLeft: 8,
},


});
