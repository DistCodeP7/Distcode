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
        lastMsgRef.current = data; // track latest message

        if (data.status === "done") {
          setIsConnected(false); // normal end
        }
      } catch (err) {
        console.error("Invalid SSE data", err);
      }
    };

    eventSource.onerror = () => {
      // Check ref instead of state
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
