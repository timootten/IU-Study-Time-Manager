import { createFileRoute, redirect } from "@tanstack/react-router";
import { withLang } from "#/lib/i18n/paths";

export const Route = createFileRoute("/$lang/auth/")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: withLang(params.lang, "/auth/login") });
	},
});
