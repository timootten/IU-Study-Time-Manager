import { env } from "#/env";
import { logger } from "#/lib/server/logger";
import { getSmtpTransport } from "./smtp";
import type { PendingNotification } from "./types";

function formatDisplayName(n: PendingNotification): string {
	if (n.goalTitle && n.sessionName) return `${n.goalTitle} — ${n.sessionName}`;
	if (n.goalTitle) return n.goalTitle;
	if (n.sessionName) return n.sessionName;
	return "Study Session";
}

function buildSessionEmailHtml(n: PendingNotification): string {
	const displayName = formatDisplayName(n);
	const startTime = n.sessionStart.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	});
	const date = n.sessionStart.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const durationLabel = n.durationMinutes
		? `${n.durationMinutes} min`
		: "Scheduled";
	const appUrl = env.VITE_APP_URL.replace(/\/$/, "");

	const heading =
		n.leadMinutes <= 1 ? "Starting Now" : `Starting in ${n.leadMinutes} min`;

	const icsBadge =
		n.source === "ics"
			? '<span style="display:inline-block;background:#e8f0fe;color:#1a73e8;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;margin-left:8px">ICS</span>'
			: "";

	return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3eee2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#0f8a8d;padding:28px 24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">${heading}</h1>
    </div>
    <div style="padding:28px 24px;text-align:center">
      <h2 style="margin:0 0 4px;color:#1d3340;font-size:22px;font-weight:700">
        ${displayName}${icsBadge}
      </h2>
      ${!n.sessionName && !n.goalTitle ? `<p style="margin:0 0 16px;color:#4b606b;font-size:13px">A study session is about to begin.</p>` : ""}
      <div style="display:inline-block;background:#f3eee2;border-radius:12px;padding:16px 24px;margin:12px 0">
        <p style="margin:0 0 4px;color:#1d3340;font-size:15px;font-weight:600">${date}</p>
        <p style="margin:0;color:#0f8a8d;font-size:14px">${startTime} · ${durationLabel}</p>
      </div>
      ${n.notes ? `<div style="background:#fafafa;border-radius:10px;padding:12px 16px;margin:16px 0 0;text-align:left"><p style="margin:0;color:#4b606b;font-size:12px;line-height:1.5;white-space:pre-line">Notes: ${n.notes}</p></div>` : ""}
      <div style="text-align:center;margin:24px 0 0">
        <a href="${appUrl}/dashboard/timer" style="display:inline-block;background:#0f8a8d;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
          Open Timer
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 0">
      <p style="margin:12px 0 0;color:#999;font-size:11px">
        Manage reminders in your <a href="${appUrl}/profile/settings" style="color:#0f8a8d">notification settings</a>.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

function buildSessionEmailText(n: PendingNotification): string {
	const displayName = formatDisplayName(n);
	const startTime = n.sessionStart.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	});
	const date = n.sessionStart.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const appUrl = env.VITE_APP_URL.replace(/\/$/, "");
	const heading =
		n.leadMinutes <= 1 ? "Starting Now" : `In ${n.leadMinutes} min`;

	return [
		`${heading} — ${displayName}`,
		``,
		`Session: ${displayName}`,
		`When: ${date} at ${startTime}`,
		n.durationMinutes ? `Duration: ${n.durationMinutes} min` : "",
		n.source === "ics" ? "Source: ICS import" : "",
		n.notes ? `\nNotes: ${n.notes}` : "",
		``,
		`Open timer: ${appUrl}/dashboard/timer`,
		``,
		`Manage reminders: ${appUrl}/profile/settings`,
	]
		.filter(Boolean)
		.join("\n");
}

export async function sendEmailNotification(
	n: PendingNotification,
): Promise<boolean> {
	try {
		const transport = getSmtpTransport();
		const subjectName = formatDisplayName(n);
		await transport.sendMail({
			from: env.SMTP_FROM,
			to: n.userEmail,
			subject: `${subjectName} in ${n.leadMinutes} min — Study Time Manager`,
			html: buildSessionEmailHtml(n),
			text: buildSessionEmailText(n),
		});
		logger.info(
			{ sessionId: n.sessionId, userId: n.userId, leadMinutes: n.leadMinutes },
			"Email notification sent",
		);
		return true;
	} catch (error) {
		logger.error(
			{ err: error, sessionId: n.sessionId, userId: n.userId },
			"Failed to send email notification",
		);
		return false;
	}
}
