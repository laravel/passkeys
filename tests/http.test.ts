import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mock,
} from "vitest";
import { configure, get, post, resetConfig } from "../src/http";
import { UnexpectedResponseError } from "../src/errors";

describe("http", () => {
    let fetchMock: Mock;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        // Clear CSRF meta tags using safe DOM methods
        document
            .querySelectorAll('meta[name="csrf-token"]')
            .forEach((el) => el.remove());
        // Clear cookies
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
    });

    afterEach(() => {
        resetConfig();
        vi.unstubAllGlobals();
    });

    describe("get", () => {
        it("makes GET request with JSON accept header", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: "test" }),
            });

            const result = await get("/api/test");

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                credentials: "same-origin",
            });
            expect(result).toEqual({ data: "test" });
        });

        it("uses configured fetch options when supplied", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            configure({
                fetch: {
                    credentials: "include",
                    headers: {
                        "X-Tenant": "tenant-1",
                    },
                },
            });

            await get("/api/test");

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-Tenant": "tenant-1",
                },
                credentials: "include",
            });
        });

        it("throws error on non-ok response", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ message: "Not found" }),
            });

            await expect(get("/api/test")).rejects.toThrow("Not found");
        });

        it("uses status code message when response is not JSON", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.reject(new Error("Invalid JSON")),
            });

            await expect(get("/api/test")).rejects.toThrow(
                "Request failed with status 500",
            );
        });

        it("throws UnexpectedResponseError when redirected to a non-JSON page", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: true,
                url: "https://app.test/dashboard",
                json: () =>
                    Promise.reject(new SyntaxError("Unexpected token '<'")),
            });

            const error = await get("/api/test").catch((e: unknown) => e);

            expect(error).toBeInstanceOf(UnexpectedResponseError);
            expect(error).toMatchObject({
                url: "https://app.test/dashboard",
                redirected: true,
                message:
                    "The passkey request was redirected to https://app.test/dashboard instead of returning JSON.",
            });
        });

        it("throws UnexpectedResponseError when a 200 response is not JSON", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: false,
                url: "https://app.test/api/test",
                json: () =>
                    Promise.reject(new SyntaxError("Unexpected token '<'")),
            });

            const error = await get("/api/test").catch((e: unknown) => e);

            expect(error).toBeInstanceOf(UnexpectedResponseError);
            expect(error).toMatchObject({
                url: "https://app.test/api/test",
                redirected: false,
                message:
                    "The passkey request to https://app.test/api/test did not return JSON.",
            });
        });

        it("returns JSON from a redirected response", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: true,
                url: "https://app.test/api/test/",
                json: () => Promise.resolve({ data: "test" }),
            });

            await expect(get("/api/test")).resolves.toEqual({ data: "test" });
        });
    });

    describe("post", () => {
        it("makes POST request with JSON body", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            const result = await post("/api/test", { name: "test" });

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({ name: "test" }),
            });
            expect(result).toEqual({ success: true });
        });

        it("uses configured fetch options when supplied", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            configure({
                fetch: {
                    credentials: "include",
                    headers: {
                        "X-Tenant": "tenant-1",
                    },
                },
            });

            await post("/api/test", { name: "test" });

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Tenant": "tenant-1",
                },
                credentials: "include",
                body: JSON.stringify({ name: "test" }),
            });
        });

        it("includes CSRF token from meta tag", async () => {
            const meta = document.createElement("meta");
            meta.name = "csrf-token";
            meta.content = "test-csrf-token";
            document.head.appendChild(meta);

            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await post("/api/test", {});

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": "test-csrf-token",
                },
                credentials: "same-origin",
                body: JSON.stringify({}),
            });
        });

        it("includes XSRF token from cookie when meta tag is missing", async () => {
            Object.defineProperty(document, "cookie", {
                writable: true,
                value: "XSRF-TOKEN=cookie-token-value",
            });

            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await post("/api/test", {});

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": "cookie-token-value",
                },
                credentials: "same-origin",
                body: JSON.stringify({}),
            });
        });

        it("preserves raw = characters inside the XSRF cookie value", async () => {
            Object.defineProperty(document, "cookie", {
                writable: true,
                value: "XSRF-TOKEN=abc=def",
            });

            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await post("/api/test", {});

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": "abc=def",
                },
                credentials: "same-origin",
                body: JSON.stringify({}),
            });
        });

        it("decodes URL-encoded XSRF cookie", async () => {
            Object.defineProperty(document, "cookie", {
                writable: true,
                value: "XSRF-TOKEN=encoded%3Dtoken",
            });

            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await post("/api/test", {});

            expect(fetchMock).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": "encoded=token",
                },
                credentials: "same-origin",
                body: JSON.stringify({}),
            });
        });

        it("throws UnexpectedResponseError when redirected to a non-JSON page", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: true,
                url: "https://app.test/dashboard",
                json: () =>
                    Promise.reject(new SyntaxError("Unexpected token '<'")),
            });

            const error = await post("/api/test", {}).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(UnexpectedResponseError);
            expect(error).toMatchObject({
                url: "https://app.test/dashboard",
                redirected: true,
                message:
                    "The passkey request was redirected to https://app.test/dashboard instead of returning JSON.",
            });
        });

        it("throws UnexpectedResponseError when a 200 response is not JSON", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: false,
                url: "https://app.test/api/test",
                json: () =>
                    Promise.reject(new SyntaxError("Unexpected token '<'")),
            });

            const error = await post("/api/test", {}).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(UnexpectedResponseError);
            expect(error).toMatchObject({
                url: "https://app.test/api/test",
                redirected: false,
                message:
                    "The passkey request to https://app.test/api/test did not return JSON.",
            });
        });

        it("returns JSON from a redirected response", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                redirected: true,
                url: "https://app.test/api/test/",
                json: () => Promise.resolve({ data: "test" }),
            });

            await expect(post("/api/test", {})).resolves.toEqual({
                data: "test",
            });
        });
    });
});
