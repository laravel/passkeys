import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mock,
} from "vitest";
import { Passkeys } from "../src/passkeys";
import { NotSupportedError, UserCancelledError } from "../src/errors";
import { configureRoutes, defaultRoutes } from "../src/routes";
import {
    browserSupportsWebAuthn,
    browserSupportsWebAuthnAutofill,
    startRegistration,
    startAuthentication,
    WebAuthnAbortService,
} from "@simplewebauthn/browser";

describe("Passkeys", () => {
    let fetchMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        configureRoutes(defaultRoutes);
        (browserSupportsWebAuthn as Mock).mockReturnValue(true);
        (browserSupportsWebAuthnAutofill as Mock).mockResolvedValue(true);

        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("isSupported", () => {
        it("returns true when WebAuthn is supported", () => {
            (browserSupportsWebAuthn as Mock).mockReturnValue(true);

            expect(Passkeys.isSupported()).toBe(true);
        });

        it("returns false when WebAuthn is not supported", () => {
            (browserSupportsWebAuthn as Mock).mockReturnValue(false);

            expect(Passkeys.isSupported()).toBe(false);
        });
    });

    describe("isAutofillSupported", () => {
        it("returns true when autofill is supported", async () => {
            (browserSupportsWebAuthnAutofill as Mock).mockResolvedValue(true);

            expect(await Passkeys.isAutofillSupported()).toBe(true);
        });

        it("returns false when autofill is not supported", async () => {
            (browserSupportsWebAuthnAutofill as Mock).mockResolvedValue(false);

            expect(await Passkeys.isAutofillSupported()).toBe(false);
        });
    });

    describe("register", () => {
        const mockOptionsResponse = {
            options: {
                challenge: "test-challenge",
                rp: { name: "Test App", id: "example.com" },
                user: {
                    id: "user-id",
                    name: "test@example.com",
                    displayName: "Test User",
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            },
        };

        const mockCredential = {
            id: "credential-id",
            rawId: "raw-id",
            type: "public-key",
            response: {
                clientDataJSON: "client-data",
                attestationObject: "attestation",
            },
        };

        const mockStoreResponse = {
            id: "passkey-123",
            name: "MacBook Pro",
        };

        it("throws NotSupportedError when WebAuthn is not supported", async () => {
            (browserSupportsWebAuthn as Mock).mockReturnValue(false);

            await expect(
                Passkeys.register({ name: "Test" }),
            ).rejects.toBeInstanceOf(NotSupportedError);
        });

        it("fetches options, registers credential, and stores passkey", async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockOptionsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockStoreResponse),
                });
            (startRegistration as Mock).mockResolvedValue(mockCredential);

            const result = await Passkeys.register({ name: "MacBook Pro" });

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(startRegistration).toHaveBeenCalledWith({
                optionsJSON: mockOptionsResponse.options,
            });
            expect(result).toEqual(mockStoreResponse);
        });
    });

    describe("verify", () => {
        const mockOptionsResponse = {
            options: {
                challenge: "test-challenge",
                rpId: "example.com",
                allowCredentials: [],
            },
        };

        const mockCredential = {
            id: "credential-id",
            rawId: "raw-id",
            type: "public-key",
            response: {
                clientDataJSON: "client-data",
                authenticatorData: "auth-data",
                signature: "signature",
            },
        };

        const mockVerifyResponse = {
            verified: true,
            redirect: "/dashboard",
        };

        it("throws NotSupportedError when WebAuthn is not supported", async () => {
            (browserSupportsWebAuthn as Mock).mockReturnValue(false);

            await expect(Passkeys.verify()).rejects.toBeInstanceOf(
                NotSupportedError,
            );
        });

        it("fetches options, authenticates, and verifies", async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockOptionsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockVerifyResponse),
                });
            (startAuthentication as Mock).mockResolvedValue(mockCredential);

            const result = await Passkeys.verify();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(startAuthentication).toHaveBeenCalledWith({
                optionsJSON: mockOptionsResponse.options,
            });
            expect(result).toEqual(mockVerifyResponse);
        });

        it("cancels any pending ceremony before starting", async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockOptionsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockVerifyResponse),
                });
            (startAuthentication as Mock).mockResolvedValue(mockCredential);

            await Passkeys.verify();

            expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalled();
        });
    });

    describe("autofill", () => {
        const mockOptionsResponse = {
            options: {
                challenge: "test-challenge",
                rpId: "example.com",
                allowCredentials: [],
            },
        };

        const mockCredential = {
            id: "credential-id",
            rawId: "raw-id",
            type: "public-key",
            response: {
                clientDataJSON: "client-data",
                authenticatorData: "auth-data",
                signature: "signature",
            },
        };

        it("returns undefined when WebAuthn is not supported", async () => {
            (browserSupportsWebAuthn as Mock).mockReturnValue(false);

            const result = await Passkeys.autofill();

            expect(result).toBeUndefined();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("returns undefined when autofill is not supported", async () => {
            (browserSupportsWebAuthnAutofill as Mock).mockResolvedValue(false);

            const result = await Passkeys.autofill();

            expect(result).toBeUndefined();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("returns the verification response on success", async () => {
            const mockResponse = { verified: true, redirect: "/dashboard" };
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockOptionsResponse),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockResponse),
                });
            (startAuthentication as Mock).mockResolvedValue(mockCredential);

            const result = await Passkeys.autofill();

            expect(startAuthentication).toHaveBeenCalledWith({
                optionsJSON: mockOptionsResponse.options,
                useBrowserAutofill: true,
            });
            expect(result).toEqual(mockResponse);
        });

        it("throws when an error occurs", async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOptionsResponse),
            });

            const error = new Error("Test error");
            (startAuthentication as Mock).mockRejectedValue(error);

            await expect(Passkeys.autofill()).rejects.toThrow();
        });

        it("returns undefined on AbortError without throwing", async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOptionsResponse),
            });

            const abortError = new Error("Aborted");
            abortError.name = "AbortError";
            (startAuthentication as Mock).mockRejectedValue(abortError);

            const result = await Passkeys.autofill();

            expect(result).toBeUndefined();
        });
    });

    describe("cancel", () => {
        it("calls WebAuthnAbortService.cancelCeremony", () => {
            Passkeys.cancel();

            expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalled();
        });
    });
});
