# @laravel/passkeys

A JavaScript client for passkey authentication designed to work with Laravel applications. It provides a clean API for browser-side WebAuthn ceremonies (registration and authentication).

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
import { usePasskeyLogin, usePasskeyRegister } from "@laravel/passkeys/react";

// Login
function LoginButton() {
    const { login, isLoading, error, isSupported } = usePasskeyLogin();

    return (
        <div>
            <button onClick={login} disabled={!isSupported || isLoading}>
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
import { usePasskeyLogin, usePasskeyRegister } from "@laravel/passkeys/vue";

const { login, isLoading: loginLoading, error: loginError } = usePasskeyLogin();

const name = ref("");
const {
    register,
    isLoading: registerLoading,
    error: registerError,
} = usePasskeyRegister();
</script>

<template>
    <!-- Login -->
    <button @click="login" :disabled="loginLoading">
        {{ loginLoading ? "Authenticating..." : "Sign in with passkey" }}
    </button>
    <p v-if="loginError" class="error">{{ loginError }}</p>

    <!-- Register -->
    <input v-model="name" placeholder="Passkey name" />
    <button @click="register(name)" :disabled="registerLoading || !name">
        {{ registerLoading ? "Registering..." : "Add passkey" }}
    </button>
    <p v-if="registerError" class="error">{{ registerError }}</p>
</template>
```

## Core API

### Public Methods

| Method                             | Description                                       |
| ---------------------------------- | ------------------------------------------------- |
| `configure({ routes })`            | Configure custom routes                           |
| `isSupported()`                    | Check if the browser supports passkeys            |
| `isAutofillSupported()`            | Check if the browser supports passkey autofill    |
| `register({ name })`               | Register a new passkey for the authenticated user |
| `verify()`                         | Verify a passkey                                  |
| `autofill({ onSuccess, onError })` | Enable passkey autofill on the current page       |
| `cancel()`                         | Cancel any pending passkey operation              |

## Expected Endpoints

This package handles communication with your Laravel application and expects the following endpoints:

### Authentication (Guest)

| Method | Route               | Purpose                            |
| ------ | ------------------- | ---------------------------------- |
| `GET`  | `/passkeys/options` | Fetch authentication options       |
| `POST` | `/passkeys/verify`  | Verify credential and authenticate |

### Registration (Authenticated)

| Method | Route                    | Purpose                    |
| ------ | ------------------------ | -------------------------- |
| `GET`  | `/user/passkeys/options` | Fetch registration options |
| `POST` | `/user/passkeys`         | Store new passkey          |

### Custom Route Configuration

```js
Passkeys.configure({
    routes: {
        verifyOptions: "/passkeys/options",
        verifySubmit: "/passkeys/verify",
        registerOptions: "/user/passkeys/options",
        registerStore: "/user/passkeys",
    },
});
```

## Type Compatibility

This package uses TypeScript types from [`@simplewebauthn/browser`](https://www.npmjs.com/package/@simplewebauthn/browser). These types are fully compatible with the JSON output from the [`web-auth/webauthn-lib`](https://packagist.org/packages/web-auth/webauthn-lib) PHP package.

## Package Exports

| Entry Point               | Exports                                 |
| ------------------------- | --------------------------------------- |
| `@laravel/passkeys`       | `Passkeys`                              |
| `@laravel/passkeys/react` | `usePasskeyLogin`, `usePasskeyRegister` |
| `@laravel/passkeys/vue`   | `usePasskeyLogin`, `usePasskeyRegister` |
