import type { MeResponse } from "@/lib/api/session";

export type AccountSummary = MeResponse["accounts"][number];

const ACCOUNT_SLUG_KEY = "monosolo.account_slug";

export function getSelectedAccountSlug(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(ACCOUNT_SLUG_KEY);
}

export function setSelectedAccountSlug(slug: string): void {
	localStorage.setItem(ACCOUNT_SLUG_KEY, slug);
}

export function resolveSelectedAccount(
	accounts: AccountSummary[],
): AccountSummary | null {
	if (accounts.length === 0) return null;

	const saved = getSelectedAccountSlug();
	if (saved) {
		const match = accounts.find((account) => account.slug === saved);
		if (match) return match;
	}

	return accounts.find((account) => account.personal) ?? accounts[0] ?? null;
}
