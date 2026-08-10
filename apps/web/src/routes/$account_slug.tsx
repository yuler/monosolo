import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/session";
import { setLastAccountSlug } from "@/lib/auth/account";
import { redirectToSign } from "@/lib/auth/guards";
import { isAccountSlug } from "@/lib/auth/slugs";

export const Route = createFileRoute("/$account_slug")({
	beforeLoad: async ({ params, location }) => {
		if (!isAccountSlug(params.account_slug)) {
			throw notFound();
		}

		try {
			const me = await fetchMe();
			const account = me.accounts.find(
				(item) => item.slug === params.account_slug,
			);
			if (!account) {
				throw notFound();
			}
			return { me, account };
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				redirectToSign(`${location.pathname}${location.search}`);
			}
			throw err;
		}
	},
	component: AccountLayout,
});

function AccountLayout() {
	const { account_slug } = Route.useParams();
	const { me, account } = Route.useRouteContext();

	useEffect(() => {
		setLastAccountSlug(account.slug);
	}, [account.slug]);

	return (
		<DashboardShell
			user={me.identity}
			accounts={me.accounts}
			slug={account_slug}
		>
			<Outlet />
		</DashboardShell>
	);
}
