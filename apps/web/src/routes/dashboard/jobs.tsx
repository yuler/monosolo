import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useDashboardMe } from "@/components/dashboard/dashboard-me-context";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type AdminJobsResponse, fetchAdminJobs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { clearSessionToken } from "@/lib/auth/session";

export const Route = createFileRoute("/dashboard/jobs")({
	component: JobsPage,
});

function JobsPage() {
	const navigate = useNavigate();
	const { me, loading: meLoading } = useDashboardMe();
	const [data, setData] = useState<AdminJobsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (meLoading) return;
		if (!me) return;
		if (!me.identity.staff) {
			void navigate({ to: "/dashboard" });
		}
	}, [me, meLoading, navigate]);

	useEffect(() => {
		if (meLoading || !me?.identity.staff) return;

		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const response = await fetchAdminJobs();
				if (!cancelled) setData(response);
			} catch (err) {
				if (cancelled) return;
				if (err instanceof ApiError && err.status === 401) {
					clearSessionToken();
					navigate({ to: "/sign" });
					return;
				}
				if (err instanceof ApiError && err.status === 403) {
					navigate({ to: "/dashboard" });
					return;
				}
				setError(
					err instanceof ApiError ? err.message : "Failed to load jobs.",
				);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [me, meLoading, navigate]);

	return (
		<>
			<DashboardHeader
				breadcrumbs={[
					{ label: "Dashboard", href: "/dashboard" },
					{ label: "Jobs", isCurrentPage: true },
				]}
			/>

			<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Jobs
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Background job queue status from core.
					</p>
				</div>

				{loading || meLoading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : null}

				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}

				{data ? (
					<>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<Card size="sm">
								<CardHeader>
									<CardDescription>Adapter</CardDescription>
									<CardTitle className="font-mono text-lg">
										{data.adapter}
									</CardTitle>
								</CardHeader>
							</Card>
							{data.counts ? (
								<>
									<StatCard label="Pending" value={data.counts.pending} />
									<StatCard label="Ready" value={data.counts.ready} />
									<StatCard label="Scheduled" value={data.counts.scheduled} />
									<StatCard label="Failed" value={data.counts.failed} />
									<StatCard label="Finished" value={data.counts.finished} />
									<StatCard label="Total" value={data.counts.total} />
								</>
							) : (
								<Card size="sm" className="sm:col-span-2">
									<CardHeader>
										<CardTitle>Solid Queue unavailable</CardTitle>
										<CardDescription>
											Queue tables are not configured in this environment.
											Adapter is still reported above.
										</CardDescription>
									</CardHeader>
								</Card>
							)}
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Recent jobs</CardTitle>
								<CardDescription>
									Latest 20 jobs from the queue.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{data.recent.length === 0 ? (
									<p className="text-sm text-muted-foreground">No jobs yet.</p>
								) : (
									<div className="overflow-x-auto">
										<table className="w-full text-left text-sm">
											<thead className="border-b text-muted-foreground">
												<tr>
													<th className="px-2 py-2 font-medium">Class</th>
													<th className="px-2 py-2 font-medium">Queue</th>
													<th className="px-2 py-2 font-medium">Status</th>
													<th className="px-2 py-2 font-medium">Created</th>
												</tr>
											</thead>
											<tbody>
												{data.recent.map((job) => (
													<tr
														key={String(job.id)}
														className="border-b last:border-0"
													>
														<td className="px-2 py-2 font-mono text-xs">
															{job.class_name}
														</td>
														<td className="px-2 py-2">{job.queue_name}</td>
														<td className="px-2 py-2">
															{job.failed
																? "Failed"
																: job.finished_at
																	? "Finished"
																	: "Pending"}
														</td>
														<td className="px-2 py-2 text-muted-foreground">
															{new Date(job.created_at).toLocaleString()}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
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
