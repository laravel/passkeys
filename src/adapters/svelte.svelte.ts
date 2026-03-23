import { onMount } from "svelte";
import { toError } from "../errors";
import { Passkeys } from "../passkeys";
import type {
    RegisterRouteOptions,
    VerifyResponse,
    VerifyRouteOptions,
} from "../types";

type UsePasskeyVerifyOptions = VerifyRouteOptions & {
    autofill?: boolean;
    onSuccess?: (response: VerifyResponse) => void;
    onError?: (error: Error) => void;
};

type UsePasskeyRegisterOptions = RegisterRouteOptions & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

export function usePasskeyVerify({
    autofill = false,
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) {
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    const verify = async () => {
        isLoading = true;
        error = null;

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            const err = toError(e, "Authentication failed");

            error = err.message;
            onError?.(err);
        } finally {
            isLoading = false;
        }
    };

    onMount(() => {
        if (!autofill) {
            return;
        }

        Passkeys.cancel();

        void (async () => {
            const supported = await Passkeys.isAutofillSupported();

            if (!supported) {
                return;
            }

            isLoading = true;
            error = null;

            try {
                const response = await Passkeys.autofill({
                    routes,
                });

                if (response) {
                    onSuccess?.(response);
                }
            } catch (e) {
                const err = toError(e, "Authentication failed");

                error = err.message;
                onError?.(err);
            } finally {
                isLoading = false;
            }
        })();

        return () => {
            Passkeys.cancel();
        };
    });

    return {
        verify,
        get isLoading() {
            return isLoading;
        },
        get error() {
            return error;
        },
        get isSupported() {
            return Passkeys.isSupported();
        },
    };
}

export function usePasskeyRegister({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    const register = async (name: string) => {
        isLoading = true;
        error = null;

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            const err = toError(e, "Registration failed");

            error = err.message;
            onError?.(err);
        } finally {
            isLoading = false;
        }
    };

    return {
        register,
        get isLoading() {
            return isLoading;
        },
        get error() {
            return error;
        },
        get isSupported() {
            return Passkeys.isSupported();
        },
    };
}
