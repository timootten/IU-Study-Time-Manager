import { Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StudyActiveSessionView } from "#/lib/server/study-manager";

function formatDuration(seconds: number) {
	const normalized = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(normalized / 3600);
	const minutes = Math.floor((normalized % 3600) / 60);
	const remainingSeconds = normalized % 60;

	return [hours, minutes, remainingSeconds]
		.map((unit) => String(unit).padStart(2, "0"))
		.join(":");
}

function formatDateTime(isoDate: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(isoDate));
}

interface SimpleTimerControlsProps {
	goals: Array<{ id: string; title: string }>;
	selectedGoalId: string;
	onGoalChange: (goalId: string) => void;
	activeSession: StudyActiveSessionView | null;
	elapsedSeconds: number;
	startPending: boolean;
	stopPending: boolean;
	onStart: () => void;
	onStop: () => void;
}

export default function SimpleTimerControls({
	goals,
	selectedGoalId,
	onGoalChange,
	activeSession,
	elapsedSeconds,
	startPending,
	stopPending,
	onStart,
	onStop,
}: SimpleTimerControlsProps) {
	const { t } = useTranslation();
	const running = Boolean(activeSession);

	return (
		<article className="island-shell rounded-2xl p-5 sm:p-6">
			<h2 className="text-base font-bold text-(--sea-ink)">
				{t("timer.stopwatchTimer")}
			</h2>
			<p className="mt-1 text-sm text-(--sea-ink-soft)">
				{t("timer.stopwatchDescription")}
			</p>

			<div className="mt-4 rounded-2xl border border-(--line) p-4 text-center">
				<p className="text-xs font-bold uppercase tracking-[0.12em] text-(--sea-ink-soft)">
					{running ? t("modal.sessionRunning") : t("modal.ready")}
				</p>
				<p className="mt-2 font-mono text-4xl font-extrabold text-(--sea-ink)">
					{formatDuration(elapsedSeconds)}
				</p>
				{activeSession ? (
					<p className="mt-2 text-xs text-(--sea-ink-soft)">
						{activeSession.goalTitle} - {t("timer.started")}{" "}
						{formatDateTime(activeSession.startIso)}
					</p>
				) : null}
			</div>

			{running ? null : (
				<label className="mt-4 block text-sm font-semibold text-(--sea-ink)">
					{t("timer.goalLabel")}
					<select
						className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
						value={selectedGoalId}
						onChange={(event) => onGoalChange(event.target.value)}
						required
						disabled={goals.length === 0 || startPending}
					>
						<option value="">{t("timer.selectGoal")}</option>
						{goals.map((goal) => (
							<option key={goal.id} value={goal.id}>
								{goal.title}
							</option>
						))}
					</select>
				</label>
			)}

			<button
				type="button"
				onClick={running ? onStop : onStart}
				disabled={(running ? stopPending : startPending) || goals.length === 0}
				className="btn-brand mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold disabled:cursor-not-allowed disabled:opacity-60"
			>
				{running ? <Square size={18} /> : <Play size={18} />}
				{running
					? stopPending
						? t("timer.stopping")
						: t("modal.stopSession")
					: startPending
						? t("timer.starting")
						: t("modal.startSession")}
			</button>
		</article>
	);
}
