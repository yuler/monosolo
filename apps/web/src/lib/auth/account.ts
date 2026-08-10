import type { MeResponse } from "@/lib/api/session";
import { safeReturnTo } from "@/lib/auth/return-to";

export type AccountSummary = MeResponse["accounts"][number];

const LAST_ACCOUNT_COOKIE = "last_account_slug";
const LAST_ACCOUNT_MAX_AGE = 60 * 60 * 24 * 365;

/** Picker hint only — never use as silent tenant context on global routes. */
export function getLastAccountSlug(): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${LAST_ACCOUNT_COOKIE}=([^;]*)`),
	);
	if (!match?.[1]) return null;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return null;
	}
}

export function setLastAccountSlug(slug: string) {
	if (typeof document === "undefined") return;
	// Matches Core `cookies.permanent[:last_account_slug]` as a picker hint only.
	// biome-ignore lint/suspicious/noDocumentCookie: intentional last-account hint cookie
	document.cookie = `${LAST_ACCOUNT_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${LAST_ACCOUNT_MAX_AGE}; SameSite=Lax`;
}

export type PostAuthTarget =
	| { kind: "href"; href: string }
	| { kind: "account"; slug: string }
	| { kind: "picker" }
	| { kind: "sign" };

/**
 * After login: honor safe return_to; one membership → that account; many → picker.
 * Matches Core `after_authentication_url` + ACCOUNT.md picker rules.
 */
export function resolvePostAuthTarget(
	accounts: AccountSummary[],
	returnTo?: string | null,
): PostAuthTarget {
	const safe = safeReturnTo(returnTo);
	if (safe) return { kind: "href", href: safe };
	if (accounts.length === 0) return { kind: "sign" };
	if (accounts.length === 1) {
		return { kind: "account", slug: accounts[0].slug };
	}
	return { kind: "picker" };
}

/** Dashboard CTA: one account → home; many → picker (never invent a tenant). */
export function resolveDashboardTarget(
	accounts: AccountSummary[],
): PostAuthTarget {
	if (accounts.length === 0) return { kind: "sign" };
	if (accounts.length === 1) {
		return { kind: "account", slug: accounts[0].slug };
	}
	return { kind: "picker" };
}
