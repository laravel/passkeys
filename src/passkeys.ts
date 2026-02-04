import {
    startRegistration,
    startAuthentication,
    browserSupportsWebAuthn,
    browserSupportsWebAuthnAutofill,
    WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { get, post } from "./http";
import { toPasskeyError, NotSupportedError } from "./errors";
import { configureRoutes, getRoutes } from "./routes";
import type {
    RegisterOptions,
    PasskeyRoutes,
    RegistrationOptionsResponse,
    VerifyOptionsResponse,
    RegistrationRequest,
    VerifyRequest,
    RegistrationResponse,
    VerifyResponse,
} from "./types";

/**
 * Passkeys client for Laravel applications.
 */
export const Passkeys = {
    /**
     * Configure the client.
     */
    configure(options: { routes?: Partial<PasskeyRoutes> }) {
        if (options.routes) {
            configureRoutes(options.routes);
        }
    },

    /**
     * Check if the browser supports passkeys.
     */
    isSupported(): boolean {
        return browserSupportsWebAuthn();
    },

    /**
     * Check if the browser supports passkey autofill.
     */
    async isAutofillSupported(): Promise<boolean> {
        return browserSupportsWebAuthnAutofill();
    },

    /**
     * Register a new passkey for the authenticated user.
     */
    async register(options: RegisterOptions): Promise<RegistrationResponse> {
        if (!this.isSupported()) {
            throw new NotSupportedError();
        }

        // Cancel any pending ceremony
        this.cancel();

        try {
            const { options: optionsJSON } =
                await get<RegistrationOptionsResponse>(
                    getRoutes().registerOptions,
                );

            const credential = await startRegistration({ optionsJSON });

            const request: RegistrationRequest = {
                name: options.name,
                credential,
            };

            return await post<RegistrationResponse>(
                getRoutes().registerStore,
                request,
            );
        } catch (error) {
            throw toPasskeyError(error);
        }
    },

    /**
     * Verify with a passkey.
     */
    async verify(): Promise<VerifyResponse> {
        if (!this.isSupported()) {
            throw new NotSupportedError();
        }

        // Cancel any pending ceremony (e.g., autofill)
        this.cancel();

        try {
            const { options: optionsJSON } = await get<VerifyOptionsResponse>(
                getRoutes().verifyOptions,
            );

            const credential = await startAuthentication({ optionsJSON });

            const request: VerifyRequest = { credential };

            return await post<VerifyResponse>(
                getRoutes().verifySubmit,
                request,
            );
        } catch (error) {
            throw toPasskeyError(error);
        }
    },

    /**
     * Enable passkey autofill on the current page.
     *
     * Note that the page must have an input with `autocomplete="username webauthn"` to
     * anchor the browser's passkey picker dropdown.
     *
     * Returns the verification response on success, or `undefined` if autofill
     * is not supported or was cancelled.
     */
    async autofill(): Promise<VerifyResponse | undefined> {
        if (!this.isSupported()) {
            return undefined;
        }

        const supportsAutofill = await this.isAutofillSupported();
        if (!supportsAutofill) {
            return undefined;
        }

        try {
            const { options: optionsJSON } = await get<VerifyOptionsResponse>(
                getRoutes().verifyOptions,
            );

            const credential = await startAuthentication({
                optionsJSON,
                useBrowserAutofill: true,
            });

            const request: VerifyRequest = { credential };

            return await post<VerifyResponse>(
                getRoutes().verifySubmit,
                request,
            );
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return undefined;
            }

            throw toPasskeyError(error);
        }
    },

    /**
     * Cancel any pending passkey operation.
     */
    cancel(): void {
        WebAuthnAbortService.cancelCeremony();
    },
};
