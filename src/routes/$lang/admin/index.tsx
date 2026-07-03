import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { BarChart3, Clock, Goal, Milestone, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import AdminShell from "#/components/admin/AdminShell";
import { getAdminKpis } from "#/lib/server/admin";
import { getAuthSession } from "#/lib/server/auth-session";

export const Route = createFileRoute("/$lang/admin/")({
	loader: async () => {
		const session = await getAuthSession();
		if (!session?.user || session.user.role !== "admin") {
			throw redirect({ to: "/" });
		}
		return { session };
	},
	component: AdminDashboardPage,
});

function KpiCard({
	icon: Icon,
	label,
	value,
	sub,
}: {
	icon: React.ComponentType<{ className?: string; size?: number }>;
	label: string;
	value: string | number;
	sub?: string;
}) {
	return (
		<div className="flex items-start gap-4 rounded-2xl border border-(--line) bg-(--surface-strong) p-5">
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--brand)/12 text-(--brand)">
				<Icon size={20} />
			</div>
			<div className="min-w-0">
				<p className="text-2xl font-bold text-(--sea-ink)">{value}</p>
				<p className="text-sm font-medium text-(--sea-ink-soft)">{label}</p>
				{sub ? (
					<p className="mt-0.5 text-xs text-(--sea-ink-soft)/70">{sub}</p>
				) : null}
			</div>
		</div>
	);
}

function AdminDashboardPage() {
	const { t } = useTranslation();

	const {
		data: kpis,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["admin", "kpis"],
		queryFn: () => getAdminKpis(),
		staleTime: 30_000,
	});

	return (
		<AdminShell title={t("admin.title")} description={t("admin.subtitle")}>
			{isLoading ? (
				<p className="text-sm text-(--sea-ink-soft)">{t("common.loading")}</p>
			) : error ? (
				<p className="text-sm text-red-500">{t("common.somethingWentWrong")}</p>
			) : kpis ? (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<KpiCard
						icon={Users}
						label={t("admin.totalUsers")}
						value={kpis.totalUsers}
					/>
					<KpiCard
						icon={Goal}
						label={t("admin.totalGoals")}
						value={kpis.totalGoals}
						sub={t("admin.goalsBreakdown", {
							active: kpis.activeGoals,
							completed: kpis.completedGoals,
						})}
					/>
					<KpiCard
						icon={Clock}
						label={t("admin.totalSessions")}
						value={kpis.totalSessions}
					/>
					<KpiCard
						icon={BarChart3}
						label={t("admin.totalTrackedHours")}
						value={`${kpis.totalTrackedHours}h`}
					/>
					<KpiCard
						icon={Milestone}
						label={t("admin.totalMilestones")}
						value={kpis.totalMilestones}
					/>
					<KpiCard
						icon={Trophy}
						label={t("admin.totalAchievements")}
						value={kpis.totalAchievements}
					/>
				</div>
			) : null}
		</AdminShell>
	);
}
