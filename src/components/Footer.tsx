import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLangParam } from "#/lib/i18n/paths";

export default function Footer() {
	const { t } = useTranslation();
	const lang = useLangParam();
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-(--line) px-4 pb-10 pt-10 text-(--sea-ink-soft)">
			<div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">{t("footer.copyright", { year })}</p>
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
					<Link
						to="/$lang/legal/imprint"
						params={{ lang }}
						className="text-sm text-(--sea-ink-soft) underline hover:text-(--sea-primary)"
					>
						{t("nav.imprint")}
					</Link>
					<Link
						to="/$lang/legal/privacy"
						params={{ lang }}
						className="text-sm text-(--sea-ink-soft) underline hover:text-(--sea-primary)"
					>
						{t("nav.privacy")}
					</Link>
					<Link
						to="/$lang/legal/terms"
						params={{ lang }}
						className="text-sm text-(--sea-ink-soft) underline hover:text-(--sea-primary)"
					>
						{t("nav.terms")}
					</Link>
					<p className="island-kicker m-0">{t("footer.tagline")}</p>
				</div>
			</div>
		</footer>
	);
}
