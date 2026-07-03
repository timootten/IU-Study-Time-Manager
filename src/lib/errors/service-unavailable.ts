const SERVICE_UNAVAILABLE_PATTERN =
	/(temporarily unavailable|service unavailable)/i;

export const SERVICE_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE" as const;
export const SERVICE_UNAVAILABLE_NAME = "ServiceUnavailableError" as const;
export const DEFAULT_SERVICE_UNAVAILABLE_MESSAGE =
	"Service is temporarily unavailable. Please try again shortly.";

type ErrorLikeRecord = Record<string, unknown>;

export class ServiceUnavailableError extends Error {
	readonly code = SERVICE_UNAVAILABLE_CODE;
	readonly statusCode = 503;

	constructor(message = DEFAULT_SERVICE_UNAVAILABLE_MESSAGE) {
		super(message);
		this.name = SERVICE_UNAVAILABLE_NAME;
	}
}

function asRecord(value: unknown): ErrorLikeRecord | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	return value as ErrorLikeRecord;
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getStatusCode(value: unknown): number | null {
	if (typeof value !== "number") {
		return null;
	}

	return Number.isFinite(value) ? value : null;
}

function findServiceUnavailableDetails(
	error: unknown,
	depth = 0,
): { message: string | null } | null {
	if (depth > 4) {
		return null;
	}

	if (error instanceof ServiceUnavailableError) {
		return { message: asNonEmptyString(error.message) };
	}

	const record = asRecord(error);
	if (!record) {
		return null;
	}

	const code = asNonEmptyString(record.code)?.toUpperCase();
	const name = asNonEmptyString(record.name);
	const message = asNonEmptyString(record.message);
	const statusCode = getStatusCode(record.statusCode);

	if (
		code === SERVICE_UNAVAILABLE_CODE ||
		name === SERVICE_UNAVAILABLE_NAME ||
		statusCode === 503
	) {
		return { message };
	}

	if (message && SERVICE_UNAVAILABLE_PATTERN.test(message)) {
		return { message };
	}

	return (
		findServiceUnavailableDetails(record.cause, depth + 1) ??
		findServiceUnavailableDetails(record.data, depth + 1) ??
		findServiceUnavailableDetails(record.error, depth + 1)
	);
}

export function isServiceUnavailableError(error: unknown) {
	return findServiceUnavailableDetails(error) !== null;
}

export function getServiceUnavailableMessage(
	error: unknown,
	fallback = DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
) {
	const details = findServiceUnavailableDetails(error);

	if (!details) {
		return null;
	}

	return details.message ?? fallback;
}
