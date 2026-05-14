/**
 * Base error class for passkey operations.
 */
export class PasskeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PasskeyError";
    }
}

/**
 * Thrown when the browser doesn't support WebAuthn.
 */
export class NotSupportedError extends PasskeyError {
    constructor() {
        super("Passkeys are not supported in this browser.");
        this.name = "NotSupportedError";
    }
}

/**
 * Thrown when the user cancels the passkey operation.
 */
export class UserCancelledError extends PasskeyError {
    constructor() {
        super("The passkey operation was cancelled.");
        this.name = "UserCancelledError";
    }
}

/**
 * Thrown when the passkey already exists (during registration).
 */
export class PasskeyExistsError extends PasskeyError {
    constructor() {
        super("This device is already registered as a passkey.");
        this.name = "PasskeyExistsError";
    }
}

/**
 * Thrown when passkeys are used from an invalid domain.
 */
export class InvalidDomainError extends PasskeyError {
    constructor() {
        super(
            "Passkeys don't work on this domain. If you're developing locally, use localhost instead of 127.0.0.1.",
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
        return new PasskeyError("An unknown error occurred.");
    }

    if (isInvalidDomainError(error)) {
        return new InvalidDomainError();
    }

    switch (error.name) {
        case "NotAllowedError":
            return new UserCancelledError();
        case "InvalidStateError":
            return new PasskeyExistsError();
        case "NotSupportedError":
            return new NotSupportedError();
        default:
            return new PasskeyError(error.message);
    }
};

const isInvalidDomainError = (error: Error): boolean =>
    errorCode(error) === "ERROR_INVALID_DOMAIN";

const errorCode = (error: Error): string | undefined =>
    "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
