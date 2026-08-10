import { createFileRoute } from "@tanstack/react-router";

import { VerifyForm } from "@/components/auth/verify-form";
import { AuthCard } from "@/components/layout";

export const Route = createFileRoute("/sign/verify")({
	component: VerifyPage,
});

function VerifyPage() {
	const { return_to: returnTo } = Route.useSearch();

	return (
		<AuthCard description="Enter the code we sent to your email.">
			<VerifyForm idPrefix="page-verify" returnTo={returnTo} />
		</AuthCard>
	);
}
