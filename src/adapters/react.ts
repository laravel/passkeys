import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const toError = (e: unknown, fallbackMessage: string): Error => {
    return e instanceof Error ? e : new Error(String(e) || fallbackMessage);
};

export const usePasskeyVerify = ({
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;

    const verify = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await Passkeys.verify({ routes });
            onSuccessRef.current?.(response);
        } catch (e) {
            const err = toError(e, "Authentication failed");
            setError(err.message);
            onErrorRef.current?.(err);
        } finally {
            setIsLoading(false);
        }
    }, [routes]);

    const attemptToAutofill = useCallback(async (): Promise<void> => {
        const supported = await Passkeys.isAutofillSupported();

        if (!supported) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await Passkeys.autofill({ routes });

            if (response) {
                onSuccessRef.current?.(response);
            }
        } catch (e) {
            const err = toError(e, "Authentication failed");
            setError(err.message);
            onErrorRef.current?.(err);
        } finally {
            setIsLoading(false);
        }
    }, [routes]);

    useEffect(() => {
        void attemptToAutofill();
    }, [attemptToAutofill]);

    const isSupported = useMemo(() => Passkeys.isSupported(), []);

    return {
        verify,
        isLoading,
        error,
        isSupported,
    };
};

export function usePasskeyRegister({
    routes,
    onSuccess,
    onError,
}: UsePasskeyRegisterOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = useCallback(
        async (name: string): Promise<void> => {
            setIsLoading(true);
            setError(null);

            try {
                await Passkeys.register({
                    name,
                    routes,
                });
                onSuccess?.();
            } catch (e) {
                const err = toError(e, "Registration failed");
                setError(err.message);
                onError?.(err);
            } finally {
                setIsLoading(false);
            }
        },
        [routes, onSuccess, onError],
    );

    const isSupported = useMemo(() => Passkeys.isSupported(), []);

    return {
        register,
        isLoading,
        error,
        isSupported,
    };
}
