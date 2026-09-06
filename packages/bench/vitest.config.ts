import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@context-meter/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url)
      ),
      "@context-meter/sdk": fileURLToPath(
        new URL("../../packages/sdk/src/index.ts", import.meta.url)
      ),
    },
  },
});
