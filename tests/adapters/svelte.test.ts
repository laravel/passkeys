import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mock,
} from "vitest";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/svelte";
import { Passkeys } from "../../src/passkeys";
import { PasskeyExistsError } from "../../src/errors";
import TestVerify from "./TestVerify.svelte";
import TestRegister from "./TestRegister.svelte";

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

describe("Svelte adapter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (Passkeys.isSupported as Mock).mockReturnValue(true);
        (Passkeys.isAutofillSupported as Mock).mockResolvedValue(false);
    });

    afterEach(() => {
        cleanup();
    });

    describe("usePasskeyVerify", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", async () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const { getByTestId } = render(TestVerify, {
                props: { routes },
            });

            await waitFor(() => {
                expect(getByTestId("loading").textContent).toBe("false");
            });
            expect(getByTestId("error").textContent).toBe("");
            expect(getByTestId("supported").textContent).toBe("true");
        });

        it("calls Passkeys.verify with routes and calls onSuccess on success", async () => {
            const response = { redirect: "/dashboard" };
            (Passkeys.verify as Mock).mockResolvedValue(response);

            const onSuccess = vi.fn();
            const { getByRole, getByTestId } = render(TestVerify, {
                props: { routes, onSuccess },
            });

            await fireEvent.click(getByRole("button", { name: "Verify" }));
            await waitFor(() => {
                expect(Passkeys.verify).toHaveBeenCalledWith({ routes });
            });

            expect(getByTestId("error").textContent).toBe("");
            expect(onSuccess).toHaveBeenCalledWith(response);
        });

        it("sets error and calls onError when verify rejects", async () => {
            (Passkeys.verify as Mock).mockRejectedValue(
                new Error("Verify failed"),
            );

            const onError = vi.fn();
            const { getByTestId, getByRole } = render(TestVerify, {
                props: { routes, onError },
            });

            await fireEvent.click(getByRole("button", { name: "Verify" }));
            await waitFor(() => {
                expect(getByTestId("error").textContent).toBe("Verify failed");
            });

            expect(getByTestId("error-instance-name").textContent).toBe(
                "PasskeyError",
            );
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Verify failed" }),
            );
        });

        it("exposes typed error instance for instanceof branching", async () => {
            (Passkeys.verify as Mock).mockRejectedValue(
                new PasskeyExistsError(),
            );

            const { getByTestId, getByRole } = render(TestVerify, {
                props: { routes },
            });

            await fireEvent.click(getByRole("button", { name: "Verify" }));
            await waitFor(() => {
                expect(getByTestId("error-instance-name").textContent).toBe(
                    "PasskeyExistsError",
                );
            });
        });

        it("does not call autofill by default", async () => {
            const onSuccess = vi.fn();
            render(TestVerify, { props: { routes, onSuccess } });

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
            render(TestVerify, {
                props: { routes, onSuccess, autofill: true },
            });

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledWith(response);
            });

            expect(Passkeys.autofill).toHaveBeenCalledWith({ routes });
        });

        it("calls Passkeys.cancel on unmount", async () => {
            const { unmount } = render(TestVerify, {
                props: { routes, autofill: true },
            });

            await waitFor(() => {
                expect(Passkeys.cancel).toHaveBeenCalled();
            });

            unmount();
            await waitFor(() => {});

            expect(Passkeys.cancel).toHaveBeenCalledTimes(2);
        });
    });

    describe("usePasskeyRegister", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", async () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const { getByTestId } = render(TestRegister, {
                props: { routes },
            });

            await waitFor(() => {
                expect(getByTestId("loading").textContent).toBe("false");
            });
            expect(getByTestId("error").textContent).toBe("");
            expect(getByTestId("supported").textContent).toBe("true");
        });

        it("calls Passkeys.register with name and routes and calls onSuccess", async () => {
            (Passkeys.register as Mock).mockResolvedValue(undefined);

            const onSuccess = vi.fn();
            const { getByTestId, getByRole } = render(TestRegister, {
                props: { routes, onSuccess },
            });

            await fireEvent.click(getByRole("button", { name: "Register" }));
            await waitFor(() => {
                expect(Passkeys.register).toHaveBeenCalledWith({
                    name: "My Device",
                    routes,
                });
            });

            expect(getByTestId("error").textContent).toBe("");
            expect(onSuccess).toHaveBeenCalled();
        });

        it("sets error and calls onError when register rejects", async () => {
            (Passkeys.register as Mock).mockRejectedValue(
                new Error("Registration failed"),
            );

            const onError = vi.fn();
            const { getByTestId, getByRole } = render(TestRegister, {
                props: { routes, onError },
            });

            await fireEvent.click(getByRole("button", { name: "Register" }));
            await waitFor(() => {
                expect(getByTestId("error").textContent).toBe(
                    "Registration failed",
                );
            });

            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Registration failed" }),
            );
        });
    });
});
