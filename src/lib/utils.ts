export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

export function toEpochMilliseconds(
  input?: string | number | null,
): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return input < 10_000_000_000 ? input * 1000 : input;
  }

  const trimmed = String(input).trim();
  if (trimmed.length === 0) return null;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function formatDate(input?: string | number | null) {
  const epoch = toEpochMilliseconds(input);
  if (epoch === null) return "—";
  try {
    const date = new Date(epoch);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return "—";
  }
}
