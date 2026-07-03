import { createFileRoute, redirect } from "@tanstack/react-router";
import type { SupportedLanguage } from "#/lib/i18n";
import { withLang } from "#/lib/i18n/paths";

export const Route = createFileRoute("/$lang/profile/")({
	beforeLoad: async ({ params }) => {
		throw redirect({
			to: withLang(params.lang as SupportedLanguage, "/profile/settings"),
		});
	},
});
