import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Goal, Target } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import PlanActualChart from "#/components/dashboard/stats/PlanActualChart";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import type { SupportedLanguage } from "#/lib/i18n";
import { seoHead } from "#/lib/i18n/seo";
import { studyDashboardQueryOptions } from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";

const dashboardRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.dashboardUnavailableTitle",
	fallbackTitleKey: "errors.dashboardLoadFailedTitle",
	fallbackDescriptionKey: "errors.dashboardLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/dashboard/")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context, params }) => {
		const session = await requireAuthSession({
			lang: params.lang as SupportedLanguage,
		});
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
		return { session, lang: params.lang as SupportedLanguage };
	},
	head: ({ params }) =>
		seoHead(
			"dashboardTitle",
			"dashboardDescription",
			params.lang as SupportedLanguage,
			"/dashboard",
		),
	pendingComponent: DashboardRoutePending,
	errorComponent: dashboardRouteErrorComponent,
	component: DashboardPage,
});

function formatHours(value: number) {
	return `${value.toFixed(1)}h`;
}

function mapCategoryLabel(category: string) {
	switch (category) {
		case "exam":
			return "Exam";
		case "project":
			return "Project";
		case "presentation":
			return "Presentation";
		default:
			return category.replaceAll("_", " ");
	}
}

function DashboardPage() {
	const { session } = Route.useLoaderData();
	const { t } = useTranslation();
	const { data: snapshot, error } = useQuery(studyDashboardQueryOptions());

	if (!snapshot) {
		throw error ?? new Error("Missing study dashboard data.");
	}

	const firstName = session.user.name?.split(" ")[0] ?? "there";
	const attentionCount =
		snapshot.attention.missedPlannedSessions +
		snapshot.attention.overdueMilestones;

	const planActualPoints = snapshot.schedule.nextSixMonths.map((entry) => ({
		month: entry.label,
		plannedHours: entry.plannedHours,
		actualHours: entry.actualHours,
	}));

	const achievementsByCategory = useMemo(
		() =>
			Object.entries(
				snapshot.achievements.reduce(
					(acc, a) => {
						acc[a.category] = (acc[a.category] ?? 0) + 1;
						return acc;
					},
					{} as Record<string, number>,
				),
			).sort((a, b) => b[1] - a[1]),
		[snapshot.achievements],
	);

	return (
		<DashboardShell
			title={t("dashboard.welcome", { name: firstName })}
			description={t("dashboard.overviewDescription")}
		>
			<div className="space-y-6">
				{/* ─── Summary cards ─── */}
				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<article className="island-shell rounded-2xl p-4 sm:p-5">
						<p className="island-kicker m-0">
							{t("dashboard.trackedVsTarget")}
						</p>
						<p className="mt-2 text-2xl font-extrabold text-(--sea-ink)">
							{formatHours(snapshot.summary.totalTrackedHours)} /{" "}
							{snapshot.summary.totalTargetHours}h
						</p>
						<p className="mt-1 text-xs text-(--sea-ink-soft)">
							{t("dashboard.lecture")}:{" "}
							{formatHours(snapshot.summary.lectureHours)} ·{" "}
							{t("dashboard.learning")}:{" "}
							{formatHours(snapshot.summary.learningHours)}
						</p>
					</article>

					<article className="island-shell rounded-2xl p-4 sm:p-5">
						<p className="island-kicker m-0">{t("dashboard.planProgress")}</p>
						<p className="mt-2 text-2xl font-extrabold text-(--sea-ink)">
							{snapshot.summary.planAdherenceRate}%
						</p>
						<p className="mt-1 text-xs text-(--sea-ink-soft)">
							{formatHours(snapshot.summary.actualHoursSixMonths)} /{" "}
							{formatHours(snapshot.summary.plannedHoursSixMonths)}{" "}
							{t("dashboard.inLast5Months")}
						</p>
					</article>

					<article className="island-shell rounded-2xl p-4 sm:p-5">
						<p className="island-kicker m-0">{t("dashboard.achievement")}</p>
						<p className="mt-2 text-2xl font-extrabold text-(--sea-ink)">
							{snapshot.summary.achievementCount}
						</p>
						<p className="mt-1 text-xs text-(--sea-ink-soft)">
							{attentionCount}{" "}
							{t("dashboard.attentionItem", { count: attentionCount })}
						</p>
					</article>
				</section>

				{/* ─── Plan vs Actual + Execution Radar ─── */}
				<section className="grid gap-4 xl:grid-cols-2">
					<article className="island-shell rounded-2xl p-5 sm:p-6">
						<h2 className="text-base font-bold text-(--sea-ink)">
							{t("dashboard.planVsActual")}
						</h2>
						<p className="mt-1 text-sm text-(--sea-ink-soft)">
							{t("dashboard.planVsActualDescription")}
						</p>
						<div className="mt-4">
							<PlanActualChart points={planActualPoints} />
						</div>
						<p className="mt-3 text-xs text-(--sea-ink-soft)">
							{t("dashboard.planProgressFull", {
								rate: snapshot.summary.planAdherenceRate,
							})}
						</p>
					</article>

					<article className="island-shell rounded-2xl p-5 sm:p-6">
						<h2 className="text-base font-bold text-(--sea-ink)">
							{t("dashboard.recentAchievements")}
						</h2>
						<p className="mt-1 text-sm text-(--sea-ink-soft)">
							{t("dashboard.recentAchievementsDescription")}
						</p>

						<div className="mt-4 space-y-3 text-sm text-(--sea-ink-soft)">
							{snapshot.achievements && snapshot.achievements.length > 0 ? (
								snapshot.achievements.slice(0, 5).map((a) => (
									<div
										key={a.id}
										className="flex items-center justify-between gap-3"
									>
										<div>
											<p className="text-sm font-semibold text-(--sea-ink)">
												{a.name ??
													a.goalTitle ??
													t("dashboard.achievementFallback")}
											</p>
											<p className="text-xs text-(--sea-ink-soft)">
												{a.goalTitle
													? `${a.goalTitle} · ${new Date(a.achievedAtIso).toLocaleDateString()}`
													: new Date(a.achievedAtIso).toLocaleDateString()}
											</p>
										</div>
										<div className="text-xs text-(--sea-ink-soft)">
											{a.points ? `${a.points} pts` : (a.grade ?? null)}
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-(--sea-ink-soft)">
									{t("dashboard.noAchievementsYet")}
								</p>
							)}
						</div>
					</article>
				</section>

				{/* ─── Goal Progress + Achievements by Category ─── */}
				<section className="grid gap-4 xl:grid-cols-2">
					<article className="island-shell rounded-2xl p-5 sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<h2 className="text-base font-bold text-(--sea-ink)">
								{t("dashboard.goalProgress")}
							</h2>
							<Goal size={18} className="mt-1 text-(--brand)" />
						</div>
						<div className="mt-4 space-y-3">
							{snapshot.goalProgress.length > 0 ? (
								snapshot.goalProgress.map((goal) => (
									<div
										key={goal.goalId}
										className="rounded-xl border border-(--line) p-3"
									>
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-semibold text-(--sea-ink)">
												{goal.title}
											</p>
											<span className="rounded-full bg-(--link-bg-hover) px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-(--sea-ink-soft)">
												{goal.status}
											</span>
										</div>
										<p className="mt-1 text-xs text-(--sea-ink-soft)">
											{formatHours(goal.actualHours)} / {goal.targetHours}h (
											{goal.completionRate}%)
										</p>
										<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-(--line)">
											<div
												className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--lagoon-deep))]"
												style={{
													width: `${Math.min(goal.completionRate, 100)}%`,
												}}
											/>
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-(--sea-ink-soft)">
									{t("dashboard.noGoalProgressYet")}
								</p>
							)}
						</div>
					</article>

					<article className="island-shell rounded-2xl p-5 sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<h2 className="text-base font-bold text-(--sea-ink)">
								{t("dashboard.achievementByCategory")}
							</h2>
							<Target size={18} className="mt-1 text-(--brand)" />
						</div>
						<div className="mt-4 space-y-3">
							{achievementsByCategory.length > 0 ? (
								achievementsByCategory.map(([category, count]) => (
									<div
										key={category}
										className="rounded-xl border border-(--line) p-3"
									>
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-semibold text-(--sea-ink)">
												{mapCategoryLabel(category)}
											</p>
											<p className="text-xs font-bold text-(--sea-ink-soft)">
												{count}
											</p>
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-(--sea-ink-soft)">
									{t("dashboard.noAchievementsYet")}
								</p>
							)}
						</div>
					</article>
				</section>
			</div>
		</DashboardShell>
	);
}
