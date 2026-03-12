import type {
  AgentProvider,
  AppSettings,
  ProviderCapabilities,
  WorkspaceInfo,
} from "@/types";

const CODEX_CAPABILITIES: ProviderCapabilities = {
  threadStart: true,
  threadResume: true,
  threadList: true,
  messageSend: true,
  modelsList: true,
  login: true,
  featureFlags: true,
  skillsList: true,
  appsList: true,
  collaborationModes: true,
  reviewStart: true,
  forkThread: true,
  archiveThread: true,
  compactThread: true,
};

const COPILOT_CAPABILITIES: ProviderCapabilities = {
  threadStart: true,
  threadResume: false,
  threadList: true,
  messageSend: true,
  modelsList: true,
  login: false,
  featureFlags: false,
  skillsList: false,
  appsList: false,
  collaborationModes: false,
  reviewStart: false,
  forkThread: false,
  archiveThread: false,
  compactThread: false,
};

export function getProviderCapabilities(
  provider: AgentProvider,
): ProviderCapabilities {
  return provider === "copilot" ? COPILOT_CAPABILITIES : CODEX_CAPABILITIES;
}

export function resolveWorkspaceAgentProvider(
  appSettings: Pick<AppSettings, "defaultAgentProvider">,
  workspace: Pick<WorkspaceInfo, "settings"> | null,
): AgentProvider {
  return workspace?.settings?.agentProvider ?? appSettings.defaultAgentProvider;
}

export function resolveWorkspaceProviderCapabilities(
  appSettings: Pick<AppSettings, "defaultAgentProvider">,
  workspace: Pick<WorkspaceInfo, "settings"> | null,
): ProviderCapabilities {
  return getProviderCapabilities(
    resolveWorkspaceAgentProvider(appSettings, workspace),
  );
}
