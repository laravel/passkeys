import { useState, useEffect } from "react";
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = async () => {
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
            setIsLoading(false);
        }
    };

    // Set up autofill on mount
    useEffect(() => {
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
                        const message =
                            e instanceof Error
                                ? e.message
                                : "Authentication failed";
                        setError(message);
                        onError?.(e as Error);
                    });
            }
        });
    }, [routes?.options, routes?.submit]);

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = async (name: string) => {
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
            setIsLoading(false);
        }
    };

    return {
        register,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}
