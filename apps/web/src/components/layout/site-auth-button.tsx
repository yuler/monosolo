import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchMe } from "@/lib/api/session";
import {
	getSelectedAccountSlug,
	resolveSelectedAccount,
	setSelectedAccountSlug,
} from "@/lib/auth/account";
import { isSignedIn } from "@/lib/auth/session";
import { isAccountSlug } from "@/lib/auth/slugs";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

function readCachedSlug(): string | null {
	const saved = getSelectedAccountSlug();
	return saved && isAccountSlug(saved) ? saved : null;
}

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
	const [signedIn, setSignedIn] = useState(() => isSignedIn());
	const [slug, setSlug] = useState<string | null>(() =>
		isSignedIn() ? readCachedSlug() : null,
	);
	const [resolving, setResolving] = useState(
		() => isSignedIn() && !readCachedSlug(),
	);

	useEffect(() => {
		if (!isSignedIn()) {
			setSignedIn(false);
			setSlug(null);
			setResolving(false);
			return;
		}

		setSignedIn(true);
		const cached = readCachedSlug();
		if (cached) {
			setSlug(cached);
			setResolving(false);
			return;
		}

		let cancelled = false;
		setResolving(true);

		void fetchMe()
			.then((me) => {
				if (cancelled) return;
				const account = resolveSelectedAccount(me.accounts);
				if (account) {
					setSelectedAccountSlug(account.slug);
					setSlug(account.slug);
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
				to="/$slug"
				params={{ slug }}
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
			disabled={resolving}
			onClick={() => {
				void (async () => {
					try {
						const me = await fetchMe();
						const account = resolveSelectedAccount(me.accounts);
						if (!account) return;
						setSelectedAccountSlug(account.slug);
						setSlug(account.slug);
						await navigate({
							to: "/$slug",
							params: { slug: account.slug },
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
