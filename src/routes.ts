export type PasskeyRoutes = {
    /**
     * GET: Fetch registration options from the server.
     * @default '/user/passkeys/options'
     */
    registerOptions: string;

    /**
     * POST: Store a new passkey after successful registration.
     * @default '/user/passkeys'
     */
    registerStore: string;

    /**
     * GET: Fetch authentication options from the server.
     * @default '/passkeys/options'
     */
    verifyOptions: string;

    /**
     * POST: Submit credential for verification.
     * @default '/passkeys/verify'
     */
    verifySubmit: string;
};

/**
 * Default Laravel routes for passkey operations.
 */
export const defaultRoutes: PasskeyRoutes = {
    registerOptions: "/user/passkeys/options",
    registerStore: "/user/passkeys",
    verifyOptions: "/passkeys/options",
    verifySubmit: "/passkeys/verify",
};

let routes: PasskeyRoutes = { ...defaultRoutes };

/**
 * Configure custom routes for passkey operations.
 */
export function configureRoutes(custom: Partial<PasskeyRoutes>): void {
    routes = { ...routes, ...custom };
}

/**
 * Get the current route configuration.
 */
export function getRoutes(): PasskeyRoutes {
    return routes;
}
