import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type ManualTimeEntryFormProps = {
	availableGoals: { id: string; title: string }[];
	goalId: string;
	startedAt: string;
	durationMinutes: string;
	notes: string;
	isPending: boolean;
	onGoalChange: (value: string) => void;
	onStartedAtChange: (value: string) => void;
	onDurationChange: (value: string) => void;
	onNotesChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

import { keepOnlyDigits } from "#/components/dashboard/timer/timer-utils";

export default function ManualTimeEntryForm({
	availableGoals,
	goalId,
	startedAt,
	durationMinutes,
	notes,
	isPending,
	onGoalChange,
	onStartedAtChange,
	onDurationChange,
	onNotesChange,
	onSubmit,
}: ManualTimeEntryFormProps) {
	const { t } = useTranslation();
	return (
		<article className="island-shell rounded-2xl p-5 sm:p-6">
			<h2 className="text-base font-bold text-(--sea-ink)">
				{t("timer.addManualTime")}
			</h2>
			<p className="mt-1 text-sm text-(--sea-ink-soft)">
				{t("timer.manualTimeDescription")}
			</p>
			<form onSubmit={onSubmit} className="mt-4 space-y-3">
				<label className="block text-sm font-semibold text-(--sea-ink)">
					{t("timer.goalLabel")}
					<select
						data-autofocus
						className="input-field mt-1 h-11 w-full rounded-xl px-3 text-sm"
						value={goalId}
						onChange={(event) => onGoalChange(event.target.value)}
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
						value={startedAt}
						onChange={(event) => onStartedAtChange(event.target.value)}
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
						value={durationMinutes}
						onChange={(event) =>
							onDurationChange(keepOnlyDigits(event.target.value))
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
						value={notes}
						onChange={(event) => onNotesChange(event.target.value)}
					/>
				</label>
				<button
					type="submit"
					disabled={isPending || availableGoals.length === 0}
					className="btn-brand inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
				>
					{isPending ? t("toast.savingDots") : t("modal.saveTimeEntry")}
				</button>
			</form>
		</article>
	);
}
