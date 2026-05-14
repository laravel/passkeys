export { Passkeys } from "./passkeys";

export {
    PasskeyError,
    NotSupportedError,
    UserCancelledError,
    PasskeyExistsError,
    InvalidDomainError,
} from "./errors";

export { defaultRoutes } from "./routes";
export type { PasskeyRoutes } from "./routes";

export type {
    RouteOverrides,
    RegisterOptions,
    RegisterRouteOptions,
    RegistrationResponse,
    VerifyRouteOptions,
    VerifyResponse,
} from "./types";
