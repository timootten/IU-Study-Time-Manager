import { createFileRoute, redirect } from "@tanstack/react-router";

import AuthCard from "#/components/auth/AuthCard";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import i18n, { type SupportedLanguage } from "#/lib/i18n";
import { withLang } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";
import { getAuthSession } from "#/lib/server/auth-session";
import { requireServiceAvailability } from "#/lib/server/require-service-availability";

const loginRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.authUnavailableTitle",
	fallbackTitleKey: "errors.loginLoadFailedTitle",
	fallbackDescriptionKey: "errors.loginLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/auth/login")({
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
			"loginTitle",
			"loginDescription",
			params.lang as SupportedLanguage,
			"/auth/login",
		),
	errorComponent: loginRouteErrorComponent,
	component: LoginPage,
});

function LoginPage() {
	return <AuthCard mode="sign-in" />;
}
