import { describe, it, expect } from "vitest";
import { getActiveFrame } from "./frameSelector";

describe("getActiveFrame", () => {
  it("returns 'phone' when only a phone number is provided", () => {
    expect(getActiveFrame("9876543210", "")).toBe("phone");
    expect(getActiveFrame("9876543210", "   ")).toBe("phone");
  });

  it("returns 'email' when only an email is provided", () => {
    expect(getActiveFrame("", "hello@example.com")).toBe("email");
    expect(getActiveFrame("  ", "hello@example.com")).toBe("email");
  });

  it("returns null when both phone and email are provided", () => {
    expect(getActiveFrame("9876543210", "hello@example.com")).toBeNull();
  });

  it("returns null when both are empty", () => {
    expect(getActiveFrame("", "")).toBeNull();
    expect(getActiveFrame("   ", "  ")).toBeNull();
  });
});
