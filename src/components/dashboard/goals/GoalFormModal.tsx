import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function addSixMonths(dateStr: string): string {
	const d = new Date(dateStr);
	d.setMonth(d.getMonth() + 6);
	return d.toISOString().slice(0, 10);
}

import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import {
	CATEGORY_COLORS,
	GOAL_CATEGORIES,
} from "#/components/dashboard/utils/goal-meta";
import { getUserMessage } from "#/lib/errors/extract-error";
import type { GoalCategory } from "#/lib/server/study-manager";
import { createStudyGoal } from "#/lib/server/study-manager";

type GoalFormModalProps = {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
};

export default function GoalFormModal({
	open,
	onClose,
	onSaved,
}: GoalFormModalProps) {
	const { t } = useTranslation();
	const todayStr = new Date().toISOString().slice(0, 10);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<GoalCategory>("other");
	const [color, setColor] = useState(() => randomBrightColor());
	const [targetHours, setTargetHours] = useState("");
	const [requiredCount, setRequiredCount] = useState("1");
	const [startDate, setStartDate] = useState(todayStr);
	const [endDate, setEndDate] = useState(() => addSixMonths(todayStr));

	const endDateManuallySetRef = useRef(false);
	const [showValidation, setShowValidation] = useState(false);

	const createMutation = useMutation({
		mutationFn: createStudyGoal,
		onSuccess: () => {
			toast.success(t("toast.goalCreated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.form.createFailed"))),
	});

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

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		createMutation.mutate({
			data: {
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
			open={open}
			title={t("modal.createGoal")}
			description={t("modal.createGoalDescription")}
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
						form="goal-form"
						disabled={createMutation.isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{createMutation.isPending
							? t("toast.creating")
							: t("modal.createGoalBtn")}
					</button>
				</div>
			}
		>
			<form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="goal-title"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.titleLabel")}
					</label>
					<input
						id="goal-title"
						data-autofocus
						type="text"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						maxLength={120}
						placeholder={t("goals.form.titlePlaceholder")}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && titleError && <FieldError message={titleError} />}
				</div>

				<div>
					<label
						htmlFor="goal-color"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.goalColorLabel")}
					</label>
					<div className="flex items-center gap-3">
						<label
							htmlFor="goal-color"
							className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
							style={{ backgroundColor: color }}
							title={t("goals.form.pickGoalColor")}
						>
							<input
								id="goal-color"
								type="color"
								value={color}
								onChange={(event) => setColor(event.target.value)}
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
						htmlFor="goal-category"
						className="mb-1.5 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.categoryLabel")}
					</label>
					<div id="goal-category" className="flex flex-wrap gap-2">
						{GOAL_CATEGORIES.map((cat) => {
							const colors = CATEGORY_COLORS[cat.value];
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
						htmlFor="goal-description"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.form.descriptionLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("goals.form.optionalLabel")}
						</span>
					</label>
					<textarea
						id="goal-description"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						maxLength={1500}
						rows={3}
						placeholder={t("goals.form.descriptionPlaceholder")}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2.5 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="goal-target-hours"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.targetHoursLabel")}
						</label>
						<input
							id="goal-target-hours"
							type="number"
							value={targetHours}
							onChange={(event) => setTargetHours(event.target.value)}
							min={1}
							max={2000}
							placeholder={t("goals.form.targetHoursPlaceholder")}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && targetHoursError && (
							<FieldError message={targetHoursError} />
						)}
					</div>
					<div>
						<label
							htmlFor="goal-required-count"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.requiredSubmissionsLabel")}
						</label>
						<input
							id="goal-required-count"
							type="number"
							value={requiredCount}
							onChange={(event) => setRequiredCount(event.target.value)}
							min={1}
							max={100}
							placeholder={t("goals.form.requiredSubmissionsPlaceholder")}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label
							htmlFor="goal-start-date"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.startDateLabel")}
						</label>
						<input
							id="goal-start-date"
							type="date"
							value={startDate}
							onChange={(event) => {
								setStartDate(event.target.value);
								if (!endDateManuallySetRef.current) {
									setEndDate(addSixMonths(event.target.value));
								}
							}}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
					</div>
					<div>
						<label
							htmlFor="goal-end-date"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.form.endDateLabel")}
						</label>
						<input
							id="goal-end-date"
							type="date"
							value={endDate}
							onChange={(event) => {
								setEndDate(event.target.value);
								endDateManuallySetRef.current = true;
							}}
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
