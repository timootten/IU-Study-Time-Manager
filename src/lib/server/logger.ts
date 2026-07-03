import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
	name: "study-time-manager",
	level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
	redact: {
		paths: [
			"password",
			"token",
			"secret",
			"headers.authorization",
			"headers.cookie",
			"req.headers.authorization",
			"req.headers.cookie",
		],
		censor: "[Redacted]",
	},
	transport: isProduction
		? undefined
		: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			},
});

function toError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	if (typeof error === "string" && error.trim().length > 0) {
		return new Error(error);
	}

	return new Error("Unknown error");
}

export function logServerError(
	message: string,
	error: unknown,
	context?: Record<string, unknown>,
) {
	logger.error(
		{
			...context,
			err: toError(error),
		},
		message,
	);
}
