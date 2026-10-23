import { Moon, Sun } from "lucide-react";
import { type ComponentProps, useEffect } from "react";

import { applyTheme, getStoredTheme, toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeWipeButton({
	className,
	children,
	onClick,
	...props
}: ComponentProps<"button">) {
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			if (!getStoredTheme()) {
				applyTheme(media.matches ? "dark" : "light");
			}
		};

		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	return (
		<button
			aria-label="切换主题"
			title="切换主题"
			{...props}
			type="button"
			data-theme-toggle
			className={cn(
				"inline-flex size-8 cursor-pointer items-center justify-center border border-line bg-transparent text-ink transition-colors hover:border-solid hover:bg-solid hover:text-solid-ink",
				className,
			)}
			onClick={(event) => {
				onClick?.(event);
				if (!event.defaultPrevented) toggleTheme(event.currentTarget);
			}}
		>
			{children ?? (
				<>
					<Sun className="size-4 dark:hidden" aria-hidden="true" />
					<Moon className="hidden size-4 dark:block" aria-hidden="true" />
				</>
			)}
		</button>
	);
}
