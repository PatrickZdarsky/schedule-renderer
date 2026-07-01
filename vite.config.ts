import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary", "cobertura", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "dist/**",
        "schedule-schema/**",
        "public/**",
        "scripts/**",
        "tests/**",
        "vite.config.ts",
        "src/main.ts",
        "src/types/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
