import {
	createFileRoute,
	notFound,
	Outlet,
	redirect,
} from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/session";
import { resolveShellAccount } from "@/lib/auth/account";
import { redirectToSign } from "@/lib/auth/guards";

export const Route = createFileRoute("/dev")({
	beforeLoad: async ({ location }) => {
		if (!import.meta.env.DEV) {
			throw notFound();
		}

		try {
			const me = await fetchMe();
			const account = resolveShellAccount(me);
			if (!account) {
				throw redirect({ to: "/sign" });
			}
			return { me, account };
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				redirectToSign(`${location.pathname}${location.searchStr}`);
			}
			throw err;
		}
	},
	component: DevLayout,
});

function DevLayout() {
	const { me, account } = Route.useRouteContext();

	return (
		<DashboardShell
			user={me.identity}
			accounts={me.accounts}
			slug={account.slug}
		>
			<Outlet />
		</DashboardShell>
	);
}
