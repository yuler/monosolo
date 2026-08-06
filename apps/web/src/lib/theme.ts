const STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme | null {
	const value = localStorage.getItem(STORAGE_KEY);
	return value === "light" || value === "dark" ? value : null;
}

export function getSystemTheme(): Theme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function getResolvedTheme(): Theme {
	return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
}

export function toggleTheme(): Theme {
	const next = getResolvedTheme() === "dark" ? "light" : "dark";
	setTheme(next);
	return next;
}
