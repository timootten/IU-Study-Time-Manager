import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "#/lib/i18n";
import { useLangParam } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";

export const Route = createFileRoute("/$lang/legal/terms")({
	head: ({ params }) =>
		seoHead(
			"termsTitle",
			"termsDescription",
			params.lang as SupportedLanguage,
			"/legal/terms",
		),
	component: Terms,
});

function Terms() {
	const { t } = useTranslation();
	const lang = useLangParam();

	return (
		<section className="page-wrap py-10 sm:py-16">
			<div className="island-shell rounded-3xl p-6 sm:p-10">
				<p className="island-kicker m-0">{t("terms.kicker")}</p>
				<h1 className="display-title mt-2 text-4xl">{t("terms.title")}</h1>

				<div className="mt-8 space-y-8 text-base leading-relaxed text-(--sea-ink-soft)">
					{/* Section 1 – Service */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s1_heading")}
						</h2>
						<p className="mt-3">{t("terms.s1_text")}</p>
					</section>

					{/* Section 2 – Use */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s2_heading")}
						</h2>
						<p className="mt-3">{t("terms.s2_text")}</p>
					</section>

					{/* Section 3 – Availability */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s3_heading")}
						</h2>
						<p className="mt-3">{t("terms.s3_text")}</p>
					</section>

					{/* Section 4 – Prohibited Use */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s4_heading")}
						</h2>
						<ul className="mt-3 list-disc pl-6 space-y-1">
							<li>{t("terms.s4_item1")}</li>
							<li>{t("terms.s4_item2")}</li>
							<li>{t("terms.s4_item3")}</li>
							<li>{t("terms.s4_item4")}</li>
						</ul>
					</section>

					{/* Section 5 – Content */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s5_heading")}
						</h2>
						<p className="mt-3">{t("terms.s5_text")}</p>
					</section>

					{/* Section 6 – Liability */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s6_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("terms.s6_text")}</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>{t("terms.s6_item1")}</li>
								<li>{t("terms.s6_item2")}</li>
								<li>{t("terms.s6_item3")}</li>
								<li>{t("terms.s6_item4")}</li>
							</ul>
						</div>
					</section>

					{/* Section 7 – Account Termination */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s7_heading")}
						</h2>
						<p className="mt-3">{t("terms.s7_text")}</p>
					</section>

					{/* Section 8 – Termination of Service */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s8_heading")}
						</h2>
						<p className="mt-3">{t("terms.s8_text")}</p>
					</section>

					{/* Section 9 – Law */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("terms.s9_heading")}
						</h2>
						<p className="mt-3">{t("terms.s9_text")}</p>
					</section>
				</div>

				{/* Cross-links */}
				<div className="mt-10 flex flex-wrap gap-4 pt-6 border-t border-(--line) text-sm">
					<Link
						to="/$lang/legal/imprint"
						params={{ lang }}
						className="text-(--sea-primary) underline hover:no-underline"
					>
						{t("nav.imprint")}
					</Link>
					<Link
						to="/$lang/legal/privacy"
						params={{ lang }}
						className="text-(--sea-primary) underline hover:no-underline"
					>
						{t("nav.privacy")}
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
