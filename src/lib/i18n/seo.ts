import type { SupportedLanguage } from "./index";
import i18n from "./index";

const RAW_BASE_URL = import.meta.env?.VITE_APP_URL ?? "";
const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export function seoHead(
	titleKey: string,
	descriptionKey: string,
	lang: SupportedLanguage,
	path: string,
) {
	const t = i18n.getFixedT(lang);
	const title = t(`meta.${titleKey}`);
	const description = t(`meta.${descriptionKey}`);

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const canonicalEn = BASE_URL
		? `${BASE_URL}/en${normalizedPath === "/" ? "" : normalizedPath}`
		: "";
	const canonicalDe = BASE_URL
		? `${BASE_URL}/de${normalizedPath === "/" ? "" : normalizedPath}`
		: "";

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{
				property: "og:locale",
				content: lang === "de" ? "de_DE" : "en_US",
			},
			{
				property: "og:locale:alternate",
				content: lang === "de" ? "en_US" : "de_DE",
			},
		],
		links: BASE_URL
			? [
					{
						rel: "canonical",
						href: lang === "de" ? canonicalDe : canonicalEn,
					},
					{ rel: "alternate", hrefLang: "en", href: canonicalEn },
					{ rel: "alternate", hrefLang: "de", href: canonicalDe },
					{ rel: "alternate", hrefLang: "x-default", href: canonicalEn },
				]
			: [],
	};
}
