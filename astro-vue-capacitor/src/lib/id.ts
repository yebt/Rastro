/** Unique id generation (impure — not part of the tested pure lib). */

export function genId(prefix = ""): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  return `${prefix}${rand}`;
}
