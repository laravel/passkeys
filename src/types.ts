import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

export type { PasskeyRoutes } from "./routes";

export type RegisterOptions = {
    /**
     * Human-readable name for this passkey (e.g., "MacBook Pro", "Work Laptop").
     */
    name: string;
};

/**
 * Response from GET /passkeys/register/options
 */
export type RegistrationOptionsResponse = {
    options: PublicKeyCredentialCreationOptionsJSON;
};

/**
 * Response from GET /passkeys/verify/options
 */
export type VerifyOptionsResponse = {
    options: PublicKeyCredentialRequestOptionsJSON;
};

/**
 * Request body for POST /passkeys/register
 */
export type RegistrationRequest = {
    name: string;
    credential: RegistrationResponseJSON;
};

/**
 * Request body for POST /passkeys/verify
 */
export type VerifyRequest = {
    credential: AuthenticationResponseJSON;
};

/**
 * Response from POST /passkeys/register
 */
export type RegistrationResponse = {
    id: string;
    name: string;
};

/**
 * Response from POST /passkeys/verify
 */
export type VerifyResponse = {
    verified: boolean;
    redirect?: string;
};
