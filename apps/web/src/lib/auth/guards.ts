import { redirect } from "@tanstack/react-router";

import { fetchMe } from "@/lib/api/session";
import {
	getSelectedAccountSlug,
	resolveSelectedAccount,
	setSelectedAccountSlug,
} from "@/lib/auth/account";
import { isSignedIn } from "@/lib/auth/session";
import { isAccountSlug } from "@/lib/auth/slugs";

export async function requireGuest() {
	if (!isSignedIn()) return;

	const saved = getSelectedAccountSlug();
	if (saved && isAccountSlug(saved)) {
		throw redirect({ to: "/$account_slug", params: { account_slug: saved } });
	}

	try {
		const me = await fetchMe();
		const account = resolveSelectedAccount(me.accounts);
		if (account) {
			setSelectedAccountSlug(account.slug);
			throw redirect({
				to: "/$account_slug",
				params: { account_slug: account.slug },
			});
		}
	} catch (err) {
		if (err && typeof err === "object" && "to" in err) throw err;
	}
}

export function requireAuth() {
	if (!isSignedIn()) {
		throw redirect({ to: "/sign" });
	}
}

export function requireStaff(
	me: { identity: { staff: boolean } },
	accountSlug: string,
) {
	if (!me.identity.staff) {
		throw redirect({
			to: "/$account_slug",
			params: { account_slug: accountSlug },
		});
	}
}

export async function redirectToAccountHome() {
	const me = await fetchMe();
	const account = resolveSelectedAccount(me.accounts);
	if (!account) {
		throw redirect({ to: "/sign" });
	}
	setSelectedAccountSlug(account.slug);
	throw redirect({
		to: "/$account_slug",
		params: { account_slug: account.slug },
	});
}
