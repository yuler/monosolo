import {
	createFileRoute,
	notFound,
	Outlet,
	redirect,
} from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/session";
import { setSelectedAccountSlug } from "@/lib/auth/account";
import { requireAuth } from "@/lib/auth/guards";
import { clearSessionToken } from "@/lib/auth/session";
import { isAccountSlug } from "@/lib/auth/slugs";

export const Route = createFileRoute("/$account_slug")({
	beforeLoad: async ({ params }) => {
		requireAuth();
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
			setSelectedAccountSlug(params.account_slug);
			return { me, account };
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				clearSessionToken();
				throw redirect({ to: "/sign" });
			}
			throw err;
		}
	},
	component: AccountLayout,
});

function AccountLayout() {
	const { account_slug } = Route.useParams();
	const { me } = Route.useRouteContext();

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
