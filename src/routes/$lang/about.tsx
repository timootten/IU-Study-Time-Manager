import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "#/lib/i18n";
import { seoHead } from "#/lib/i18n/seo";

export const Route = createFileRoute("/$lang/about")({
	head: ({ params }) =>
		seoHead(
			"aboutTitle",
			"aboutDescription",
			params.lang as SupportedLanguage,
			"/about",
		),
	component: About,
});

function About() {
	const { t } = useTranslation();

	return (
		<section className="page-wrap py-10 sm:py-16">
			<div className="island-shell rounded-3xl p-6 sm:p-10">
				<p className="island-kicker m-0">{t("about.kicker")}</p>
				<h1 className="display-title mt-2 text-4xl">{t("about.title")}</h1>
				<p className="mt-4 max-w-3xl text-base leading-relaxed text-(--sea-ink-soft)">
					{t("about.description")}
				</p>
			</div>
		</section>
	);
}
