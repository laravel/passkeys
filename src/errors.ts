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
 * Thrown when no passkey is found (during authentication).
 */
export class NoPasskeyFoundError extends PasskeyError {
    constructor() {
        super("No passkey found for this account.");
        this.name = "NoPasskeyFoundError";
    }
}

/**
 * Convert WebAuthn errors to friendly passkey errors.
 */
export function toPasskeyError(error: unknown): PasskeyError {
    if (error instanceof PasskeyError) {
        return error;
    }

    if (error instanceof Error) {
        // User cancelled the operation
        if (error.name === "NotAllowedError") {
            return new UserCancelledError();
        }

        // Passkey already registered
        if (error.name === "InvalidStateError") {
            return new PasskeyExistsError();
        }

        // Browser doesn't support WebAuthn
        if (error.name === "NotSupportedError") {
            return new NotSupportedError();
        }

        // Pass through with original message
        return new PasskeyError(error.message);
    }

    return new PasskeyError("An unknown error occurred.");
}
