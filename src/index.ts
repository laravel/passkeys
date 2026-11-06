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
    PasskeysConfig,
    PasskeysFetchConfig,
    RememberOption,
    RouteOverrides,
    RegisterOptions,
    RegisterRouteOptions,
    RegistrationResponse,
    VerifyOptions,
    VerifyRouteOptions,
    VerifyResponse,
} from "./types";
