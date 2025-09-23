import { useEffect, useMemo } from "react";

type useShortcutProps = {
  callback: () => void;
  shortCutOS: {
    Windows: string;
    MacOS: string;
    Linux: string;
  };
};

/**
 * Custom React hook that detects the user's operating system and sets up a keyboard shortcut listener.
 *
 * @param callback - The function to execute when the specified shortcut is triggered.
 * @param shortCutOS - An object specifying the keyboard shortcut for each supported OS.
 *
 * @returns The keyboard shortcut string for the detected OS.
 *
 * @example
 * useShortcut({
 * callback: () => alert('Shortcut triggered!'),
 * shortCutOS: {
 * Windows: 'Ctrl+S',
 * MacOS: '⌘+S',
 * Linux: 'Ctrl+S'
 * }
 * });
 */
export default function useShortcut({
  callback,
  shortCutOS,
}: useShortcutProps): string {
  const os = useMemo(() => {
    if (typeof window === "undefined") return "Unknown";
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("win")) return "Windows";
    if (platform.includes("mac")) return "MacOS";
    if (platform.includes("linux")) return "Linux";
    return "Unknown";
  }, []);

  const shortcut_keys: string[] = useMemo(() => {
    if (os === "Unknown") return [];
    const shortcutString = shortCutOS[os];
    return shortcutString
      .replace(/⌘/g, "meta+")
      .replace(/⇧/g, "shift+")
      .replace(/⌃/g, "ctrl+")
      .replace(/⌥/g, "alt+")
      .toLowerCase()
      .replace(/ /g, "")
      .replace(/command|meta/g, "meta")
      .replace(/control|ctrl/g, "ctrl")
      .replace(/option|alt/g, "alt")
      .split("+")
      .filter(Boolean);
  }, [os, shortCutOS]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mainKey = shortcut_keys.at(-1);
      console.log(mainKey);
      if (!mainKey || event.key.toLowerCase() !== mainKey) return;
      const metaRequired = shortcut_keys.includes("meta");
      const shiftRequired = shortcut_keys.includes("shift");
      const ctrlRequired = shortcut_keys.includes("ctrl");
      const altRequired = shortcut_keys.includes("alt");
      if (
        event.metaKey === metaRequired &&
        event.shiftKey === shiftRequired &&
        event.ctrlKey === ctrlRequired &&
        event.altKey === altRequired
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [os, callback, shortCutOS]);

  return os !== "Unknown" ? shortCutOS[os] : "";
}
