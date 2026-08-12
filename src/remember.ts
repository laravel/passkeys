import type { RememberOption } from "./types";

/**
 * Resolve a remember option to its boolean value at submit time, so getters
 * report live UI state.
 */
export const resolveRemember = (remember?: RememberOption): boolean =>
    (typeof remember === "function" ? remember() : remember) ?? false;
