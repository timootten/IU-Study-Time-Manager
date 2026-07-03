import { createFileRoute, redirect } from "@tanstack/react-router";

import AuthCard from "#/components/auth/AuthCard";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import i18n, { type SupportedLanguage } from "#/lib/i18n";
import { withLang } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";
import { getAuthSession } from "#/lib/server/auth-session";
import { requireServiceAvailability } from "#/lib/server/require-service-availability";

const registerRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.authUnavailableTitle",
	fallbackTitleKey: "errors.registerLoadFailedTitle",
	fallbackDescriptionKey: "errors.registerLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/auth/register")({
	loader: async ({ params }) => {
		const lang = params.lang as SupportedLanguage;
		const t = i18n.getFixedT(lang);
		await requireServiceAvailability(t("errors.authServiceUnavailable"));

		const session = await getAuthSession();
		if (session?.user) {
			throw redirect({ to: withLang(lang, "/dashboard") });
		}
		return null;
	},
	head: ({ params }) =>
		seoHead(
			"registerTitle",
			"registerDescription",
			params.lang as SupportedLanguage,
			"/auth/register",
		),
	errorComponent: registerRouteErrorComponent,
	component: RegisterPage,
});

function RegisterPage() {
	return <AuthCard mode="register" />;
}
