import { useTranslation } from "react-i18next";
import DashboardBottomNav from "./dashboard/DashboardBottomNav";

interface OfflineStateProps {
	showDashboardBottomNav?: boolean;
}

export default function OfflineState({
	showDashboardBottomNav = false,
}: OfflineStateProps) {
	const { t } = useTranslation();

	return (
		<section className="page-wrap min-h-[calc(100vh-96px)] pb-24 pt-10 sm:pb-28 sm:py-14">
			<div className="hero-surface rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
				<p className="island-kicker m-0">{t("errors.connectionKicker")}</p>
				<h1 className="display-title mt-3 text-3xl leading-tight sm:text-4xl">
					{t("errors.offlineTitle")}
				</h1>
				<p className="mt-4 max-w-2xl text-sm text-(--sea-ink-soft) sm:text-base">
					{t("errors.offlineDescription")}
				</p>
			</div>

			{showDashboardBottomNav ? <DashboardBottomNav /> : null}
		</section>
	);
}
