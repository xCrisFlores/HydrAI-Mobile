import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { WEBSOCKET_URL_LOCAL } from '@/urls/urls';

type MessageData = {
  tiempo: number;
  consumo: number;
  timestamp: string;
  predicted_consumption?: number;
  nivelConsumo?: string;
};

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();
  
  const url = WEBSOCKET_URL_LOCAL;

  const [connected, setConnected] = useState(false);
  const [timeActive, setTimeActive] = useState(0);
  const [consumption, setConsumption] = useState(0);
  const [predictedConsumption, setPredictedConsumption] = useState<number | null>(null);
  const [nivelConsumo, setNivelConsumo] = useState<string>("");

  const connectWebSocket = useCallback(() => {
    if (!token) {
      console.warn("⏳ Token no disponible. Esperando para conectar WebSocket...");
      return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("🔄 WebSocket ya conectado");
      return;
    }

    console.log(token);
    

    const WS_URL = `${url}?token=${encodeURIComponent(token)}`;
    console.log("🔌 Conectando WebSocket a:", WS_URL);

    ws.current = new WebSocket(WS_URL);

    console.log("📡 Estado inicial del WebSocket:", ws.current.readyState);

    ws.current.onopen = () => {
      console.log("✅ WebSocket conectado (readyState = OPEN)");
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log("📥 MENSAJE RECIBIDO DEL SERVIDOR:", event.data);
      try {
        const data: MessageData = JSON.parse(event.data);

        if ("tiempo" in data && "consumo" in data) {
          setTimeActive(data.tiempo);
          setConsumption(data.consumo);
        }

        if ("predicted_consumption" in data) {
          setPredictedConsumption(data.predicted_consumption ?? 0);
        }

        if ("nivelConsumo" in data) {
          setNivelConsumo(data.nivelConsumo ?? '');
        }
      } catch (err) {
        console.error("❌ Error parseando mensaje WebSocket:", err);
      }
    };

    ws.current.onerror = (err) => {
      console.error("❌ Error WebSocket:", err);
    };

    ws.current.onclose = (event) => {
      console.warn(`🔌 WebSocket cerrado (code=${event.code}, reason=${event.reason})`);
      setConnected(false);
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          reconnectTimeout.current = null;
          connectWebSocket();
        }, 5000);
      }
    };
  }, [token, url]);

  const sendPredictionRequest = (predictionTime: number) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        source: "react_app",
        tiempo: predictionTime,
      };
      console.log("📤 Enviando solicitud de predicción:", payload);
      ws.current.send(JSON.stringify(payload));
    } else {
      console.warn("⚠️ No se puede enviar: WebSocket no está conectado");
    }
  };

  useEffect(() => {
    console.log("🪝 useEffect ejecutado con token:", token);
    if (token) {
      connectWebSocket();
    }

    return () => {
      if (ws.current) {
        console.log("🛑 Cerrando WebSocket...");
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [token, connectWebSocket]);

  return {
    connected,
    timeActive,
    consumption,
    predictedConsumption,
    nivelConsumo,
    connectWebSocket,
    sendPredictionRequest,
  };
};
