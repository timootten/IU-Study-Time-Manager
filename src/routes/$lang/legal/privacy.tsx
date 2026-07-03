import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "#/lib/i18n";
import { useLangParam } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";

export const Route = createFileRoute("/$lang/legal/privacy")({
	head: ({ params }) =>
		seoHead(
			"privacyTitle",
			"privacyDescription",
			params.lang as SupportedLanguage,
			"/legal/privacy",
		),
	component: Privacy,
});

function Privacy() {
	const { t } = useTranslation();
	const lang = useLangParam();

	return (
		<section className="page-wrap py-10 sm:py-16">
			<div className="island-shell rounded-3xl p-6 sm:p-10">
				<p className="island-kicker m-0">{t("privacy.kicker")}</p>
				<h1 className="display-title mt-2 text-4xl">{t("privacy.title")}</h1>
				<p className="mt-2 text-sm text-(--sea-ink-soft)">
					{t("privacy.lastUpdated")}
				</p>

				<div className="mt-8 space-y-8 text-base leading-relaxed text-(--sea-ink-soft)">
					{/* Section 1 – Data Controller */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s1_heading")}
						</h2>
						<div className="mt-3 space-y-1">
							<p>Timo Otten</p>
							<p>Wiesenstraße 1</p>
							<p>41363 Jüchen</p>
							<p>{t("privacy.germany")}</p>
							<p className="mt-2">
								{t("imprint.email")}:{" "}
								<a
									href="mailto:Timo@ShadeHost.eu"
									className="text-(--sea-primary) underline hover:no-underline"
								>
									Timo@ShadeHost.eu
								</a>
							</p>
							<p>
								{t("privacy.s1_security")}:{" "}
								<a
									href="mailto:timootten@icloud.com"
									className="text-(--sea-primary) underline hover:no-underline"
								>
									timootten@icloud.com
								</a>
							</p>
						</div>
					</section>

					{/* Section 2 – General */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s2_heading")}
						</h2>
						<p className="mt-3">{t("privacy.s2_text")}</p>
					</section>

					{/* Section 3 – Hosting */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s3_heading")}
						</h2>
						<p className="mt-3">{t("privacy.s3_text1")}</p>
					</section>

					{/* Section 4 – Data Collected */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s4_heading")}
						</h2>
						<div className="mt-3 space-y-4">
							<div>
								<p className="font-medium text-(--sea-ink)">
									{t("privacy.s4_sub_a")}
								</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>{t("privacy.s4_a1")}</li>
									<li>{t("privacy.s4_a2")}</li>
									<li>{t("privacy.s4_a3")}</li>
									<li>{t("privacy.s4_a4")}</li>
									<li>{t("privacy.s4_a5")}</li>
								</ul>
							</div>
							<div>
								<p className="font-medium text-(--sea-ink)">
									{t("privacy.s4_sub_b")}
								</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>{t("privacy.s4_b1")}</li>
									<li>{t("privacy.s4_b2")}</li>
									<li>{t("privacy.s4_b3")}</li>
								</ul>
							</div>
							<div>
								<p className="font-medium text-(--sea-ink)">
									{t("privacy.s4_sub_c")}
								</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>{t("privacy.s4_c1")}</li>
									<li>{t("privacy.s4_c2")}</li>
									<li>{t("privacy.s4_c3")}</li>
									<li>{t("privacy.s4_c4")}</li>
								</ul>
							</div>
							<div>
								<p className="font-medium text-(--sea-ink)">
									{t("privacy.s4_sub_d")}
								</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>{t("privacy.s4_d1")}</li>
									<li>{t("privacy.s4_d2")}</li>
									<li>{t("privacy.s4_d3")}</li>
									<li>{t("privacy.s4_d4")}</li>
								</ul>
							</div>
							<div>
								<p className="font-medium text-(--sea-ink)">
									{t("privacy.s4_sub_e")}
								</p>
								<ul className="list-disc pl-6 space-y-1">
									<li>{t("privacy.s4_e1")}</li>
									<li>{t("privacy.s4_e2")}</li>
									<li>{t("privacy.s4_e3")}</li>
								</ul>
							</div>
						</div>
					</section>

					{/* Section 5 – Cookies */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s5_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s5_text1")}</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>{t("privacy.s5_item1")}</li>
								<li>{t("privacy.s5_item2")}</li>
								<li>{t("privacy.s5_item3")}</li>
							</ul>
							<p>{t("privacy.s5_text2")}</p>
							<p>{t("privacy.s5_text3")}</p>
							<p className="text-sm">{t("privacy.s5_legal")}</p>
						</div>
					</section>

					{/* Section 6 – Purpose */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s6_heading")}
						</h2>
						<ul className="mt-3 list-disc pl-6 space-y-1">
							<li>{t("privacy.s6_item1")}</li>
							<li>{t("privacy.s6_item2")}</li>
							<li>{t("privacy.s6_item3")}</li>
							<li>{t("privacy.s6_item4")}</li>
							<li>{t("privacy.s6_item5")}</li>
						</ul>
					</section>

					{/* Section 7 – Legal Bases */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s7_heading")}
						</h2>
						<ul className="mt-3 list-disc pl-6 space-y-1">
							<li>{t("privacy.s7_item1")}</li>
							<li>{t("privacy.s7_item2")}</li>
							<li>{t("privacy.s7_item3")}</li>
						</ul>
					</section>

					{/* Section 8 – Retention */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s8_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s8_text1")}</p>
							<p>{t("privacy.s8_text2")}</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>{t("privacy.s8_item1")}</li>
								<li>{t("privacy.s8_item2")}</li>
							</ul>
							<p>{t("privacy.s8_text3")}</p>
						</div>
					</section>

					{/* Section 9 – Data Sharing */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s9_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s9_text1")}</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>{t("privacy.s9_item1")}</li>
								<li>{t("privacy.s9_item2")}</li>
								<li>{t("privacy.s9_item3")}</li>
							</ul>
							<p>{t("privacy.s9_text2")}</p>
						</div>
					</section>

					{/* Section 10 – User Rights */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s10_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s10_text1")}</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>{t("privacy.s10_item1")}</li>
								<li>{t("privacy.s10_item2")}</li>
								<li>{t("privacy.s10_item3")}</li>
								<li>{t("privacy.s10_item4")}</li>
								<li>{t("privacy.s10_item5")}</li>
								<li>{t("privacy.s10_item6")}</li>
							</ul>
							<p className="font-medium text-(--sea-ink)">
								{t("privacy.s10_text2")}
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
						</div>
					</section>

					{/* Section 11 – Right to Complain */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s11_heading")}
						</h2>
						<div className="mt-3 space-y-1">
							<p>{t("privacy.s11_text1")}</p>
							<p>{t("privacy.s11_text2")}</p>
							<a
								href="https://www.ldi.nrw.de"
								target="_blank"
								rel="noopener noreferrer"
								className="text-(--sea-primary) underline hover:no-underline"
							>
								https://www.ldi.nrw.de
							</a>
						</div>
					</section>

					{/* Section 12 – Security */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s12_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s12_text1")}</p>
							<p>{t("privacy.s12_text2")}</p>
						</div>
					</section>

					{/* Section 13 – Minors */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s13_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s13_text1")}</p>
							<p>{t("privacy.s13_text2")}</p>
						</div>
					</section>

					{/* Section 14 – Changes */}
					<section>
						<h2 className="text-lg font-semibold text-(--sea-ink)">
							{t("privacy.s14_heading")}
						</h2>
						<div className="mt-3 space-y-3">
							<p>{t("privacy.s14_text1")}</p>
							<p>{t("privacy.s14_text2")}</p>
						</div>
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
