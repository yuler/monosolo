import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/session";
import { resolveShellAccount } from "@/lib/auth/account";
import { redirectToSign, requireStaff } from "@/lib/auth/guards";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ location }) => {
		try {
			const me = await fetchMe();
			requireStaff(me);
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
	component: AdminLayout,
});

function AdminLayout() {
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
