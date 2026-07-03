/** Clamp a number between `min` and `max` (inclusive). */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Round a floating-point hour value to one decimal place. */
export function roundHours(value: number): number {
	return Math.round(value * 10) / 10;
}

/** Convert seconds to hours, rounded to one decimal place. */
export function secondsToHours(seconds: number): number {
	return roundHours(seconds / 3600);
}
