import { Search, X } from "lucide-react";

type DashboardSearchInputProps = {
	value: string;
	placeholder: string;
	onChange: (nextValue: string) => void;
};

export default function DashboardSearchInput({
	value,
	placeholder,
	onChange,
}: DashboardSearchInputProps) {
	return (
		<div className="relative flex-1 sm:max-w-sm">
			<Search
				size={16}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)"
			/>
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-10 w-full rounded-xl border border-(--line) bg-(--input-field-bg) pl-9 pr-3 text-sm text-(--input-field-text) placeholder:text-(--sea-ink-soft) outline-none transition focus:ring-2 focus:ring-(--brand)/40"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--sea-ink-soft) hover:text-(--sea-ink)"
				>
					<X size={14} />
				</button>
			)}
		</div>
	);
}
