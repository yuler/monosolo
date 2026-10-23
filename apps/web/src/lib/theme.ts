const STORAGE_KEY = "theme";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export function getStoredTheme(): Theme | null {
	const value = localStorage.getItem(STORAGE_KEY);
	return value === "light" || value === "dark" ? value : null;
}

export function getThemePreference(): ThemePreference {
	return getStoredTheme() ?? "system";
}

export function getSystemTheme(): Theme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function getResolvedTheme(): Theme {
	return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme, syncColorScheme = true) {
	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.dataset.theme = theme;
	if (syncColorScheme) root.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
}

export function setThemePreference(preference: ThemePreference) {
	if (preference === "system") {
		localStorage.removeItem(STORAGE_KEY);
		applyTheme(getSystemTheme());
		return;
	}
	setTheme(preference);
}

export type ThemeAnchor = Element | { clientX: number; clientY: number };

type ThemeViewTransition = {
	finished: Promise<void>;
	skipTransition: () => void;
};

function startViewTransition(
	update: () => void,
): ThemeViewTransition | undefined {
	const start = document.startViewTransition?.bind(document);
	if (typeof start !== "function") return undefined;
	return start(update) as ThemeViewTransition;
}

function anchorCenter(el: Element | null | undefined) {
	if (!el || typeof el.getBoundingClientRect !== "function") return null;
	const rect = el.getBoundingClientRect();
	if (rect.width === 0 && rect.height === 0) return null;
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Prefer the toggle's own rect. A raw mouse point, or a keyboard click at
// (0, 0), would start the wipe off the button.
function clickPoint(anchor?: ThemeAnchor) {
	const fallback = anchorCenter(
		document.querySelector("[data-theme-toggle]"),
	) ?? {
		x: window.innerWidth - 36,
		y: 28,
	};
	if (anchor instanceof Element) return anchorCenter(anchor) ?? fallback;
	if (
		anchor &&
		typeof anchor.clientX === "number" &&
		typeof anchor.clientY === "number" &&
		!(anchor.clientX === 0 && anchor.clientY === 0)
	) {
		return { x: anchor.clientX, y: anchor.clientY };
	}
	return fallback;
}

export function toggleTheme(anchor?: ThemeAnchor): Theme {
	const next: Theme = getResolvedTheme() === "dark" ? "light" : "dark";
	const reducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	if (reducedMotion || typeof document.startViewTransition !== "function") {
		setTheme(next);
		return next;
	}

	const root = document.documentElement;
	if (root.classList.contains("theme-transitioning")) return getResolvedTheme();

	const { x, y } = clickPoint(anchor);
	const endRadius = Math.hypot(
		Math.max(x, window.innerWidth - x),
		Math.max(y, window.innerHeight - y),
	);
	const w = Math.max(window.innerWidth, 1);
	const h = Math.max(window.innerHeight, 1);
	const goingDark = next === "dark";

	root.classList.add("theme-transitioning");
	if (goingDark) root.classList.add("theme-reveal-old");
	// Percentages, not px: some Chrome setups size the view-transition snapshot
	// box at 2x and scale it down, so px origins land at half (top center).
	root.style.setProperty("--vt-x", `${(x / w) * 100}%`);
	root.style.setProperty("--vt-y", `${(y / h) * 100}%`);
	root.style.setProperty(
		"--vt-r",
		`${(endRadius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`,
	);
	root.style.setProperty("--vt-bg", goingDark ? "#ffffff" : "#000000");
	root.style.colorScheme = goingDark ? "light" : "dark";

	let timeout = 0;
	let finished = false;
	let updated = false;
	let transition: ThemeViewTransition | undefined;
	const finish = (skip = false) => {
		if (finished) return;
		finished = true;
		window.clearTimeout(timeout);
		if (skip) {
			try {
				transition?.skipTransition();
			} catch {
				// already skipped
			}
		}
		root.classList.remove("theme-transitioning", "theme-reveal-old");
		root.style.removeProperty("--vt-x");
		root.style.removeProperty("--vt-y");
		root.style.removeProperty("--vt-r");
		root.style.removeProperty("--vt-bg");
		if (!updated) {
			setTheme(next);
		}
	};
	timeout = window.setTimeout(() => finish(true), 800);

	try {
		transition = startViewTransition(() => {
			updated = true;
			applyTheme(next, false);
			// Native controls follow color-scheme, not author classes. The
			// incoming snapshot has to be captured with the new scheme.
			root.style.colorScheme = next;
			localStorage.setItem(STORAGE_KEY, next);
		});
	} catch {
		finish(true);
		return next;
	}

	if (!transition) {
		finish(true);
		return next;
	}

	transition.finished.then(() => finish(false)).catch(() => finish(true));
	return next;
}
