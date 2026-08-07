// Base URL of the Rails core API / auth server.
// Set VITE_CORE_URL in the root .env to override (e.g. for staging).
// Falls back to the standard local subdomain so the app works out-of-the-box.
export const CORE_URL =
	import.meta.env.VITE_CORE_URL ?? "http://core.monosolo.localhost:3001";
