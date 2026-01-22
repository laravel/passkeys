/**
 * @laravel/passkeys-alpine
 *
 * Alpine.js bindings for Laravel Passkeys.
 *
 * This package is a placeholder. Once the core vanilla JS API is stable,
 * we'll evaluate what Alpine-specific conveniences (if any) are worth adding.
 *
 * Potential additions:
 * - $passkeys magic helper
 * - x-data="passkeys" component
 * - Livewire integration helpers
 *
 * For now, use @laravel/passkeys directly:
 *
 * ```html
 * <div x-data="{ isLoading: false }">
 *   <button
 *     @click="isLoading = true; Passkeys.register({ name: 'My Device' }).finally(() => isLoading = false)"
 *     :disabled="isLoading"
 *   >
 *     Add Passkey
 *   </button>
 * </div>
 *
 * <script type="module">
 *   import { Passkeys } from '@laravel/passkeys'
 *   window.Passkeys = Passkeys
 * </script>
 * ```
 */

export {}
