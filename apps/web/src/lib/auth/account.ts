import type { MeResponse } from "@/lib/api/session";

export type AccountSummary = MeResponse["accounts"][number];

/** Prefer personal account, else the first membership. URL is the live selection. */
export function resolveSelectedAccount(
	accounts: AccountSummary[],
): AccountSummary | null {
	if (accounts.length === 0) return null;
	return accounts.find((account) => account.personal) ?? accounts[0] ?? null;
}
