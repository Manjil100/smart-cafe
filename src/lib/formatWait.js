// Turns a number of minutes into friendly text, e.g. 8 -> "about 8 min".
// Rounds up (2.2 -> 3) and never shows less than 1, so a nearly-ready
// order says "about 1 min" rather than "about 0 min".
export function formatWait(minutes) {
  const rounded = Math.max(1, Math.ceil(minutes))
  return `about ${rounded} min`
}
