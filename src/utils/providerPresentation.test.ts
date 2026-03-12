import { describe, expect, it } from "vitest";
import { getProviderDisplayName } from "./providerPresentation";

describe("providerPresentation", () => {
  it("returns Codex for codex provider", () => {
    expect(getProviderDisplayName("codex")).toBe("Codex");
  });

  it("returns Copilot for copilot provider", () => {
    expect(getProviderDisplayName("copilot")).toBe("Copilot");
  });
});
