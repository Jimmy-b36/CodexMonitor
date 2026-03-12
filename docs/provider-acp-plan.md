# Provider-Agnostic ACP Plan

## Outcome
Implement a provider-agnostic runtime using ACP as the internal contract, while preserving Codex behavior and adding Copilot as the first additional provider.

## Contract
The canonical ACP types are now defined in:

- `src-tauri/src/shared/provider_acp.rs`
- `src/types.ts`

Primary types:

1. `ProviderDescriptor`
2. `ProviderCapabilities`
3. `ProviderSessionHandle`
4. `ProviderRequestContext`
5. `ProviderError`
6. `CanonicalEvent`

Canonical provider error codes:

1. `unsupported_capability`
2. `provider_unavailable`
3. `auth_required`
4. `invalid_request`
5. `upstream_error`
6. `timeout`

## Phase Breakdown
1. Discovery and contract freeze.
2. ACP core abstraction with Codex shim and no behavior change.
3. Settings/data migration (`defaultAgentProvider`, workspace `agentProvider`).
4. Provider registry routing parity across app and daemon.
5. Copilot ACP adapter MVP.
6. Frontend capability gating and provider selection UX.
7. Hardening, telemetry, and staged rollout behind feature flag.

## Non-Goals For MVP
1. No redesign of unrelated product areas.
2. No deep provider-specific advanced tooling for Copilot in MVP.
3. No initial rename of existing `codex_*` invoke command names.
