import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchMe } from "@/lib/api/session";
import { resolveSelectedAccount } from "@/lib/auth/account";
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
	const [slug, setSlug] = useState<string | null>(null);
	const [resolving, setResolving] = useState(true);

	useEffect(() => {
		let cancelled = false;

		void fetchMe()
			.then((me) => {
				if (cancelled) return;
				const account = resolveSelectedAccount(me.accounts);
				if (account) {
					setSlug(account.slug);
					setSignedIn(true);
				} else {
					setSignedIn(false);
					setSlug(null);
				}
			})
			.catch(() => {
				if (cancelled) return;
				setSignedIn(false);
				setSlug(null);
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

	if (slug) {
		return (
			<Link
				to="/$account_slug"
				params={{ account_slug: slug }}
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
						const account = resolveSelectedAccount(me.accounts);
						if (!account) return;
						setSlug(account.slug);
						await navigate({
							to: "/$account_slug",
							params: { account_slug: account.slug },
						});
					} catch {
						setSignedIn(false);
					}
				})();
			}}
		>
			{dashboardLabel}
		</Button>
	);
}
