import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AuthLayout } from "@/components/layout";
import { requireGuest } from "@/lib/auth/guards";

export const Route = createFileRoute("/sign")({
	beforeLoad: requireGuest,
	component: SignLayout,
});

function SignLayout() {
	return (
		<AuthLayout>
			<Outlet />
		</AuthLayout>
	);
}
