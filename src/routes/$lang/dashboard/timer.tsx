import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardRoutePending from "#/components/dashboard/DashboardRoutePending";
import DashboardShell from "#/components/dashboard/DashboardShell";
import SimpleTimerControls from "#/components/dashboard/timer/SimpleTimerControls";
import {
	datetimeLocalToIso,
	keepOnlyDigits,
	toDateTimeInputValue,
} from "#/components/dashboard/timer/timer-utils";
import DashboardModal from "#/components/dashboard/ui/DashboardModal";
import { createServiceRouteErrorComponent } from "#/components/errors/RouteServiceError";
import { getUserMessage } from "#/lib/errors/extract-error";
import type { SupportedLanguage } from "#/lib/i18n";
import {
	studyDashboardQueryKey,
	studyDashboardQueryOptions,
} from "#/lib/queries/study-dashboard";
import { requireAuthSession } from "#/lib/server/require-auth";
import {
	addStudyManualTimeEntry,
	deleteStudySession,
	startStudyFocusSession,
	stopStudyFocusSession,
	updateStudyTimeEntry,
} from "#/lib/server/study-manager";

const timerRouteErrorComponent = createServiceRouteErrorComponent({
	unavailableTitleKey: "errors.timerUnavailableTitle",
	fallbackTitleKey: "errors.timerLoadFailedTitle",
	fallbackDescriptionKey: "errors.timerLoadFailedDescription",
});

export const Route = createFileRoute("/$lang/dashboard/timer")({
	staleTime: 0,
	preloadStaleTime: 0,
	pendingMs: 120,
	pendingMinMs: 250,
	loader: async ({ context, params }) => {
		await requireAuthSession({ lang: params.lang as SupportedLanguage });
		await context.queryClient.fetchQuery(studyDashboardQueryOptions());
	},
	pendingComponent: DashboardRoutePending,
	errorComponent: timerRouteErrorComponent,
	component: TimerPage,
});

function TimerPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: snapshot, error } = useQuery(studyDashboardQueryOptions());
	const [selectedGoalId, setSelectedGoalId] = useState("");
	const [manualGoalId, setManualGoalId] = useState("");
	const [manualStartedAt, setManualStartedAt] = useState(() => {
		const base = new Date();
		base.setMinutes(base.getMinutes() - 60, 0, 0);
		return toDateTimeInputValue(base);
	});
	const [manualDurationMinutes, setManualDurationMinutes] = useState("60");
	const [manualNotes, setManualNotes] = useState("");
	const [tickNow, setTickNow] = useState(Date.now());
	const [timeEntryEditing, setTimeEntryEditing] = useState<{
		id: string;
		goalId: string | null;
		startedAt: string;
		durationMinutes: string;
		notes: string;
	} | null>(null);
	const [deleteDialog, setDeleteDialog] = useState<{
		id: string;
		label: string;
	} | null>(null);

	useEffect(() => {
		if (!snapshot || selectedGoalId.length > 0) return;
		const firstGoal = snapshot.goals.find((goal) => goal.status !== "failed");
		if (firstGoal) {
			setSelectedGoalId(firstGoal.id);
			setManualGoalId((current) => current || firstGoal.id);
		}
	}, [selectedGoalId, snapshot]);
	useEffect(() => {
		if (!snapshot?.activeSession) return;
		const intervalId = window.setInterval(() => {
			setTickNow(Date.now());
		}, 1000);
		return () => {
			window.clearInterval(intervalId);
		};
	}, [snapshot?.activeSession]);

	const invalidateSnapshot = async () => {
		await queryClient.invalidateQueries({ queryKey: studyDashboardQueryKey });
	};

	const startMutation = useMutation({
		mutationFn: (payload: { goalId: string }) =>
			startStudyFocusSession({ data: payload }),
		onSuccess: async () => {
			toast.success(t("toast.focusSessionStarted"));
			await invalidateSnapshot();
		},
		onError: (mutationError) => {
			toast.error(
				getUserMessage(mutationError, t("timer.focusSessionStartFailed")),
			);
		},
	});
	const stopMutation = useMutation({
		mutationFn: (payload: { notes?: string }) =>
			stopStudyFocusSession({ data: payload }),
		onSuccess: async () => {
			toast.success(t("toast.focusSessionStopped"));
			await invalidateSnapshot();
		},
		onError: (mutationError) => {
			toast.error(
				getUserMessage(mutationError, t("timer.focusSessionStopFailed")),
			);
		},
	});
	const addManualTimeMutation = useMutation({
		mutationFn: (payload: {
			goalId: string;
			startedAt: string;
			durationMinutes: number;
			notes?: string;
		}) => addStudyManualTimeEntry({ data: payload }),
		onSuccess: async () => {
			toast.success(t("toast.manualTimeAdded"));
			const nextStart = new Date();
			nextStart.setMinutes(nextStart.getMinutes() - 60, 0, 0);
			setManualStartedAt(toDateTimeInputValue(nextStart));
			setManualDurationMinutes("60");
			setManualNotes("");
			await invalidateSnapshot();
		},
		onError: (mutationError) => {
			toast.error(
				getUserMessage(mutationError, t("timer.manualTimeAddFailed")),
			);
		},
	});
	const updateTimeEntryMutation = useMutation({
		mutationFn: (payload: {
			sessionId: string;
			goalId: string | null;
			startedAt: string;
			durationMinutes: number;
			notes?: string;
		}) => updateStudyTimeEntry({ data: payload }),
		onSuccess: async () => {
			toast.success(t("toast.timeEntryUpdated"));
			await invalidateSnapshot();
		},
		onError: (mutationError) => {
			toast.error(
				getUserMessage(mutationError, t("timer.timeEntryUpdateFailed")),
			);
		},
	});
	const deleteSessionMutation = useMutation({
		mutationFn: (payload: { sessionId: string }) =>
			deleteStudySession({ data: payload }),
		onSuccess: async () => {
			toast.success(t("toast.timeEntryDeleted"));
			await invalidateSnapshot();
		},
		onError: (mutationError) => {
			toast.error(
				getUserMessage(mutationError, t("timer.timeEntryDeleteFailed")),
			);
		},
	});

	if (!snapshot) {
		throw error ?? new Error("Missing timer data.");
	}

	const availableGoals = snapshot.goals
		.filter((goal) => goal.status !== "failed")
		.map((goal) => ({ id: goal.id, title: goal.title }));
	const elapsedSeconds = useMemo(() => {
		if (!snapshot.activeSession) return 0;
		const startedAtMs = new Date(snapshot.activeSession.startIso).getTime();
		const optimisticElapsed = Math.floor((tickNow - startedAtMs) / 1000);
		return Math.max(snapshot.activeSession.elapsedSec, optimisticElapsed);
	}, [snapshot.activeSession, tickNow]);

	const handleStart = () => {
		if (!selectedGoalId) {
			toast.error(t("toast.selectGoalBeforeStart"));
			return;
		}
		startMutation.mutate({ goalId: selectedGoalId });
	};
	const handleStop = () => {
		stopMutation.mutate({});
	};
	const handleManualTimeSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!manualGoalId || !manualStartedAt || !manualDurationMinutes) return;
		addManualTimeMutation.mutate({
			goalId: manualGoalId,
			startedAt: datetimeLocalToIso(manualStartedAt),
			durationMinutes: Number(manualDurationMinutes),
			notes: manualNotes.trim() || undefined,
		});
	};

	return (
		<DashboardShell
			title={t("modal.studyTimer")}
			description={t("timer.stopwatchDescription")}
		>
			<div className="space-y-6">
				<SimpleTimerControls
					goals={availableGoals}
					selectedGoalId={selectedGoalId}
					onGoalChange={setSelectedGoalId}
					activeSession={snapshot.activeSession}
					elapsedSeconds={elapsedSeconds}
					startPending={startMutation.isPending}
					stopPending={stopMutation.isPending}
					onStart={handleStart}
					onStop={handleStop}
				/>
				<article className="island-shell rounded-2xl p-5 sm:p-6">
					<h2 className="text-base font-bold text-(--sea-ink)">
						{t("timer.addManualTime")}
					</h2>
					<p className="mt-1 text-sm text-(--sea-ink-soft)">
						{t("timer.manualTimeDescription")}
					</p>
					<form onSubmit={handleManualTimeSubmit} className="mt-4 space-y-3">
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.goalLabel")}
							<select
								data-autofocus
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={manualGoalId}
								onChange={(event) => setManualGoalId(event.target.value)}
								required
							>
								<option value="">{t("timer.selectGoal")}</option>
								{availableGoals.map((goal) => (
									<option key={goal.id} value={goal.id}>
										{goal.title}
									</option>
								))}
							</select>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.startTime")}
							<input
								type="datetime-local"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={manualStartedAt}
								onChange={(event) => setManualStartedAt(event.target.value)}
								required
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.durationMinutes")}
							<input
								type="number"
								inputMode="numeric"
								pattern="[0-9]*"
								step={1}
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={manualDurationMinutes}
								onChange={(event) =>
									setManualDurationMinutes(keepOnlyDigits(event.target.value))
								}
								min={1}
								max={720}
								required
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.notesOptional")}
							<textarea
								className="input-field mt-1 min-h-20 w-full rounded-xl px-3 py-2 text-sm"
								value={manualNotes}
								onChange={(event) => setManualNotes(event.target.value)}
							/>
						</label>
						<button
							type="submit"
							disabled={
								addManualTimeMutation.isPending || availableGoals.length === 0
							}
							className="btn-brand inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
						>
							{addManualTimeMutation.isPending
								? t("toast.savingDots")
								: t("modal.saveTimeEntry")}
						</button>
					</form>
				</article>
			</div>
			{timeEntryEditing && (
				<DashboardModal
					open
					title={t("modal.editTimeEntry")}
					onClose={() => setTimeEntryEditing(null)}
				>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!timeEntryEditing) return;
							updateTimeEntryMutation.mutate(
								{
									sessionId: timeEntryEditing.id,
									goalId: timeEntryEditing.goalId,
									startedAt: datetimeLocalToIso(timeEntryEditing.startedAt),
									durationMinutes: Number(timeEntryEditing.durationMinutes),
									notes: timeEntryEditing.notes.trim() || undefined,
								},
								{ onSuccess: () => setTimeEntryEditing(null) },
							);
						}}
						className="space-y-3 p-2"
					>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.startTime")}
							<input
								type="datetime-local"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={timeEntryEditing.startedAt}
								onChange={(e) =>
									setTimeEntryEditing({
										...timeEntryEditing,
										startedAt: e.target.value,
									})
								}
								required
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.durationMinutes")}
							<input
								type="number"
								className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
								value={timeEntryEditing.durationMinutes}
								onChange={(e) =>
									setTimeEntryEditing({
										...timeEntryEditing,
										durationMinutes: keepOnlyDigits(e.target.value),
									})
								}
								min={1}
								required
							/>
						</label>
						<label className="block text-sm font-semibold text-(--sea-ink)">
							{t("timer.notesOptional")}
							<textarea
								className="input-field mt-1 min-h-16 w-full rounded-xl px-3 py-2 text-sm"
								value={timeEntryEditing.notes}
								onChange={(e) =>
									setTimeEntryEditing({
										...timeEntryEditing,
										notes: e.target.value,
									})
								}
							/>
						</label>
						<button
							type="submit"
							disabled={updateTimeEntryMutation.isPending}
							className="btn-brand inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
						>
							{updateTimeEntryMutation.isPending
								? t("toast.savingDots")
								: t("modal.updateEntry")}
						</button>
					</form>
				</DashboardModal>
			)}
			{deleteDialog && (
				<DashboardModal
					open
					title={t("modal.deleteTimeEntry")}
					onClose={() => setDeleteDialog(null)}
				>
					<div className="p-2 space-y-4">
						<p className="text-sm text-(--sea-ink-soft)">
							{t("modal.deleteWarning")}
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setDeleteDialog(null)}
								className="rounded-lg border border-(--line) bg-(--surface-strong) px-4 py-2 text-xs font-semibold"
							>
								{t("common.cancel")}
							</button>
							<button
								type="button"
								onClick={() => {
									deleteSessionMutation.mutate(
										{ sessionId: deleteDialog.id },
										{ onSuccess: () => setDeleteDialog(null) },
									);
								}}
								disabled={deleteSessionMutation.isPending}
								className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
							>
								{deleteSessionMutation.isPending
									? t("modal.deletingBtn")
									: t("common.delete")}
							</button>
						</div>
					</div>
				</DashboardModal>
			)}
		</DashboardShell>
	);
}
