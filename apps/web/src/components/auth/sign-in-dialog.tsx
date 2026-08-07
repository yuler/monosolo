import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useState } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type ButtonProps = ComponentProps<typeof Button>;

export function SignInDialog({
	label = "Sign in",
	size,
	variant,
	className,
}: {
	label?: string;
	size?: ButtonProps["size"];
	variant?: ButtonProps["variant"];
	className?: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button size={size} variant={variant} className={className} />}
			>
				{label}
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Sign in</DialogTitle>
					<DialogDescription>
						Enter your email to sign in or create an account.
					</DialogDescription>
				</DialogHeader>
				<SignInForm
					idPrefix="dialog-sign"
					onSuccess={() => {
						setOpen(false);
					}}
				/>
				<p className="text-center text-xs text-muted-foreground">
					Prefer a full page?{" "}
					<Link
						to="/sign"
						className="underline underline-offset-4"
						onClick={() => setOpen(false)}
					>
						Open sign-in
					</Link>
				</p>
			</DialogContent>
		</Dialog>
	);
}
