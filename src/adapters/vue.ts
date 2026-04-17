import { onMounted, onUnmounted, ref } from "vue";
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

export const usePasskeyVerify = ({
    autofill = false,
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isSupported = ref(false);

    const verify = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            const err = toError(e, "Authentication failed");

            error.value = err.message;
            onError?.(err);
        } finally {
            isLoading.value = false;
        }
    };

    onMounted(async () => {
        isSupported.value = Passkeys.isSupported();

        if (!autofill) {
            return;
        }

        // Prevent possible double autofill in Vue strict mode (local dev only)
        Passkeys.cancel();

        // Set up autofill
        const supported = await Passkeys.isAutofillSupported();

        if (!supported) {
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await Passkeys.autofill({
                routes,
            });

            if (response) {
                onSuccess?.(response);
            }
        } catch (e) {
            const err = toError(e, "Authentication failed");

            error.value = err.message;
            onError?.(err);
        } finally {
            isLoading.value = false;
        }
    });

    onUnmounted(() => {
        Passkeys.cancel();
    });

    return {
        verify,
        isLoading,
        error,
        isSupported,
    };
};

export const usePasskeyRegister = ({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isSupported = ref(false);

    onMounted(() => {
        isSupported.value = Passkeys.isSupported();
    });

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
            const err = toError(e, "Registration failed");

            error.value = err.message;
            onError?.(err);
        } finally {
            isLoading.value = false;
        }
    };

    return {
        register,
        isLoading,
        error,
        isSupported,
    };
};
