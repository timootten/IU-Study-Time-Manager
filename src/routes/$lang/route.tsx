import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import NotFoundPage from "#/components/errors/NotFoundPage";
import i18n, { DEFAULT_LANGUAGE, type SupportedLanguage } from "#/lib/i18n";
import { normalizeLanguage } from "#/lib/i18n/paths";

export const Route = createFileRoute("/$lang")({
	beforeLoad: ({ params }) => {
		const lang = normalizeLanguage(params.lang) as SupportedLanguage | null;
		if (!lang) {
			throw redirect({ to: `/${DEFAULT_LANGUAGE}` });
		}

		// Synchronous — avoids flicker between SSR and client hydration.
		// i18next's changeLanguage is async only for loading remote resources;
		// with local JSON bundles it's effectively synchronous.
		if (i18n.language !== lang) {
			i18n.changeLanguage(lang);
		}

		return { lang };
	},
	notFoundComponent: NotFoundPage,
	component: () => <Outlet />,
});
