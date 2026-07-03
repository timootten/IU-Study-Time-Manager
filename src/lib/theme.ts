export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "stm-theme";
const THEME_COLOR_LIGHT = "#fcf7ef";
const THEME_COLOR_DARK = "#08131b";

export function getInitialThemeMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "dark";
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	const themeAttribute = document.documentElement.getAttribute("data-theme");
	if (themeAttribute === "light" || themeAttribute === "dark") {
		return themeAttribute;
	}

	if (document.documentElement.classList.contains("dark")) {
		return "dark";
	}

	if (document.documentElement.classList.contains("light")) {
		return "light";
	}

	return "dark";
}

export function applyThemeMode(mode: ThemeMode) {
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(mode);
	document.documentElement.setAttribute("data-theme", mode);
	document.documentElement.style.colorScheme = mode;

	window.localStorage.setItem(THEME_STORAGE_KEY, mode);
	// biome-ignore lint/suspicious/noDocumentCookie: Used for SSR theme detection
	document.cookie = `theme=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;

	const themeColorMeta = document.querySelector('meta[name="theme-color"]');
	if (themeColorMeta) {
		themeColorMeta.setAttribute(
			"content",
			mode === "light" ? THEME_COLOR_LIGHT : THEME_COLOR_DARK,
		);
	}
}
