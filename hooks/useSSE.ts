"use client";
import { useRef, useState } from "react";

export const useSSE = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lastMsgRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
        lastMsgRef.current = data;
        if (data.status === "done") setIsConnected(false);
      } catch {
        console.error("Invalid SSE data");
      }
    };

    eventSource.onerror = () => {
      if (!lastMsgRef.current || lastMsgRef.current.status !== "done") {
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

  return { isConnected, messages, error, connect, disconnect };
};
