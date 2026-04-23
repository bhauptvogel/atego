import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "static",
  build: {
    outDir: "build",
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
      },
    },
  },
});