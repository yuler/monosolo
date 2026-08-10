import { isRedirect, redirect } from "@tanstack/react-router";

import { fetchMe } from "@/lib/api/session";
import { resolveSelectedAccount } from "@/lib/auth/account";

export async function requireGuest() {
	try {
		const me = await fetchMe();
		const account = resolveSelectedAccount(me.accounts);
		if (account) {
			throw redirect({
				to: "/$account_slug",
				params: { account_slug: account.slug },
			});
		}
	} catch (err) {
		if (isRedirect(err)) throw err;
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
	throw redirect({
		to: "/$account_slug",
		params: { account_slug: account.slug },
	});
}
