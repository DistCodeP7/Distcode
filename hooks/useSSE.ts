"use client";
import { useRef, useState } from "react";

export const useSSE = <T>(url: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lastMsgRef = useRef<T>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const clearMessages = () => setMessages([]);

  const connect = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setIsLoading(true);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      const data: T = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      lastMsgRef.current = data;
    };

    eventSource.onerror = () => {
      if (!lastMsgRef.current) {
        setError("Connection lost. Try again.");
      }
      setIsConnected(false);
      eventSource.close();
    };
  };

  const disconnect = () => {
    eventSourceRef.current?.close();
    setIsConnected(false);
  };

  return {
    isLoading,
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    clearMessages,
  };
};
