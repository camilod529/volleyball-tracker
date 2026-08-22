/** matches.matchDate is a full ISO timestamp; this renders it in the current app language. */
export function formatMatchDateTime(isoString: string, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(isoString)
    );
  } catch {
    return isoString;
  }
}
