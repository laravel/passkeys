import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  WebAuthnAbortService,
} from '@simplewebauthn/browser'
import { get, post } from './http'
import { toPasskeyError, NotSupportedError } from './errors'
import { configureRoutes, getRoutes } from './routes'
import type {
  RegisterOptions,
  AutofillOptions,
  PasskeyRoutes,
  RegistrationOptionsResponse,
  VerifyOptionsResponse,
  RegistrationRequest,
  VerifyRequest,
  RegistrationResponse,
  VerifyResponse,
} from './types'

/**
 * Passkeys client for Laravel applications.
 */
export const Passkeys = {
  /**
   * Configure the client.
   */
  configure(options: { routes?: Partial<PasskeyRoutes> }) {
    if (options.routes) {
      configureRoutes(options.routes)
    }
  },

  /**
   * Check if the browser supports passkeys.
   */
  isSupported(): boolean {
    return browserSupportsWebAuthn()
  },

  /**
   * Check if the browser supports passkey autofill.
   */
  async isAutofillSupported(): Promise<boolean> {
    return browserSupportsWebAuthnAutofill()
  },

  /**
   * Register a new passkey for the authenticated user.
   */
  async register(options: RegisterOptions): Promise<RegistrationResponse> {
    if (!this.isSupported()) {
      throw new NotSupportedError()
    }

    try {
      const { options: optionsJSON } = await get<RegistrationOptionsResponse>(
        getRoutes().registerOptions
      )

      const credential = await startRegistration({ optionsJSON })

      const request: RegistrationRequest = {
        name: options.name,
        credential,
      }

      return await post<RegistrationResponse>(getRoutes().registerStore, request)
    } catch (error) {
      throw toPasskeyError(error)
    }
  },

  /**
   * Authenticate with a passkey.
   */
  async verify(): Promise<VerifyResponse> {
    if (!this.isSupported()) {
      throw new NotSupportedError()
    }

    try {
      const { options: optionsJSON } = await get<VerifyOptionsResponse>(
        getRoutes().verifyOptions
      )

      const credential = await startAuthentication({ optionsJSON })

      const request: VerifyRequest = { credential }

      return await post<VerifyResponse>(getRoutes().verifySubmit, request)
    } catch (error) {
      throw toPasskeyError(error)
    }
  },

  /**
   * Enable passkey autofill on the current page.
   *
   * Note that the page must have an input with `autocomplete="username webauthn"` to
   * anchor the browser's passkey picker dropdown.
   */
  async autofill(options?: AutofillOptions): Promise<void> {
    if (!this.isSupported()) {
      return
    }

    const supportsAutofill = await this.isAutofillSupported()
    if (!supportsAutofill) {
      return
    }

    try {
      const { options: optionsJSON } = await get<VerifyOptionsResponse>(
        getRoutes().verifyOptions
      )

      const credential = await startAuthentication({
        optionsJSON,
        useBrowserAutofill: true,
      })

      const request: VerifyRequest = { credential }
      const result = await post<VerifyResponse>(getRoutes().verifySubmit, request)

      if (result.verified) {
        options?.onSuccess?.()
      }
    } catch (error) {
      if (options?.onError) {
        options.onError(toPasskeyError(error))
      }
    }
  },

  /**
   * Cancel any pending passkey operation.
   */
  cancel(): void {
    WebAuthnAbortService.cancelCeremony()
  },
}
