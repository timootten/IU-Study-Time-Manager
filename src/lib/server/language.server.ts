import { getRequestHeaders, getRequestUrl } from "@tanstack/react-start/server";
import {
	DEFAULT_LANGUAGE,
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "#/lib/i18n";
import { resolveLanguageFromPathname } from "#/lib/i18n/paths";

function normalizeLanguage(value: string | null | undefined) {
	if (!value) return null;
	const normalized = value.toLowerCase().split("-")[0];
	return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)
		? (normalized as SupportedLanguage)
		: null;
}

/**
 * Extract the current language from the incoming request.
 *
 * Precedence:
 * 1. Language segment in the request URL path (e.g. `/de/dashboard` → `de`)
 * 2. `Accept-Language` header
 * 3. `DEFAULT_LANGUAGE`
 *
 * Safe to call from middleware (unlike `getLanguage`, which is wrapped in
 * `createServerFn` and only callable from the client).
 */
export function getLanguageFromRequest(): SupportedLanguage {
	// 1. Try the URL path — this is the user's explicit choice.
	const url = getRequestUrl();
	const urlLang = resolveLanguageFromPathname(url.pathname);
	if (urlLang) return urlLang;

	// 2. Fall back to the Accept-Language header.
	const headers = getRequestHeaders();
	const acceptLanguage = headers?.get("accept-language") ?? null;

	if (acceptLanguage) {
		const [primary] = acceptLanguage.split(",");
		const headerLang = normalizeLanguage(primary);
		if (headerLang) return headerLang;
	}

	// 3. Ultimate fallback.
	return DEFAULT_LANGUAGE;
}
