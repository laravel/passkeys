# @laravel/passkeys

A JavaScript client for passkey authentication designed to work with Laravel applications. It provides a fluent API for browser-side WebAuthn ceremonies (registration and authentication).

## Installation

```bash
npm install @laravel/passkeys
```

## Quick Start

```js
import { Passkeys } from "@laravel/passkeys";

// Register a new passkey (authenticated user)
await Passkeys.register({ name: "MacBook Pro" });

// Verify passkey
await Passkeys.verify();
```

## Framework Helpers

### React

```jsx
import { useState } from "react";
import { usePasskeyVerify, usePasskeyRegister } from "@laravel/passkeys/react";

// Login
function LoginPage() {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        onSuccess: (response) => {
            if (response.redirect) {
                window.location.href = response.redirect;
            }
        },
    });

    return (
        <div>
            {/* Add webauthn to autocomplete to enable passkey autofill */}
            <input type="text" autoComplete="email webauthn" />

            <button onClick={verify} disabled={!isSupported || isLoading}>
                {isLoading ? "Authenticating..." : "Sign in with passkey"}
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

// Register
function RegisterForm() {
    const [name, setName] = useState("");
    const { register, isLoading, error } = usePasskeyRegister();

    return (
        <div>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Passkey name"
            />
            <button
                onClick={() => register(name)}
                disabled={isLoading || !name}
            >
                {isLoading ? "Registering..." : "Add passkey"}
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}
```

### Vue

```vue
<script setup>
import { ref } from "vue";
import { usePasskeyVerify, usePasskeyRegister } from "@laravel/passkeys/vue";
import { router } from "@inertiajs/vue3";

// Login
const {
    verify,
    isLoading: verifyLoading,
    error: verifyError,
} = usePasskeyVerify({
    onSuccess: (response) => {
        if (response.redirect) {
            router.visit(response.redirect);
        }
    },
});

// Register
const name = ref("");
const {
    register,
    isLoading: registerLoading,
    error: registerError,
} = usePasskeyRegister();
</script>

<template>
    <!-- Include webauthn in autocomplete to enable passkey autofill -->
    <input type="text" autocomplete="email webauthn" />

    <button @click="verify" :disabled="verifyLoading">
        {{ verifyLoading ? "Authenticating..." : "Sign in with passkey" }}
    </button>
    <p v-if="verifyError" class="error">{{ verifyError }}</p>

    <!-- Register -->
    <input v-model="name" placeholder="Passkey name" />
    <button @click="register(name)" :disabled="registerLoading || !name">
        {{ registerLoading ? "Registering..." : "Add passkey" }}
    </button>
    <p v-if="registerError" class="error">{{ registerError }}</p>
</template>
```

### Svelte

```svelte
<script lang="ts">
    import {
        usePasskeyVerify,
        usePasskeyRegister,
    } from "@laravel/passkeys/svelte";

    // Login
    const {
        verify,
        isLoading: verifyLoading,
        error: verifyError,
    } = usePasskeyVerify({
        onSuccess: (response) => {
            if (response.redirect) {
                window.location.href = response.redirect;
            }
        },
    });

    // Register
    let name = "";
    const {
        register,
        isLoading: registerLoading,
        error: registerError,
    } = usePasskeyRegister();
</script>

<!-- Include webauthn in autocomplete to enable passkey autofill -->
<input type="text" autocomplete="email webauthn" />

<button on:click={verify} disabled={$verifyLoading}>
    {$verifyLoading ? "Authenticating..." : "Sign in with passkey"}
</button>
{#if $verifyError}
    <p class="error">{$verifyError}</p>
{/if}

<!-- Register -->
<input bind:value={name} placeholder="Passkey name" />
<button on:click={() => register(name)} disabled={$registerLoading || !name}>
    {$registerLoading ? "Registering..." : "Add passkey"}
</button>
{#if $registerError}
    <p class="error">{$registerError}</p>
{/if}
```

## Core API

### Public Methods

| Method                        | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `isSupported()`               | Check if the browser supports passkeys            |
| `isAutofillSupported()`       | Check if the browser supports passkey autofill    |
| `register({ name, routes? })` | Register a new passkey for the authenticated user |
| `verify(options?)`            | Verify a passkey                                  |
| `autofill(options?)`          | Enable passkey autofill on the current page       |
| `cancel()`                    | Cancel any pending passkey operation              |

## Expected Endpoints

This package handles communication with your Laravel application and expects the following endpoints:

### Authentication (Guest)

| Method | Route                     | Purpose                            |
| ------ | ------------------------- | ---------------------------------- |
| `GET`  | `/passkeys/login/options` | Fetch authentication options       |
| `POST` | `/passkeys/login`         | Verify credential and authenticate |

### Registration (Authenticated)

| Method | Route                    | Purpose                    |
| ------ | ------------------------ | -------------------------- |
| `GET`  | `/user/passkeys/options` | Fetch registration options |
| `POST` | `/user/passkeys`         | Store new passkey          |

### Per-Call Route Overrides

```js
await Passkeys.register({
    name: "MacBook Pro",
    routes: {
        options: "/user/security/passkeys/options",
        submit: "/user/security/passkeys",
    },
});

await Passkeys.verify({
    routes: {
        options: "/passkeys/confirm/options",
        submit: "/passkeys/confirm",
    },
});
```

`register()`, `verify()`, and `autofill()` all use:

```ts
type RouteOverrides = {
    routes?: {
        options?: string;
        submit?: string;
    };
};
```

### React / Vue / Svelte Route Overrides

All framework `usePasskeyVerify` adapters accept:

```js
usePasskeyVerify({
    routes: {
        options: "/passkeys/confirm/options",
        submit: "/passkeys/confirm",
    },
    onSuccess: (response) => {
        if (response.redirect) {
            window.location.href = response.redirect;
        }
    },
});
```

All framework `usePasskeyRegister` adapters accept:

```js
usePasskeyRegister({
    routes: {
        options: "/user/security/passkeys/options",
        submit: "/user/security/passkeys",
    },
    onSuccess: () => {
        window.location.reload();
    },
});
```

`usePasskeyVerify` automatically attempts `Passkeys.autofill()` when autofill is supported.

## Type Compatibility

This package uses TypeScript types from [`@simplewebauthn/browser`](https://www.npmjs.com/package/@simplewebauthn/browser). These types are fully compatible with the JSON output from the [`web-auth/webauthn-lib`](https://packagist.org/packages/web-auth/webauthn-lib) PHP package.

## Package Exports

| Entry Point                | Exports                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@laravel/passkeys`        | `Passkeys`, `defaultRoutes`, `PasskeyError`, `NotSupportedError`, `UserCancelledError`, `PasskeyExistsError`, `NoPasskeyFoundError` |
| `@laravel/passkeys/react`  | `usePasskeyVerify`, `usePasskeyRegister`                                                                                            |
| `@laravel/passkeys/vue`    | `usePasskeyVerify`, `usePasskeyRegister`                                                                                            |
| `@laravel/passkeys/svelte` | `usePasskeyVerify`, `usePasskeyRegister`                                                                                            |