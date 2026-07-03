import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { getUserMessage } from "#/lib/errors/extract-error";
import type {
	StudyGoalView,
	StudyRoughPlanView,
} from "#/lib/server/study-manager";
import {
	updateStudyMonthlyPlan,
	upsertStudyMonthlyPlan,
} from "#/lib/server/study-manager";

type MonthlyPlanModalProps = {
	goalId: string;
	goal: StudyGoalView;
	editing: StudyRoughPlanView | null;
	onClose: () => void;
	onSaved: () => void;
};

export default function MonthlyPlanModal({
	goalId,
	goal,
	editing,
	onClose,
	onSaved,
}: MonthlyPlanModalProps) {
	const { t } = useTranslation();
	const [month, setMonth] = useState(
		editing?.month ?? new Date().toISOString().slice(0, 7),
	);
	const [plannedHours, setPlannedHours] = useState(
		String(editing?.plannedHours ?? ""),
	);
	const [notes, setNotes] = useState(editing?.notes ?? "");

	const createMutation = useMutation({
		mutationFn: upsertStudyMonthlyPlan,
		onSuccess: () => {
			toast.success(t("toast.planCreated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.monthlyPlan.createFailed"))),
	});
	const updateMutation = useMutation({
		mutationFn: updateStudyMonthlyPlan,
		onSuccess: () => {
			toast.success(t("toast.planUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.monthlyPlan.updateFailed"))),
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	const [showValidation, setShowValidation] = useState(false);

	const plannedHoursNum = Number(plannedHours);

	const monthError = !month ? t("goals.monthlyPlan.monthRequired") : null;

	const plannedHoursError = !plannedHours
		? t("goals.monthlyPlan.plannedHoursRequired")
		: plannedHoursNum <= 0
			? t("goals.monthlyPlan.plannedHoursTooSmall")
			: null;

	const hasErrors = !!(monthError || plannedHoursError);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		const payload = {
			goalId,
			month,
			plannedHours: plannedHoursNum,
			notes: notes.trim() || undefined,
		};
		if (editing) {
			updateMutation.mutate({ data: { planId: editing.id, ...payload } });
		} else {
			createMutation.mutate({ data: payload });
		}
	}

	return (
		<DashboardModal
			open
			title={editing ? t("modal.editMonthlyPlan") : t("modal.addMonthlyPlan")}
			description={t("goals.monthlyPlan.planFor", { goalTitle: goal.title })}
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
						form="plan-form"
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{isPending
							? t("toast.savingDots")
							: editing
								? t("modal.updatePlan")
								: t("modal.addPlan")}
					</button>
				</div>
			}
		>
			<form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="plan-month"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.monthlyPlan.monthLabel")}
					</label>
					<input
						id="plan-month"
						type="month"
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && monthError && <FieldError message={monthError} />}
				</div>
				<div>
					<label
						htmlFor="plan-hours"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.monthlyPlan.plannedHoursLabel")}
					</label>
					<input
						id="plan-hours"
						type="number"
						value={plannedHours}
						onChange={(e) => setPlannedHours(e.target.value)}
						min={1}
						max={300}
						placeholder={t("goals.monthlyPlan.plannedHoursPlaceholder")}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && plannedHoursError && (
						<FieldError message={plannedHoursError} />
					)}
				</div>
				<div>
					<label
						htmlFor="plan-notes"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.monthlyPlan.notesLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("goals.monthlyPlan.optionalLabel")}
						</span>
					</label>
					<textarea
						id="plan-notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						maxLength={1500}
						rows={3}
						placeholder={t("goals.monthlyPlan.notesPlaceholder")}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2.5 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>
			</form>
		</DashboardModal>
	);
}
