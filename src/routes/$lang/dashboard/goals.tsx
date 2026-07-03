import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$lang/dashboard/goals")({
	component: () => <Outlet />,
});
