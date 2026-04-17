import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { Passkeys } from "../../src/passkeys";
import { PasskeyError, PasskeyExistsError } from "../../src/errors";
import { usePasskeyVerify, usePasskeyRegister } from "../../src/adapters/vue";

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

const createVerifyWrapper = (autofill = false) =>
    defineComponent({
        setup() {
            const onSuccess = vi.fn();
            const onError = vi.fn();
            const passkey = usePasskeyVerify({
                routes,
                onSuccess,
                onError,
                autofill,
            });
            return { passkey, onSuccess, onError };
        },
        render() {
            const passkey = this.passkey;
            return h("div", [
                h(
                    "span",
                    { "data-loading": "" },
                    String(passkey.isLoading.value),
                ),
                h("span", { "data-error": "" }, passkey.error.value ?? ""),
                h(
                    "span",
                    { "data-supported": "" },
                    String(passkey.isSupported.value),
                ),
                h(
                    "button",
                    { "data-verify": "", onClick: () => passkey.verify() },
                    "Verify",
                ),
            ]);
        },
    });

const RegisterWrapper = defineComponent({
    setup() {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const passkey = usePasskeyRegister({ routes, onSuccess, onError });
        return { passkey, onSuccess, onError };
    },
    render() {
        const passkey = this.passkey;
        return h("div", [
            h("span", { "data-loading": "" }, String(passkey.isLoading.value)),
            h("span", { "data-error": "" }, passkey.error.value ?? ""),
            h(
                "span",
                { "data-supported": "" },
                String(passkey.isSupported.value),
            ),
            h(
                "button",
                {
                    "data-register": "",
                    onClick: () => passkey.register("My Device"),
                },
                "Register",
            ),
        ]);
    },
});

describe("Vue adapter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (Passkeys.isSupported as Mock).mockReturnValue(true);
        (Passkeys.isAutofillSupported as Mock).mockResolvedValue(false);
    });

    describe("usePasskeyVerify", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", async () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            expect(wrapper.find("[data-loading]").text()).toBe("false");
            expect(wrapper.find("[data-error]").text()).toBe("");
            expect(wrapper.find("[data-supported]").text()).toBe("true");
        });

        it("renders isSupported as false during SSR", async () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const Probe = defineComponent({
                setup() {
                    const { isSupported } = usePasskeyVerify({ routes });

                    return { isSupported };
                },
                render() {
                    return h("span", String(this.isSupported));
                },
            });

            const html = await renderToString(createSSRApp(Probe));

            expect(html).toContain("false");
            expect(Passkeys.isSupported).not.toHaveBeenCalled();
        });

        it("calls Passkeys.verify with routes and calls onSuccess on success", async () => {
            const response = { redirect: "/dashboard" };
            (Passkeys.verify as Mock).mockResolvedValue(response);

            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            const vm = wrapper.vm as unknown as {
                onSuccess: ReturnType<typeof vi.fn>;
            };
            await wrapper.find("[data-verify]").trigger("click");
            await flushPromises();

            expect(Passkeys.verify).toHaveBeenCalledWith({ routes });
            expect(wrapper.find("[data-error]").text()).toBe("");
            expect(vm.onSuccess).toHaveBeenCalledWith(response);
        });

        it("sets error and calls onError when verify rejects", async () => {
            (Passkeys.verify as Mock).mockRejectedValue(
                new Error("Verify failed"),
            );

            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            await wrapper.find("[data-verify]").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-error]").text()).toBe("Verify failed");
            const vm = wrapper.vm as unknown as {
                onError: ReturnType<typeof vi.fn>;
                passkey: { errorInstance: { value: unknown } };
            };
            expect(vm.passkey.errorInstance.value).toBeInstanceOf(PasskeyError);
            expect(vm.onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Verify failed" }),
            );
        });

        it("exposes typed error instance for instanceof branching", async () => {
            (Passkeys.verify as Mock).mockRejectedValue(
                new PasskeyExistsError(),
            );

            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            await wrapper.find("[data-verify]").trigger("click");
            await flushPromises();

            const vm = wrapper.vm as unknown as {
                passkey: { errorInstance: { value: unknown } };
            };
            expect(vm.passkey.errorInstance.value).toBeInstanceOf(
                PasskeyExistsError,
            );
        });

        it("does not call autofill by default", async () => {
            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            const vm = wrapper.vm as unknown as {
                onSuccess: ReturnType<typeof vi.fn>;
            };
            expect(Passkeys.isAutofillSupported).not.toHaveBeenCalled();
            expect(Passkeys.autofill).not.toHaveBeenCalled();
            expect(vm.onSuccess).not.toHaveBeenCalled();
        });

        it("calls onSuccess when autofill is enabled and returns a value", async () => {
            (Passkeys.isAutofillSupported as Mock).mockResolvedValue(true);
            const response = { redirect: "/home" };
            (Passkeys.autofill as Mock).mockResolvedValue(response);

            const wrapper = mount(createVerifyWrapper(true));
            await flushPromises();

            const vm = wrapper.vm as unknown as {
                onSuccess: ReturnType<typeof vi.fn>;
            };
            expect(vm.onSuccess).toHaveBeenCalledWith(response);
            expect(Passkeys.autofill).toHaveBeenCalledWith({ routes });
        });

        it("calls Passkeys.cancel on unmount", async () => {
            const wrapper = mount(createVerifyWrapper());
            await flushPromises();

            wrapper.unmount();
            await flushPromises();

            expect(Passkeys.cancel).toHaveBeenCalled();
        });
    });

    describe("usePasskeyRegister", () => {
        it("returns initial state with isSupported from Passkeys.isSupported", async () => {
            (Passkeys.isSupported as Mock).mockReturnValue(true);

            const wrapper = mount(RegisterWrapper);
            await flushPromises();

            expect(wrapper.find("[data-loading]").text()).toBe("false");
            expect(wrapper.find("[data-error]").text()).toBe("");
            expect(wrapper.find("[data-supported]").text()).toBe("true");
        });

        it("calls Passkeys.register with name and routes and calls onSuccess", async () => {
            (Passkeys.register as Mock).mockResolvedValue(undefined);

            const wrapper = mount(RegisterWrapper);
            await flushPromises();

            const vm = wrapper.vm as unknown as {
                onSuccess: ReturnType<typeof vi.fn>;
            };
            await wrapper.find("[data-register]").trigger("click");
            await flushPromises();

            expect(Passkeys.register).toHaveBeenCalledWith({
                name: "My Device",
                routes,
            });
            expect(wrapper.find("[data-error]").text()).toBe("");
            expect(vm.onSuccess).toHaveBeenCalled();
        });

        it("sets error and calls onError when register rejects", async () => {
            (Passkeys.register as Mock).mockRejectedValue(
                new Error("Registration failed"),
            );

            const wrapper = mount(RegisterWrapper);
            await flushPromises();

            await wrapper.find("[data-register]").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-error]").text()).toBe(
                "Registration failed",
            );
            const vm = wrapper.vm as unknown as {
                onError: ReturnType<typeof vi.fn>;
            };
            expect(vm.onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Registration failed" }),
            );
        });
    });
});
