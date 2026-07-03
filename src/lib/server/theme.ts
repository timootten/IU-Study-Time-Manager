import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export type ThemeMode = "light" | "dark";

function resolveThemeFromCookie(cookieValue?: string): ThemeMode {
	return cookieValue === "light" ? "light" : "dark";
}

export const getThemeMode = createServerFn({ method: "GET" }).handler(() => {
	return resolveThemeFromCookie(getCookie("theme"));
});
