import type { ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeWipeButton } from "@/components/ui/theme-wipe-button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
	className,
	...props
}: ComponentProps<typeof ThemeWipeButton>) {
	return (
		<ThemeWipeButton
			aria-label="Toggle color theme"
			title="Toggle color theme"
			className={cn(
				buttonVariants({ variant: "outline", size: "icon" }),
				className,
			)}
			{...props}
		/>
	);
}

export { ThemeWipeButton };
