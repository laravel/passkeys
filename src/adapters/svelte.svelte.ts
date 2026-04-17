import { onMount } from "svelte";
import { PasskeyError, toPasskeyError } from "../errors";
import { Passkeys } from "../passkeys";
import type {
    RegisterRouteOptions,
    VerifyResponse,
    VerifyRouteOptions,
} from "../types";

type UsePasskeyVerifyOptions = VerifyRouteOptions & {
    autofill?: boolean;
    onSuccess?: (response: VerifyResponse) => void;
    onError?: (error: PasskeyError) => void;
};

type UsePasskeyRegisterOptions = RegisterRouteOptions & {
    onSuccess?: () => void;
    onError?: (error: PasskeyError) => void;
};

export function usePasskeyVerify({
    autofill = false,
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) {
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    let errorInstance = $state<PasskeyError | null>(null);

    const resetError = () => {
        error = null;
        errorInstance = null;
    };

    const handleError = (e: unknown) => {
        const err = toPasskeyError(e);

        error = err.message;
        errorInstance = err;
        onError?.(err);
    };

    const verify = async () => {
        isLoading = true;
        resetError();

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            handleError(e);
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
            resetError();

            try {
                const response = await Passkeys.autofill({
                    routes,
                });

                if (response) {
                    onSuccess?.(response);
                }
            } catch (e) {
                handleError(e);
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
        get errorInstance() {
            return errorInstance;
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
    let errorInstance = $state<PasskeyError | null>(null);

    const register = async (name: string) => {
        isLoading = true;
        error = null;
        errorInstance = null;

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            const err = toPasskeyError(e);

            error = err.message;
            errorInstance = err;
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
        get errorInstance() {
            return errorInstance;
        },
        get isSupported() {
            return Passkeys.isSupported();
        },
    };
}
