type PasskeyErrorOptions = { cause?: unknown };

/**
 * Base error class for passkey operations.
 */
export class PasskeyError extends Error {
    /**
     * The original error this one was converted from, if any.
     */
    cause?: unknown;

    constructor(message: string, options?: PasskeyErrorOptions) {
        super(message);
        this.name = "PasskeyError";

        if (options && "cause" in options) {
            this.cause = options.cause;
        }
    }
}

/**
 * Thrown when the browser doesn't support WebAuthn.
 */
export class NotSupportedError extends PasskeyError {
    constructor(options?: PasskeyErrorOptions) {
        super("Passkeys are not supported in this browser.", options);
        this.name = "NotSupportedError";
    }
}

/**
 * Thrown when the user cancels the passkey operation.
 */
export class UserCancelledError extends PasskeyError {
    constructor(options?: PasskeyErrorOptions) {
        super("The passkey operation was cancelled.", options);
        this.name = "UserCancelledError";
    }
}

/**
 * Thrown when the passkey already exists (during registration).
 */
export class PasskeyExistsError extends PasskeyError {
    constructor(options?: PasskeyErrorOptions) {
        super("This device is already registered as a passkey.", options);
        this.name = "PasskeyExistsError";
    }
}

/**
 * Thrown when the server answers a passkey request with an error status.
 */
export class ServerError extends PasskeyError {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ServerError";
        this.status = status;
    }
}

/**
 * Thrown when passkeys are used from an invalid domain.
 */
export class InvalidDomainError extends PasskeyError {
    constructor(domain?: string, options?: PasskeyErrorOptions) {
        const subject = domain ?? "this domain";

        super(
            `Passkeys can't be used on ${subject}. For local development, use localhost.`,
            options,
        );
        this.name = "InvalidDomainError";
    }
}

/**
 * Convert WebAuthn errors to friendly passkey errors.
 */
export const toPasskeyError = (error: unknown): PasskeyError => {
    if (error instanceof PasskeyError) {
        return error;
    }

    if (!(error instanceof Error)) {
        return new PasskeyError("An unknown error occurred.", { cause: error });
    }

    if (isInvalidDomainError(error)) {
        return new InvalidDomainError(currentHostname(), { cause: error });
    }

    switch (error.name) {
        case "NotAllowedError":
            return new UserCancelledError({ cause: error });
        case "InvalidStateError":
            return new PasskeyExistsError({ cause: error });
        case "NotSupportedError":
            return new NotSupportedError({ cause: error });
        default:
            return new PasskeyError(error.message, { cause: error });
    }
};

const isInvalidDomainError = (error: Error): boolean =>
    errorCode(error) === "ERROR_INVALID_DOMAIN";

const errorCode = (error: Error): string | undefined =>
    "code" in error && typeof error.code === "string" ? error.code : undefined;

const currentHostname = (): string | undefined =>
    typeof globalThis.location?.hostname === "string" &&
    globalThis.location.hostname.length > 0
        ? globalThis.location.hostname
        : undefined;
