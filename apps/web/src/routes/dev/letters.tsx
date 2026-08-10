import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { coreAppUrl } from "@/config";
import { useAdminResource } from "@/hooks/use-admin-resource";
import { fetchDevLetters } from "@/lib/api/dev";

const devRoute = getRouteApi("/dev");

export const Route = createFileRoute("/dev/letters")({
	component: LettersPage,
});

function LettersPage() {
	const { account } = devRoute.useRouteContext();
	const { data, error, loading } = useAdminResource(
		fetchDevLetters,
		"Failed to load letters.",
	);

	return (
		<>
			<DashboardHeader
				breadcrumbs={[
					{
						label: "Home",
						to: "/$account_slug",
						params: { account_slug: account.slug },
					},
					{ label: "Dev" },
					{ label: "Letters", isCurrentPage: true },
				]}
			/>

			<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="font-heading text-2xl font-semibold tracking-tight">
							Letters
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Recent emails captured by letter opener in development.
						</p>
					</div>
					<Button
						variant="outline"
						render={
							// biome-ignore lint/a11y/useAnchorContent: children merge via useRender
							<a
								href={coreAppUrl("/letter_opener")}
								target="_blank"
								rel="noreferrer"
							/>
						}
					>
						Open letter opener
						<ExternalLink data-icon="inline-end" />
					</Button>
				</div>

				{loading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : null}

				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}

				{data && data.letters.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No letters yet. Sign in or trigger an email to see them here.
					</p>
				) : null}

				{data && data.letters.length > 0 ? (
					<ul className="flex flex-col gap-3">
						{data.letters.map((letter) => (
							<li key={letter.id}>
								<Card size="sm">
									<CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
										<div className="min-w-0 space-y-1">
											<CardTitle className="truncate text-base">
												{letter.subject ?? "(no subject)"}
											</CardTitle>
											<CardDescription className="truncate">
												{letter.to
													? `To ${letter.to}`
													: letter.from
														? `From ${letter.from}`
														: letter.id}
											</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="sm"
											render={
												// biome-ignore lint/a11y/useAnchorContent: children merge via useRender
												<a
													href={coreAppUrl(`/letter_opener/${letter.id}`)}
													target="_blank"
													rel="noreferrer"
													aria-label={`Open letter ${letter.subject ?? letter.id}`}
												/>
											}
										>
											Open
											<ExternalLink data-icon="inline-end" />
										</Button>
									</CardHeader>
									{(letter.from || letter.sent_at) && (
										<CardContent className="text-xs text-muted-foreground">
											{letter.from ? <span>From {letter.from}</span> : null}
											{letter.from && letter.sent_at ? (
												<span aria-hidden> · </span>
											) : null}
											{letter.sent_at
												? new Date(letter.sent_at).toLocaleString()
												: null}
										</CardContent>
									)}
								</Card>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</>
	);
}
