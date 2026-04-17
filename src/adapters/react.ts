import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
            const response = await Passkeys.verify({
                routes: routesRef.current,
            });
            onSuccessRef.current?.(response);
        } catch (e) {
            const err = toError(e, "Authentication failed");
            setError(err.message);
            onErrorRef.current?.(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!autofill) {
            return;
        }

        let cancelled = false;

        Passkeys.cancel();

        const attemptToAutofill = async (): Promise<void> => {
            const supported = await Passkeys.isAutofillSupported();

            if (cancelled || !supported) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await Passkeys.autofill({
                    routes: routesRef.current,
                });

                if (cancelled || !response) {
                    return;
                }

                onSuccessRef.current?.(response);
            } catch (e) {
                if (cancelled) {
                    return;
                }

                const err = toError(e, "Authentication failed");

                setError(err.message);
                onErrorRef.current?.(err);
            } finally {
                setIsLoading(false);
            }
        };

        void attemptToAutofill();

        return () => {
            cancelled = true;
            Passkeys.cancel();
        };
    }, [autofill]);

    const isSupported = useMemo(() => Passkeys.isSupported(), []);

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const routesRef = useRef(routes);

    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    routesRef.current = routes;

    const register = useCallback(async (name: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            await Passkeys.register({
                name,
                routes: routesRef.current,
            });
            onSuccessRef.current?.();
        } catch (e) {
            const err = toError(e, "Registration failed");
            setError(err.message);
            onErrorRef.current?.(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const isSupported = useMemo(() => Passkeys.isSupported(), []);

    return {
        register,
        isLoading,
        error,
        isSupported,
    };
};
