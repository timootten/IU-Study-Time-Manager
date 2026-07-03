import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toDatetimeLocal } from "#/components/dashboard/goals/format-utils";
import { datetimeLocalToIso } from "#/components/dashboard/timer/timer-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { getUserMessage } from "#/lib/errors/extract-error";
import type {
	SessionCategory,
	StudyGoalView,
	StudySessionView,
} from "#/lib/server/study-manager";
import {
	createStudyDetailedPlan,
	updateStudyDetailedPlan,
	updateStudyTimeEntry,
} from "#/lib/server/study-manager";

type SessionModalProps = {
	goalId: string;
	goal: StudyGoalView;
	editing: StudySessionView | null;
	onClose: () => void;
	onSaved: () => void;
};

export default function SessionModal({
	goalId,
	goal,
	editing,
	onClose,
	onSaved,
}: SessionModalProps) {
	const { t } = useTranslation();
	const isEditing = !!editing;
	const isCompleted = editing?.status === "completed";

	const defaultFrom = (() => {
		if (editing?.startIso) return toDatetimeLocal(editing.startIso);
		const now = new Date();
		now.setMinutes(0, 0, 0);
		now.setHours(now.getHours() + 1);
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
	})();

	const defaultUntil = (() => {
		if (editing?.endIso) return toDatetimeLocal(editing.endIso);
		const from = new Date(defaultFrom);
		from.setHours(from.getHours() + 1);
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}T${pad(from.getHours())}:${pad(from.getMinutes())}`;
	})();

	const [fromValue, setFromValue] = useState(defaultFrom);
	const [untilValue, setUntilValue] = useState(defaultUntil);
	const [category, setCategory] = useState<SessionCategory>(
		editing?.category ?? "learning",
	);
	const [countsTowardGoal, setCountsTowardGoal] = useState(
		editing?.countsTowardGoal ?? editing?.category !== "course",
	);
	const [notes, setNotes] = useState(editing?.notes ?? "");

	useEffect(() => {
		if (category === "course" && !editing) setCountsTowardGoal(false);
	}, [category, editing]);

	function handleFromChange(newFrom: string) {
		const oldFrom = new Date(fromValue).getTime();
		const oldUntil = new Date(untilValue).getTime();
		const gap = oldUntil - oldFrom;
		setFromValue(newFrom);
		const newUntilTime =
			new Date(newFrom).getTime() + (gap > 0 ? gap : 3600000);
		const newUntil = new Date(newUntilTime);
		const pad = (n: number) => n.toString().padStart(2, "0");
		setUntilValue(
			`${newUntil.getFullYear()}-${pad(newUntil.getMonth() + 1)}-${pad(newUntil.getDate())}T${pad(newUntil.getHours())}:${pad(newUntil.getMinutes())}`,
		);
	}

	const createMutation = useMutation({
		mutationFn: createStudyDetailedPlan,
		onSuccess: () => {
			toast.success(t("toast.sessionPlanned"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.session.createFailed"))),
	});

	const updatePlannedMutation = useMutation({
		mutationFn: updateStudyDetailedPlan,
		onSuccess: () => {
			toast.success(t("toast.sessionUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.session.updateFailed"))),
	});

	const updateCompletedMutation = useMutation({
		mutationFn: updateStudyTimeEntry,
		onSuccess: () => {
			toast.success(t("toast.sessionUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("goals.session.updateFailed"))),
	});

	const isPending =
		createMutation.isPending ||
		updatePlannedMutation.isPending ||
		updateCompletedMutation.isPending;

	const [showValidation, setShowValidation] = useState(false);

	const durationMs =
		new Date(untilValue).getTime() - new Date(fromValue).getTime();
	const durationMinutes = durationMs > 0 ? Math.round(durationMs / 60000) : 0;

	const fromError = !fromValue ? t("goals.session.startTimeRequired") : null;

	const untilError = !untilValue
		? t("goals.session.endTimeRequired")
		: new Date(untilValue) <= new Date(fromValue)
			? t("goals.session.endBeforeStart")
			: null;

	const durationError =
		durationMinutes > 720 ? t("goals.session.durationTooLong") : null;

	const hasErrors = !!(fromError || untilError || durationError);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		const startTime = datetimeLocalToIso(fromValue);
		const endTime = datetimeLocalToIso(untilValue);

		if (isEditing && isCompleted) {
			updateCompletedMutation.mutate({
				data: {
					sessionId: editing.id,
					goalId,
					startedAt: startTime,
					durationMinutes: Math.round(
						(new Date(untilValue).getTime() - new Date(fromValue).getTime()) /
							60000,
					),
					category,
					countsTowardGoal,
					notes: notes.trim() || undefined,
				},
			});
		} else if (isEditing) {
			updatePlannedMutation.mutate({
				data: {
					sessionId: editing.id,
					goalId,
					startTime,
					endTime,
					category,
					countsTowardGoal,
					notes: notes.trim() || undefined,
				},
			});
		} else {
			createMutation.mutate({
				data: {
					goalId,
					startTime,
					endTime,
					category,
					countsTowardGoal,
					notes: notes.trim() || undefined,
				},
			});
		}
	}

	const durationLabel =
		durationMinutes >= 60
			? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
			: `${durationMinutes}min`;
	const modalTitle = isEditing
		? isCompleted
			? t("modal.editCompletedSession")
			: t("modal.editPlannedSession")
		: t("modal.planNewSession");

	return (
		<DashboardModal
			open
			title={modalTitle}
			description={t("goals.session.manageFor", { goalTitle: goal.title })}
			onClose={onClose}
			footer={
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold text-(--sea-ink) hover:bg-(--link-bg-hover)"
					>
						{t("goals.session.cancelLabel")}
					</button>
					<button
						type="submit"
						form="session-form"
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{isPending
							? t("goals.session.savingLabel")
							: isEditing
								? t("goals.session.updateLabel")
								: t("goals.session.createLabel")}
					</button>
				</div>
			}
		>
			<form id="session-form" onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label
							htmlFor="session-from"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.session.fromLabel")}
						</label>
						<input
							id="session-from"
							data-autofocus
							type="datetime-local"
							value={fromValue}
							onChange={(e) => handleFromChange(e.target.value)}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && fromError && <FieldError message={fromError} />}
					</div>
					<div>
						<label
							htmlFor="session-until"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("goals.session.untilLabel")}
						</label>
						<input
							id="session-until"
							type="datetime-local"
							value={untilValue}
							onChange={(e) => setUntilValue(e.target.value)}
							min={fromValue}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && untilError && (
							<FieldError message={untilError} />
						)}
						{showValidation && durationError && (
							<FieldError message={durationError} />
						)}
					</div>
				</div>
				{durationMinutes > 0 && (
					<p className="text-xs text-(--sea-ink-soft)">
						{t("goals.session.durationLabel")}{" "}
						<span className="font-semibold">{durationLabel}</span>
					</p>
				)}
				<fieldset>
					<legend className="mb-1 block text-xs font-semibold text-(--sea-ink)">
						{t("goals.session.categoryLabel")}
					</legend>
					<div className="flex gap-2">
						{(["course", "learning", "other"] as const).map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => setCategory(cat)}
								aria-pressed={category === cat}
								className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${category === cat ? `border-(--brand) bg-(--brand)/10 text-(--brand) ring-1 ring-(--brand)/30 ${cat === "course" ? "border-dashed" : cat === "learning" ? "border-solid" : "border-dotted"}` : `border-(--line) bg-(--surface) text-(--sea-ink-soft) hover:bg-(--link-bg-hover) ${cat === "course" ? "border-dashed" : cat === "learning" ? "border-solid" : "border-dotted"}`}`}
							>
								{t(`calendar.${cat}`)}
							</button>
						))}
					</div>
				</fieldset>
				<div>
					<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
						<input
							type="checkbox"
							checked={countsTowardGoal}
							onChange={(e) => setCountsTowardGoal(e.target.checked)}
							className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
						/>
						<span>{t("goals.session.countsTowardGoal")}</span>
					</label>
				</div>
				<div>
					<label
						htmlFor="session-notes"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("goals.session.notesLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("goals.session.optionalLabel")}
						</span>
					</label>
					<textarea
						id="session-notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						maxLength={1500}
						rows={3}
						placeholder={t("goals.session.notesPlaceholder")}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>
			</form>
		</DashboardModal>
	);
}
