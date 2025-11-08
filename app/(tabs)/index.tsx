import React, { useEffect, useState, useRef } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Slider } from "@rneui/themed";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { WEBSOCKET_URL_LOCAL } from "@/urls/urls";

export default function HomeScreen() {
  const { token } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const [connected, setConnected] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [consumo, setConsumo] = useState(0);
  const [prediccion, setPrediccion] = useState<number | null>(null);

  const [predictionTime, setPredictionTime] = useState(0);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const [nivelConsumo, setNivelConsumo] = useState("bajo");
  const [etiquetaActual, setEtiquetaActual] = useState<string | null>(null);
  const [nivelFuturo, setNivelFuturo] = useState<string | null>(null);

  const [showFloatingNotif, setShowFloatingNotif] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [predRanges, setPredRanges] = useState<number[]>([0, 1, 5, 10, 15, 30, 60]);
  const [prediccionesMap, setPrediccionesMap] = useState<Record<string, { prediccion: number; etiqueta: string }> | null>(null);

  const connectWebSocket = (jwt: string) => {
    const wsUrl = `${WEBSOCKET_URL_LOCAL}?token=${jwt}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
    };

    ws.current.onclose = (e) => {
      setConnected(false);
      reconnectTimeout.current = setTimeout(() => {
        if (token) connectWebSocket(token);
      }, 3000);
    };

    ws.current.onerror = (e) => {
      ws.current?.close();
    };

    ws.current.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log(data);
        

        if (data.source === "arduino") {
          if (typeof data.tiempo === "number") setTiempo(data.tiempo);
          if (typeof data.consumo === "number") setConsumo(data.consumo);

          if (data.AIData) {
            setEtiquetaActual(data.AIData.etiquetaActual ?? null);
            setPrediccionesMap(data.AIData.predicciones ?? null);

            if (data.AIData.predicciones) {
              const etiquetas = data.AIData.predicciones;
              const etiquetaFutura = etiquetas[predictionTime]?.etiqueta ?? null;
              setNivelFuturo(etiquetaFutura);
            }
          }
        }

        if (data.nivelConsumo) {
          setNivelConsumo(data.nivelConsumo);
        }

        if (typeof data.prediccion === "number") {
          setPrediccion(data.prediccion);
          setLoadingPrediction(false);
        }

        if (data.notificacion) {
          console.log("Entra noti correctamente");

          const pred = data.AIData.predicciones["60"].prediccion?.toFixed(2) ?? "0.0";
          const etiqueta = data.AIData.predicciones["60"].etiqueta ?? "desconocido";
          const tiempoUsado = data.tiempo ?? 0;

          const messagePopUp = `ALERTA!\nEstas a punto de consumir ${pred} litros\nTu nivel de consumo sera ${etiqueta}\nY has usado agua durante ${tiempoUsado} segundos`;
          const message = `Estas a punto de consumir ${pred} litros\nTu nivel de consumo sera ${etiqueta}\nY has usado agua durante ${tiempoUsado} segundos`;

        
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Alerta! ⚠️",
              body: message,
            },
            trigger: null,
          });

      
          setFloatingMessage(messagePopUp);
          setShowFloatingNotif(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowFloatingNotif(false));
          }, 5000);
        }

      } catch (err) {
        setLoadingPrediction(false);
      }
    };
  };

  useEffect(() => {
    if (!token) return;
    connectWebSocket(token);

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [token]);

  useEffect(() => {
    if (prediccionesMap && prediccionesMap[predictionTime]) {
      setNivelFuturo(prediccionesMap[predictionTime].etiqueta);
      setPrediccion(prediccionesMap[predictionTime].prediccion);
    } else {
      setNivelFuturo(null);
      setPrediccion(null);
    }
  }, [predictionTime, prediccionesMap]);

  const getNivelColor = (nivel: string | null, notificacion?: boolean | null) => {
    if (!nivel) return "#95a5a6";
    if ((nivel === "bajo" || nivel === "ideal") && (notificacion)) return "#1d4727ff";
    if ((nivel === "normal") && (notificacion)) return "#1d3a47ff";
    if ((nivel === "alto") && (notificacion)) return "#471e1dff";
    if (nivel === "bajo" || nivel === "ideal") return "#2ecc71";
    if (nivel === "normal") return "#3498db";
    if (nivel === "alto") return "#e74c3c";
    
    return "#95a5a6";
  };

  return (
    <ParallaxScrollView headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }} headerImage={<Image source={require("@/assets/images/HydrAI_Logo.png")} style={styles.reactLogo} />}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Consumo en tiempo real</ThemedText>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: connected ? "green" : "red" }]}>
            {connected ? "Conectado" : "Desconectado"}
          </Text>
        </View>

        {predictionTime > 0 ? (
          <View style={[styles.card, { backgroundColor: getNivelColor(nivelFuturo) }]}>
            <Text style={styles.label}>Nivel de consumo futuro para {predictionTime} seg después: {nivelFuturo ?? "..."}</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: getNivelColor(etiquetaActual) }]}>
            <Text style={styles.label}>Nivel de consumo actual: {etiquetaActual ?? "..."}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.dataText}>Has consumido agua durante {tiempo} segundos</Text>
          <Text style={styles.dataText}>Has consumido un total de {consumo.toFixed(2)} litros</Text>
          <Text style={styles.dataText}>
            Estás por consumir{" "}
            {loadingPrediction ? (
              <ActivityIndicator size="small" color="#89C87C" />
            ) : (
              `${prediccion?.toFixed(2) ?? "0.0000"} litros`
            )}
          </Text>

          <Slider
            value={predictionTime}
            onValueChange={(val) => setPredictionTime(val)}
            minimumValue={Math.min(...predRanges)}
            maximumValue={Math.max(...predRanges)}
            step={1}
            thumbStyle={{ height: 25, width: 25, backgroundColor: "#89C87C", borderWidth: 0 }}
            trackStyle={{ height: 6, borderRadius: 3 }}
            minimumTrackTintColor="#72B06A"
            maximumTrackTintColor="#CDEAC3"
            onSlidingComplete={(val) => {
              const closest = predRanges.reduce((prev, curr) =>
                Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
              );
              setPredictionTime(closest);
            }}
          />

          <Text style={{ marginTop: 10, fontSize: 16, color: "#89C87C", fontWeight: "bold", textAlign: "center" }}>
            Estimar para {predictionTime} segundos después
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.reconnectButton, !connected && styles.reconnectButtonDisabled]}
          onPress={() => connectWebSocket(token ?? "")}
          disabled={!token}
        >
          <Text style={styles.reconnectButtonText}>Reconectar</Text>
        </TouchableOpacity>
      </ThemedView>

      {showFloatingNotif && (
        <Animated.View style={[styles.floatingNotif, { opacity: fadeAnim, backgroundColor: getNivelColor(prediccionesMap!['60'].etiqueta ?? "", true) },]}>
          <Text style={styles.floatingText}>{floatingMessage}</Text>
        </Animated.View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  statusContainer: { marginVertical: 10, alignItems: "center" },
  statusText: { fontSize: 18, fontWeight: "bold" },
  card: {
    backgroundColor: "#687076",
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
  },
  dataText: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
    color: "white",
  },
  label: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
  reactLogo: {
    height: 180,
    width: 180,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  reconnectButton: {
    backgroundColor: "#69cdff",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  reconnectButtonDisabled: {
    backgroundColor: "#aaa",
  },
  reconnectButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  floatingNotif: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#1D3D47",
    padding: 15,
    borderRadius: 10,
    zIndex: 999,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingText: {
    color: "#ECEDEE",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
