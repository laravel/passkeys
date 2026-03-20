import {
    browserSupportsWebAuthn,
    browserSupportsWebAuthnAutofill,
    startAuthentication,
    startRegistration,
    WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { NotSupportedError, toPasskeyError } from "./errors";
import { get, post } from "./http";
import { defaultRoutes } from "./routes";
import type {
    RegisterOptions,
    RegistrationOptionsResponse,
    RegistrationRequest,
    RegistrationResponse,
    RouteOverrides,
    VerifyOptionsResponse,
    VerifyRequest,
    VerifyResponse,
    VerifyRouteOptions,
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
                await get<RegistrationOptionsResponse>(routes.optionsRoute);

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

            return await post<VerifyResponse>(routes.submitRoute, request);
        } catch (error) {
            throw toPasskeyError(error);
        }
    },

    /**
     * Enable passkey autofill on the current page.
     *
     * Note that the page must have an input with `autocomplete="email webauthn"` to
     * anchor the browser's passkey picker dropdown.
     *
     * Returns the verification response on success, or `undefined` if autofill
     * is not supported or was cancelled.
     */
    async autofill(
        options: VerifyRouteOptions = {},
    ): Promise<VerifyResponse | undefined> {
        if (!this.isSupported()) {
            return;
        }

        const supportsAutofill = await this.isAutofillSupported();

        if (!supportsAutofill) {
            return;
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

            return await post<VerifyResponse>(routes.submitRoute, request);
        } catch (error) {
            if (
                error instanceof Error &&
                ["AbortError", "NotAllowedError"].includes(error.name)
            ) {
                return;
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

const resolveRoutes = (
    options: RouteOverrides,
    defaults: { options: string; submit: string },
): { optionsRoute: string; submitRoute: string } => ({
    optionsRoute: options.routes?.options ?? defaults.options,
    submitRoute: options.routes?.submit ?? defaults.submit,
});
