// jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // So Jest only looks for tests in your /test folder
  roots: ["<rootDir>/test"],
  // Make "@/..." imports work in tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// Important: don't use module.exports in TS/ESM, just default export
export default createJestConfig(config);
