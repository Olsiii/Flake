import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Next's RSC bundler resolves "server-only" to its no-op `empty.js`
      // via the "react-server" export condition; outside that bundler
      // (i.e. here) it resolves to `index.js`, which throws
      // unconditionally. Point at the same no-op Next itself uses so
      // server-only modules stay importable in tests.
      "server-only": path.resolve(
        import.meta.dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
});
