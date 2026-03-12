import { describe, expect, it } from "vitest";
import {
  getProviderCapabilities,
  resolveWorkspaceAgentProvider,
  resolveWorkspaceProviderCapabilities,
} from "./providerCapabilities";

describe("providerCapabilities", () => {
  it("resolves workspace provider override before app default", () => {
    const provider = resolveWorkspaceAgentProvider(
      { defaultAgentProvider: "codex" },
      { settings: { sidebarCollapsed: false, agentProvider: "copilot" } },
    );
    expect(provider).toBe("copilot");
  });

  it("falls back to app default when workspace override is missing", () => {
    const provider = resolveWorkspaceAgentProvider(
      { defaultAgentProvider: "copilot" },
      { settings: { sidebarCollapsed: false } },
    );
    expect(provider).toBe("copilot");
  });

  it("returns codex capabilities for codex", () => {
    expect(getProviderCapabilities("codex").featureFlags).toBe(true);
    expect(getProviderCapabilities("codex").login).toBe(true);
  });

  it("returns copilot capabilities for copilot", () => {
    const caps = resolveWorkspaceProviderCapabilities(
      { defaultAgentProvider: "codex" },
      { settings: { sidebarCollapsed: false, agentProvider: "copilot" } },
    );
    expect(caps.featureFlags).toBe(false);
    expect(caps.appsList).toBe(false);
    expect(caps.collaborationModes).toBe(false);
    expect(caps.messageSend).toBe(true);
  });
});
