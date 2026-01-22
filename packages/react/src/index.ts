/**
 * @laravel/passkeys-react
 *
 * React bindings for Laravel Passkeys.
 *
 * This package is a placeholder. Once the core vanilla JS API is stable,
 * we'll evaluate what React-specific conveniences (if any) are worth adding.
 *
 * Potential additions:
 * - usePasskeys() for managing passkey list (CRUD)
 * - usePasskeyAutofill() for conditional mediation
 * - usePasskeySupport() for browser capability detection
 * - <PasskeysProvider> for configuration context
 *
 * For now, use @laravel/passkeys directly:
 *
 * ```tsx
 * import { Passkeys } from '@laravel/passkeys'
 *
 * function RegisterButton() {
 *   const [isLoading, setIsLoading] = useState(false)
 *
 *   const handleRegister = async () => {
 *     setIsLoading(true)
 *     try {
 *       await Passkeys.register({ name: 'My Device' })
 *     } finally {
 *       setIsLoading(false)
 *     }
 *   }
 *
 *   return <button onClick={handleRegister} disabled={isLoading}>Add Passkey</button>
 * }
 * ```
 */

export {}
