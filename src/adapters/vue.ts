import { onMounted, onUnmounted, ref } from "vue";
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

export const usePasskeyVerify = ({
    autofill = false,
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isSupported = ref(false);
    const errorInstance = ref<PasskeyError | null>(null);

    const resetError = () => {
        error.value = null;
        errorInstance.value = null;
    };

    const handleError = (e: unknown) => {
        const err = toPasskeyError(e);

        error.value = err.message;
        errorInstance.value = err;
        onError?.(err);
    };

    const verify = async () => {
        isLoading.value = true;
        resetError();

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            handleError(e);
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
        errorInstance,
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
    const errorInstance = ref<PasskeyError | null>(null);

    onMounted(() => {
        isSupported.value = Passkeys.isSupported();
    });

    const register = async (name: string) => {
        isLoading.value = true;
        error.value = null;
        errorInstance.value = null;

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            const err = toPasskeyError(e);

            error.value = err.message;
            errorInstance.value = err;
            onError?.(err);
        } finally {
            isLoading.value = false;
        }
    };

    return {
        register,
        isLoading,
        error,
        errorInstance,
        isSupported,
    };
};
