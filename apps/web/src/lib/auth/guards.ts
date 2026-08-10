import {
	isRedirect,
	type NavigateOptions,
	redirect,
} from "@tanstack/react-router";

import { fetchMe } from "@/lib/api/session";
import {
	type AccountSummary,
	type PostAuthTarget,
	resolvePostAuthTarget,
} from "@/lib/auth/account";
import { safeReturnTo } from "@/lib/auth/return-to";

export function redirectForTarget(target: PostAuthTarget): never {
	switch (target.kind) {
		case "href":
			throw redirect({ href: target.href });
		case "account":
			throw redirect({
				to: "/$account_slug",
				params: { account_slug: target.slug },
			});
		case "picker":
			throw redirect({ to: "/accounts" });
		case "sign":
			throw redirect({ to: "/sign" });
	}
}

export function redirectToSign(returnTo?: string | null): never {
	const safe = safeReturnTo(returnTo);
	throw redirect({
		to: "/sign",
		search: safe ? { return_to: safe } : {},
	});
}

export async function requireGuest({
	search,
}: {
	search: { return_to?: string };
}) {
	try {
		const me = await fetchMe();
		redirectForTarget(resolvePostAuthTarget(me.accounts, search.return_to));
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

type NavigateFn = (opts: NavigateOptions) => Promise<void> | void;

export function navigateForTarget(
	navigate: NavigateFn,
	target: PostAuthTarget,
) {
	switch (target.kind) {
		case "href":
			return navigate({ href: target.href });
		case "account":
			return navigate({
				to: "/$account_slug",
				params: { account_slug: target.slug },
			});
		case "picker":
			return navigate({ to: "/accounts" });
		case "sign":
			return navigate({ to: "/sign" });
	}
}

export type { AccountSummary };
