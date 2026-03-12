import type { AgentProvider, ProviderError, ProviderErrorCode } from "@/types";
import { getProviderDisplayName } from "./providerPresentation";

const PROVIDER_ERROR_CODES: ReadonlySet<ProviderErrorCode> = new Set([
  "unsupported_capability",
  "provider_unavailable",
  "auth_required",
  "invalid_request",
  "upstream_error",
  "timeout",
]);

const CAPABILITY_LABELS: Record<string, string> = {
  threadStart: "Starting new threads",
  threadResume: "Resuming existing threads",
  threadList: "Listing threads",
  messageSend: "Sending messages",
  modelsList: "Listing models",
  login: "Account login",
  featureFlags: "Feature flags",
  skillsList: "Skills",
  appsList: "Apps",
  collaborationModes: "Collaboration modes",
  reviewStart: "Starting reviews",
  forkThread: "Forking threads",
  archiveThread: "Archiving threads",
  compactThread: "Compacting threads",
  setThreadName: "Renaming threads",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function isProviderErrorCode(value: unknown): value is ProviderErrorCode {
  return typeof value === "string" && PROVIDER_ERROR_CODES.has(value as ProviderErrorCode);
}

function coerceProviderError(value: unknown): ProviderError | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const code = record.code;
  if (!isProviderErrorCode(code)) {
    return null;
  }
  const message =
    typeof record.message === "string" && record.message.trim().length > 0
      ? record.message.trim()
      : "Provider request failed.";
  const retryable = typeof record.retryable === "boolean" ? record.retryable : false;
  const capability =
    typeof record.capability === "string" && record.capability.trim().length > 0
      ? record.capability.trim()
      : undefined;
  return { code, message, retryable, capability };
}

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseProviderErrorFromString(text: string): ProviderError | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const direct = coerceProviderError(parseJson(trimmed));
  if (direct) {
    return direct;
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }
  const nested = parseJson(trimmed.slice(firstBrace, lastBrace + 1));
  return coerceProviderError(nested);
}

export function parseProviderError(value: unknown): ProviderError | null {
  const direct = coerceProviderError(value);
  if (direct) {
    return direct;
  }
  if (value instanceof Error) {
    return parseProviderErrorFromString(value.message);
  }
  if (typeof value === "string") {
    return parseProviderErrorFromString(value);
  }
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  if ("error" in record) {
    const nested = parseProviderError(record.error);
    if (nested) {
      return nested;
    }
  }
  if (typeof record.message === "string") {
    return parseProviderErrorFromString(record.message);
  }
  return null;
}

function getCapabilityLabel(capability: string | undefined): string {
  if (!capability) {
    return "This action";
  }
  return CAPABILITY_LABELS[capability] ?? capability;
}

export function getProviderGuardrailMessage(
  value: unknown,
  provider?: AgentProvider | null,
): string | null {
  const providerError = parseProviderError(value);
  if (!providerError) {
    return null;
  }

  switch (providerError.code) {
    case "unsupported_capability": {
      const capabilityLabel = getCapabilityLabel(providerError.capability);
      if (provider) {
        return `${capabilityLabel} is not available for ${getProviderDisplayName(provider)}. Switch this workspace to a provider that supports it.`;
      }
      return `${capabilityLabel} is not available for the selected provider. Switch this workspace to a provider that supports it.`;
    }
    case "auth_required":
      return "Provider authentication is required. Sign in and try again.";
    case "provider_unavailable":
      return "Provider is unavailable right now. Check provider setup and try again.";
    case "timeout":
      return "Provider request timed out. Try again.";
    case "invalid_request":
      return providerError.message || "Provider rejected the request. Check inputs and try again.";
    case "upstream_error":
      return providerError.message || "Provider returned an upstream error. Try again.";
    default:
      return providerError.message || "Provider request failed.";
  }
}
