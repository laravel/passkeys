/**
 * All routes used by the passkeys client.
 */
export interface PasskeyRoutes {
  /**
   * GET: Fetch registration options from the server.
   * @default '/passkeys/register/options'
   */
  registerOptions: string

  /**
   * POST: Store a new passkey after successful registration.
   * @default '/passkeys/register'
   */
  registerStore: string

  /**
   * GET: Fetch authentication options from the server.
   * @default '/passkeys/verify/options'
   */
  verifyOptions: string

  /**
   * POST: Submit credential for verification.
   * @default '/passkeys/verify'
   */
  verifySubmit: string
}

/**
 * Default Laravel routes for passkey operations.
 */
export const defaultRoutes: PasskeyRoutes = {
  registerOptions: '/passkeys/register/options',
  registerStore: '/passkeys/register',
  verifyOptions: '/passkeys/verify/options',
  verifySubmit: '/passkeys/verify',
}

let routes: PasskeyRoutes = { ...defaultRoutes }

/**
 * Configure custom routes for passkey operations.
 */
export function configureRoutes(custom: Partial<PasskeyRoutes>): void {
  routes = { ...routes, ...custom }
}

/**
 * Get the current route configuration.
 */
export function getRoutes(): PasskeyRoutes {
  return routes
}
