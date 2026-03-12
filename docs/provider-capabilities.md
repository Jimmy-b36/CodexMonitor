# Provider Capabilities

This document defines ACP capability keys used for backend routing and frontend capability gating.

## Capability Keys
1. `threadStart`
2. `threadResume`
3. `threadList`
4. `messageSend`
5. `modelsList`
6. `login`
7. `featureFlags`
8. `skillsList`
9. `appsList`
10. `collaborationModes`
11. `reviewStart`
12. `forkThread`
13. `archiveThread`
14. `compactThread`

## MVP Expectations
Codex:
All keys are expected to be `true` once wired through ACP shim.

Copilot MVP:
1. `threadStart`: `true`
2. `threadResume`: provider-dependent; `false` if unsupported
3. `threadList`: `true`
4. `messageSend`: `true`
5. `modelsList`: `true`
6. `login`: provider-dependent
7. `featureFlags`: `false` (initially)
8. `skillsList`: `false` (initially)
9. `appsList`: `false` (initially)
10. `collaborationModes`: `false` (initially)
11. `reviewStart`: `false` (initially)
12. `forkThread`: `false` (initially)
13. `archiveThread`: `false` (initially)
14. `compactThread`: `false` (initially)

## Error Behavior
When a requested operation maps to a `false` capability, providers should return:

- `code: "unsupported_capability"`
- `capability: <capability key>`
- `retryable: false`
