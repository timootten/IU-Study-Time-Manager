import { Link } from "@tanstack/react-router";
import { CalendarDays, House, Target, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLangParam, withLang } from "#/lib/i18n/paths";
import DashboardBottomNav from "./DashboardBottomNav";

interface DashboardShellProps {
	title: string;
	description: string;
	headerExtra?: ReactNode;
	children?: ReactNode;
}

const desktopNavItemClass =
	"block rounded-xl px-3 py-2.5 text-sm font-semibold text-(--sea-ink-soft) no-underline transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)";

const desktopNavItemActiveClass =
	"block rounded-xl bg-(--link-bg-hover) px-3 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline";

export default function DashboardShell({
	title,
	description,
	headerExtra,
	children,
}: DashboardShellProps) {
	const { t } = useTranslation();
	const lang = useLangParam();

	const navItems = [
		{
			to: withLang(lang, "/dashboard"),
			label: t("nav.overview"),
			icon: House,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/goals"),
			label: t("nav.goals"),
			icon: Target,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/calendar"),
			label: t("nav.calendar"),
			icon: CalendarDays,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/timer"),
			label: t("nav.timer"),
			icon: Timer,
			exact: true as const,
		},
		{
			to: withLang(lang, "/dashboard/achievements"),
			label: t("nav.achievements"),
			icon: Trophy,
			exact: true as const,
		},
	];

	return (
		<section className="min-h-[calc(100vh-96px)] border-t border-(--line)">
			<aside className="fixed left-0 top-0 bottom-0 z-30 hidden w-70 overflow-y-auto border-r border-(--line) bg-(--sidebar-panel-bg) p-4 pt-20 sm:p-5 sm:pt-20 lg:block">
				<p className="island-kicker m-0">{t("nav.workspace")}</p>
				<nav className="mt-4 space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;

						return (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.exact }}
								className={desktopNavItemClass}
								activeProps={{ className: desktopNavItemActiveClass }}
							>
								<span className="inline-flex items-center gap-2">
									<Icon size={16} aria-hidden="true" />
									{item.label}
								</span>
							</Link>
						);
					})}
				</nav>
			</aside>

			<div className="px-4 py-5 pb-28 sm:px-8 sm:py-8 sm:pb-28 lg:ml-70 lg:pb-8">
				<p className="island-kicker m-0">{t("nav.dashboard")}</p>
				<div className="mt-2 flex items-start justify-between gap-4">
					<h1 className="display-title text-2xl leading-tight sm:text-4xl">
						{title}
					</h1>
					{headerExtra}
				</div>
				<p className="mt-2 max-w-3xl text-sm text-(--sea-ink-soft) sm:mt-3 sm:text-base">
					{description}
				</p>

				<div className="mt-5 sm:mt-6">{children}</div>
			</div>

			<DashboardBottomNav />
		</section>
	);
}
