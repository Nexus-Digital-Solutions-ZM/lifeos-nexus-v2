"use client";
import { useEffect, useRef, useCallback } from "react";
import type { WSEvent } from "@/types";

type EventHandler = (data: unknown) => void;

export function useWebSocket(handlers: Record<string, EventHandler>) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("lifeos_access") : null;
    if (!token) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://residue-snipping-usage.ngrok-free.dev";
    const socket = new WebSocket(`${WS_URL}/ws?token=${token}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log("[WS] Connected");
      // Heartbeat ping every 25s
      const ping = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("ping");
        else clearInterval(ping);
      }, 25_000);
    };

    socket.onmessage = (event) => {
      try {
        const { event: name, data }: WSEvent = JSON.parse(event.data);
        const handler = handlersRef.current[name];
        if (handler) handler(data);
      } catch {
        // ignore malformed messages
      }
    };

    socket.onclose = (e) => {
      if (e.code !== 1000) {
        // Auto-reconnect after 3s unless deliberate close
        reconnectTimer.current = setTimeout(connect, 3_000);
      }
    };

    socket.onerror = () => socket.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close(1000);
    };
  }, [connect]);
}
