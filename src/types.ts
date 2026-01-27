import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

export type { PasskeyRoutes } from "./routes";

export interface RegisterOptions {
    /**
     * Human-readable name for this passkey (e.g., "MacBook Pro", "Work Laptop").
     */
    name: string;
}

export interface AutofillOptions {
    /**
     * Called when the user successfully verifies via autofill.
     */
    onSuccess?: () => void;

    /**
     * Called when an error occurs.
     */
    onError?: (error: Error) => void;
}

/**
 * Response from GET /passkeys/register/options
 */
export interface RegistrationOptionsResponse {
    options: PublicKeyCredentialCreationOptionsJSON;
}

/**
 * Response from GET /passkeys/verify/options
 */
export interface VerifyOptionsResponse {
    options: PublicKeyCredentialRequestOptionsJSON;
}

/**
 * Request body for POST /passkeys/register
 */
export interface RegistrationRequest {
    name: string;
    credential: RegistrationResponseJSON;
}

/**
 * Request body for POST /passkeys/verify
 */
export interface VerifyRequest {
    credential: AuthenticationResponseJSON;
}

/**
 * Response from POST /passkeys/register
 */
export interface RegistrationResponse {
    id: string;
    name: string;
}

/**
 * Response from POST /passkeys/verify
 */
export interface VerifyResponse {
    verified: boolean;
    redirect?: string;
}
