import { useMutation } from "@tanstack/react-query";
import { Bell, BookOpen, GraduationCap } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CalendarSession } from "#/components/dashboard/calendar/calendar-utils";
import { getGoalIcon } from "#/components/dashboard/calendar/calendar-utils";
import { datetimeLocalToIso } from "#/components/dashboard/timer/timer-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import FieldError from "#/components/dashboard/ui/FieldError";
import { randomBrightColor } from "#/components/dashboard/utils/color-utils";
import { getUserMessage } from "#/lib/errors/extract-error";
import {
	maybePromptForPush,
	pushSubscriptionToPayload,
} from "#/lib/push-notifications";
import { subscribePush } from "#/lib/server/notifications/api";
import type {
	SessionCategory,
	StudyGoalView,
} from "#/lib/server/study-manager";
import {
	createStudyDetailedPlan,
	updateStudyDetailedPlan,
	updateStudyTimeEntry,
} from "#/lib/server/study-manager";

type CalendarSessionModalProps = {
	selectedDate: Date;
	goals: StudyGoalView[];
	editing: CalendarSession | null;
	onClose: () => void;
	onSaved: () => void;
};

export default function CalendarSessionModal({
	selectedDate,
	goals,
	editing,
	onClose,
	onSaved,
}: CalendarSessionModalProps) {
	function toDatetimeLocal(date: Date) {
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	const defaultFrom = (() => {
		if (editing?.startIso) return toDatetimeLocal(new Date(editing.startIso));
		const start = new Date(selectedDate);
		start.setHours(start.getHours() < 23 ? start.getHours() + 1 : 10, 0, 0, 0);
		return toDatetimeLocal(start);
	})();

	const defaultUntil = (() => {
		if (editing?.endIso) return toDatetimeLocal(new Date(editing.endIso));
		const from = new Date(defaultFrom);
		from.setHours(from.getHours() + 1);
		return toDatetimeLocal(from);
	})();

	const [goalId, setGoalId] = useState(
		editing ? (editing.goalId ?? "") : (goals[0]?.id ?? ""),
	);
	const [fromValue, setFromValue] = useState(defaultFrom);
	const [untilValue, setUntilValue] = useState(defaultUntil);
	const [category, setCategory] = useState<SessionCategory>(
		editing?.category ?? "learning",
	);
	const [countsTowardGoal, setCountsTowardGoal] = useState(
		editing?.countsTowardGoal ?? editing?.category !== "course",
	);
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		editing?.notificationsEnabled ?? true,
	);
	const [sessionName, setSessionName] = useState(editing?.name ?? "");
	const [sessionColor, setSessionColor] = useState(() => {
		if (editing && !editing.goalId && !editing.importId) return editing.color;
		return randomBrightColor();
	});
	const [notes, setNotes] = useState(editing?.notes ?? "");
	const isEditing = Boolean(editing);
	const isCompleted = editing?.status === "completed";
	const isActive = editing?.status === "active";
	const previousGoalIdRef = useRef(goalId);

	const selectedGoal = goalId
		? (goals.find((g) => g.id === goalId) ?? null)
		: null;
	const SelectedGoalIcon = selectedGoal
		? getGoalIcon(selectedGoal.category)
		: null;

	useEffect(() => {
		if (category === "course" && !editing) setCountsTowardGoal(false);
	}, [category, editing]);

	useEffect(() => {
		if (!goalId) setCountsTowardGoal(false);
	}, [goalId]);

	useEffect(() => {
		const prev = previousGoalIdRef.current;
		if (prev && !goalId && !editing?.importId)
			setSessionColor(randomBrightColor());
		previousGoalIdRef.current = goalId;
	}, [goalId, editing]);

	function handleFromChange(newFrom: string) {
		const oldFrom = new Date(fromValue).getTime();
		const oldUntil = new Date(untilValue).getTime();
		const gap = oldUntil - oldFrom;
		setFromValue(newFrom);
		const newUntilTime =
			new Date(newFrom).getTime() + (gap > 0 ? gap : 3600000);
		setUntilValue(toDatetimeLocal(new Date(newUntilTime)));
	}

	const { t, i18n } = useTranslation();

	const createMutation = useMutation({
		mutationFn: createStudyDetailedPlan,
		onSuccess: async () => {
			toast.success(t("toast.sessionPlanned"));
			// Silently try to subscribe to push if not already
			if (notificationsEnabled) {
				const sub = await maybePromptForPush();
				if (sub) {
					await subscribePush({
						data: pushSubscriptionToPayload(sub),
					}).catch(() => {});
				}
			}
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.sessionCreateFailed"))),
	});

	const updatePlannedMutation = useMutation({
		mutationFn: updateStudyDetailedPlan,
		onSuccess: () => {
			toast.success(t("toast.sessionUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.sessionUpdateFailed"))),
	});

	const updateCompletedMutation = useMutation({
		mutationFn: updateStudyTimeEntry,
		onSuccess: () => {
			toast.success(t("toast.sessionUpdated"));
			onSaved();
		},
		onError: (err) =>
			toast.error(getUserMessage(err, t("toast.sessionUpdateFailed"))),
	});

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setShowValidation(true);
		if (hasErrors) return;

		const startTime = datetimeLocalToIso(fromValue);
		const endTime = datetimeLocalToIso(untilValue);
		const nameValue = sessionName.trim();
		const durationMinutes = Math.round(
			(new Date(untilValue).getTime() - new Date(fromValue).getTime()) / 60000,
		);

		if (isEditing && editing) {
			// Allow editing active sessions as well as completed ones by
			// routing both to the time-entry update mutation. For planned
			// sessions we keep using the detailed-plan update.
			if (isCompleted || isActive) {
				updateCompletedMutation.mutate({
					data: {
						sessionId: editing.id,
						goalId: goalId || undefined,
						name: nameValue || undefined,
						color: goalId || editing.importId ? undefined : sessionColor,
						startedAt: startTime,
						durationMinutes,
						category,
						countsTowardGoal,
						notes: notes.trim() || undefined,
					},
				});
				return;
			}

			updatePlannedMutation.mutate({
				data: {
					sessionId: editing.id,
					goalId: goalId || undefined,
					name: nameValue || undefined,
					color: goalId || editing.importId ? undefined : sessionColor,
					startTime,
					endTime,
					category,
					countsTowardGoal,
					notes: notes.trim() || undefined,
				},
			});
			return;
		}
		createMutation.mutate({
			data: {
				goalId: goalId || undefined,
				name: nameValue || undefined,
				color: goalId || editing?.importId ? undefined : sessionColor,
				startTime,
				endTime,
				category,
				countsTowardGoal,
				notificationsEnabled,
				notes: notes.trim() || undefined,
			},
		});
	}

	const isPending =
		createMutation.isPending ||
		updatePlannedMutation.isPending ||
		updateCompletedMutation.isPending;

	const [showValidation, setShowValidation] = useState(false);

	const nameRequired = !goalId;
	const nameValue = sessionName.trim();

	const durationMs =
		new Date(untilValue).getTime() - new Date(fromValue).getTime();
	const durationMinutes = durationMs > 0 ? Math.round(durationMs / 60000) : 0;

	const fromError = !fromValue ? t("calendar.session.startTimeRequired") : null;

	const untilError = !untilValue
		? t("calendar.session.endTimeRequired")
		: new Date(untilValue) <= new Date(fromValue)
			? t("calendar.session.endBeforeStart")
			: null;

	const durationError =
		durationMinutes > 720 ? t("calendar.session.durationTooLong") : null;

	const nameError =
		nameRequired && !nameValue
			? t("calendar.session.sessionNameRequiredError")
			: null;

	const hasErrors = !!(fromError || untilError || durationError || nameError);
	const modalTitle = isEditing
		? isCompleted
			? t("modal.editCompletedSession")
			: t("modal.editPlannedSession")
		: t("modal.planNewSession");

	const durationLabel =
		durationMinutes >= 60
			? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
			: `${durationMinutes}min`;

	return (
		<DashboardModal
			open
			title={modalTitle}
			description={t("calendar.session.scheduleFor", {
				date: selectedDate.toLocaleDateString(i18n.language, {
					month: "long",
					day: "numeric",
					year: "numeric",
				}),
			})}
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
						form="calendar-session-form"
						disabled={isPending}
						className="rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
					>
						{isPending
							? t("modal.savingBtn")
							: isEditing
								? t("modal.updateBtn")
								: t("modal.createBtn")}
					</button>
				</div>
			}
		>
			<form
				id="calendar-session-form"
				onSubmit={handleSubmit}
				className="space-y-4"
			>
				<div>
					<label
						htmlFor="calendar-session-goal"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("calendar.session.goalLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("calendar.session.goalOptional")}
						</span>
					</label>
					<select
						id="calendar-session-goal"
						data-autofocus
						value={goalId}
						onChange={(e) => setGoalId(e.target.value)}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					>
						<option value="">{t("calendar.session.noGoal")}</option>
						{goals.map((goal) => (
							<option key={goal.id} value={goal.id}>
								{goal.title}
							</option>
						))}
					</select>
					{selectedGoal && (
						<div className="mt-2 flex items-center gap-3">
							<span
								className="h-3.5 w-3.5 rounded-full border border-(--line)"
								style={{ backgroundColor: selectedGoal.color }}
								title={t("calendar.session.goalColorTitle", {
									color: selectedGoal.color,
								})}
							/>
							<div className="inline-flex items-center gap-2 rounded-full bg-(--surface) px-2 py-0.5 text-[12px] font-semibold text-(--sea-ink)">
								{SelectedGoalIcon && <SelectedGoalIcon size={14} />}
								<span className="truncate">{selectedGoal.title}</span>
							</div>
						</div>
					)}
				</div>

				{!goalId && (
					<div>
						<label
							htmlFor="calendar-session-color"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("calendar.session.sessionColorLabel")}
						</label>
						<div className="flex items-center gap-3">
							<label
								className="h-8 w-8 cursor-pointer rounded-full border border-(--line)"
								style={{ backgroundColor: sessionColor }}
								title={t("calendar.session.pickSessionColor")}
							>
								<input
									id="calendar-session-color"
									type="color"
									value={sessionColor}
									onChange={(e) => setSessionColor(e.target.value)}
									className="sr-only"
									aria-label={t("calendar.session.pickSessionColor")}
								/>
							</label>
							<button
								type="button"
								onClick={() => setSessionColor(randomBrightColor())}
								className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--link-bg-hover)"
							>
								{t("calendar.session.randomColor")}
							</button>
						</div>
					</div>
				)}

				<div>
					<label
						htmlFor="calendar-session-name"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("calendar.session.sessionNameLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{goalId
								? t("calendar.session.sessionNameOptional")
								: t("calendar.session.sessionNameWhenNoGoal")}
						</span>
					</label>
					<input
						id="calendar-session-name"
						type="text"
						value={sessionName}
						onChange={(e) => setSessionName(e.target.value)}
						maxLength={120}
						placeholder={t("calendar.session.sessionNamePlaceholder")}
						required={!goalId}
						className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
					{showValidation && nameError && <FieldError message={nameError} />}
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label
							htmlFor="calendar-session-from"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("calendar.session.fromLabel")}
						</label>
						<input
							id="calendar-session-from"
							type="datetime-local"
							value={fromValue}
							onChange={(e) => handleFromChange(e.target.value)}
							className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) px-3 text-sm text-(--input-field-text) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
						/>
						{showValidation && fromError && <FieldError message={fromError} />}
					</div>
					<div>
						<label
							htmlFor="calendar-session-until"
							className="mb-1 block text-xs font-semibold text-(--sea-ink)"
						>
							{t("calendar.session.untilLabel")}
						</label>
						<input
							id="calendar-session-until"
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
						{t("calendar.session.durationLabel")}{" "}
						<span className="font-semibold">{durationLabel}</span>
					</p>
				)}

				<fieldset>
					<legend className="mb-1 block text-xs font-semibold text-(--sea-ink)">
						{t("calendar.session.categoryLabel")}
					</legend>
					<div className="flex gap-2">
						{(["course", "learning", "other"] as const).map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => setCategory(cat)}
								aria-pressed={category === cat}
								className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
									category === cat
										? `border-(--brand) bg-(--brand)/10 text-(--brand) ring-1 ring-(--brand)/30 ${cat === "course" ? "border-dashed" : cat === "learning" ? "border-solid" : "border-dotted"}`
										: `border-(--line) bg-(--surface) text-(--sea-ink-soft) hover:bg-(--link-bg-hover) ${cat === "course" ? "border-dashed" : cat === "learning" ? "border-solid" : "border-dotted"}`
								} flex items-center gap-1`}
							>
								{cat === "course" && <GraduationCap size={12} />}
								{cat === "learning" && <BookOpen size={12} />}
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
							disabled={!goalId}
							className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
						/>
						<span>{t("calendar.session.countsTowardGoal")}</span>
					</label>
				</div>

				<div>
					<label className="flex items-center gap-2 text-xs font-semibold text-(--sea-ink) cursor-pointer">
						<input
							type="checkbox"
							checked={notificationsEnabled}
							onChange={(e) => setNotificationsEnabled(e.target.checked)}
							className="h-4 w-4 rounded border-(--line) text-(--brand) focus:ring-2 focus:ring-(--brand)/40"
						/>
						<span className="inline-flex items-center gap-1">
							<Bell size={11} />
							{t("calendar.session.sendReminders")}
						</span>
					</label>
				</div>

				<div>
					<label
						htmlFor="calendar-session-notes"
						className="mb-1 block text-xs font-semibold text-(--sea-ink)"
					>
						{t("calendar.session.notesLabel")}{" "}
						<span className="font-normal text-(--sea-ink-soft)">
							{t("calendar.session.notesOptional")}
						</span>
					</label>
					<textarea
						id="calendar-session-notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						maxLength={1500}
						rows={3}
						placeholder={t("calendar.session.notesPlaceholder")}
						className="w-full resize-none rounded-xl border border-(--line) bg-(--input-field-bg) px-3 py-2 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
					/>
				</div>
			</form>
		</DashboardModal>
	);
}
