import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Enable global APIs like describe, it, expect
    globals: true,
    // Use JSDOM for testing components or browser-like environments
    environment: "jsdom",
    // Match test files in the 'test' directory
    include: ["test/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // Configure path aliases
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
