import { ref } from "vue";
import { Passkeys } from "../passkeys";

interface UsePasskeyLoginOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePasskeyLogin({
    onSuccess,
    onError,
}: UsePasskeyLoginOptions = {}) {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const login = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            await Passkeys.verify();
            onSuccess?.();
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
            void Passkeys.autofill()
                .then((result) => {
                    if (result?.verified) {
                        onSuccess?.();
                    }
                })
                .catch(() => {
                    /* Autofill errors are silently ignored */
                });
        }
    });

    return {
        login,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}

interface UsePasskeyRegisterOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePasskeyRegister({
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const register = async (name: string) => {
        isLoading.value = true;
        error.value = null;
        try {
            await Passkeys.register({ name });
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
