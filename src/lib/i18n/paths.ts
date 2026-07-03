import { useLocation, useParams } from "@tanstack/react-router";
import i18n, {
	DEFAULT_LANGUAGE,
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "./index";

export function isSupportedLanguage(
	value: string | null | undefined,
): value is SupportedLanguage {
	return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function normalizeLanguage(
	value: string | null | undefined,
): SupportedLanguage | null {
	if (!value) return null;
	const normalized = value.toLowerCase().split("-")[0];
	return isSupportedLanguage(normalized) ? normalized : null;
}

export function normalizeLanguageValue(
	value: string | null | undefined,
	fallback: SupportedLanguage = DEFAULT_LANGUAGE,
): SupportedLanguage {
	return normalizeLanguage(value) ?? fallback;
}

export function resolveLanguageFromPathname(
	pathname: string,
): SupportedLanguage | null {
	const segment = pathname.split("/")[1];
	return normalizeLanguage(segment);
}

export function stripLangPrefix(
	pathname: string,
	lang: SupportedLanguage,
): string {
	if (pathname === `/${lang}`) return "/";
	if (pathname.startsWith(`/${lang}/`)) {
		return pathname.slice(lang.length + 1);
	}
	return pathname;
}

export function withLang(lang: SupportedLanguage, path: string): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (normalized === `/${lang}` || normalized.startsWith(`/${lang}/`)) {
		return normalized;
	}
	if (normalized === "/") {
		return `/${lang}`;
	}
	return `/${lang}${normalized}`;
}

export function replaceLangInPath(
	pathname: string,
	nextLang: SupportedLanguage,
): string {
	const currentLang = resolveLanguageFromPathname(pathname);
	const basePath = currentLang
		? stripLangPrefix(pathname, currentLang)
		: pathname;
	return withLang(nextLang, basePath);
}

export function useLangParam(): SupportedLanguage {
	const params = useParams({ strict: false }) as { lang?: string };
	const location = useLocation();
	return normalizeLanguageValue(
		params?.lang ??
			resolveLanguageFromPathname(location.pathname) ??
			i18n.language,
	);
}
