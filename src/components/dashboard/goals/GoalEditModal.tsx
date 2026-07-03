import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import {
	CATEGORY_COLORS,
	GOAL_CATEGORIES,
} from "#/components/dashboard/utils/goal-meta";
import { getUserMessage } from "#/lib/errors/extract-error";
import type { GoalCategory, StudyGoalView } from "#/lib/server/study-manager";
import { updateStudyGoal } from "#/lib/server/study-manager";

type GoalEditModalProps = {
	goal: StudyGoalView;
	onClose: () => void;
	onSaved: () => void;
};

export default function GoalEditModal({
	goal,
	onClose,
	onSaved,
}: GoalEditModalProps) {
	const { t } = useTranslation();

	const [title, setTitle] = useState(goal.title);
	const [description, setDescription] = useState(goal.description ?? "");
	const [category, setCategory] = useState<GoalCategory>(goal.category);
	const [color, setColor] = useState(goal.color ?? randomBrightColor());
	const [targetHours, setTargetHours] = useState(String(goal.targetHours));
	const [requiredCount, setRequiredCount] = useState(
		String(goal.requiredCount),
	);
	const [startDate, setStartDate] = useState(goal.startDateIso.slice(0, 10));
	const [endDate, setEndDate] = useState(goal.endDateIso.slice(0, 10));

	const mutation = useMutation({
		mutationFn: updateStudyGoal,
		onSuccess: () => {
			toast.success(t("toast.goalUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.goalUpdateFailed"))),
	});

	const [showValidation, setShowValidation] = useState(false);

	const titleValue = title.trim();
	const targetHoursNum = Number(targetHours);

	const titleError = !titleValue
		? t("goals.form.titleRequired")
		: titleValue.length < 3
			? t("goals.form.titleTooShort")
			: null;

	const targetHoursError = !targetHours
		? t("goals.form.targetHoursRequired")
		: targetHoursNum <= 0
			? t("goals.form.targetHoursTooSmall")
			: null;

	const endDateError = !endDate
		? t("goals.form.endDateRequired")
		: new Date(endDate) <= new Date(startDate)
			? t("goals.form.endDateBeforeStart")
			: null;

	const hasErrors = !!(titleError || targetHoursError || endDateError);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		mutation.mutate({
			data: {
				goalId: goal.id,
				title: titleValue,
				description: description.trim() || undefined,
				category,
				color,
				targetHours: targetHoursNum,
				requiredCount: Number(requiredCount) || 1,
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
			},
		});
	}

	return (
		<DashboardModal
			open
			title={t("modal.editGoal")}
			description={t("modal.editGoalDescription")}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("common.cancel")}
					</button>
					<button
						type="submit"
						form="edit-goal-form"
						disabled={mutation.isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{mutation.isPending
							? t("toast.savingDots")
							: t("modal.saveChanges")}
					</button>
				</div>
			}
		>
			<form id="edit-goal-form" onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="edit-goal-title"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.titleLabel")}
					</label>
					<input
						id="edit-goal-title"
						data-autofocus
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={120}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && titleError && <FieldError message={titleError} />}
				</div>
				<fieldset>
					<legend className="mb-1.5 block text-xs font-semibold text-(--sea-ink)">
						{t("goals.form.categoryLabel")}
					</legend>
					<div className="flex flex-wrap gap-2">
						{GOAL_CATEGORIES.map((cat) => {
							const colors = CATEGORY_COLORS[cat.value];
							const CatIcon = cat.icon;
							return (
								<button
									key={cat.value}
									type="button"
									onClick={() => setCategory(cat.value)}
									className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${category === cat.value ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-(--brand)/30` : "border-(--line) bg-(--surface) text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"}`}
								>
									<CatIcon size={13} /> {t(`goals.category.${cat.value}`)}
								</button>
							);
						})}
					</div>
				</fieldset>
				<div>
					<label
						htmlFor="edit-goal-color"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.goalColorLabel")}
					</label>
					<div className="flex items-center gap-3">
						<label
							className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
							style={{ backgroundColor: color }}
							title={t("goals.form.pickGoalColor")}
						>
							<input
								id="edit-goal-color"
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="sr-only"
								aria-label={t("goals.form.pickGoalColor")}
							/>
						</label>
						<button
							type="button"
							onClick={() => setColor(randomBrightColor())}
							className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
						>
							{t("goals.form.randomColor")}
						</button>
					</div>
				</div>
				<div>
					<label
						htmlFor="edit-goal-description"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.descriptionLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("goals.form.optionalLabel")}
						</span>
					</label>
					<textarea
						id="edit-goal-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						maxLength={1500}
						rows={3}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2.5 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="edit-goal-target-hours"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.targetHoursLabel")}
						</label>
						<input
							id="edit-goal-target-hours"
							type="number"
							value={targetHours}
							onChange={(e) => setTargetHours(e.target.value)}
							min={1}
							max={2000}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && targetHoursError && (
							<FieldError message={targetHoursError} />
						)}
					</div>
					<div>
						<label
							htmlFor="edit-goal-required-count"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.requiredSubmissionsLabel")}
						</label>
						<input
							id="edit-goal-required-count"
							type="number"
							value={requiredCount}
							onChange={(e) => setRequiredCount(e.target.value)}
							min={1}
							max={100}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="edit-goal-start-date"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.startDateLabel")}
						</label>
						<input
							id="edit-goal-start-date"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
					</div>
					<div>
						<label
							htmlFor="edit-goal-end-date"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.endDateLabel")}
						</label>
						<input
							id="edit-goal-end-date"
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							min={startDate}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && endDateError && (
							<FieldError message={endDateError} />
						)}
					</div>
				</div>
			</form>
		</DashboardModal>
	);
}
