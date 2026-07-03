import { createFileRoute, Link } from "@tanstack/react-router";
import { ChartNoAxesCombined, Goal, ShieldAlert, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "#/lib/i18n";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import { seoHead } from "#/lib/i18n/seo";
import { getAuthSession } from "#/lib/server/auth-session";

export const Route = createFileRoute("/$lang/")({
	loader: async () => {
		try {
			const session = await getAuthSession();
			return { isLoggedIn: Boolean(session?.user) };
		} catch {
			return { isLoggedIn: false };
		}
	},
	head: ({ params }) =>
		seoHead(
			"homeTitle",
			"homeDescription",
			params.lang as SupportedLanguage,
			"/",
		),
	component: App,
});

function App() {
	const { isLoggedIn } = Route.useLoaderData();
	const { t } = useTranslation();
	const lang = useLangParam();

	return (
		<>
			<section className="page-wrap pt-10 sm:pt-16">
				<div className="hero-surface rise-in rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
					<p className="island-kicker m-0">{t("home.kicker")}</p>
					<h1 className="display-title mt-3 max-w-2xl text-4xl leading-tight sm:text-6xl">
						{t("home.headline")}
					</h1>
					<p className="mt-5 max-w-2xl text-base text-(--sea-ink-soft) sm:text-lg">
						{t("home.subheadline")}
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						{isLoggedIn ? (
							<Link
								to={withLang(lang, "/dashboard")}
								className="btn-brand rounded-full px-5 py-2.5 text-sm font-semibold no-underline"
							>
								{t("home.openDashboard")}
							</Link>
						) : (
							<>
								<Link
									to={withLang(lang, "/auth/register")}
									className="btn-brand rounded-full px-5 py-2.5 text-sm font-semibold no-underline"
								>
									{t("home.createAccount")}
								</Link>
								<Link
									to={withLang(lang, "/auth/login")}
									className="inline-flex items-center rounded-full border border-(--chip-line) bg-(--chip-bg) px-5 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline"
								>
									{t("home.login")}
								</Link>
							</>
						)}
					</div>
				</div>
			</section>

			<section className="page-wrap py-10 sm:py-14">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<article className="rounded-2xl border border-(--line) p-5">
						<Goal size={20} className="text-(--brand)" aria-hidden="true" />
						<h2 className="mt-4 text-lg font-bold">
							{t("home.feature1Title")}
						</h2>
						<p className="mt-2 text-sm text-(--sea-ink-soft)">
							{t("home.feature1Description")}
						</p>
					</article>
					<article className="rounded-2xl border border-(--line) p-5">
						<Timer size={20} className="text-(--brand)" aria-hidden="true" />
						<h2 className="mt-4 text-lg font-bold">
							{t("home.feature2Title")}
						</h2>
						<p className="mt-2 text-sm text-(--sea-ink-soft)">
							{t("home.feature2Description")}
						</p>
					</article>
					<article className="rounded-2xl border border-(--line) p-5">
						<ChartNoAxesCombined
							size={20}
							className="text-(--brand)"
							aria-hidden="true"
						/>
						<h2 className="mt-4 text-lg font-bold">
							{t("home.feature3Title")}
						</h2>
						<p className="mt-2 text-sm text-(--sea-ink-soft)">
							{t("home.feature3Description")}
						</p>
					</article>
					<article className="rounded-2xl border border-(--line) p-5">
						<ShieldAlert
							size={20}
							className="text-(--brand)"
							aria-hidden="true"
						/>
						<h2 className="mt-4 text-lg font-bold">
							{t("home.feature4Title")}
						</h2>
						<p className="mt-2 text-sm text-(--sea-ink-soft)">
							{t("home.feature4Description")}
						</p>
					</article>
				</div>
			</section>

			<section className="page-wrap pb-14 sm:pb-18">
				<div className="island-shell rounded-3xl p-6 sm:p-8">
					<p className="island-kicker m-0">{t("home.scopeKicker")}</p>
					<h2 className="display-title mt-2 text-2xl sm:text-3xl">
						{t("home.scopeTitle")}
					</h2>
					<ul className="mt-4 grid list-disc gap-2 pl-5 text-sm text-(--sea-ink-soft) sm:grid-cols-2">
						<li>{t("home.scopeItem1")}</li>
						<li>{t("home.scopeItem2")}</li>
						<li>{t("home.scopeItem3")}</li>
						<li>{t("home.scopeItem4")}</li>
						<li>{t("home.scopeItem5")}</li>
						<li>{t("home.scopeItem6")}</li>
					</ul>
				</div>
			</section>
		</>
	);
}
