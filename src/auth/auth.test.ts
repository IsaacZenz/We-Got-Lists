import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./messages";
import { initialsFor } from "../profile/initials";

describe("initialsFor", () => {
  it.each([
    ["Isaac Zenz", "IZ"],
    ["isaac", "IS"],
    ["  j  ", "J"],
    ["Mary Jo Smith", "MS"],
    ["Dr. Who", "DW"],
    ["", "?"],
    ["!!!", "?"],
    ["Émile Zola", "ÉZ"],
  ])("%s → %s", (name, expected) => expect(initialsFor(name)).toBe(expected));
});

describe("friendlyAuthError", () => {
  it("explains a wrong password", () => expect(friendlyAuthError("Invalid login credentials")).toMatch(/don't match/));
  it("explains unconfirmed email", () => expect(friendlyAuthError("Email not confirmed")).toMatch(/isn't confirmed/));
  it("explains rate limits", () => expect(friendlyAuthError("email rate limit exceeded")).toMatch(/Wait a minute/));
  it("explains network trouble", () => expect(friendlyAuthError("TypeError: Failed to fetch")).toMatch(/internet/));
  it("passes unknown messages through", () => expect(friendlyAuthError("Weird thing")).toBe("Weird thing"));
  it("never returns empty", () => expect(friendlyAuthError(undefined)).toMatch(/went wrong/));
});
