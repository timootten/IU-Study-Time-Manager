import {
	formatDateTime,
	keepOnlyDigits,
	minutesFromSeconds,
	toDateTimeInputValueFromIso,
} from "#/components/dashboard/timer/timer-utils";

type EditFormState = {
	id: string;
	goalId: string | null;
	startedAt: string;
	durationMinutes: string;
	notes: string;
};

type TimeEntryProps = {
	entry: {
		id: string;
		goalTitle: string;
		startIso: string;
		durationSec: number;
		notes?: string | null;
		goalId?: string | null;
	};
	onEdit: (form: EditFormState) => void;
	onDelete: (id: string, label: string) => void;
};

export function getEditFormState(
	entry: TimeEntryProps["entry"],
): EditFormState {
	return {
		id: entry.id,
		goalId: entry.goalId ?? null,
		startedAt: toDateTimeInputValueFromIso(entry.startIso),
		durationMinutes: String(minutesFromSeconds(entry.durationSec)),
		notes: entry.notes ?? "",
	};
}

export { formatDateTime, keepOnlyDigits };
