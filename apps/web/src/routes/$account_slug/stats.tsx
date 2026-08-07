import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useDashboardMe } from "@/components/dashboard/dashboard-me-context";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type AdminStatsResponse, fetchAdminStats } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { clearSessionToken } from "@/lib/auth/session";

export const Route = createFileRoute("/$account_slug/stats")({
	component: StatsPage,
});

function StatsPage() {
	const navigate = useNavigate();
	const { me, slug } = useDashboardMe();
	const [data, setData] = useState<AdminStatsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!me) return;
		if (!me.identity.staff) {
			void navigate({ to: "/$account_slug", params: { account_slug: slug } });
		}
	}, [me, navigate, slug]);

	useEffect(() => {
		if (!me?.identity.staff) return;

		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const response = await fetchAdminStats();
				if (!cancelled) setData(response);
			} catch (err) {
				if (cancelled) return;
				if (err instanceof ApiError && err.status === 401) {
					clearSessionToken();
					navigate({ to: "/sign" });
					return;
				}
				if (err instanceof ApiError && err.status === 403) {
					navigate({ to: "/$account_slug", params: { account_slug: slug } });
					return;
				}
				setError(
					err instanceof ApiError ? err.message : "Failed to load stats.",
				);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [me, navigate, slug]);

	return (
		<>
			<DashboardHeader
				breadcrumbs={[
					{
						label: "Home",
						to: "/$account_slug",
						params: { account_slug: slug },
					},
					{ label: "Stats", isCurrentPage: true },
				]}
			/>

			<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Stats
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Account and identity growth from core.
					</p>
				</div>

				{loading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : null}

				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}

				{data ? (
					<>
						<section className="grid gap-4 sm:grid-cols-3">
							<StatCard label="Accounts total" value={data.accounts.total} />
							<StatCard
								label="Accounts · 7 days"
								value={data.accounts.last_7_days}
							/>
							<StatCard
								label="Accounts · 24 hours"
								value={data.accounts.last_24_hours}
							/>
						</section>

						<section className="grid gap-4 sm:grid-cols-3">
							<StatCard
								label="Identities total"
								value={data.identities.total}
							/>
							<StatCard
								label="Identities · 7 days"
								value={data.identities.last_7_days}
							/>
							<StatCard
								label="Identities · 24 hours"
								value={data.identities.last_24_hours}
							/>
						</section>

						<Card>
							<CardHeader>
								<CardTitle>Recent accounts</CardTitle>
								<CardDescription>Newest 10 accounts.</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								{data.recent_accounts.length === 0 ? (
									<p className="text-sm text-muted-foreground">No accounts.</p>
								) : (
									data.recent_accounts.map((account) => (
										<div
											key={account.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="min-w-0">
												<p className="truncate font-medium">{account.name}</p>
												<p className="truncate text-xs text-muted-foreground">
													/{account.slug} ·{" "}
													{new Date(account.created_at).toLocaleString()}
												</p>
											</div>
											{account.personal ? (
												<Badge variant="secondary">Personal</Badge>
											) : (
												<Badge variant="outline">Team</Badge>
											)}
										</div>
									))
								)}
							</CardContent>
						</Card>
					</>
				) : null}
			</div>
		</>
	);
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
			</CardHeader>
		</Card>
	);
}
