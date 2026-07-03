import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import GoalCard from "#/components/dashboard/goals/GoalCard";
import GoalFilters from "#/components/dashboard/goals/GoalFilters";
import GoalFormModal from "#/components/dashboard/goals/GoalFormModal";
import EmptyState from "#/components/dashboard/ui/EmptyState";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import type { SupportedLanguage } from "#/lib/i18n";
import { seoHead } from "#/lib/i18n/seo";
import {
	studyDashboardQueryKey,
	studyDashboardQueryOptions,
} from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";
import type { GoalCategory } from "#/lib/server/study-manager";

const goalsRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.goalsUnavailableTitle",
	fallbackTitleKey: "errors.goalsLoadFailedTitle",
	fallbackDescriptionKey: "errors.goalsLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/dashboard/goals/")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context, params }) => {
		await requireAuthSession({ lang: params.lang as SupportedLanguage });
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
	},
	head: ({ params }) =>
		seoHead(
			"dashboardTitle",
			"dashboardDescription",
			params.lang as SupportedLanguage,
			"/dashboard/goals",
		),
	pendingComponent: DashboardRoutePending,
	errorComponent: goalsRouteErrorComponent,
	component: GoalsPage,
});

/* ---------- GoalsPage ---------- */

function GoalsPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: snapshot, error } = useQuery(studyDashboardQueryOptions());

	if (!snapshot) {
		throw error ?? new Error("Missing study dashboard data.");
	}

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "paused" | "completed" | "failed"
	>("active");
	const [categoryFilter, setCategoryFilter] = useState<GoalCategory | "all">(
		"all",
	);
	const [showCreateModal, setShowCreateModal] = useState(false);

	const goals = snapshot.goals;
	const goalProgress = snapshot.goalProgress;

	const filteredGoals = useMemo(() => {
		let result = goals;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(g) =>
					g.title.toLowerCase().includes(q) ||
					g.description?.toLowerCase().includes(q),
			);
		}

		if (statusFilter !== "all") {
			result = result.filter((g) => g.status === statusFilter);
		}

		if (categoryFilter !== "all") {
			result = result.filter((g) => g.category === categoryFilter);
		}

		const statusOrder: Record<string, number> = {
			active: 0,
			paused: 1,
			failed: 2,
			completed: 3,
		};
		result = [...result].sort(
			(a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4),
		);

		return result;
	}, [goals, searchQuery, statusFilter, categoryFilter]);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyDashboardQueryKey });

	return (
		<DashboardShell
			title={t("goals.title")}
			description={t("goals.description")}
		>
			<GoalFilters
				searchQuery={searchQuery}
				statusFilter={statusFilter}
				categoryFilter={categoryFilter}
				onSearchChange={setSearchQuery}
				onStatusChange={setStatusFilter}
				onCategoryChange={setCategoryFilter}
				onCreate={() => setShowCreateModal(true)}
			/>

			{/* ─── Goal cards ─── */}
			{filteredGoals.length === 0 ? (
				<EmptyState
					icon={<Target size={36} />}
					title={
						goals.length === 0
							? t("goals.noGoalsYet")
							: t("goals.noMatchingGoals")
					}
					description={
						goals.length === 0
							? t("goals.createFirstGoal")
							: t("goals.tryAdjustingFilters")
					}
					action={
						goals.length === 0
							? {
									label: t("modal.createGoalLabel"),
									onClick: () => setShowCreateModal(true),
								}
							: undefined
					}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filteredGoals.map((goal) => (
						<GoalCard
							key={goal.id}
							goal={goal}
							progress={goalProgress.find((gp) => gp.goalId === goal.id)}
						/>
					))}
				</div>
			)}

			{showCreateModal && (
				<GoalFormModal
					open={showCreateModal}
					onClose={() => setShowCreateModal(false)}
					onSaved={() => {
						setShowCreateModal(false);
						invalidate();
					}}
				/>
			)}
		</DashboardShell>
	);
}
