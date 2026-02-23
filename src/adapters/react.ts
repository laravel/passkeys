import { useCallback, useEffect, useState } from "react";
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

type UsePasskeyRegisterOptions = RegisterRouteOptions & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

export const usePasskeyVerify = ({
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await Passkeys.verify({ routes });
            onSuccess?.(response);
        } catch (e) {
            const message =
                e instanceof Error ? e.message : "Authentication failed";
            setError(message);
            onError?.(e as Error);
        } finally {
            setIsLoading(false);
        }
    }, [routes, onSuccess, onError]);

    const attemptToAutofill = useCallback(async (): Promise<void> => {
        const supported = await Passkeys.isAutofillSupported();

        if (!supported) {
            return;
        }

        try {
            const response = await Passkeys.autofill({ routes });

            if (response) {
                onSuccess?.(response);
            }
        } catch (e) {
            const message =
                e instanceof Error ? e.message : "Authentication failed";
            setError(message);
            onError?.(e as Error);
        }
    }, [routes, onSuccess, onError]);

    useEffect(() => {
        void attemptToAutofill();
    }, [routes?.options, routes?.submit]);

    return {
        verify,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
};

export function usePasskeyRegister({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = useCallback(async (name: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            await Passkeys.register({
                name,
                routes,
            });
            onSuccess?.();
        } catch (e) {
            const message =
                e instanceof Error ? e.message : "Registration failed";
            setError(message);
            onError?.(e as Error);
        } finally {
            setIsLoading(false);
        }
    }, [routes, onSuccess, onError]);

    return {
        register,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}
