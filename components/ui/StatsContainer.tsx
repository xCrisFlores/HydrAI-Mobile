import { StyleSheet, View } from 'react-native';
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Colors } from '@/constants/Colors';

export const StatsContainer = ({ stats, rango }: { stats: any, rango: 'hora' | 'dia' }) => {
  if (!stats || Object.keys(stats).length === 0) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        Estadísticas por {rango === 'hora' ? 'hora' : 'día'}
      </ThemedText>

      <View style={styles.row}>
       <View style={[styles.statBox, { backgroundColor: "#e24b4bff" }]}>
          <ThemedText style={styles.statText}>Consumo Maximo: {stats.max.toFixed(2) ?? '...'} L</ThemedText>
        </View>
        <View style={[styles.statBox, { backgroundColor: "#5bdb57ff" }]}>
          <ThemedText style={styles.statText}>Consumo Minimo: {stats.min.toFixed(2) ?? '...'} L</ThemedText>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.statBox, { backgroundColor: "#e28f4bff" }]}>
          <ThemedText style={styles.statText}>Consumo promedio: {stats.avgConsumo?.toFixed(2) ?? '...'} L</ThemedText>
        </View>
        <View style={[styles.statBox, { backgroundColor: "#4ba6e2ff" }]}>
          <ThemedText style={styles.statText}>Uso promedio: {stats.avgTiempo?.toFixed(2) ?? '...'} Seg</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.dark.headerPrimary,
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

