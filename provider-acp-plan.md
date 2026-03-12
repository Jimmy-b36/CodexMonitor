# Provider-Agnostic ACP Plan for CodexMonitor

## Outcome
Implement provider-agnostic runtime in CodexMonitor using ACP as the internal protocol, with Codex preserved and Copilot added as first new provider.

## Success Criteria
1. Existing Codex users see no regressions after migration.
2. Provider can be selected globally and per workspace.
3. Backend app and daemon both route through one provider abstraction.
4. Copilot works for MVP thread/message flow.
5. Unsupported features are capability-gated in UI, not hard-failed.

## Scope
1. In scope: backend abstraction, ACP contract, provider registry, Codex shim, Copilot adapter MVP, settings migration, UI capability gating, tests, docs.
2. Out of scope: redesigning non-provider features (Git panel, notifications architecture, workspace model beyond provider settings), deep Copilot-specific advanced tools in MVP.

## Architecture Decisions
1. ACP is the canonical internal provider contract.
2. Keep transport provider (`remoteBackendProvider: "tcp"`) separate from agent provider (`agentProvider: "codex" | "copilot"`).
3. Introduce provider capabilities and make UI conditional by capabilities.
4. Preserve current frontend IPC method names initially for compatibility; internally route through provider abstraction.
5. Add a compatibility layer before any major renaming of `codex_*` command surfaces.

## Phase 0: Discovery and Contract Freeze
1. Inventory Codex-coupled surfaces and classify as `core`, `optional`, `codex-only`.
2. Freeze MVP ACP operation list.
3. Define canonical event schema consumed by frontend reducer.
4. Deliverable: `docs/provider-acp-plan.md` and `docs/provider-capabilities.md`.
5. Exit criteria: agreed operation matrix and capability keys.

## Phase 1: ACP Core Abstraction (No Behavior Change)
1. Add shared provider traits/interfaces in backend shared core.
2. Add provider registry and provider resolution from workspace/app settings.
3. Wrap existing Codex runtime as `CodexProvider` ACP shim.
4. Keep all current behavior and command names intact.
5. Exit criteria: all current tests pass, no visible UX change.

## Phase 2: Settings and Data Model Migration
1. Add `defaultAgentProvider` to app settings.
2. Add optional workspace override `agentProvider`.
3. Add storage migration with default `codex` for existing installs.
4. Keep `remoteBackendProvider` unchanged as transport only.
5. Exit criteria: migration tests pass for old/new settings payloads.

## Phase 3: Routing Through Provider Registry (App and Daemon Parity)
1. Refactor session/thread/message/model/login paths to call provider facade.
2. Ensure parity in Tauri app commands and daemon RPC handlers.
3. Introduce unsupported-capability error type with stable payload shape.
4. Exit criteria: same behavior for Codex across local and remote modes.

## Phase 4: Copilot ACP Adapter MVP
1. Implement Copilot adapter for `session.start`.
2. Implement `thread.start`.
3. Implement `thread.resume` (if supported, else capability false).
4. Implement `thread.list`.
5. Implement `message.send`.
6. Implement `events.subscribe`.
7. Implement `models.list`.
8. Map provider-specific responses/events to canonical schema.
9. Exit criteria: end-to-end thread send/receive works on Copilot-enabled workspace.

## Phase 5: Frontend Capability Gating and Provider UX
1. Add provider selector in settings and workspace settings.
2. Show only supported controls (login, feature flags, apps, collaboration modes).
3. Preserve existing codex-focused UI labels where required; add neutral labels where feasible.
4. Exit criteria: no broken actions from unsupported operations.

## Phase 6: Hardening (Single-User Rollout)
1. Add guardrails/fallback messaging for unsupported operations.
2. Validate unsupported flows fail gracefully without breaking active sessions.
3. Run full regression matrix across frontend and backend.
4. Exit criteria: release candidate checklist complete for single-user usage.

## Target Contract (ACP Internal)
1. `ProviderDescriptor { id, label, version, capabilities }`
2. `ProviderCapabilities { threadStart, threadResume, threadList, messageSend, modelsList, login, featureFlags, skillsList, appsList, collaborationModes, reviewStart, forkThread, archiveThread, compactThread }`
3. `ProviderSessionHandle { workspaceId, providerId, connectionState }`
4. `ProviderRequestContext { workspaceId, threadId?, metadata }`
5. `ProviderError { code, message, retryable, capability? }`
6. `CanonicalEvent { workspaceId, method, params, providerId, raw? }`

## Canonical Error Codes
1. `unsupported_capability`
2. `provider_unavailable`
3. `auth_required`
4. `invalid_request`
5. `upstream_error`
6. `timeout`

## Data Model Changes
1. TypeScript: add `defaultAgentProvider` and workspace `agentProvider`.
2. Rust: add matching serde fields with defaults/migration.
3. Storage migration:
4. If missing, set `defaultAgentProvider = "codex"`.
5. Leave existing settings untouched otherwise.
6. Validation:
7. Unknown provider string falls back to `codex` with warning log.

## API Compatibility Strategy
1. Keep existing frontend `invoke` method names in first rollout.
2. Internally route to provider facade.
3. Add new neutral commands in parallel where needed.
4. Deprecate `codex_*` names only after frontend migration confidence.

## Test Plan
1. Unit tests:
2. Settings migration old to new.
3. Provider selection resolution app/workspace.
4. Capability gating decisions.
5. Canonical event mapping for Codex and Copilot.
6. Unsupported-capability error normalization.
7. Integration tests:
8. Local mode Codex baseline unchanged.
9. Remote daemon parity for provider routing.
10. Copilot MVP flow start/send/list.
11. Frontend tests:
12. Settings provider selector behavior.
13. Conditional rendering by capabilities.
14. Graceful unsupported action UI states.
15. Validation commands:
16. `npm run typecheck`
17. `npm run test`
18. `cd src-tauri && cargo check`

## Rollout Plan
1. Single-user rollout only; provider selection remains directly configurable in settings.
2. Keep rollback path: force provider to `codex` globally.

## Risk Register
1. Risk: protocol mismatch between ACP expectations and Copilot behavior.
2. Mitigation: strict adapter boundary plus capability false for unsupported ops.
3. Risk: event-shape drift breaks thread reducer.
4. Mitigation: canonical event schema plus mapping tests.
5. Risk: app/daemon drift.
6. Mitigation: parity checklist enforced per PR.
7. Risk: naming confusion (`remoteBackendProvider` vs agent provider).
8. Mitigation: explicit new field names and UI copy.

## PR Slice Plan
1. PR1: docs plus contract definitions plus capability enums.
2. PR2: provider registry plus Codex ACP shim wired but behavior unchanged.
3. PR3: settings schema/storage migration for `defaultAgentProvider` plus workspace override.
4. PR4: route core commands through provider facade (app).
5. PR5: route daemon RPC through provider facade (daemon parity).
6. PR6: Copilot adapter MVP backend.
7. PR7: frontend provider selection UI plus capability gating.
8. PR8: tests/hardening plus docs updates.

## Primary Files To Touch
1. `src-tauri/src/shared/*`
2. `src-tauri/src/codex/mod.rs`
3. `src-tauri/src/backend/app_server.rs`
4. `src-tauri/src/bin/codex_monitor_daemon.rs`
5. `src-tauri/src/bin/codex_monitor_daemon/rpc.rs`
6. `src-tauri/src/types.rs`
7. `src/types.ts`
8. `src/features/settings/hooks/useAppSettings.ts`
9. `src/features/settings/components/SettingsView.tsx`
10. `src/services/tauri.ts`
11. `src/features/threads/hooks/useThreadsReducer.ts`
