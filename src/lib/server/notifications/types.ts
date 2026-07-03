export interface PendingNotification {
	sessionId: string;
	userId: string;
	userEmail: string;
	sessionName: string | null;
	goalTitle: string | null;
	sessionStart: Date;
	durationMinutes: number | null;
	notes: string | null;
	leadMinutes: number;
	source: "manual" | "ics";
	importId: string | null;
}
