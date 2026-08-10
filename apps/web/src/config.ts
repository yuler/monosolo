// Base URL of the Rails core API / auth server.
// Set VITE_CORE_URL in the root .env (e.g. http://core…:${CORE_PORT} or "" for Mode B).
export const CORE_URL =
	import.meta.env.VITE_CORE_URL ?? "http://core.monosolo.localhost:3001";

/** Core HTML page URL — Mode A absolute origin, Mode B same-origin path. */
export function coreAppUrl(path: string): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return CORE_URL ? `${CORE_URL}${normalized}` : normalized;
}
