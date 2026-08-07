import { createFileRoute, redirect } from "@tanstack/react-router";

import { VerifyForm } from "@/components/auth/verify-form";
import { AuthCard } from "@/components/layout";
import { getPendingAuthenticationToken } from "@/lib/auth/session";

export const Route = createFileRoute("/sign/verify")({
	beforeLoad: () => {
		// No pending token means the user landed here directly — send them back
		if (!getPendingAuthenticationToken()) {
			throw redirect({ to: "/sign" });
		}
	},
	component: VerifyPage,
});

function VerifyPage() {
	return (
		<AuthCard description="Enter the code we sent to your email.">
			<VerifyForm idPrefix="page-verify" />
		</AuthCard>
	);
}
