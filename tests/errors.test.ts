import { describe, it, expect } from "vitest";
import {
    PasskeyError,
    NotSupportedError,
    UserCancelledError,
    PasskeyExistsError,
    toPasskeyError,
} from "../src/errors";

describe("toPasskeyError", () => {
    it("returns PasskeyError unchanged", () => {
        const original = new PasskeyError("original");

        expect(toPasskeyError(original)).toBe(original);
    });

    it("converts NotAllowedError to UserCancelledError", () => {
        const error = new Error();
        error.name = "NotAllowedError";

        expect(toPasskeyError(error)).toBeInstanceOf(UserCancelledError);
    });

    it("converts InvalidStateError to PasskeyExistsError", () => {
        const error = new Error();
        error.name = "InvalidStateError";

        expect(toPasskeyError(error)).toBeInstanceOf(PasskeyExistsError);
    });

    it("converts NotSupportedError to NotSupportedError", () => {
        const error = new Error();
        error.name = "NotSupportedError";

        expect(toPasskeyError(error)).toBeInstanceOf(NotSupportedError);
    });

    it("wraps unknown errors preserving message", () => {
        const error = new Error("Something broke");

        const result = toPasskeyError(error);

        expect(result).toBeInstanceOf(PasskeyError);
        expect(result.message).toBe("Something broke");
    });

    it("handles non-Error values", () => {
        expect(toPasskeyError("string")).toBeInstanceOf(PasskeyError);
        expect(toPasskeyError(null)).toBeInstanceOf(PasskeyError);
    });
});
