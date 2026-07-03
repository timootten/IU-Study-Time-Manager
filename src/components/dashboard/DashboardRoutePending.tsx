import { useTranslation } from "react-i18next";
import DashboardShell from "./DashboardShell";

export default function DashboardRoutePending() {
	const { t } = useTranslation();
	return (
		<DashboardShell
			title={t("modal.loadingDashboard")}
			description={t("modal.loadingDashboardDescription")}
		>
			<div aria-busy="true" aria-live="polite" className="space-y-4">
				<div className="h-5 w-36 animate-pulse rounded-full bg-(--line)" />
				<div className="h-28 animate-pulse rounded-2xl bg-(--line)" />
				<div className="h-24 animate-pulse rounded-2xl bg-(--line)" />
			</div>
		</DashboardShell>
	);
}
