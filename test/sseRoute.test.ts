/**
 * @jest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { useSSE } from "@/hooks/useSSE";

type MockESHandler = ((ev: any) => void) | null;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: MockESHandler = null;
  onmessage: MockESHandler = null;
  onerror: MockESHandler = null;
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  emitOpen() {
    this.onopen?.({});
  }

  emitMessage(data: string) {
    this.onmessage?.({ data });
  }

  emitError() {
    this.onerror?.({});
  }
}

describe("useSSE", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (globalThis as any).EventSource = MockEventSource;
    jest.clearAllMocks();
  });

  it("connect sets loading, then onopen marks connected", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => {
      result.current.connect();
    });

    expect(result.current.isLoading).toBe(true);
    expect(MockEventSource.instances.length).toBe(1);

    act(() => {
      MockEventSource.instances[0].emitOpen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("onmessage appends parsed JSON messages", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      MockEventSource.instances[0].emitMessage(JSON.stringify({ a: 1 }));
    });

    expect(result.current.messages).toEqual([{ a: 1 }]);

    act(() => {
      MockEventSource.instances[0].emitMessage(JSON.stringify({ a: 2 }));
    });

    expect(result.current.messages).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("ignores invalid JSON messages without crashing", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      MockEventSource.instances[0].emitMessage("not-json");
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("onerror sets an error message only if no messages were received", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      MockEventSource.instances[0].emitError();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe("Connection lost. Try again.");
    expect(MockEventSource.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("onerror does not set error if at least one message has been received", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      MockEventSource.instances[0].emitMessage(JSON.stringify({ a: 1 }));
    });

    act(() => {
      MockEventSource.instances[0].emitError();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("disconnect closes the EventSource and marks disconnected", () => {
    const { result } = renderHook(() => useSSE("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      result.current.disconnect();
    });

    expect(MockEventSource.instances[0].close).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
  });

  it("clearMessages empties the message list", () => {
    const { result } = renderHook(() => useSSE<{ a: number }>("/api/sse"));

    act(() => result.current.connect());
    act(() => MockEventSource.instances[0].emitOpen());

    act(() => {
      MockEventSource.instances[0].emitMessage(JSON.stringify({ a: 1 }));
    });

    expect(result.current.messages.length).toBe(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it("unmount closes EventSource (cleanup)", () => {
    const { result, unmount } = renderHook(() => useSSE("/api/sse"));

    act(() => result.current.connect());
    expect(MockEventSource.instances.length).toBe(1);

    unmount();
    expect(MockEventSource.instances[0].close).toHaveBeenCalledTimes(1);
  });
});
