import { describe, expect, it } from "vitest";
import {
  getProviderGuardrailMessage,
  parseProviderError,
} from "./providerErrors";

describe("providerErrors", () => {
  it("parses provider errors from structured objects", () => {
    const parsed = parseProviderError({
      code: "unsupported_capability",
      message: "Provider does not support capability `appsList`",
      retryable: false,
      capability: "appsList",
    });
    expect(parsed).toEqual({
      code: "unsupported_capability",
      message: "Provider does not support capability `appsList`",
      retryable: false,
      capability: "appsList",
    });
  });

  it("parses provider errors from nested rpc error payloads", () => {
    const parsed = parseProviderError({
      error: {
        code: "unsupported_capability",
        message: "Provider does not support capability `reviewStart`",
        retryable: false,
        capability: "reviewStart",
      },
    });
    expect(parsed?.code).toBe("unsupported_capability");
    expect(parsed?.capability).toBe("reviewStart");
  });

  it("parses provider errors from wrapped error strings", () => {
    const parsed = parseProviderError(
      new Error(
        'invoke failed: {"code":"auth_required","message":"Sign in first","retryable":false}',
      ),
    );
    expect(parsed?.code).toBe("auth_required");
    expect(parsed?.message).toBe("Sign in first");
  });

  it("builds guardrail message for unsupported capability", () => {
    const message = getProviderGuardrailMessage({
      code: "unsupported_capability",
      message: "Provider does not support capability `compactThread`",
      retryable: false,
      capability: "compactThread",
    });
    expect(message).toContain("Compacting threads is not available");
    expect(message).toContain("Switch this workspace to Codex");
  });

  it("builds guardrail message for auth-required errors", () => {
    const message = getProviderGuardrailMessage({
      code: "auth_required",
      message: "Login required",
      retryable: false,
    });
    expect(message).toBe("Provider authentication is required. Sign in and try again.");
  });
});
