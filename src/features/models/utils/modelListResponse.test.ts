import { describe, expect, it } from "vitest";
import { parseModelListResponse } from "./modelListResponse";

describe("parseModelListResponse", () => {
  it("uses displayName when present", () => {
    const response = {
      result: {
        data: [
          { id: "m1", model: "gpt-5.3-codex-spark", displayName: "GPT-5.3-Codex-Spark" },
        ],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.displayName).toBe("GPT-5.3-Codex-Spark");
  });

  it("uses the raw model slug when displayName is missing", () => {
    const response = {
      result: {
        data: [{ id: "m1", model: "gpt-5.3-codex" }],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.displayName).toBe("gpt-5.3-codex");
  });

  it("uses the raw model slug when displayName is an empty string", () => {
    const response = {
      result: {
        data: [{ id: "m1", model: "gpt-5.1-codex-mini", displayName: "" }],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.displayName).toBe("gpt-5.1-codex-mini");
  });

  it("preserves displayName when it equals the model slug", () => {
    const response = {
      result: {
        data: [{ id: "m1", model: "gpt-5.3-codex", displayName: "gpt-5.3-codex" }],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.displayName).toBe("gpt-5.3-codex");
  });

  it("preserves displayName when it differs from the slug", () => {
    const response = {
      result: {
        data: [
          { id: "m1", model: "gpt-5.3-codex-spark", displayName: "GPT-5.3-Codex-Spark" },
          { id: "m2", model: "gpt-5.2-codex", displayName: "gpt-5.2-codex" },
        ],
      },
    };
    const models = parseModelListResponse(response);
    expect(models[0].displayName).toBe("GPT-5.3-Codex-Spark");
    expect(models[1].displayName).toBe("gpt-5.2-codex");
  });

  it("parses method options from camelCase fields", () => {
    const response = {
      result: {
        data: [
          {
            id: "m1",
            model: "gpt-5.3",
            methodOptions: [
              {
                id: "balanced",
                label: "Balanced",
                description: "Default profile",
                isDefault: true,
              },
              {
                id: "fast",
                label: "Fast",
                description: "Lower latency",
                isDefault: false,
              },
            ],
          },
        ],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.methodOptions?.map((method) => method.id)).toEqual([
      "balanced",
      "fast",
    ]);
    expect(model.methodOptions?.[0].isDefault).toBe(true);
    expect(model.methodOptions?.[0].description).toBe("Default profile");
  });

  it("parses method options from snake_case and string entries", () => {
    const response = {
      result: {
        data: [
          {
            id: "m1",
            model: "gpt-5.3",
            method_options: ["fast", { name: "thorough", is_default: true }],
          },
        ],
      },
    };
    const [model] = parseModelListResponse(response);
    expect(model.methodOptions?.map((method) => method.id)).toEqual([
      "fast",
      "thorough",
    ]);
    expect(model.methodOptions?.[1].isDefault).toBe(true);
  });
});
