import { vi } from "vitest";

// Mock @simplewebauthn/browser
vi.mock("@simplewebauthn/browser", () => ({
    browserSupportsWebAuthn: vi.fn(() => true),
    browserSupportsWebAuthnAutofill: vi.fn(() => Promise.resolve(true)),
    startRegistration: vi.fn(),
    startAuthentication: vi.fn(),
    WebAuthnAbortService: {
        cancelCeremony: vi.fn(),
    },
}));
