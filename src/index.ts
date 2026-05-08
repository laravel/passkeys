export { Passkeys } from "./passkeys";

export {
    PasskeyError,
    NotSupportedError,
    UserCancelledError,
    PasskeyExistsError,
} from "./errors";

export { defaultRoutes } from "./routes";
export type { PasskeyRoutes } from "./routes";

export type {
    PasskeysConfig,
    PasskeysFetchConfig,
    RouteOverrides,
    RegisterOptions,
    RegisterRouteOptions,
    RegistrationResponse,
    VerifyRouteOptions,
    VerifyResponse,
} from "./types";
