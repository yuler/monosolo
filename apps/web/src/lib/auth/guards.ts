import { redirect } from "@tanstack/react-router";

import { isSignedIn } from "@/lib/auth/session";

export function requireGuest() {
	if (isSignedIn()) {
		throw redirect({ to: "/dashboard" });
	}
}

export function requireAuth() {
	if (!isSignedIn()) {
		throw redirect({ to: "/sign" });
	}
}
