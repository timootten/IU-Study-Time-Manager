import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "#/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	sortable?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	sortable = true,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!sortable || !column.getCanSort()) {
		return <div className="flex items-center">{title}</div>;
	}

	return (
		<div className="flex items-center gap-2">
			<button
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className={cn(
					"inline-flex items-center gap-1.5 font-semibold text-(--sea-ink) transition hover:text-(--brand)",
					column.getCanSort() && "cursor-pointer select-none hover:opacity-75",
				)}
				type="button"
			>
				{title}
				<span className="ml-1">
					{column.getIsSorted() === "desc" ? (
						<ArrowDown className="h-4 w-4" />
					) : column.getIsSorted() === "asc" ? (
						<ArrowUp className="h-4 w-4" />
					) : (
						<ChevronsUpDown className="h-3 w-3 opacity-50" />
					)}
				</span>
			</button>
		</div>
	);
}
