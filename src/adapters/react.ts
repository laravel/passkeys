import { useState, useEffect } from "react";
import { Passkeys } from "../passkeys";
import type { VerifyResponse } from "../types";

type UsePasskeyLoginOptions = {
    onSuccess?: (response: VerifyResponse) => void;
    onError?: (error: Error) => void;
};

export function usePasskeyLogin({
    onSuccess,
    onError,
}: UsePasskeyLoginOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await Passkeys.verify();
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
                void Passkeys.autofill()
                    .then((response) => {
                        if (response) {
                            onSuccess?.(response);
                        }
                    })
                    .catch(() => {
                        /* Autofill errors are silently ignored */
                    });
            }
        });
    }, []);

    return {
        login,
        isLoading,
        error,
        isSupported: Passkeys.isSupported(),
    };
}

type UsePasskeyRegisterOptions = {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
};

export function usePasskeyRegister({
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = async (name: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await Passkeys.register({ name });
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
