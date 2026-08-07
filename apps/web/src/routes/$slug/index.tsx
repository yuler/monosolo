import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/$slug/")({
	component: AccountHomePage,
});

function AccountHomePage() {
	const { me, loading, error, slug } = useDashboardMe();
	const account = me?.accounts.find((item) => item.slug === slug);

	return (
		<>
			<DashboardHeader breadcrumbs={[{ label: "Home", isCurrentPage: true }]} />

			<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						{account?.name ?? "Account"}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						/{slug} · identity and membership for this account.
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

				{me ? (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Identity</CardTitle>
								<CardDescription>Signed in as</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="font-medium">{me.identity.email}</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Accounts</CardTitle>
								<CardDescription>
									Tenants you can access with this identity.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								{me.accounts.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No accounts yet.
									</p>
								) : (
									me.accounts.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="min-w-0">
												<p className="truncate font-medium">{item.name}</p>
												<p className="truncate text-xs text-muted-foreground">
													/{item.slug}
												</p>
											</div>
											{item.personal ? (
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
