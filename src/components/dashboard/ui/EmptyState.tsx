import type { ReactNode } from "react";

type EmptyStateProps = {
	icon?: ReactNode;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
};

export default function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--line) px-6 py-16 text-center">
			{icon && <div className="mb-3 text-(--sea-ink-soft)/50">{icon}</div>}
			<p className="text-sm font-semibold text-(--sea-ink)">{title}</p>
			<p className="mt-1 text-xs text-(--sea-ink-soft)">{description}</p>
			{action && (
				<button
					type="button"
					onClick={action.onClick}
					className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-(--brand) px-4 py-2 text-xs font-bold text-white hover:opacity-90"
				>
					{action.label}
				</button>
			)}
		</div>
	);
}
