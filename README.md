# @laravel/passkeys

A JavaScript client for passkey authentication designed to work with Laravel applications. It provides a clean, Laravel-style API for browser-side WebAuthn ceremonies (registration and authentication).

```js
import { Passkeys } from '@laravel/passkeys'

// Register a new passkey (authenticated user)
await Passkeys.register({ name: 'MacBook Pro' })

// Verify with passkey
await Passkeys.verify()

// Autofill support for login pages
Passkeys.autofill({ onSuccess: () => window.location.href = '/dashboard' })
```

### Public Methods

| Method | Description |
|--------|-------------|
| `configure({ routes })` | Configure custom routes |
| `isSupported()` | Check if the browser supports passkeys |
| `isAutofillSupported()` | Check if the browser supports passkey autofill |
| `register({ name })` | Register a new passkey for the authenticated user |
| `verify()` | Authenticate with a passkey |
| `autofill({ onSuccess, onError })` | Enable passkey autofill on the current page |
| `cancel()` | Cancel any pending passkey operation |


## Expected Endpoints

This package handles communication with your Laravel application and expects the following endpoints:

### Registration (Authenticated)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/passkeys/register/options` | Fetch registration options |
| `POST` | `/passkeys/register` | Store new passkey |

### Authentication (Guest)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/passkeys/verify/options` | Fetch authentication options |
| `POST` | `/passkeys/verify` | Verify credential and authenticate |

### Custom Route Configuration

```js
Passkeys.configure({
  routes: {
    registerOptions: '/passkeys/register/options',
    registerStore: '/passkeys/register',
    verifyOptions: '/passkeys/verify/options',
    verifySubmit: '/passkeys/verify',
  }
})
```

## Type Compatibility

This package imports TypeScript types from [`@simplewebauthn/browser`](https://www.npmjs.com/package/@simplewebauthn/browser). These types are fully compatible with the JSON output from the [`web-auth/webauthn-lib`](https://packagist.org/packages/web-auth/webauthn-lib) PHP package.

## Package Structure

```
packages/
├── core/          → @laravel/passkeys (this package)
├── react/         → @laravel/passkeys-react (placeholder)
├── vue/           → @laravel/passkeys-vue (placeholder)
└── alpine/        → @laravel/passkeys-alpine (placeholder)
```
