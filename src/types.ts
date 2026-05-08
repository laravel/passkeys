import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

export type { PasskeyRoutes } from "./routes";

export type PasskeysConfig = {
    /**
     * Configure the fetch options used for requests to the Laravel backend.
     */
    fetch?: PasskeysFetchConfig;
};

export type PasskeysFetchConfig = {
    /**
     * The fetch `credentials` mode used for requests.
     *
     * Defaults to `"same-origin"`. Set to `"include"` for SPAs hosted on a
     * different origin from the Laravel backend.
     */
    credentials?: RequestCredentials;

    /**
     * Additional headers included with requests.
     */
    headers?: Record<string, string>;
};

export type RouteOverrides = {
    routes?: {
        /**
         * Override the options endpoint used before the ceremony.
         */
        options?: string;

        /**
         * Override the submit endpoint used after the ceremony.
         */
        submit?: string;
    };
};

export type RegisterRouteOptions = RouteOverrides;

export type VerifyRouteOptions = RouteOverrides;

export type RegisterOptions = {
    /**
     * Human-readable name for this passkey (e.g., "MacBook Pro", "Work Laptop").
     */
    name: string;
} & RegisterRouteOptions;

/**
 * Response from GET /user/passkeys/options
 */
export type RegistrationOptionsResponse = {
    options: PublicKeyCredentialCreationOptionsJSON;
};

/**
 * Response from GET /passkeys/login/options
 */
export type VerifyOptionsResponse = {
    options: PublicKeyCredentialRequestOptionsJSON;
};

/**
 * Request body for POST /user/passkeys
 */
export type RegistrationRequest = {
    name: string;
    credential: RegistrationResponseJSON;
};

/**
 * Request body for POST /passkeys/login
 */
export type VerifyRequest = {
    credential: AuthenticationResponseJSON;
};

/**
 * Response from POST /user/passkeys
 */
export type RegistrationResponse = {
    id: string;
    name: string;
};

/**
 * Response from POST /passkeys/login
 */
export type VerifyResponse = {
    redirect?: string;
};
