/**
 * Data Table Utilities & Hooks
 *
 * Provides helper functions and configurations for working with TanStack Table.
 * These utilities support filtering, sorting, and other common table operations.
 */

import { rankItem } from "@tanstack/match-sorter-utils";
import type { FilterFn } from "@tanstack/react-table";

/**
 * Fuzzy filter function for TanStack Table
 * Enables fuzzy search across columns with ranking
 */
export const fuzzyFilter: FilterFn<unknown> = (
	row,
	columnId,
	value,
	addMeta,
) => {
	const itemRank = rankItem(
		String(row.getValue(columnId) ?? ""),
		String(value ?? ""),
	);
	addMeta({
		itemRank,
	});
	return itemRank.passed;
};

/**
 * Case-insensitive filter function for exact matching
 */
export const caseInsensitiveFilter: FilterFn<unknown> = (
	row,
	columnId,
	value,
) => {
	const cellValue = String(row.getValue(columnId) ?? "").toLowerCase();
	const filterValue = String(value ?? "").toLowerCase();
	return cellValue.includes(filterValue);
};

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
	try {
		return new Date(date).toLocaleDateString();
	} catch {
		return "—";
	}
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(num: number): string {
	return num.toLocaleString();
}
