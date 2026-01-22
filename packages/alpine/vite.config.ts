import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ["src/**/*.ts"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "LaravelPasskeysAlpine",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["alpinejs", "@laravel/passkeys"],
      output: {
        globals: {
          alpinejs: "Alpine",
          "@laravel/passkeys": "LaravelPasskeys",
        },
      },
    },
  },
});
