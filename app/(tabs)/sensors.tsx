import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { API_URL_LOCAL } from '@/urls/urls';


const API_BASE_URL = API_URL_LOCAL;

type Sensor = {
  id: string;
  nombre: string;
  activo: boolean;
  ubicacion?: string;
};

export default function SensorsScreen() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);

  const { token, id } = useAuth();

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sensores/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al obtener sensores');
      const data = await res.json();
      setSensors(data);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);


  const toggleActive = async (sensor: Sensor) => {
    const updatedSensor = { ...sensor, active: !sensor.activo };
    try {
      const res = await fetch(`${API_BASE_URL}/sensores/${sensor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: updatedSensor.active }),
      });
      if (!res.ok) throw new Error('Error al actualizar sensor');
      await fetchSensors();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };


  const onEditLocation = (sensor: Sensor) => {
    Alert.prompt(
      'Editar ubicación',
      `Ingrese la nueva ubicación para ${sensor.nombre}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (newLocation: any) => {
            if (!newLocation) return;
            try {
              const res = await fetch(`${API_BASE_URL}/sensores/${sensor.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ubicacion: newLocation }),
              });
              if (!res.ok) throw new Error('Error al actualizar ubicación');
              setSensors((prev) =>
                prev.map((s) =>
                  s.id === sensor.id ? { ...s, location: newLocation } : s
                )
              );
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            }
          },
        },
      ],
      'plain-text',
      sensor.ubicacion || ''
    );
  };

  return (
    <ParallaxScrollView
          headerBackgroundColor={{ light: Colors.dark.headerSecondary, dark: Colors.dark.headerSecondary }}
          headerImage={
            <IconSymbol
              size={310}
              color= {Colors.dark.secondaryColor}
              name="sensor"
              style={styles.headerImage}
            />
          }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={{ marginBottom: 15 }}>
          Sensores
        </ThemedText>

        {loading ? (
          <ThemedText>Cargando sensores...</ThemedText>
        ) : sensors.length === 0 ? (
          <ThemedText>No hay sensores disponibles.</ThemedText>
        ) : (
          sensors.map((sensor) => (
            <View key={sensor.id} style={styles.card}>
              <IconSymbol
                name="sensor"
                size={30}
                color={sensor.activo ? '#4caf50' : '#b0b0b0'}
                style={styles.sensorIcon}
              />

              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sensorName}>{sensor.nombre}</ThemedText>
                {sensor.ubicacion ? (
                  <ThemedText style={styles.sensorLocation}>
                    Ubicación: {sensor.ubicacion}
                  </ThemedText>
                ) : null}
              </View>

              <Switch
                value={sensor.activo}
                onValueChange={() => toggleActive(sensor)}
                trackColor={{ false: '#ccc', true: '#4caf50' }}
                thumbColor={sensor.activo ? '#2e7d32' : '#f4f3f4'}
                style={styles.switch}
              />

              <TouchableOpacity
                onPress={() => onEditLocation(sensor)}
                style={styles.editButton}
              >
                <IconSymbol name="edit" size={25} color="#2196f3" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: Colors.dark.secondaryColor,
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#687076',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sensorIcon: {
    marginRight: 15,
  },
  sensorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sensorLocation: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  switch: {
    marginRight: 15,
  },
  editButton: {
    padding: 6,
  },
});
