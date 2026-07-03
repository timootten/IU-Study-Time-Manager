import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
	getAchievementCategoryColors,
	getGradeLabel,
	gradeToPoints,
	pointsToGrade,
} from "#/components/dashboard/achievements/achievement-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { GOAL_CATEGORIES } from "#/components/dashboard/utils/goal-meta";
import { getUserMessage } from "#/lib/errors/extract-error";
import type {
	GoalCategory,
	StudyAchievementView,
	StudyGoalView,
} from "#/lib/server/study-manager";
import {
	createStudyAchievement,
	updateStudyAchievement,
} from "#/lib/server/study-manager";

type AchievementFormModalProps = {
	mode: "create" | "edit";
	achievement?: StudyAchievementView;
	goals: StudyGoalView[];
	onClose: () => void;
	onSaved: () => void;
};

export default function AchievementFormModal({
	mode,
	achievement,
	goals,
	onClose,
	onSaved,
}: AchievementFormModalProps) {
	const { t } = useTranslation();
	const [goalId, setGoalId] = useState(achievement?.goalId ?? "");
	const [category, setCategory] = useState<GoalCategory>(
		achievement?.category ?? "exam",
	);
	const [name, setName] = useState(achievement?.name ?? "");
	const [achievedAt, setAchievedAt] = useState(
		achievement?.achievedAtIso
			? achievement.achievedAtIso.slice(0, 10)
			: new Date().toISOString().slice(0, 10),
	);
	const [grade, setGrade] = useState(achievement?.grade ?? "");
	const [points, setPoints] = useState(achievement?.points?.toString() ?? "");
	const [notes, setNotes] = useState(achievement?.notes ?? "");

	const selectedGoal = goals.find((g) => g.id === goalId);
	const nameRequired = !goalId;

	function handleGoalChange(newGoalId: string) {
		setGoalId(newGoalId);
		const goal = goals.find((g) => g.id === newGoalId);
		if (goal) {
			setCategory(goal.category);
		}
	}

	function handleGradeChange(value: string) {
		setGrade(value);
		if (/^\d\.\d$/.test(value)) {
			const pts = gradeToPoints(value);
			if (pts !== null) {
				setPoints(String(pts));
			}
		}
	}

	function handlePointsChange(value: string) {
		setPoints(value);
		const num = Number(value);
		if (!Number.isNaN(num) && num >= 0 && num <= 100) {
			const g = pointsToGrade(num);
			if (g !== null) {
				setGrade(g);
			}
		}
	}

	const createMutation = useMutation({
		mutationFn: createStudyAchievement,
		onSuccess: () => {
			toast.success(t("toast.achievementRecorded"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("achievements.form.createFailed"))),
	});

	const updateMutation = useMutation({
		mutationFn: updateStudyAchievement,
		onSuccess: () => {
			toast.success(t("toast.achievementUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("achievements.form.updateFailed"))),
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	const [showValidation, setShowValidation] = useState(false);

	const achievedAtError = !achievedAt
		? t("achievements.form.dateRequired")
		: null;

	const nameValue = name.trim();
	const nameError =
		nameRequired && !nameValue
			? t("achievements.form.nameRequiredError")
			: null;

	const hasErrors = !!(achievedAtError || nameError);

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		const payload = {
			goalId: goalId || undefined,
			category,
			name: nameValue || undefined,
			achievedAt: new Date(achievedAt).toISOString(),
			grade: grade || null,
			points: points ? Number(points) : null,
			notes: notes.trim() || undefined,
		};

		if (mode === "edit" && achievement) {
			updateMutation.mutate({
				data: { achievementId: achievement.id, ...payload },
			});
			return;
		}

		createMutation.mutate({ data: payload });
	}

	const gradeLabel = /^\d\.\d$/.test(grade) ? getGradeLabel(grade) : null;

	return (
		<DashboardModal
			open
			title={
				mode === "create"
					? t("modal.recordAchievement")
					: t("modal.editAchievement")
			}
			description={
				mode === "create"
					? t("achievements.form.createDescription")
					: t("achievements.form.editDescription")
			}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("achievements.form.cancelBtn")}
					</button>
					<button
						type="submit"
						form="achievement-form"
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{isPending
							? t("modal.savingBtn")
							: mode === "create"
								? t("modal.recordAchievementBtn")
								: t("modal.saveChanges")}
					</button>
				</div>
			}
		>
			<form id="achievement-form" onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="achievement-goal"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("achievements.form.goalLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("achievements.form.goalOptional")}
						</span>
					</label>
					<select
						id="achievement-goal"
						data-autofocus
						value={goalId}
						onChange={(event) => handleGoalChange(event.target.value)}
						className="h-10 w-full appearance-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					>
						<option value="">{t("achievements.form.noLinkedGoal")}</option>
						{goals.map((goal) => (
							<option key={goal.id} value={goal.id}>
								{goal.title}
							</option>
						))}
					</select>
					{selectedGoal && (
						<p className="mt-1 text-[11px] text-(--sea-ink-soft)">
							{t(`goals.category.${selectedGoal.category}`)} ·{" "}
							{selectedGoal.requiredCount > 1
								? t("achievements.form.goalInfoRequired", {
										count: selectedGoal.requiredCount,
									})
								: t("achievements.form.goalInfoRequired", { count: 1 })}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="achievement-category"
						className="mb-1.5 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("achievements.form.categoryLabel")}
					</label>
					<div id="achievement-category" className="flex flex-wrap gap-2">
						{GOAL_CATEGORIES.map((cat) => {
							const colors = getAchievementCategoryColors(cat.value);
							const isActive = category === cat.value;
							const CatIcon = cat.icon;
							return (
								<button
									type="button"
									key={cat.value}
									onClick={() => setCategory(cat.value)}
									className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
										isActive
											? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-(--brand)/30`
											: "border-(--line) bg-(--surface) text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
									}`}
								>
									<CatIcon size={13} />
									{t(`goals.category.${cat.value}`)}
								</button>
							);
						})}
					</div>
				</div>

				<div>
					<label
						htmlFor="achievement-name"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("achievements.form.nameLabel")}{" "}
						{nameRequired ? (
							t("achievements.form.nameRequiredStar")
						) : (
							<span className="font-normal text-(--sea-ink-soft)">
								{t("achievements.form.nameOptional")}
							</span>
						)}
					</label>
					<input
						id="achievement-name"
						type="text"
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={180}
						placeholder={
							nameRequired
								? t("achievements.form.namePlaceholderRequired")
								: t("achievements.form.namePlaceholder")
						}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && nameError && <FieldError message={nameError} />}
				</div>

				<div>
					<label
						htmlFor="achievement-date"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("achievements.form.dateLabel")}
					</label>
					<input
						id="achievement-date"
						type="date"
						value={achievedAt}
						onChange={(event) => setAchievedAt(event.target.value)}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && achievedAtError && (
						<FieldError message={achievedAtError} />
					)}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="achievement-grade"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("achievements.form.gradeLabel")}{" "}
							<span className="font-normal text-(--sea-ink-soft)">
								{t("achievements.form.gradeHint")}
							</span>
						</label>
						<input
							id="achievement-grade"
							type="text"
							value={grade}
							onChange={(event) => handleGradeChange(event.target.value)}
							placeholder={t("achievements.form.gradePlaceholder")}
							maxLength={3}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{gradeLabel && (
							<p className="mt-1 text-[11px] italic text-(--sea-ink-soft)">
								{gradeLabel}
							</p>
						)}
					</div>
					<div>
						<label
							htmlFor="achievement-points"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("achievements.form.scoreLabel")}{" "}
							<span className="font-normal text-(--sea-ink-soft)">
								{t("achievements.form.scoreHint")}
							</span>
						</label>
						<input
							id="achievement-points"
							type="number"
							value={points}
							onChange={(event) => handlePointsChange(event.target.value)}
							min={0}
							max={100}
							placeholder={t("achievements.form.scorePlaceholder")}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
					</div>
				</div>

				<div>
					<label
						htmlFor="achievement-notes"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("achievements.form.notesLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("achievements.form.notesOptional")}
						</span>
					</label>
					<textarea
						id="achievement-notes"
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						maxLength={1500}
						rows={3}
						placeholder={t("achievements.form.notesPlaceholder")}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2.5 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>
			</form>
		</DashboardModal>
	);
}
