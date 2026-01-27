import { useState, useEffect } from "react";
import { Passkeys } from "../passkeys";

interface UsePasskeyLoginOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

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
            await Passkeys.verify();
            onSuccess?.();
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
                    onSuccess: () => onSuccess?.(),
                    onError: (_e) => {
                        /* Autofill errors are silently ignored */
                    },
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

interface UsePasskeyRegisterOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

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
