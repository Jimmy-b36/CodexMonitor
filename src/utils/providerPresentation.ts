import type { AgentProvider } from "@/types";

export function getProviderDisplayName(provider: AgentProvider): string {
  return provider === "copilot" ? "Copilot" : "Codex";
}
