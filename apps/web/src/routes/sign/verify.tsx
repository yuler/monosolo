import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { AuthCard } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { verifyMagicLink } from "@/lib/api/session";
import {
	clearPendingAuthenticationToken,
	getPendingAuthenticationToken,
	setSessionToken,
} from "@/lib/auth/session";

export const Route = createFileRoute("/sign/verify")({
	beforeLoad: () => {
		if (!getPendingAuthenticationToken()) {
			throw redirect({ to: "/sign" });
		}
	},
	component: SignVerifyPage,
});

function SignVerifyPage() {
	const navigate = useNavigate();
	const [code, setCode] = useState(() => {
		if (import.meta.env.DEV) {
			return sessionStorage.getItem("monosolo.dev_magic_link_code") ?? "";
		}
		return "";
	});
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		const pendingToken = getPendingAuthenticationToken();
		if (!pendingToken) {
			await navigate({ to: "/sign" });
			return;
		}

		try {
			const result = await verifyMagicLink(code.trim(), pendingToken);
			setSessionToken(result.session_token);
			clearPendingAuthenticationToken();
			sessionStorage.removeItem("monosolo.dev_magic_link_code");
			await navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Something went wrong.");
		} finally {
			setPending(false);
		}
	}

	return (
		<AuthCard description="Enter the code from your email to finish signing in.">
			<form className="flex flex-col gap-4" onSubmit={onSubmit}>
				<div className="flex flex-col gap-2">
					<Label htmlFor="code">Verification code</Label>
					<Input
						id="code"
						name="code"
						inputMode="text"
						autoComplete="one-time-code"
						required
						value={code}
						onChange={(event) => setCode(event.target.value)}
						placeholder="ABCDEF"
						className="font-mono tracking-widest uppercase"
					/>
				</div>
				{error ? (
					<p className="text-sm text-destructive" role="alert">
						{error}
					</p>
				) : null}
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Verifying…" : "Verify and continue"}
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					Wrong email?{" "}
					<Link to="/sign" className="underline underline-offset-4">
						Start over
					</Link>
				</p>
			</form>
		</AuthCard>
	);
}
