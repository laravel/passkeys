/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ["src/**/*.ts"],
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                react: resolve(__dirname, "src/adapters/react.ts"),
                vue: resolve(__dirname, "src/adapters/vue.ts"),
            },
            formats: ["es"],
        },
        rollupOptions: {
            external: ["@simplewebauthn/browser", "react", "vue"],
            output: {
                entryFileNames: "[name].js",
            },
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
    },
});
