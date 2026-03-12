import { describe, expect, it } from "vitest";
import { extractThreadCodexMetadata } from "./threadCodexMetadata";

describe("extractThreadCodexMetadata", () => {
  it("reads model and effort from thread-level fields", () => {
    const metadata = extractThreadCodexMetadata({
      model: "gpt-5-codex",
      reasoning_effort: "high",
    });

    expect(metadata).toEqual({
      modelId: "gpt-5-codex",
      methodId: null,
      effort: "high",
    });
  });

  it("prefers latest turn metadata over thread-level values", () => {
    const metadata = extractThreadCodexMetadata({
      model: "gpt-4.1",
      turns: [
        {
          items: [{ type: "turnContext", payload: { model: "gpt-5-codex" } }],
        },
      ],
    });

    expect(metadata.modelId).toBe("gpt-5-codex");
  });

  it("reads payload.info fields from turn items", () => {
    const metadata = extractThreadCodexMetadata({
      turns: [
        {
          items: [
            {
              type: "tokenCount",
              payload: {
                info: {
                  model_name: "gpt-5.3-codex",
                  method_id: "balanced",
                  reasoning_effort: "Medium",
                },
              },
            },
          ],
        },
      ],
    });

    expect(metadata).toEqual({
      modelId: "gpt-5.3-codex",
      methodId: "balanced",
      effort: "medium",
    });
  });

  it("normalizes missing/default effort to null", () => {
    const metadata = extractThreadCodexMetadata({
      modelId: "gpt-5",
      effort: "default",
    });

    expect(metadata).toEqual({
      modelId: "gpt-5",
      methodId: null,
      effort: null,
    });
  });

  it("extracts method metadata from thread-level fields", () => {
    const metadata = extractThreadCodexMetadata({
      model: "gpt-5-codex",
      method: "fast",
      reasoning_effort: "low",
    });

    expect(metadata).toEqual({
      modelId: "gpt-5-codex",
      methodId: "fast",
      effort: "low",
    });
  });
});
