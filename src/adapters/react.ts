import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
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

// Stable references for useSyncExternalStore. `subscribe` is a no-op because
// WebAuthn support doesn't change during a session; we only care about the
// SSR/client split that `getServerSnapshot` provides.
const noop = (): void => undefined;
const subscribeSupport = () => noop;
const getSupportClientSnapshot = () => Passkeys.isSupported();
const getSupportServerSnapshot = () => false;

export const usePasskeyVerify = ({
    autofill = false,
    routes,
    onSuccess,
    onError,
}: UsePasskeyVerifyOptions = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorInstance, setErrorInstance] = useState<PasskeyError | null>(
        null,
    );
    const isSupported = useSyncExternalStore(
        subscribeSupport,
        getSupportClientSnapshot,
        getSupportServerSnapshot,
    );

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const routesRef = useRef(routes);

    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    routesRef.current = routes;

    const resetError = () => {
        setError(null);
        setErrorInstance(null);
    };

    const handleError = (e: unknown) => {
        const err = toPasskeyError(e);
        setError(err.message);
        setErrorInstance(err);
        onErrorRef.current?.(err);
    };

    const verify = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        resetError();

        try {
            const response = await Passkeys.verify({
                routes: routesRef.current,
            });
            onSuccessRef.current?.(response);
        } catch (e) {
            handleError(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!autofill) {
            return;
        }

        Passkeys.cancel();

        const attemptToAutofill = async (): Promise<void> => {
            const supported = await Passkeys.isAutofillSupported();

            if (!supported) {
                return;
            }

            setIsLoading(true);
            resetError();

            try {
                const response = await Passkeys.autofill({
                    routes: routesRef.current,
                });

                if (response) {
                    onSuccessRef.current?.(response);
                }
            } catch (e) {
                handleError(e);
            } finally {
                setIsLoading(false);
            }
        };

        void attemptToAutofill();

        return () => {
            Passkeys.cancel();
        };
    }, [autofill]);

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorInstance, setErrorInstance] = useState<PasskeyError | null>(
        null,
    );
    const isSupported = useSyncExternalStore(
        subscribeSupport,
        getSupportClientSnapshot,
        getSupportServerSnapshot,
    );

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const routesRef = useRef(routes);

    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    routesRef.current = routes;

    const register = useCallback(async (name: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        setErrorInstance(null);

        try {
            await Passkeys.register({
                name,
                routes: routesRef.current,
            });
            onSuccessRef.current?.();
        } catch (e) {
            const err = toPasskeyError(e);
            setError(err.message);
            setErrorInstance(err);
            onErrorRef.current?.(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        register,
        isLoading,
        error,
        errorInstance,
        isSupported,
    };
};
