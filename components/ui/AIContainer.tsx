import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import {  HYDRAI_NET_URL_LOCAL, LSTM_URL_LOCAL } from '@/urls/urls';

type RegistroData = {
  tiempoActivo: number;
  consumo: number;
  personas: number;
  temperaturaProm: number;
  sensacionProm: number;
  humedadProm: number;
  dia: number;
  hora: number;
  mes: number;
};

type Props = {
  registros: RegistroData[];
  rango: 'hora' | 'dia';
  titulo: string;
  total: number;
};

export default function AnalisisConsumo({ registros, rango, titulo, total }: Props) {
  const { token } = useAuth();
  const [clasificacionActual, setClasificacionActual] = useState<number | null>(null);
  const [prediccion, setPrediccion] = useState<number | null>(null);
  const [clasificacionFutura, setClasificacionFutura] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (registros.length === 0) return;
    procesar();
  }, [registros]);

  const procesar = async () => {
    try {
      setLoading(true);
      const ultimo = registros[registros.length - 1];

      const clasificacion = await predictClasico(ultimo);
      const pred = await predictLSTM(registros);

      const clasPredicha = await predictClasico({
        ...ultimo,
        consumo: pred,
        tiempoActivo: pred,
      });

      setClasificacionActual(clasificacion);
      setPrediccion(pred);
      setClasificacionFutura(clasPredicha);
    } catch (err) {
      console.error('Error en análisis:', err);
    } finally {
      setLoading(false);
    }
  };

  const predictClasico = async (registro: RegistroData): Promise<number> => {
    const payload = {
      rango,
      features: {
        tiempoActivo: registro.tiempoActivo,
        consumo: registro.consumo,
        personas: registro.personas,
        temperaturaProm: registro.temperaturaProm,
        sensacionProm: registro.sensacionProm,
        humedadProm: registro.humedadProm,
        dia: registro.dia,
        hora: rango === 'dia' ? 0 : registro.hora,
        mes: registro.mes
      }
    };

    const res = await fetch(`${HYDRAI_NET_URL_LOCAL}/api/hydrai/classify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data.cluster;
  };

  const predictLSTM = async (datos: RegistroData[]): Promise<number> => {
    const sequence = datos.slice(-7).map(r => [
      r.tiempoActivo,
      rango === 'dia' ? 0 : r.hora,
      r.temperaturaProm,
      r.sensacionProm,
      r.humedadProm,
      r.dia,
      r.mes
    ]);

    const payload = {
      sequence,
      modo: 'hora',
      rango
    };

    const res = await fetch(`${LSTM_URL_LOCAL}/api/hydrai/predict`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data.prediction;
  };

  const renderNivel = (nivel: number | null) => {
    if (nivel === null) return '...';
    return ['Ideal', 'Normal', 'Alto'][nivel];
  };

  const nivelColor = (nivel: number | null) => {
    if (nivel === null) return '#374151';
    return ['#10b981', '#3498db', '#ef4444'][nivel];
  };

  return (
    <View style={styles.wrapper}>
      {/* Header con título centrado */}
      <View style={styles.header}>
        <Text style={styles.title}>{titulo}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.dark.secondaryColor} />
          <Text style={styles.loadingText}>Analizando...</Text>
        </View>
      ) : (
        // OPCIÓN 1: Layout con flexbox (recomendado)
        <View style={[styles.prediccionCardContainer, { backgroundColor: nivelColor(clasificacionActual) }]}>
          {/* Contenido principal */}
          <View style={styles.mainContent}>
            <Text style={styles.prediccionMainText}>
              Haz consumido un total de:
              {"\n"}{total?.toFixed(2) ?? 'N/A'} L
              {"\n"}Nivel de consumo: {renderNivel(clasificacionActual)}
            </Text>
          </View>

          {/* Mini tarjeta */}
          <View style={[styles.prediccionMiniCard, { backgroundColor: nivelColor(clasificacionFutura) }]}>
            <Text style={styles.prediccionMiniText}>
              Estas por consumir:
              {"\n"}{prediccion !== null ? `${prediccion.toFixed(2)} L` : '...'}
              {"\n"}Nivel de consumo: {renderNivel(clasificacionFutura)}
            </Text>
          </View>
        </View>

       
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  loadingText: {
    color: '#9ca3af',
    marginLeft: 8,
    fontSize: 14,
  },

  // OPCIÓN 1: Flexbox layout (recomendado)
  prediccionCardContainer: {
    borderRadius: 12,
    padding: 16,
    borderBottomWidth: 4,
    borderBottomColor: 'white',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 80, // altura mínima para evitar cards muy pequeñas
    position: 'relative',
  },
  mainContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    paddingBottom: 60, 
   
  },
  prediccionMainText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  prediccionMiniCard: {
    borderRadius: 8,
    padding: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'white',
    width: 140,
    elevation: 4,
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  prediccionMiniText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },


  prediccionCardContainerAlt: {
    borderRadius: 12,
    padding: 16,
    borderBottomWidth: 4,
    borderBottomColor: 'white',
    position: 'relative',
    minHeight: 100, // altura mínima garantizada
  },
  mainContentAlt: {
    marginRight: 150, // deja espacio para la mini card (140px + 10px margen)
    paddingBottom: 8,
  },
  prediccionMiniCardAlt: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 8,
    padding: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'white',
    width: 140,
    elevation: 4,
  },
  
});