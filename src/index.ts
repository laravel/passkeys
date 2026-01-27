export { Passkeys } from "./passkeys";

export {
    PasskeyError,
    NotSupportedError,
    UserCancelledError,
    PasskeyExistsError,
    NoPasskeyFoundError,
} from "./errors";

export { defaultRoutes } from "./routes";
export type { PasskeyRoutes } from "./routes";

export type {
    RegisterOptions,
    AutofillOptions,
    RegistrationResponse,
    VerifyResponse,
} from "./types";
