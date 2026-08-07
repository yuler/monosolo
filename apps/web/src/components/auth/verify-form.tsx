import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";

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
import { resolveSelectedAccount } from "@/lib/auth/account";
import { fetchMe } from "@/lib/api/session";
import { setSelectedAccountSlug } from "@/lib/auth/account";

export function VerifyForm({ idPrefix = "verify" }: { idPrefix?: string }) {
	const navigate = useNavigate();
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

		const pendingToken = getPendingAuthenticationToken();
		if (!pendingToken) {
			setError("Session expired. Please request a new code.");
			setPending(false);
			return;
		}

		try {
			const result = await verifyMagicLink(code.trim(), pendingToken);
			setSessionToken(result.session_token);
			clearPendingAuthenticationToken();
			if (import.meta.env.DEV) {
				sessionStorage.removeItem("monosolo.dev_magic_link_code");
			}

			// Redirect to account home
			const me = await fetchMe();
			const account = resolveSelectedAccount(me.accounts);
			if (account) {
				setSelectedAccountSlug(account.slug);
				await navigate({
					to: "/$account_slug",
					params: { account_slug: account.slug },
				});
			} else {
				await navigate({ to: "/sign" });
			}
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
			<Button type="submit" disabled={pending || code.length < 6} className="w-full">
				{pending ? "Verifying…" : "Verify"}
			</Button>
		</form>
	);
}
