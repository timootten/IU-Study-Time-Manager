import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { getUserMessage } from "#/lib/errors/extract-error";
import type {
	StudyGoalView,
	StudyMilestoneView,
} from "#/lib/server/study-manager";
import {
	createStudyMilestone,
	updateStudyMilestone,
} from "#/lib/server/study-manager";

type MilestoneModalProps = {
	goalId: string;
	goal: StudyGoalView;
	editing: StudyMilestoneView | null;
	onClose: () => void;
	onSaved: () => void;
};

export default function MilestoneModal({
	goalId,
	goal,
	editing,
	onClose,
	onSaved,
}: MilestoneModalProps) {
	const { t } = useTranslation();
	const [title, setTitle] = useState(editing?.title ?? "");
	const [dueDate, setDueDate] = useState(
		editing?.dueDateIso.slice(0, 10) ?? "",
	);

	const createMutation = useMutation({
		mutationFn: createStudyMilestone,
		onSuccess: () => {
			toast.success(t("toast.milestoneCreated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.milestone.createFailed"))),
	});
	const updateMutation = useMutation({
		mutationFn: updateStudyMilestone,
		onSuccess: () => {
			toast.success(t("toast.milestoneUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.milestone.updateFailed"))),
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	const [showValidation, setShowValidation] = useState(false);

	const titleValue = title.trim();
	const titleError = !titleValue
		? t("goals.milestone.titleRequired")
		: titleValue.length < 3
			? t("goals.milestone.titleTooShort")
			: null;

	const dueDateError = !dueDate ? t("goals.milestone.dueDateRequired") : null;

	const hasErrors = !!(titleError || dueDateError);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		const payload = {
			goalId,
			title: titleValue,
			dueDate: new Date(dueDate).toISOString(),
		};
		if (editing) {
			updateMutation.mutate({ data: { milestoneId: editing.id, ...payload } });
		} else {
			createMutation.mutate({ data: payload });
		}
	}

	return (
		<DashboardModal
			open
			title={editing ? t("modal.editMilestone") : t("modal.addMilestone")}
			description={t("goals.milestone.manageFor", { goalTitle: goal.title })}
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
						form="milestone-form"
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{isPending
							? t("toast.savingDots")
							: editing
								? t("common.edit")
								: t("common.add")}
					</button>
				</div>
			}
		>
			<form id="milestone-form" onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="milestone-title"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.milestone.titleLabel")}
					</label>
					<input
						id="milestone-title"
						data-autofocus
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={180}
						placeholder={t("goals.milestone.titlePlaceholder")}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && titleError && <FieldError message={titleError} />}
				</div>
				<div>
					<label
						htmlFor="milestone-due-date"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.milestone.dueDateLabel")}
					</label>
					<input
						id="milestone-due-date"
						type="date"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						min={goal.startDateIso.slice(0, 10)}
						max={goal.endDateIso.slice(0, 10)}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && dueDateError && (
						<FieldError message={dueDateError} />
					)}
				</div>
			</form>
		</DashboardModal>
	);
}
