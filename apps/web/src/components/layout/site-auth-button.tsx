import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchMe } from "@/lib/api/session";
import { resolveDashboardTarget } from "@/lib/auth/account";
import { navigateForTarget } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

export function SiteAuthButton({
	signInLabel = "Sign in",
	dashboardLabel = "Dashboard",
	size,
	variant,
	className,
}: {
	signInLabel?: string;
	dashboardLabel?: string;
	size?: ButtonProps["size"];
	variant?: ButtonProps["variant"];
	className?: string;
}) {
	const navigate = useNavigate();
	const [signedIn, setSignedIn] = useState(false);
	const [target, setTarget] = useState<ReturnType<
		typeof resolveDashboardTarget
	> | null>(null);
	const [resolving, setResolving] = useState(true);

	useEffect(() => {
		let cancelled = false;

		void fetchMe()
			.then((me) => {
				if (cancelled) return;
				if (me.accounts.length === 0) {
					setSignedIn(false);
					setTarget(null);
					return;
				}
				setSignedIn(true);
				setTarget(resolveDashboardTarget(me.accounts));
			})
			.catch(() => {
				if (cancelled) return;
				setSignedIn(false);
				setTarget(null);
			})
			.finally(() => {
				if (!cancelled) setResolving(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	if (resolving) {
		return (
			<Button size={size} variant={variant} className={className} disabled>
				{signInLabel}
			</Button>
		);
	}

	if (!signedIn) {
		return (
			<SignInDialog
				label={signInLabel}
				size={size}
				variant={variant}
				className={className}
			/>
		);
	}

	if (target?.kind === "account") {
		return (
			<Link
				to="/$account_slug"
				params={{ account_slug: target.slug }}
				className={cn(buttonVariants({ size, variant }), className)}
			>
				{dashboardLabel}
			</Link>
		);
	}

	if (target?.kind === "picker") {
		return (
			<Link
				to="/accounts"
				className={cn(buttonVariants({ size, variant }), className)}
			>
				{dashboardLabel}
			</Link>
		);
	}

	return (
		<Button
			size={size}
			variant={variant}
			className={className}
			onClick={() => {
				void (async () => {
					try {
						const me = await fetchMe();
						const next = resolveDashboardTarget(me.accounts);
						setTarget(next);
						setSignedIn(next.kind !== "sign");
						await navigateForTarget(navigate, next);
					} catch {
						setSignedIn(false);
						setTarget(null);
					}
				})();
			}}
		>
			{dashboardLabel}
		</Button>
	);
}
