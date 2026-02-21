import { describe, it, expect } from "vitest";
import { defaultRoutes } from "../src/routes";

describe("routes", () => {
    it("has correct default values", () => {
        expect(defaultRoutes.registerOptions).toBe("/user/passkeys/options");
        expect(defaultRoutes.registerStore).toBe("/user/passkeys");
        expect(defaultRoutes.verifyOptions).toBe("/passkeys/login/options");
        expect(defaultRoutes.verifySubmit).toBe("/passkeys/login");
    });
});
