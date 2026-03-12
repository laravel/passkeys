import { onMount } from "svelte";
import { readonly, writable, type Readable } from "svelte/store";
import { Passkeys } from "../passkeys";
import type {
    RegisterRouteOptions,
    VerifyResponse,
    VerifyRouteOptions,
} from "../types";

type UsePasskeyVerifyOptions = VerifyRouteOptions & {
    onSuccess?: (response: VerifyResponse) => void;
    onError?: (error: Error) => void;
};

type UsePasskeyVerifyResult = {
    verify: () => Promise<void>;
    isLoading: Readable<boolean>;
    error: Readable<string | null>;
    isSupported: boolean;
};

export function usePasskeyVerify({
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}): UsePasskeyVerifyResult {
    const isLoading = writable(false);
    const error = writable<string | null>(null);

    const verify = async () => {
        isLoading.set(true);
        error.set(null);

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            error.set(e instanceof Error ? e.message : "Authentication failed");
            onError?.(e as Error);
            isLoading.set(false);
        }
    };

    onMount(() => {
        void Passkeys.isAutofillSupported().then((supported) => {
            if (supported) {
                void Passkeys.autofill({
                    routes,
                })
                    .then((response) => {
                        if (response) {
                            onSuccess?.(response);
                        }
                    })
                    .catch((e) => {
                        error.set(
                            e instanceof Error
                                ? e.message
                                : "Authentication failed",
                        );
                        onError?.(e as Error);
                    });
            }
        });
    });

    return {
        verify,
        isLoading: readonly(isLoading),
        error: readonly(error),
        isSupported: Passkeys.isSupported(),
    };
}

type UsePasskeyRegisterOptions = RegisterRouteOptions & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

type UsePasskeyRegisterResult = {
    register: (name: string) => Promise<void>;
    isLoading: Readable<boolean>;
    error: Readable<string | null>;
    isSupported: boolean;
};

export function usePasskeyRegister({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}): UsePasskeyRegisterResult {
    const isLoading = writable(false);
    const error = writable<string | null>(null);

    const register = async (name: string) => {
        isLoading.set(true);
        error.set(null);

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            error.set(e instanceof Error ? e.message : "Registration failed");
            onError?.(e as Error);
            isLoading.set(false);
        }
    };

    return {
        register,
        isLoading: readonly(isLoading),
        error: readonly(error),
        isSupported: Passkeys.isSupported(),
    };
}
