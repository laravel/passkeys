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
        autofill: true,
        onSuccess: (response) => {
            if (response.redirect) {
                window.location.href = response.redirect;
            }
        },
    });

    return (
        <div>
            {/* Add webauthn and set autofill: true to show passkeys in the input */}
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
    autofill: true,
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
    <!-- Include webauthn and set autofill: true to show passkeys in the input -->
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

Access the returned values through the hook object (don't destructure), so Svelte's reactivity stays live:

```svelte
<script>
    import { usePasskeyVerify, usePasskeyRegister } from "@laravel/passkeys/svelte";

    const verify = usePasskeyVerify({
        autofill: true,
        onSuccess: (response) => {
            if (response.redirect) window.location.href = response.redirect;
        },
    });

    const register = usePasskeyRegister();
    let name = $state("");
</script>

<!-- Include webauthn and set autofill: true to show passkeys in the input -->
<input type="email" autocomplete="email webauthn" />

<button onclick={verify.verify} disabled={!verify.isSupported || verify.isLoading}>
    {verify.isLoading ? "Authenticating..." : "Sign in with passkey"}
</button>
{#if verify.error}<p class="error">{verify.error}</p>{/if}

<input bind:value={name} placeholder="Passkey name" />
<button
    onclick={() => register.register(name)}
    disabled={register.isLoading || !name}
>
    {register.isLoading ? "Registering..." : "Add passkey"}
</button>
{#if register.error}<p class="error">{register.error}</p>{/if}
```

## Server-Side Rendering

WebAuthn is a browser-only API. The framework hooks are SSR-safe: on the server and during hydration, `isSupported` renders as `false`, then updates to the real value after the component mounts. This avoids hydration warnings without any user-visible flash — in Vue and Svelte the post-mount update runs as a microtask before the browser paints; in React it's handled by `useSyncExternalStore` (client-only apps see the real value on the first render).

If you need the synchronous value outside a component lifecycle, call `Passkeys.isSupported()` directly — it returns `false` under Node without throwing.

## Passkey Autofill

When `autofill: true` is passed, the hook asks the browser to surface saved passkeys inside the native credential-picker dropdown. The browser attaches that dropdown to an `<input>` whose `autocomplete` attribute includes the `webauthn` token (typically alongside `username` or `email`). If no such input is mounted by the time the autofill request starts, the dropdown has nowhere to anchor and silently shows nothing — no error, no console warning, just no picker.

If the browser doesn't support autofill (checked via `isAutofillSupported()`) or the user dismisses the picker, the hook falls back to doing nothing and your explicit "Sign in with passkey" button still works.

## Core API

### Public Methods

| Method                        | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `configure(options)`          | Configure the passkeys client                     |
| `isSupported()`               | Check if the browser supports passkeys            |
| `isAutofillSupported()`       | Check if the browser supports passkey autofill    |
| `register({ name, routes? })` | Register a new passkey for the authenticated user |
| `verify(options?)`            | Verify a passkey                                  |
| `autofill(options?)`          | Enable passkey autofill on the current page       |
| `cancel()`                    | Cancel any pending passkey operation              |

### Client Configuration

Use `configure()` to adjust the fetch options used for passkey requests:

```js
Passkeys.configure({
    fetch: {
        credentials: "include",
        headers: {
            "X-Tenant": tenantId,
        },
    },
});
```

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

The `usePasskeyVerify` adapters accept:

```js
usePasskeyVerify({
    autofill: true,
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

The `usePasskeyRegister` adapters accept:

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

## Typed Errors

All ceremony failures are converted to `PasskeyError` subclasses so you can branch on error type:

| Class                | Thrown when                                                  |
| -------------------- | ------------------------------------------------------------ |
| `NotSupportedError`  | The browser does not support WebAuthn                        |
| `UserCancelledError` | The user dismissed the native prompt                         |
| `PasskeyExistsError` | A passkey for this account/device is already registered      |
| `InvalidDomainError` | Passkeys are used from an invalid domain                     |
| `PasskeyError`       | Base class; used for server errors and any unmapped failures |

`Passkeys.register()` and `Passkeys.verify()` throw these directly. The framework adapters expose them two ways: the `onError` callback receives the typed instance, and each hook returns an `errorInstance` field (alongside the string `error`) so you can branch from markup:

```jsx
import { PasskeyExistsError } from "@laravel/passkeys";
import { usePasskeyRegister } from "@laravel/passkeys/react";

const { register, error, errorInstance } = usePasskeyRegister();

// ...
{
    errorInstance instanceof PasskeyExistsError ? (
        <p>You already registered a passkey on this device.</p>
    ) : error ? (
        <p className="error">{error}</p>
    ) : null;
}
```

## Type Compatibility

This package uses TypeScript types from [`@simplewebauthn/browser`](https://www.npmjs.com/package/@simplewebauthn/browser). These types are fully compatible with the JSON output from the [`web-auth/webauthn-lib`](https://packagist.org/packages/web-auth/webauthn-lib) PHP package.

## Package Exports

| Entry Point                | Exports                                  |
| -------------------------- | ---------------------------------------- |
| `@laravel/passkeys`        | `Passkeys`                               |
| `@laravel/passkeys/react`  | `usePasskeyVerify`, `usePasskeyRegister` |
| `@laravel/passkeys/vue`    | `usePasskeyVerify`, `usePasskeyRegister` |
| `@laravel/passkeys/svelte` | `usePasskeyVerify`, `usePasskeyRegister` |
