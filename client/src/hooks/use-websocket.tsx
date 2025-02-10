import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";

type WSMessage = {
  type: string;
  payload: any;
};

export function useWebSocket(onMessage: (message: WSMessage) => void) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [user, onMessage]);

  return (message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };
}
