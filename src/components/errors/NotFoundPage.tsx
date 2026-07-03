import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLangParam, withLang } from "#/lib/i18n/paths";

export default function NotFoundPage() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const router = useRouter();
	const location = useLocation();

	const handleGoBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			window.history.back();
			return;
		}

		void router.navigate({ to: withLang(lang, "/") });
	};

	return (
		<section className="page-wrap min-h-[calc(100vh-96px)] pb-24 pt-10 sm:pb-28 sm:py-14">
			<div className="hero-surface rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
				<p className="island-kicker m-0">404</p>
				<h1 className="display-title mt-3 text-3xl leading-tight sm:text-4xl">
					{t("errors.notFound")}
				</h1>
				<p className="mt-4 max-w-2xl text-sm text-(--sea-ink-soft) sm:text-base">
					{t("errors.notFoundDescription")}
				</p>
				<p className="mt-3 text-xs text-(--sea-ink-soft)">
					{t("errors.requestedPath")} {location.pathname}
				</p>

				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						to={withLang(lang, "/")}
						className="btn-brand rounded-xl px-4 py-2 text-sm font-semibold no-underline"
					>
						{t("errors.goHome")}
					</Link>
					<button
						type="button"
						onClick={handleGoBack}
						className="rounded-xl border border-(--chip-line) bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink)"
					>
						{t("errors.goBack")}
					</button>
				</div>
			</div>
		</section>
	);
}
