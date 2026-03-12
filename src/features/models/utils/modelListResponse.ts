import type { ModelOption } from "../../../types";

export function normalizeEffortValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractModelItems(response: unknown): unknown[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const record = response as Record<string, unknown>;
  const result =
    record.result && typeof record.result === "object"
      ? (record.result as Record<string, unknown>)
      : null;

  const resultData = result?.data;
  if (Array.isArray(resultData)) {
    return resultData;
  }

  const topLevelData = record.data;
  if (Array.isArray(topLevelData)) {
    return topLevelData;
  }

  return [];
}

function parseReasoningEfforts(item: Record<string, unknown>): ModelOption["supportedReasoningEfforts"] {
  const camel = item.supportedReasoningEfforts;
  if (Array.isArray(camel)) {
    return camel
      .map((effort) => {
        if (!effort || typeof effort !== "object") {
          return null;
        }
        const entry = effort as Record<string, unknown>;
        return {
          reasoningEffort: String(entry.reasoningEffort ?? entry.reasoning_effort ?? ""),
          description: String(entry.description ?? ""),
        };
      })
      .filter((effort): effort is { reasoningEffort: string; description: string } =>
        effort !== null,
      );
  }

  const snake = item.supported_reasoning_efforts;
  if (Array.isArray(snake)) {
    return snake
      .map((effort) => {
        if (!effort || typeof effort !== "object") {
          return null;
        }
        const entry = effort as Record<string, unknown>;
        return {
          reasoningEffort: String(entry.reasoningEffort ?? entry.reasoning_effort ?? ""),
          description: String(entry.description ?? ""),
        };
      })
      .filter((effort): effort is { reasoningEffort: string; description: string } =>
        effort !== null,
      );
  }

  return [];
}

function parseMethodOptions(
  item: Record<string, unknown>,
): NonNullable<ModelOption["methodOptions"]> {
  const sources = [
    item.methodOptions,
    item.method_options,
    item.methods,
    item.alternativeMethods,
    item.alternative_methods,
    item.providerMethods,
    item.provider_methods,
  ];
  const raw = sources.find((value) => Array.isArray(value));
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (!trimmed) {
          return null;
        }
        return {
          id: trimmed,
          label: trimmed,
          description: null,
          isDefault: false,
          value: { id: trimmed },
        };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const id = String(record.id ?? record.method ?? record.name ?? "").trim();
      if (!id) {
        return null;
      }
      const labelRaw = String(record.label ?? record.displayName ?? record.display_name ?? id).trim();
      return {
        id,
        label: labelRaw || id,
        description:
          typeof record.description === "string" && record.description.trim().length > 0
            ? record.description.trim()
            : null,
        isDefault: Boolean(record.isDefault ?? record.is_default ?? false),
        value: record,
      };
    })
    .filter(
      (
        option,
      ): option is {
        id: string;
        label: string;
        description: string | null;
        isDefault: boolean;
        value: Record<string, unknown>;
      } => option !== null,
    );
}

export function parseModelListResponse(response: unknown): ModelOption[] {
  const items = extractModelItems(response);

  return items
    .map((item): ModelOption | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const modelSlug = String(record.model ?? record.id ?? "");
      const rawDisplayName = String(record.displayName || record.display_name || "");
      const displayName = rawDisplayName.trim().length > 0 ? rawDisplayName : modelSlug;
      return {
        id: String(record.id ?? record.model ?? ""),
        model: modelSlug,
        displayName,
        description: String(record.description ?? ""),
        supportedReasoningEfforts: parseReasoningEfforts(record),
        defaultReasoningEffort: normalizeEffortValue(
          record.defaultReasoningEffort ?? record.default_reasoning_effort,
        ),
        isDefault: Boolean(record.isDefault ?? record.is_default ?? false),
        methodOptions: parseMethodOptions(record),
      };
    })
    .filter((model): model is ModelOption => model !== null);
}
