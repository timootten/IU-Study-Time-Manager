import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { AppError } from "#/lib/errors/app-error";
import { isValidationError } from "#/lib/errors/extract-error";
import { withLang } from "#/lib/i18n/paths";
import { getAuthSession } from "#/lib/server/auth-session";
import { getLanguageFromRequest } from "#/lib/server/language.server";
import { logServerError } from "#/lib/server/logger";
import { requireServiceAvailability } from "#/lib/server/require-service-availability";

/**
 * Auth middleware for TanStack Start server functions.
 *
 * Ensures the service is available and the user is authenticated.
 * Injects `userId` and `user` into the handler context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	await requireServiceAvailability();

	const session = await getAuthSession();

	if (!session?.user) {
		throw redirect({ to: withLang(getLanguageFromRequest(), "/auth/login") });
	}

	return next({ context: { userId: session.user.id, user: session.user } });
});

/**
 * Error-logging middleware for server functions.
 *
 * Wraps the handler in a try/catch that logs errors with structured context
 * before re-throwing. Handlers only need to throw — they never manually log.
 *
 * Silently passes through redirects (used by TanStack Router) and known
 * `AppError` instances are logged with their error code for traceability.
 */
export const errorLoggingMiddleware = createMiddleware().server(
	async ({ next }) => {
		try {
			return await next();
		} catch (error) {
			// Redirects are control-flow, not errors — don't log them.
			if (isRedirectError(error)) {
				throw error;
			}

			if (isValidationError(error)) {
				throw error;
			}

			if (error instanceof AppError) {
				logServerError(error.message, error, { code: error.code });
			} else {
				logServerError("Unhandled server function error", error);
			}

			throw error;
		}
	},
);

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Detect TanStack Router redirect objects and Response-based redirects.
 * These are control-flow mechanisms, not real errors.
 */
function isRedirectError(error: unknown): boolean {
	if (error instanceof Response) return true;

	if (error && typeof error === "object") {
		// TanStack Router redirects carry an `isRedirect` flag
		if ("isRedirect" in error) return true;
		// Some frameworks throw redirect objects with a `status` of 301/302/307/308
		if ("status" in error) {
			const status = (error as { status: unknown }).status;
			return typeof status === "number" && status >= 300 && status < 400;
		}
	}

	return false;
}
