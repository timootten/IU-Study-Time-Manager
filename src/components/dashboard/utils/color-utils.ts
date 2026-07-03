export function hslToHex(hue: number, saturation: number, lightness: number) {
	const h = ((hue % 360) + 360) % 360;
	const s = Math.min(100, Math.max(0, saturation)) / 100;
	const l = Math.min(100, Math.max(0, lightness)) / 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;
	if (h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}
	const toHex = (value: number) =>
		Math.round((value + m) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

export function randomBrightColor() {
	const hue = 140 + Math.random() * 140;
	const saturation = 70 + Math.random() * 20;
	const lightness = 50 + Math.random() * 10;
	return hslToHex(hue, saturation, lightness);
}

export function hexToRgb(hex: string) {
	const normalized = hex.replace("#", "");
	if (normalized.length !== 6) return null;
	const r = Number.parseInt(normalized.slice(0, 2), 16);
	const g = Number.parseInt(normalized.slice(2, 4), 16);
	const b = Number.parseInt(normalized.slice(4, 6), 16);
	if ([r, g, b].some((value) => Number.isNaN(value))) return null;
	return { r, g, b };
}

export function toRgba(hex: string, alpha: number) {
	const rgb = hexToRgb(hex);
	if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
