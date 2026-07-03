import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	ChevronDown,
	Clock,
	Edit2,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import {
	formatDate,
	GOAL_STATUSES,
} from "#/components/dashboard/goals/format-utils";
import GoalEditModal from "#/components/dashboard/goals/GoalEditModal";
import MilestoneCard from "#/components/dashboard/goals/MilestoneCard";
import MilestoneModal from "#/components/dashboard/goals/MilestoneModal";
import MonthlyPlanCard from "#/components/dashboard/goals/MonthlyPlanCard";
import MonthlyPlanModal from "#/components/dashboard/goals/MonthlyPlanModal";
import SessionCard from "#/components/dashboard/goals/SessionCard";
import SessionModal from "#/components/dashboard/goals/SessionModal";
import DeleteConfirmModal from "#/components/dashboard/ui/DeleteConfirmModal";
import MiniEmptyState from "#/components/dashboard/ui/MiniEmptyState";
import SectionCard from "#/components/dashboard/ui/SectionCard";
import {
	CATEGORY_COLORS,
	daysRemaining,
	getCategoryMeta,
	STATUS_BADGE,
} from "#/components/dashboard/utils/goal-meta";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { getUserMessage } from "#/lib/errors/extract-error";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import {
	studyDashboardQueryKey,
	studyDashboardQueryOptions,
} from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";
import type {
	StudyMilestoneView,
	StudyRoughPlanView,
	StudySessionView,
} from "#/lib/server/study-manager";
import {
	deleteStudyGoal,
	deleteStudyMilestone,
	deleteStudyMonthlyPlan,
	deleteStudySession,
	toggleStudyMilestoneCompletion,
	updateStudyGoalStatus,
} from "#/lib/server/study-manager";

/* ---------- route config ---------- */

const goalDetailErrorComponent = createServiceRouteErrorComponent({
	unavailableTitle: "Goal temporarily unavailable",
	fallbackTitle: "Unable to load goal",
	fallbackDescription:
		"This goal page could not be loaded right now. Please try again.",
});

export const Route = createFileRoute("/$lang/dashboard/goals/$goalId")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context }) => {
		await requireAuthSession();
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
	},
	pendingComponent: DashboardRoutePending,
	errorComponent: goalDetailErrorComponent,
	component: GoalDetailPage,
});

/* ---------- GoalDetailPage ---------- */

function GoalDetailPage() {
	const { t, i18n } = useTranslation();
	const { goalId } = Route.useParams();
	const lang = useLangParam();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: snapshot, error } = useQuery(studyDashboardQueryOptions());

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyDashboardQueryKey });

	// Modal states
	const [showEditGoal, setShowEditGoal] = useState(false);
	const [showDeleteGoal, setShowDeleteGoal] = useState(false);
	const [showMonthlyPlanModal, setShowMonthlyPlanModal] = useState(false);
	const [editingPlan, setEditingPlan] = useState<StudyRoughPlanView | null>(
		null,
	);
	const [showSessionModal, setShowSessionModal] = useState(false);
	const [editingSession, setEditingSession] = useState<StudySessionView | null>(
		null,
	);
	const [showMilestoneModal, setShowMilestoneModal] = useState(false);
	const [editingMilestone, setEditingMilestone] =
		useState<StudyMilestoneView | null>(null);

	// Mutations
	const statusMutation = useMutation({
		mutationFn: updateStudyGoalStatus,
		onSuccess: () => {
			toast.success(t("toast.statusUpdated"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to update status.")),
	});

	const deleteGoalMutation = useMutation({
		mutationFn: deleteStudyGoal,
		onSuccess: () => {
			toast.success(t("toast.goalDeleted"));
			invalidate();
			navigate({ to: withLang(lang, "/dashboard/goals") });
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to delete goal.")),
	});

	const deleteMonthlyPlanMut = useMutation({
		mutationFn: deleteStudyMonthlyPlan,
		onSuccess: () => {
			toast.success(t("toast.planDeleted"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to delete plan.")),
	});

	const toggleMilestoneMut = useMutation({
		mutationFn: toggleStudyMilestoneCompletion,
		onSuccess: () => {
			toast.success(t("toast.milestoneUpdated"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to toggle milestone.")),
	});

	const deleteMilestoneMut = useMutation({
		mutationFn: deleteStudyMilestone,
		onSuccess: () => {
			toast.success(t("toast.milestoneDeleted"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to delete milestone.")),
	});

	const deleteSessionMut = useMutation({
		mutationFn: deleteStudySession,
		onSuccess: () => {
			toast.success(t("toast.sessionDeleted"));
			invalidate();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, "Failed to delete session.")),
	});

	if (!snapshot) {
		throw error ?? new Error("Missing study dashboard data.");
	}

	const goal = snapshot.goals.find((g) => g.id === goalId);
	const progress = snapshot.goalProgress.find((gp) => gp.goalId === goalId);
	const roughPlans = useMemo(
		() => snapshot.roughPlans.filter((rp) => rp.goalId === goalId),
		[snapshot.roughPlans, goalId],
	);
	const sessions = useMemo(
		() =>
			snapshot.detailedPlans.filter(
				(s) => s.goalId === goalId && s.status !== "completed",
			),
		[snapshot.detailedPlans, goalId],
	);
	const recentSessions = useMemo(
		() => snapshot.recentSessions.filter((s) => s.goalId === goalId),
		[snapshot.recentSessions, goalId],
	);
	const goalMilestones = useMemo(
		() => snapshot.milestones.filter((m) => m.goalId === goalId),
		[snapshot.milestones, goalId],
	);

	if (!goal) {
		return (
			<DashboardShell
				title={t("errors.goalNotFound")}
				description={t("errors.goalNotFoundDescription")}
			>
				<Link
					to={withLang(lang, "/dashboard/goals")}
					className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--brand) hover:underline"
				>
					<ArrowLeft size={14} /> Back to Goals
				</Link>
			</DashboardShell>
		);
	}

	const cat = getCategoryMeta(goal.category);
	const catColors = CATEGORY_COLORS[goal.category];
	const statusBadge = STATUS_BADGE[goal.status] ?? STATUS_BADGE.active;
	const CatIcon = cat.icon;
	const days = daysRemaining(goal.endDateIso);

	return (
		<DashboardShell
			title={goal.title}
			description={`${cat.label} · ${formatDate(goal.startDateIso, i18n.language)} – ${formatDate(goal.endDateIso, i18n.language)}`}
		>
			{/* Back link */}
			<Link
				to={withLang(lang, "/dashboard/goals")}
				className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-(--sea-ink-soft) hover:text-(--brand)"
			>
				<ArrowLeft size={13} /> {t("nav.goals")}
			</Link>

			{/* ─── Goal Header ─── */}
			<div className="mb-6 rounded-2xl border border-(--line) bg-(--surface-strong) p-4 sm:p-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex-1">
						<div className="mb-2 flex flex-wrap items-center gap-2">
							<span
								className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${catColors.bg} ${catColors.text} ${catColors.border}`}
							>
								<CatIcon size={12} /> {t(`goals.category.${goal.category}`)}
							</span>
							<span
								className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text}`}
							>
								{t(`goals.status.${goal.status}`)}
							</span>
							{goal.status === "active" && (
								<span
									className={`text-[11px] font-semibold ${days <= 7 ? "text-rose-600 dark:text-rose-400" : "text-(--sea-ink-soft)"}`}
								>
									{t("goals.remaining", { count: days })}
								</span>
							)}
						</div>
						{goal.description && (
							<p className="mt-1 text-sm text-(--sea-ink-soft)">
								{goal.description}
							</p>
						)}
						<div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-(--sea-ink-soft)">
							<span className="inline-flex items-center gap-1">
								<Calendar size={12} />
								{formatDate(goal.startDateIso, i18n.language)} –{" "}
								{formatDate(goal.endDateIso, i18n.language)}
							</span>
							<span className="inline-flex items-center gap-1">
								<Clock size={12} />
								{goal.targetHours}h {t("goals.targetHours")}
							</span>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Visible goal color swatch */}
						<div
							className="h-8 w-8 rounded-full border border-(--line)"
							style={{ backgroundColor: goal.color }}
							title={t("modal.pickGoalColor")}
						/>
						<div className="relative">
							<select
								value={goal.status}
								onChange={(e) =>
									statusMutation.mutate({
										data: {
											goalId: goal.id,
											status: e.target.value as (typeof GOAL_STATUSES)[number],
										},
									})
								}
								disabled={statusMutation.isPending}
								className="h-8 appearance-none rounded-lg border border-(--line) bg-(--input-field-bg) pl-2.5 pr-7 text-xs font-semibold text-(--sea-ink) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
							>
								{GOAL_STATUSES.map((s) => {
									const label = t(`goals.status.${s}`);
									const capitalized =
										label.charAt(0).toUpperCase() + label.slice(1);
									return (
										<option key={s} value={s}>
											{capitalized}
										</option>
									);
								})}
							</select>
							<ChevronDown
								size={12}
								className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
							/>
						</div>
						<button
							type="button"
							onClick={() => setShowEditGoal(true)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) bg-(--surface-strong) text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--brand)"
						>
							<Edit2 size={14} />
						</button>
						<button
							type="button"
							onClick={() => setShowDeleteGoal(true)}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--line) bg-(--surface-strong) text-(--sea-ink-soft) hover:bg-rose-500/10 hover:text-rose-600"
						>
							<Trash2 size={14} />
						</button>
					</div>
				</div>

				{/* Progress bar */}
				{progress && (
					<div className="mt-4">
						<div className="mb-1 flex items-center justify-between text-xs text-(--sea-ink-soft)">
							<span>
								{progress.actualHours.toFixed(1)}h / {progress.targetHours}h
								{` ${t("goals.logged")}`}
							</span>
							<span className="font-semibold">{progress.completionRate}%</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-(--line)">
							<div
								className="h-full rounded-full bg-(--brand) transition-all"
								style={{ width: `${Math.min(100, progress.completionRate)}%` }}
							/>
						</div>
						{progress.totalMilestones > 0 && (
							<p className="mt-1.5 text-[11px] text-(--sea-ink-soft)">
								{progress.completedMilestones}/{progress.totalMilestones}{" "}
								milestones completed
							</p>
						)}
					</div>
				)}
			</div>

			{/* ─── Sections Grid ─── */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Monthly Plans */}
				<SectionCard
					title={t("modal.monthlyPlans")}
					count={roughPlans.length}
					onAdd={() => {
						setEditingPlan(null);
						setShowMonthlyPlanModal(true);
					}}
				>
					{roughPlans.length === 0 ? (
						<MiniEmptyState text={t("goals.noMonthlyPlansYet")} />
					) : (
						<div className="space-y-2">
							{roughPlans.map((plan) => (
								<MonthlyPlanCard
									key={plan.id}
									plan={plan}
									onEdit={() => {
										setEditingPlan(plan);
										setShowMonthlyPlanModal(true);
									}}
									onDelete={() =>
										deleteMonthlyPlanMut.mutate({ data: { planId: plan.id } })
									}
								/>
							))}
						</div>
					)}
				</SectionCard>

				{/* Milestones */}
				<SectionCard
					title={t("goals.milestonesTitle")}
					count={goalMilestones.length}
					onAdd={() => {
						setEditingMilestone(null);
						setShowMilestoneModal(true);
					}}
				>
					{goalMilestones.length === 0 ? (
						<MiniEmptyState text={t("goals.noMilestonesYet")} />
					) : (
						<div className="space-y-2">
							{goalMilestones.map((ms) => (
								<MilestoneCard
									key={ms.id}
									milestone={ms}
									onToggle={() =>
										toggleMilestoneMut.mutate({
											data: { milestoneId: ms.id, completed: !ms.isCompleted },
										})
									}
									onEdit={() => {
										setEditingMilestone(ms);
										setShowMilestoneModal(true);
									}}
									onDelete={() =>
										deleteMilestoneMut.mutate({ data: { milestoneId: ms.id } })
									}
								/>
							))}
						</div>
					)}
				</SectionCard>
			</div>

			{/* ─── Sessions (full width) ─── */}
			<div className="mt-6">
				<SectionCard
					title={t("goals.sessionsTitle")}
					count={sessions.length + recentSessions.length}
					onAdd={() => {
						setEditingSession(null);
						setShowSessionModal(true);
					}}
				>
					{sessions.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-[11px] font-bold uppercase tracking-wide text-(--sea-ink-soft)">
								{t("goals.planned")}
							</h4>
							{sessions.map((s) => (
								<SessionCard
									key={s.id}
									session={s}
									onEdit={() => {
										setEditingSession(s);
										setShowSessionModal(true);
									}}
									onDelete={() =>
										deleteSessionMut.mutate({ data: { sessionId: s.id } })
									}
								/>
							))}
						</div>
					)}

					{recentSessions.length > 0 && (
						<div className="space-y-2 mt-4">
							<h4 className="text-[11px] font-bold uppercase tracking-wide text-(--sea-ink-soft)">
								{t("goals.status.completed")}
							</h4>
							{recentSessions.map((s) => (
								<SessionCard
									key={s.id}
									session={s}
									onEdit={() => {
										setEditingSession(s);
										setShowSessionModal(true);
									}}
									onDelete={() =>
										deleteSessionMut.mutate({ data: { sessionId: s.id } })
									}
								/>
							))}
						</div>
					)}

					{sessions.length === 0 && recentSessions.length === 0 && (
						<MiniEmptyState text={t("goals.noSessionsYet")} />
					)}
				</SectionCard>
			</div>

			{/* ─── Modals ─── */}
			{showEditGoal && (
				<GoalEditModal
					goal={goal}
					onClose={() => setShowEditGoal(false)}
					onSaved={() => {
						setShowEditGoal(false);
						invalidate();
					}}
				/>
			)}

			{showDeleteGoal && (
				<DeleteConfirmModal
					title={t("modal.deleteGoalTitle")}
					description={`Are you sure you want to delete "${goal.title}"? All associated plans, sessions and milestones will be removed. This cannot be undone.`}
					onConfirm={() => {
						deleteGoalMutation.mutate({ data: { goalId: goal.id } });
						setShowDeleteGoal(false);
					}}
					onClose={() => setShowDeleteGoal(false)}
					isPending={deleteGoalMutation.isPending}
				/>
			)}

			{showMonthlyPlanModal && (
				<MonthlyPlanModal
					goalId={goalId}
					goal={goal}
					editing={editingPlan}
					onClose={() => {
						setShowMonthlyPlanModal(false);
						setEditingPlan(null);
					}}
					onSaved={() => {
						setShowMonthlyPlanModal(false);
						setEditingPlan(null);
						invalidate();
					}}
				/>
			)}

			{showSessionModal && (
				<SessionModal
					goalId={goalId}
					goal={goal}
					editing={editingSession}
					onClose={() => {
						setShowSessionModal(false);
						setEditingSession(null);
					}}
					onSaved={() => {
						setShowSessionModal(false);
						setEditingSession(null);
						invalidate();
					}}
				/>
			)}

			{showMilestoneModal && (
				<MilestoneModal
					goalId={goalId}
					goal={goal}
					editing={editingMilestone}
					onClose={() => {
						setShowMilestoneModal(false);
						setEditingMilestone(null);
					}}
					onSaved={() => {
						setShowMilestoneModal(false);
						setEditingMilestone(null);
						invalidate();
					}}
				/>
			)}
		</DashboardShell>
	);
}
