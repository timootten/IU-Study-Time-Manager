import { redirect } from "@tanstack/react-router";

import { DEFAULT_LANGUAGE, type SupportedLanguage } from "#/lib/i18n";
import { withLang } from "#/lib/i18n/paths";
import { getAuthSession } from "./auth-session";
import { requireServiceAvailability } from "./require-service-availability";

interface RequireAuthOptions {
	lang?: SupportedLanguage;
}

export async function requireAuthSession(options?: RequireAuthOptions) {
	await requireServiceAvailability();

	const session = await getAuthSession();

	if (!session?.user) {
		const lang = options?.lang ?? DEFAULT_LANGUAGE;
		throw redirect({ to: withLang(lang, "/auth/login") });
	}

	return session;
}
