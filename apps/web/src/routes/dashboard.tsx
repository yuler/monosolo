import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DashboardMeProvider } from "@/components/dashboard/dashboard-me-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { fetchMe, type MeResponse } from "@/lib/api/session";
import { requireAuth } from "@/lib/auth/guards";
import { clearSessionToken } from "@/lib/auth/session";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: requireAuth,
	component: DashboardLayout,
});

function DashboardLayout() {
	const navigate = useNavigate();
	const [me, setMe] = useState<MeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchMe();
				if (!cancelled) setMe(data);
			} catch (err) {
				if (cancelled) return;
				if (err instanceof ApiError && err.status === 401) {
					clearSessionToken();
					navigate({ to: "/sign" });
					return;
				}
				setError(err instanceof ApiError ? err.message : "Failed to load.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [navigate]);

	return (
		<DashboardShell user={me?.identity ?? null} accounts={me?.accounts ?? []}>
			<DashboardMeProvider value={{ me, loading, error }}>
				<Outlet />
			</DashboardMeProvider>
		</DashboardShell>
	);
}
