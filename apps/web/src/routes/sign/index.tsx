import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { AuthCard } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { startSession } from "@/lib/api/session";
import { setPendingAuthenticationToken } from "@/lib/auth/session";

export const Route = createFileRoute("/sign/")({
	component: SignPage,
});

function SignPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		try {
			const result = await startSession(email.trim());
			setPendingAuthenticationToken(result.pending_authentication_token);
			if (import.meta.env.DEV && result.code) {
				sessionStorage.setItem("monosolo.dev_magic_link_code", result.code);
			}
			await navigate({ to: "/sign/verify" });
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Something went wrong.");
		} finally {
			setPending(false);
		}
	}

	return (
		<AuthCard description="Enter your email to sign in or create an account.">
			<form className="flex flex-col gap-4" onSubmit={onSubmit}>
				<div className="flex flex-col gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="username"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="you@example.com"
					/>
				</div>
				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Sending…" : "Continue"}
				</Button>
			</form>
		</AuthCard>
	);
}
