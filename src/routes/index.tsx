import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLanguage } from "#/lib/server/language";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const lang = await getLanguage();
		throw redirect({ to: `/${lang}` });
	},
});
