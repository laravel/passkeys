/**
 * @laravel/passkeys-vue
 *
 * Vue bindings for Laravel Passkeys.
 *
 * This package is a placeholder. Once the core vanilla JS API is stable,
 * we'll evaluate what Vue-specific conveniences (if any) are worth adding.
 *
 * Potential additions:
 * - usePasskeys() composable for managing passkey list (CRUD)
 * - usePasskeyAutofill() for conditional mediation
 * - usePasskeySupport() for browser capability detection
 * - Plugin for global configuration
 *
 * For now, use @laravel/passkeys directly:
 *
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import { Passkeys } from '@laravel/passkeys'
 *
 * const isLoading = ref(false)
 *
 * async function handleRegister() {
 *   isLoading.value = true
 *   try {
 *     await Passkeys.register({ name: 'My Device' })
 *   } finally {
 *     isLoading.value = false
 *   }
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleRegister" :disabled="isLoading">Add Passkey</button>
 * </template>
 * ```
 */

export {}
