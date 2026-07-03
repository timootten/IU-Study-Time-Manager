type MiniEmptyStateProps = {
	text: string;
};

export default function MiniEmptyState({ text }: MiniEmptyStateProps) {
	return (
		<div className="flex items-center justify-center rounded-xl border border-dashed border-(--line) px-4 py-8 text-center">
			<p className="text-xs text-(--sea-ink-soft)">{text}</p>
		</div>
	);
}
