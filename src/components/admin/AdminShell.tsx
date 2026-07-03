import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLangParam, withLang } from "#/lib/i18n/paths";

interface AdminShellProps {
	title: string;
	description: string;
	headerExtra?: ReactNode;
	children?: ReactNode;
}

const desktopNavItemClass =
	"block rounded-xl px-3 py-2.5 text-sm font-semibold text-(--sea-ink-soft) no-underline transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)";

const desktopNavItemActiveClass =
	"block rounded-xl bg-(--link-bg-hover) px-3 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline";

const mobileNavItemClass =
	"flex min-w-0 flex-1 items-center justify-center rounded-xl px-2 py-3.5 text-xs font-semibold text-(--sea-ink-soft) no-underline transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)";

const mobileNavItemActiveClass =
	"flex min-w-0 flex-1 items-center justify-center rounded-xl bg-(--link-bg-hover) px-2 py-3.5 text-xs font-semibold text-(--sea-ink) no-underline";

function useNavItems(lang: "de" | "en") {
	return [
		{
			to: withLang(lang, "/admin"),
			labelKey: "admin.kpis" as const,
			icon: BarChart3,
			exact: true as const,
		},
		{
			to: withLang(lang, "/admin/users"),
			labelKey: "admin.manageUsers" as const,
			icon: Users,
			exact: true as const,
		},
	];
}

export default function AdminShell({
	title,
	description,
	headerExtra,
	children,
}: AdminShellProps) {
	const { t } = useTranslation();
	const lang = useLangParam();
	const location = useLocation();
	const navItems = useNavItems(lang);

	return (
		<section className="min-h-[calc(100vh-96px)] border-t border-(--line)">
			{/* Desktop sidebar */}
			<aside className="fixed left-0 top-0 bottom-0 z-30 hidden w-70 overflow-y-auto border-r border-(--line) bg-(--sidebar-panel-bg) p-4 pt-20 sm:p-5 sm:pt-20 lg:block">
				<p className="island-kicker m-0">{t("nav.admin")}</p>
				<nav className="mt-4 space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.exact
							? location.pathname === item.to
							: location.pathname.startsWith(item.to);

						return (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.exact }}
								className={
									isActive ? desktopNavItemActiveClass : desktopNavItemClass
								}
								activeProps={{ className: desktopNavItemActiveClass }}
							>
								<span className="inline-flex items-center gap-2">
									<Icon size={16} aria-hidden="true" />
									{t(item.labelKey)}
								</span>
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* Main content */}
			<div className="px-4 py-5 pb-28 sm:px-8 sm:py-8 sm:pb-28 lg:ml-70 lg:pb-8">
				<p className="island-kicker m-0">{t("nav.admin")}</p>
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

			{/* Mobile bottom nav */}
			<nav
				className="fixed inset-x-3 bottom-8 z-40 rounded-2xl border border-(--line) bg-(--surface-strong)/98 px-3 pt-2 shadow-[0_-10px_28px_rgba(8,21,35,0.22)] backdrop-blur lg:hidden"
				style={{
					paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
				}}
			>
				<div className="mx-auto flex w-full max-w-lg items-stretch gap-1.5">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.exact
							? location.pathname === item.to
							: location.pathname.startsWith(item.to);

						return (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.exact }}
								className={
									isActive ? mobileNavItemActiveClass : mobileNavItemClass
								}
								activeProps={{ className: mobileNavItemActiveClass }}
							>
								<span className="flex flex-col items-center gap-1">
									<Icon size={18} aria-hidden="true" />
									{t(item.labelKey)}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>
		</section>
	);
}
