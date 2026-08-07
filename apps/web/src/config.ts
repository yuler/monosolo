// Base URL of the Rails core API / auth server.
// Set VITE_CORE_URL in the root .env to override (e.g. for staging).
// Subdomain split (A): absolute URL, e.g. http://core.monosolo.localhost:3001
// Same-origin proxy (B): empty string so requests use relative /api/v1 paths.
export const CORE_URL =
	import.meta.env.VITE_CORE_URL ?? "http://core.monosolo.localhost:3001";
