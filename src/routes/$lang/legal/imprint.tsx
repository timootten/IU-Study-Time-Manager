import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "#/lib/i18n";
import { useLangParam } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";

export const Route = createFileRoute("/$lang/legal/imprint")({
	head: ({ params }) =>
		seoHead(
			"imprintTitle",
			"imprintDescription",
			params.lang as SupportedLanguage,
			"/legal/imprint",
		),
	component: Imprint,
});

function Imprint() {
	const { t } = useTranslation();
	const lang = useLangParam();

	return (
		<section className="page-wrap py-10 sm:py-16">
			<div className="island-shell rounded-3xl p-6 sm:p-10">
				<p className="island-kicker m-0">{t("imprint.kicker")}</p>
				<h1 className="display-title mt-2 text-4xl">{t("imprint.title")}</h1>

				<div className="mt-6 space-y-6 text-base leading-relaxed text-(--sea-ink-soft)">
					<div>
						<p className="font-semibold text-(--sea-ink)">
							{t("imprint.name")}
						</p>
						<p>Timo Otten</p>
					</div>
					<div>
						<p className="font-semibold text-(--sea-ink)">
							{t("imprint.address")}
						</p>
						<p>Wiesenstraße 1</p>
						<p>41363 Jüchen</p>
						<p>{t("imprint.germany")}</p>
					</div>
					<div>
						<p className="font-semibold text-(--sea-ink)">
							{t("imprint.contact")}
						</p>
						<p>
							{t("imprint.email")}:{" "}
							<a
								href="mailto:Timo@ShadeHost.eu"
								className="text-(--sea-primary) underline hover:no-underline"
							>
								Timo@ShadeHost.eu
							</a>
						</p>
						<p>
							{t("imprint.phone")}:{" "}
							<a
								href="tel:+491722045900"
								className="text-(--sea-primary) underline hover:no-underline"
							>
								+49 172 2045900
							</a>{" "}
							<span className="text-(--sea-ink-soft) text-sm">
								({t("imprint.noSupport")})
							</span>
						</p>
					</div>

					{/* MStV */}
					<div>
						<p className="font-semibold text-(--sea-ink)">
							{t("imprint.mstv")}
						</p>
						<p>{t("imprint.mstvName")}</p>
					</div>

					{/* Advertising Notice */}
					<div>
						<p className="font-semibold text-(--sea-ink)">
							{t("imprint.advertisingNotice")}
						</p>
						<p>{t("imprint.advertisingNoticeText")}</p>
					</div>
				</div>

				{/* Cross-links */}
				<div className="mt-10 flex flex-wrap gap-4 pt-6 border-t border-(--line) text-sm">
					<Link
						to="/$lang/legal/privacy"
						params={{ lang }}
						className="text-(--sea-primary) underline hover:no-underline"
					>
						{t("nav.privacy")}
					</Link>
					<Link
						to="/$lang/legal/terms"
						params={{ lang }}
						className="text-(--sea-primary) underline hover:no-underline"
					>
						{t("nav.terms")}
					</Link>
					<Link
						to="/$lang"
						params={{ lang }}
						className="text-(--sea-primary) underline hover:no-underline"
					>
						{t("common.back")}
					</Link>
				</div>
			</div>
		</section>
	);
}
