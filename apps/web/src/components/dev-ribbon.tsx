import { cn } from "@/lib/utils";

/**
 * Subtle top-right ribbon so local development is not mistaken for production.
 * Only rendered when `import.meta.env.DEV` is true (stripped from prod behavior).
 */
export function DevRibbon() {
	if (!import.meta.env.DEV) {
		return null;
	}

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed top-0 right-0 z-[90] h-20 w-20 overflow-hidden select-none"
		>
			<div
				className={cn(
					"absolute top-[14px] -right-10 w-36 border border-line bg-wash/80 py-0.5 text-center shadow-xs backdrop-blur-sm",
					"text-[10px] font-semibold tracking-[0.22em] text-gray uppercase",
					"dark:border-white/20 dark:bg-zinc-800/90 dark:text-white",
					"rotate-45",
				)}
			>
				Dev
			</div>
		</div>
	);
}
