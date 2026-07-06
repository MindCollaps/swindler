/**
 * Players paste anything into the "Lobby Code" field: the bare code, a full
 * lobby link, a link with a trailing slash or query string. Accept all of
 * them and return the bare code, or null when nothing usable is there.
 */
export function normalizeLobbyCode(raw: string | null | undefined): string | null {
    if (!raw) return null;

    let value = raw.trim();
    if (!value) return null;

    const linkMatch = value.match(/\/lobby\/([^/?#\s]+)/i);
    if (linkMatch?.[1]) value = linkMatch[1];

    value = value.trim();
    if (!value || /[/?#\s]/.test(value)) return null;

    return value;
}
