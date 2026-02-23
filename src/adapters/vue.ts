import { ref } from "vue";
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

export function usePasskeyVerify({
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const verify = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            error.value =
                e instanceof Error ? e.message : "Authentication failed";
            onError?.(e as Error);
            isLoading.value = false;
        }
    };

    // Set up autofill
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
                    error.value =
                        e instanceof Error
                            ? e.message
                            : "Authentication failed";
                    onError?.(e as Error);
                });
        }
    });

    return {
        verify,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}

type UsePasskeyRegisterOptions = RegisterRouteOptions & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

export function usePasskeyRegister({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const register = async (name: string) => {
        isLoading.value = true;
        error.value = null;

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            error.value =
                e instanceof Error ? e.message : "Registration failed";
            onError?.(e as Error);
            isLoading.value = false;
        }
    };

    return {
        register,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}
