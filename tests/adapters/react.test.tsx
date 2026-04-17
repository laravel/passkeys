import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { Passkeys } from "../../src/passkeys";
import { usePasskeyVerify, usePasskeyRegister } from "../../src/adapters/react";

vi.mock("../../src/passkeys", () => ({
    Passkeys: {
        verify: vi.fn(),
        register: vi.fn(),
        autofill: vi.fn(),
        isAutofillSupported: vi.fn(),
        isSupported: vi.fn(),
        cancel: vi.fn(),
    },
}));

const routes = { options: "/opts", submit: "/submit" };

describe("React adapter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (Passkeys.isSupported as Mock).mockReturnValue(true);
        (Passkeys.isAutofillSupported as Mock).mockResolvedValue(false);
    });

    describe("usePasskeyVerify", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const { result } = renderHook(() => usePasskeyVerify({ routes }));

            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.isSupported).toBe(true);
            expect(typeof result.current.verify).toBe("function");
        });

        it("returns isSupported false when Passkeys.isSupported returns false", () => {
            (Passkeys.isSupported as Mock).mockReturnValue(false);

            const { result } = renderHook(() => usePasskeyVerify({ routes }));

            expect(result.current.isSupported).toBe(false);
        });

        it("calls Passkeys.verify with routes and updates state on success", async () => {
            const response = { redirect: "/dashboard" };
            (Passkeys.verify as Mock).mockResolvedValue(response);

            const onSuccess = vi.fn();
            const { result } = renderHook(() =>
                usePasskeyVerify({ routes, onSuccess }),
            );

            await act(async () => {
                result.current.verify();
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(Passkeys.verify).toHaveBeenCalledWith({ routes });
            expect(result.current.error).toBeNull();
            expect(onSuccess).toHaveBeenCalledWith(response);
        });

        it("sets error and calls onError when verify rejects", async () => {
            const err = new Error("Verify failed");
            (Passkeys.verify as Mock).mockRejectedValue(err);

            const onError = vi.fn();
            const { result } = renderHook(() =>
                usePasskeyVerify({ routes, onError }),
            );

            await act(async () => {
                result.current.verify();
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Verify failed");
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Verify failed" }),
            );
        });

        it("does not call autofill by default", async () => {
            const onSuccess = vi.fn();
            renderHook(() => usePasskeyVerify({ routes, onSuccess }));

            await waitFor(() => {
                expect(Passkeys.autofill).not.toHaveBeenCalled();
            });

            expect(Passkeys.isAutofillSupported).not.toHaveBeenCalled();
            expect(onSuccess).not.toHaveBeenCalled();
        });

        it("calls onSuccess when autofill is enabled and returns a value", async () => {
            (Passkeys.isAutofillSupported as Mock).mockResolvedValue(true);
            const response = { redirect: "/home" };
            (Passkeys.autofill as Mock).mockResolvedValue(response);

            const onSuccess = vi.fn();
            renderHook(() =>
                usePasskeyVerify({ routes, onSuccess, autofill: true }),
            );

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(response);
            });

            expect(Passkeys.autofill).toHaveBeenCalledWith({ routes });
        });

        it("skips post-unmount callbacks when autofill resolves after unmount", async () => {
            (Passkeys.isAutofillSupported as Mock).mockResolvedValue(true);

            let resolveAutofill: (value: unknown) => void = () => {};
            (Passkeys.autofill as Mock).mockReturnValue(
                new Promise((resolve) => {
                    resolveAutofill = resolve;
                }),
            );

            const onSuccess = vi.fn();
            const onError = vi.fn();
            const { unmount } = renderHook(() =>
                usePasskeyVerify({
                    routes,
                    onSuccess,
                    onError,
                    autofill: true,
                }),
            );

            await waitFor(() => {
                expect(Passkeys.autofill).toHaveBeenCalled();
            });

            unmount();
            resolveAutofill({ redirect: "/home" });
            await Promise.resolve();

            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
        });

        it("does not call autofill when enabled but unsupported", async () => {
            (Passkeys.isAutofillSupported as Mock).mockResolvedValue(false);

            const onSuccess = vi.fn();
            renderHook(() =>
                usePasskeyVerify({ routes, onSuccess, autofill: true }),
            );

            await waitFor(() => {
                expect(Passkeys.isAutofillSupported).toHaveBeenCalled();
            });

            expect(Passkeys.autofill).not.toHaveBeenCalled();
            expect(onSuccess).not.toHaveBeenCalled();
        });
    });

    describe("usePasskeyRegister", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const { result } = renderHook(() => usePasskeyRegister({ routes }));

            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.isSupported).toBe(true);
            expect(typeof result.current.register).toBe("function");
        });

        it("calls Passkeys.register with name and routes and calls onSuccess", async () => {
            (Passkeys.register as Mock).mockResolvedValue(undefined);

            const onSuccess = vi.fn();
            const { result } = renderHook(() =>
                usePasskeyRegister({ routes, onSuccess }),
            );

            await act(async () => {
                result.current.register("My Device");
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(Passkeys.register).toHaveBeenCalledWith({
                name: "My Device",
                routes,
            });
            expect(result.current.error).toBeNull();
            expect(onSuccess).toHaveBeenCalled();
        });

        it("sets error and calls onError when register rejects", async () => {
            const err = new Error("Registration failed");
            (Passkeys.register as Mock).mockRejectedValue(err);

            const onError = vi.fn();
            const { result } = renderHook(() =>
                usePasskeyRegister({ routes, onError }),
            );

            await act(async () => {
                result.current.register("My Device");
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Registration failed");
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Registration failed" }),
            );
        });
    });
});
