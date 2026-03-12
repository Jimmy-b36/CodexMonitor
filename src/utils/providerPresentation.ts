import type { AgentProvider } from "@/types";

export function getProviderDisplayName(provider: AgentProvider): string {
  return provider === "copilot" ? "Copilot" : "Codex";
}

export function getProviderArgsProfileLabel(provider: AgentProvider): string {
  return `${getProviderDisplayName(provider)} args profile`;
}
