import { Link } from "@tanstack/react-router";
import { CalendarDays, House, Target, Timer, Trophy } from "lucide-react";
import { useLangParam, withLang } from "#/lib/i18n/paths";

const mobileNavItemClass =
	"flex min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-3.5 text-xs font-semibold text-(--sea-ink-soft) no-underline transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)";

const mobileNavItemActiveClass =
	"flex min-w-0 flex-1 items-center justify-center rounded-xl bg-(--link-bg-hover) px-2 py-3.5 text-xs font-semibold text-(--sea-ink) no-underline";

interface DashboardBottomNavProps {
	className?: string;
}

export default function DashboardBottomNav({
	className = "fixed inset-x-3 bottom-8 z-40 rounded-2xl border border-(--line) bg-(--surface-strong)/98 px-3 pt-2 shadow-[0_-10px_28px_rgba(8,21,35,0.22)] backdrop-blur lg:hidden",
}: DashboardBottomNavProps) {
	const lang = useLangParam();

	const navItems = [
		{
			to: withLang(lang, "/dashboard"),
			icon: House,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/goals"),
			icon: Target,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/calendar"),
			icon: CalendarDays,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/timer"),
			icon: Timer,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/achievements"),
			icon: Trophy,
			exact: true as const,
		},
	];

	return (
		<nav
			className={className}
			style={{
				paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
			}}
		>
			<div className="mx-auto flex w-full max-w-lg items-stretch gap-1.5">
				{navItems.map((item) => {
					const Icon = item.icon;

					return (
						<Link
							key={`mobile-${item.to}`}
							to={item.to}
							activeOptions={{ exact: item.exact }}
							className={mobileNavItemClass}
							activeProps={{ className: mobileNavItemActiveClass }}
						>
							<Icon size={26} aria-hidden="true" />
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
