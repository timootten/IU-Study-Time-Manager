import { clamp } from "./math";

// ── Core conversion ───────────────────────────────────────────────────

function hslToHex(hue: number, saturation: number, lightness: number): string {
	const h = ((hue % 360) + 360) % 360;
	const s = clamp(saturation, 0, 100) / 100;
	const l = clamp(lightness, 0, 100) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (h < 60) {
		r = c;
		g = x;
	} else if (h < 120) {
		r = x;
		g = c;
	} else if (h < 180) {
		g = c;
		b = x;
	} else if (h < 240) {
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}

	const toHex = (value: number) =>
		Math.round((value + m) * 255)
			.toString(16)
			.padStart(2, "0");

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

// ── Public helpers ────────────────────────────────────────────────────

/** Generate a random bright color in the teal-to-purple hue range. */
export function randomBrightColor(): string {
	const hue = 140 + Math.random() * 140;
	const saturation = 70 + Math.random() * 20;
	const lightness = 50 + Math.random() * 10;
	return hslToHex(hue, saturation, lightness);
}

/** Derive a deterministic bright color from a string (e.g. a UUID). */
export function colorFromString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i += 1) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	const normalized = Math.abs(hash);
	const hue = 140 + (normalized % 140);
	const saturation = 70 + ((normalized >> 3) % 20);
	const lightness = 50 + ((normalized >> 6) % 10);
	return hslToHex(hue, saturation, lightness);
}
