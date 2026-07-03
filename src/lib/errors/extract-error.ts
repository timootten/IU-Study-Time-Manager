/**
 * Shared utilities for extracting user-facing error messages from unknown
 * error values.
 *
 * Works with:
 * - `AppError` (our own typed errors)
 * - better-auth structured responses `{ error: { code, message } }`
 * - plain `Error` instances
 * - TanStack server-function serialized errors
 */

import { ErrorCode, type ErrorCodeValue, getErrorMessage } from "./app-error";

// ---------------------------------------------------------------------------
// Error-code matching for better-auth responses
// ---------------------------------------------------------------------------

/**
 * Maps known better-auth / API error codes to our `ErrorCode` values.
 */
const betterAuthCodeMap: Record<string, ErrorCodeValue> = {
	INVALID_ORIGIN: ErrorCode.INVALID_ORIGIN,
	INVALID_EMAIL_OR_PASSWORD: ErrorCode.INVALID_CREDENTIALS,
	INVALID_PASSWORD: ErrorCode.INVALID_CREDENTIALS,
	INVALID_EMAIL: ErrorCode.INVALID_CREDENTIALS,
	CREDENTIAL_ERROR: ErrorCode.INVALID_CREDENTIALS,
	USER_ALREADY_EXISTS: ErrorCode.ACCOUNT_EXISTS,
	EMAIL_ALREADY_EXISTS: ErrorCode.ACCOUNT_EXISTS,
	RATE_LIMIT_EXCEEDED: ErrorCode.RATE_LIMITED,
	TOO_MANY_REQUESTS: ErrorCode.RATE_LIMITED,
	SERVICE_UNAVAILABLE: ErrorCode.SERVICE_UNAVAILABLE,
	BANNED_USER: ErrorCode.BANNED_USER,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ErrorLikeRecord = Record<string, unknown>;
type ZodIssueLike = {
	path?: unknown;
	message?: unknown;
	code?: unknown;
	minimum?: unknown;
	inclusive?: unknown;
};
export type ValidationIssue = {
	path: Array<string | number>;
	message: string;
};

function asRecord(value: unknown): ErrorLikeRecord | null {
	return value && typeof value === "object" ? (value as ErrorLikeRecord) : null;
}

function asString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function asZodIssueArray(value: unknown): ZodIssueLike[] | null {
	if (!Array.isArray(value) || value.length === 0) return null;
	const issueLike = value.every((item) => item && typeof item === "object");
	return issueLike ? (value as ZodIssueLike[]) : null;
}

function asPathArray(value: unknown): Array<string | number> | null {
	if (!Array.isArray(value)) return null;
	const path: Array<string | number> = [];
	for (const part of value) {
		if (typeof part === "string" || typeof part === "number") {
			path.push(part);
			continue;
		}
		return null;
	}
	return path;
}

function extractZodIssues(value: unknown): ZodIssueLike[] | null {
	const record = asRecord(value);
	if (!record) return null;

	if (record.issues) {
		const issues = asZodIssueArray(record.issues);
		if (issues) return issues;
	}

	const nestedError = asRecord(record.error);
	if (nestedError?.issues) {
		const issues = asZodIssueArray(nestedError.issues);
		if (issues) return issues;
	}

	const nestedData = asRecord(record.data);
	if (nestedData?.issues) {
		const issues = asZodIssueArray(nestedData.issues);
		if (issues) return issues;
	}

	return null;
}

function parseJsonIssues(raw: string): ZodIssueLike[] | null {
	const trimmed = raw.trim();
	if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;
	try {
		const parsed = JSON.parse(trimmed) as unknown;
		return extractZodIssues(parsed) ?? asZodIssueArray(parsed);
	} catch {
		return null;
	}
}

function toValidationIssues(issues: ZodIssueLike[]): ValidationIssue[] {
	return issues
		.map((issue) => {
			const message = asString(issue.message);
			if (!message) return null;
			return {
				path: asPathArray(issue.path) ?? [],
				message,
			};
		})
		.filter((issue): issue is ValidationIssue => !!issue);
}

export function getValidationIssues(value: unknown): ValidationIssue[] {
	const directIssues = extractZodIssues(value);
	if (directIssues) return toValidationIssues(directIssues);

	const raw = extractMessage(value);
	if (!raw) return [];

	const parsedIssues = parseJsonIssues(raw);
	if (!parsedIssues) return [];
	return toValidationIssues(parsedIssues);
}

export function isValidationError(value: unknown): boolean {
	return getValidationIssues(value).length > 0;
}

function getValidationMessage(value: unknown): string | null {
	const issues = getValidationIssues(value);
	return issues.length > 0 ? issues[0].message : null;
}

/**
 * Try to extract a structured code from any error-like value.
 *
 * Handles shapes like:
 * - `{ code: "SOME_CODE" }`
 * - `{ error: { code: "SOME_CODE" } }`
 * - `{ data: { code: "SOME_CODE" } }`
 */
function extractCode(value: unknown): string | null {
	const record = asRecord(value);
	if (!record) return null;

	// Direct code
	const code = asString(record.code);
	if (code) return code;

	// Nested in .error
	const nestedError = asRecord(record.error);
	if (nestedError) {
		const nestedCode = asString(nestedError.code);
		if (nestedCode) return nestedCode;
	}

	// Nested in .data
	const nestedData = asRecord(record.data);
	if (nestedData) {
		const dataCode = asString(nestedData.code);
		if (dataCode) return dataCode;
	}

	return null;
}

/**
 * Try to extract a plain text message from any error-like value.
 */
function extractMessage(value: unknown): string | null {
	if (value instanceof Error && value.message.trim().length > 0) {
		return value.message;
	}

	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}

	const record = asRecord(value);
	if (!record) return null;

	// .error.message
	const nestedError = asRecord(record.error);
	if (nestedError) {
		const msg = asString(nestedError.message);
		if (msg) return msg;
	}

	// .message
	const msg = asString(record.message);
	if (msg) return msg;

	// .statusText
	const statusText = asString(record.statusText);
	if (statusText) return statusText;

	return null;
}

// ---------------------------------------------------------------------------
// Fallback substring matching for unstructured messages
// ---------------------------------------------------------------------------

const messageFallbackPatterns: Array<{
	test: (msg: string) => boolean;
	code: ErrorCodeValue;
}> = [
	{
		test: (m) =>
			m.includes("unavailable") || m.includes("timeout") || m.includes("503"),
		code: ErrorCode.SERVICE_UNAVAILABLE,
	},
	{
		test: (m) => m.includes("rate limit") || m.includes("too many"),
		code: ErrorCode.RATE_LIMITED,
	},
	{
		test: (m) =>
			(m.includes("already") && m.includes("exist")) || m.includes("duplicate"),
		code: ErrorCode.ACCOUNT_EXISTS,
	},
	{
		test: (m) =>
			m.includes("credential") ||
			(m.includes("invalid") &&
				(m.includes("password") || m.includes("email"))),
		code: ErrorCode.INVALID_CREDENTIALS,
	},
];

function matchMessageToCode(message: string): ErrorCodeValue | null {
	const lower = message.toLowerCase();
	for (const pattern of messageFallbackPatterns) {
		if (pattern.test(lower)) return pattern.code;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves an `ErrorCodeValue` from any error-like value.
 *
 * Resolution order:
 *  1. If it's an `AppError`, use its `.code` directly.
 *  2. Extract a structured code and map it via `betterAuthCodeMap`.
 *  3. If code matches an `ErrorCode` value, return it directly.
 *  4. Fall back to substring matching on the message.
 *  5. Return `null` if nothing matched.
 */
export function resolveErrorCode(value: unknown): ErrorCodeValue | null {
	// AppError
	const record = asRecord(value);
	if (record?.code && typeof record.code === "string") {
		const raw = record.code.toUpperCase();

		// Check direct match to our enum
		const allCodes = Object.values(ErrorCode) as string[];
		if (allCodes.includes(raw)) return raw as ErrorCodeValue;

		// Check better-auth code map
		const mapped = betterAuthCodeMap[raw];
		if (mapped) return mapped;
	}

	// Nested code
	const extracted = extractCode(value);
	if (extracted) {
		const upper = extracted.toUpperCase();
		const allCodes = Object.values(ErrorCode) as string[];
		if (allCodes.includes(upper)) return upper as ErrorCodeValue;

		const mapped = betterAuthCodeMap[upper];
		if (mapped) return mapped;
	}

	// Substring matching
	const message = extractMessage(value);
	if (message) {
		return matchMessageToCode(message);
	}

	return null;
}

/**
 * Extract a user-facing error message from any error-like value.
 *
 * Priority:
 *  1. Resolve a known error code → return its registered message.
 *  2. If the value has a non-empty message string, return it.
 *  3. Fall back to the provided `fallback` string.
 */
export function getUserMessage(value: unknown, fallback: string): string {
	const code = resolveErrorCode(value);
	if (code) return getErrorMessage(code);

	const validationMessage = getValidationMessage(value);
	if (validationMessage) return validationMessage;

	const raw = extractMessage(value);
	if (raw) return raw;

	return fallback;
}

/**
 * Resolve an error for auth flows (login / register).
 *
 * Same as `getUserMessage` but with auth-specific defaults.
 */
export function getAuthErrorMessage(value: unknown): string {
	return getUserMessage(value, getErrorMessage(ErrorCode.AUTH_FAILED));
}
