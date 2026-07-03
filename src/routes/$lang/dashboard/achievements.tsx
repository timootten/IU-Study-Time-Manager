import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
	AchievementCard,
	AchievementDeleteModal,
	AchievementDetailModal,
	AchievementEmptyState,
	AchievementFilters,
	AchievementFormModal,
	AchievementHeaderStats,
} from "#/components/dashboard/achievements";
import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { getUserMessage } from "#/lib/errors/extract-error";
import {
	studyDashboardQueryKey,
	studyDashboardQueryOptions,
} from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";
import type {
	GoalCategory,
	StudyAchievementView,
} from "#/lib/server/study-manager";
import { deleteStudyAchievement } from "#/lib/server/study-manager";

const achievementsRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitle: "Achievements temporarily unavailable",
	fallbackTitle: "Unable to load achievements",
	fallbackDescription:
		"This achievements page could not be loaded right now. Please try again.",
});

export const Route = createFileRoute("/$lang/dashboard/achievements")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context }) => {
		await requireAuthSession();
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
	},
	pendingComponent: DashboardRoutePending,
	errorComponent: achievementsRouteErrorComponent,
	component: AchievementsPage,
});

/* ─────────────────────────────────────────────────────────── */
/*  AchievementsPage                                           */
/* ─────────────────────────────────────────────────────────── */

function AchievementsPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: snapshot } = useQuery(studyDashboardQueryOptions());

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<GoalCategory | "all">(
		"all",
	);
	const [goalFilter, setGoalFilter] = useState<string>("all");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editAchievement, setEditAchievement] =
		useState<StudyAchievementView | null>(null);
	const [detailAchievement, setDetailAchievement] =
		useState<StudyAchievementView | null>(null);
	const [deleteConfirm, setDeleteConfirm] =
		useState<StudyAchievementView | null>(null);

	// Always call hooks in the same order
	const allAchievements = snapshot ? snapshot.achievements : [];
	const goalsWithAchievements = useMemo(() => {
		if (!snapshot) return [];
		const goalIds = new Set(
			allAchievements.map((a) => a.goalId).filter(Boolean),
		);
		return snapshot.goals.filter((g) => goalIds.has(g.id));
	}, [allAchievements, snapshot]);

	const filteredAchievements = useMemo(() => {
		let result = allAchievements;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(a) =>
					a.goalTitle?.toLowerCase().includes(q) ||
					a.name?.toLowerCase().includes(q) ||
					a.notes?.toLowerCase().includes(q),
			);
		}

		if (categoryFilter !== "all") {
			result = result.filter((a) => a.category === categoryFilter);
		}

		if (goalFilter !== "all") {
			result = result.filter((a) => a.goalId === goalFilter);
		}

		return result;
	}, [allAchievements, searchQuery, categoryFilter, goalFilter]);

	const { avgGrade, avgPoints, gradeCount, pointsCount } = useMemo(() => {
		const grades: number[] = [];
		const pts: number[] = [];
		for (const a of allAchievements) {
			if (a.grade) {
				const g = Number.parseFloat(a.grade);
				if (!Number.isNaN(g)) grades.push(g);
			}
			if (a.points !== null) {
				pts.push(a.points);
			}
		}
		return {
			avgGrade:
				grades.length > 0
					? grades.reduce((s, v) => s + v, 0) / grades.length
					: null,
			avgPoints:
				pts.length > 0 ? pts.reduce((s, v) => s + v, 0) / pts.length : null,
			gradeCount: grades.length,
			pointsCount: pts.length,
		};
	}, [allAchievements]);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyDashboardQueryKey });

	const deleteMutation = useMutation({
		mutationFn: deleteStudyAchievement,
		onSuccess: () => {
			toast.success(t("toast.achievementDeleted"));
			invalidate();
			setDeleteConfirm(null);
			setDetailAchievement(null);
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Unable to delete achievement.")),
	});

	if (!snapshot) return null;

	return (
		<DashboardShell
			title={t("achievements.title")}
			description={t("achievements.description")}
			headerExtra={
				allAchievements.length > 0 &&
				(avgGrade !== null || avgPoints !== null) ? (
					<AchievementHeaderStats
						avgGrade={avgGrade}
						avgPoints={avgPoints}
						gradeCount={gradeCount}
						pointsCount={pointsCount}
					/>
				) : undefined
			}
		>
			<AchievementFilters
				searchQuery={searchQuery}
				categoryFilter={categoryFilter}
				goalFilter={goalFilter}
				goalsWithAchievements={goalsWithAchievements}
				onSearchChange={setSearchQuery}
				onCategoryChange={setCategoryFilter}
				onGoalChange={setGoalFilter}
				onCreate={() => setShowCreateModal(true)}
			/>

			{/* ─── Achievement cards ─── */}
			{filteredAchievements.length === 0 ? (
				<AchievementEmptyState
					isEmptyAll={allAchievements.length === 0}
					onCreate={() => setShowCreateModal(true)}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filteredAchievements.map((achievement) => (
						<AchievementCard
							key={achievement.id}
							achievement={achievement}
							onSelect={setDetailAchievement}
						/>
					))}
				</div>
			)}

			{/* ─── Create modal ─── */}
			{showCreateModal && (
				<AchievementFormModal
					mode="create"
					goals={snapshot.goals}
					onClose={() => setShowCreateModal(false)}
					onSaved={() => {
						setShowCreateModal(false);
						invalidate();
					}}
				/>
			)}

			{editAchievement && (
				<AchievementFormModal
					mode="edit"
					achievement={editAchievement}
					goals={snapshot.goals}
					onClose={() => setEditAchievement(null)}
					onSaved={() => {
						setEditAchievement(null);
						setDetailAchievement(null);
						invalidate();
					}}
				/>
			)}

			{detailAchievement && !editAchievement && (
				<AchievementDetailModal
					achievement={detailAchievement}
					onClose={() => setDetailAchievement(null)}
					onEdit={() => setEditAchievement(detailAchievement)}
					onDelete={() => setDeleteConfirm(detailAchievement)}
				/>
			)}

			{deleteConfirm && (
				<AchievementDeleteModal
					achievement={deleteConfirm}
					isPending={deleteMutation.isPending}
					onCancel={() => setDeleteConfirm(null)}
					onConfirm={(achievement) =>
						deleteMutation.mutate({
							data: { achievementId: achievement.id },
						})
					}
				/>
			)}
		</DashboardShell>
	);
}
