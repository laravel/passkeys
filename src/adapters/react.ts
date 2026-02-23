import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toError } from "../errors";
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

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const routesRef = useRef(routes);

    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    routesRef.current = routes;

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

    useEffect(() => {
        const attemptToAutofill = async (): Promise<void> => {
            const supported = await Passkeys.isAutofillSupported();

            if (!supported) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await Passkeys.autofill({
                    routes: routesRef.current,
                });

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
        };

        void attemptToAutofill();
    }, []);

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
