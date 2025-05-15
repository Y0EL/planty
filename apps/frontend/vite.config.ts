/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";
import { resolve } from "path";

export default defineConfig(() => {
  return {
    plugins: [
      wasm(),
      nodePolyfills({
        globals: {
          Buffer: true
        },
        protocolImports: true
      }), 
      react()
    ],
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      assetsInclude: ['**/*.wasm']
    },
    preview: {
      port: 5001,
      strictPort: true,
    },
    server: {
      port: 5001,
      strictPort: true,
      host: true,
      origin: "http://0.0.0.0:5001",
    },
    //vitest
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: [
        resolve(__dirname, "test/setup/setup.ts"),
        resolve(__dirname, "test/setup/resizeObserverMock.ts"),
      ],
    },
  };
});