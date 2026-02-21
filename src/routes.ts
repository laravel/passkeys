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
     * @default '/passkeys/login/options'
     */
    verifyOptions: string;

    /**
     * POST: Submit credential for verification.
     * @default '/passkeys/login'
     */
    verifySubmit: string;
};

/**
 * Default Laravel routes for passkey operations.
 */
export const defaultRoutes: PasskeyRoutes = {
    registerOptions: "/user/passkeys/options",
    registerStore: "/user/passkeys",
    verifyOptions: "/passkeys/login/options",
    verifySubmit: "/passkeys/login",
};
