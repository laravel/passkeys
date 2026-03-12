/// <reference types="vitest" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    resolve: {
        conditions: ["browser", "import"],
    },
    plugins: [
        svelte(),
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
                svelte: resolve(__dirname, "src/adapters/svelte.ts"),
                vue: resolve(__dirname, "src/adapters/vue.ts"),
            },
            formats: ["es"],
        },
        rollupOptions: {
            external: ["@simplewebauthn/browser", "react", "vue", "svelte", /^svelte\//],
            output: {
                entryFileNames: "[name].js",
            },
        },
    },
    test: {
        environment: "happy-dom",
        setupFiles: ["./tests/setup.ts"],
    },
});
