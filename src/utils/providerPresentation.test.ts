import { describe, expect, it } from "vitest";
import {
  getProviderArgsProfileLabel,
  getProviderDisplayName,
} from "./providerPresentation";

describe("providerPresentation", () => {
  it("returns Codex for codex provider", () => {
    expect(getProviderDisplayName("codex")).toBe("Codex");
  });

  it("returns Copilot for copilot provider", () => {
    expect(getProviderDisplayName("copilot")).toBe("Copilot");
  });

  it("builds provider-specific args profile labels", () => {
    expect(getProviderArgsProfileLabel("codex")).toBe("Codex args profile");
    expect(getProviderArgsProfileLabel("copilot")).toBe("Copilot args profile");
  });
});
