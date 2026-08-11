import { useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { fetchMe, verifyMagicLink } from "@/lib/api/session";
import { resolvePostAuthTarget } from "@/lib/auth/account";
import { navigateForTarget } from "@/lib/auth/guards";

export function VerifyForm({
	idPrefix = "verify",
	returnTo,
	onBack,
	onVerified,
}: {
	idPrefix?: string;
	returnTo?: string;
	/** Go back to the email step (wrong address, etc.). */
	onBack?: () => void;
	/** Called after verify, session fetch, and post-auth navigation succeed. */
	onVerified?: () => void;
}) {
	const navigate = useNavigate();
	const router = useRouter();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	// In dev, autofill the code that the server returned
	useEffect(() => {
		if (import.meta.env.DEV) {
			const devCode = sessionStorage.getItem("monosolo.dev_magic_link_code");
			if (devCode) setCode(devCode);
		}
	}, []);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		try {
			await verifyMagicLink(code.trim());
			if (import.meta.env.DEV) {
				sessionStorage.removeItem("monosolo.dev_magic_link_code");
			}

			const me = await fetchMe({ force: true });
			await router.invalidate();
			await navigateForTarget(
				navigate,
				resolvePostAuthTarget(me.accounts, returnTo),
			);

			onVerified?.();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Something went wrong.");
		} finally {
			setPending(false);
		}
	}

	const codeId = `${idPrefix}-code`;

	return (
		<form className="flex flex-col gap-4" onSubmit={onSubmit}>
			<div className="flex flex-col gap-2">
				<Label htmlFor={codeId}>One-time code</Label>
				<Input
					id={codeId}
					name="code"
					type="text"
					inputMode="numeric"
					autoComplete="one-time-code"
					required
					maxLength={6}
					placeholder="123456"
					value={code}
					onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
					className="text-center font-mono text-lg tracking-widest"
					autoFocus
				/>
				<p className="text-xs text-muted-foreground">
					Check your email for a 6-digit code.
				</p>
			</div>
			{error ? (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			) : null}
			<Button
				type="submit"
				disabled={pending || code.length < 6}
				className="w-full"
			>
				{pending ? "Verifying…" : "Verify"}
			</Button>
			{onBack ? (
				<Button
					type="button"
					variant="ghost"
					className="w-full"
					disabled={pending}
					onClick={onBack}
				>
					Use a different email
				</Button>
			) : null}
		</form>
	);
}
