import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useCounter } from "@/hooks/useCounter";

test("useCounter works correctly", () => {
  const { result } = renderHook(() => useCounter(5));

  // Initial value
  expect(result.current.count).toBe(5);

  // Increment
  act(() => result.current.increment());
  expect(result.current.count).toBe(6);

  // Decrement
  act(() => result.current.decrement());
  expect(result.current.count).toBe(5);

  // Reset
  act(() => result.current.reset());
  expect(result.current.count).toBe(5);
});
