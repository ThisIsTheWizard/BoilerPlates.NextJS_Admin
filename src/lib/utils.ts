export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(input?: string | null) {
  if (!input) return "—";
  try {
    const date = new Date(Number(input));
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}
