import {
    startRegistration,
    startAuthentication,
    browserSupportsWebAuthn,
    browserSupportsWebAuthnAutofill,
    WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { get, post } from "./http";
import { toPasskeyError, NotSupportedError } from "./errors";
import { defaultRoutes } from "./routes";
import type {
    RegisterOptions,
    VerifyRouteOptions,
    RouteOverrides,
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
            const routes = resolveRoutes(options, {
                options: defaultRoutes.registerOptions,
                submit: defaultRoutes.registerStore,
            });

            const { options: optionsJSON } =
                await get<RegistrationOptionsResponse>(
                    routes.optionsRoute,
                );

            const credential = await startRegistration({ optionsJSON });

            const request: RegistrationRequest = {
                name: options.name,
                credential,
            };

            return await post<RegistrationResponse>(
                routes.submitRoute,
                request,
            );
        } catch (error) {
            throw toPasskeyError(error);
        }
    },

    /**
     * Verify with a passkey.
     */
    async verify(options: VerifyRouteOptions = {}): Promise<VerifyResponse> {
        if (!this.isSupported()) {
            throw new NotSupportedError();
        }

        // Cancel any pending ceremony (e.g., autofill)
        this.cancel();

        try {
            const routes = resolveRoutes(options, {
                options: defaultRoutes.verifyOptions,
                submit: defaultRoutes.verifySubmit,
            });

            const { options: optionsJSON } = await get<VerifyOptionsResponse>(
                routes.optionsRoute,
            );

            const credential = await startAuthentication({ optionsJSON });

            const request: VerifyRequest = { credential };

            return await post<VerifyResponse>(
                routes.submitRoute,
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
    async autofill(
        options: VerifyRouteOptions = {},
    ): Promise<VerifyResponse | undefined> {
        if (!this.isSupported()) {
            return undefined;
        }

        const supportsAutofill = await this.isAutofillSupported();
        if (!supportsAutofill) {
            return undefined;
        }

        try {
            const routes = resolveRoutes(options, {
                options: defaultRoutes.verifyOptions,
                submit: defaultRoutes.verifySubmit,
            });

            const { options: optionsJSON } = await get<VerifyOptionsResponse>(
                routes.optionsRoute,
            );

            const credential = await startAuthentication({
                optionsJSON,
                useBrowserAutofill: true,
            });

            const request: VerifyRequest = { credential };

            return await post<VerifyResponse>(
                routes.submitRoute,
                request,
            );
        } catch (error) {
            if (
                error instanceof Error &&
                (error.name === "AbortError" ||
                    error.name === "NotAllowedError")
            ) {
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

function resolveRoutes(
    options: RouteOverrides,
    defaults: {
        options: string;
        submit: string;
    },
): {
    optionsRoute: string;
    submitRoute: string;
} {
    const submitRoute = options.routes?.submit ?? defaults.submit;
    const optionsRoute = options.routes?.options ?? defaults.options;

    return {
        optionsRoute,
        submitRoute,
    };
}
