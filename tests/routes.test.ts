import { describe, it, expect, beforeEach } from "vitest";
import { defaultRoutes, configureRoutes, getRoutes } from "../src/routes";

describe("routes", () => {
    beforeEach(() => {
        configureRoutes(defaultRoutes);
    });

    it("has correct default values", () => {
        expect(defaultRoutes.registerOptions).toBe("/user/passkeys/options");
        expect(defaultRoutes.registerStore).toBe("/user/passkeys");
        expect(defaultRoutes.verifyOptions).toBe("/passkeys/options");
        expect(defaultRoutes.verifySubmit).toBe("/passkeys/verify");
    });

    it("allows partial override while preserving other defaults", () => {
        configureRoutes({
            verifyOptions: "/api/auth/options",
            verifySubmit: "/api/auth/verify",
        });

        const routes = getRoutes();

        expect(routes.verifyOptions).toBe("/api/auth/options");
        expect(routes.verifySubmit).toBe("/api/auth/verify");
        expect(routes.registerOptions).toBe(defaultRoutes.registerOptions);
        expect(routes.registerStore).toBe(defaultRoutes.registerStore);
    });
});
