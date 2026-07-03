import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

i18n.use(initReactI18next);

void i18n.init({
	resources: {
		en: { translation: en },
		de: { translation: de },
	},
	fallbackLng: DEFAULT_LANGUAGE,
	supportedLngs: SUPPORTED_LANGUAGES,
	interpolation: { escapeValue: false },
	// Don't use LanguageDetector — language is always determined from the URL
	// path by the $lang/route.tsx layout. This avoids SSR hydration mismatches.
	lng: DEFAULT_LANGUAGE,
});

export default i18n;
