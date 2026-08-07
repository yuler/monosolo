import { Link, useRouterState } from "@tanstack/react-router";
import {
	Activity,
	BriefcaseBusiness,
	LayoutDashboard,
	Mail,
} from "lucide-react";
import type * as React from "react";

import { AccountSwitcher } from "@/components/dashboard/account-switcher";
import { SidebarUserMenu } from "@/components/dashboard/sidebar-user-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { CORE_URL } from "@/config";
import type { MeResponse } from "@/lib/api/session";

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
	user: MeResponse["identity"] | null;
	accounts: MeResponse["accounts"];
	slug: string;
};

export function DashboardSidebar({
	user,
	accounts,
	slug,
	...props
}: DashboardSidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { isMobile, setOpenMobile } = useSidebar();

	const closeMobileSidebar = () => {
		if (isMobile) setOpenMobile(false);
	};

	const homePath = `/${slug}`;
	const jobsPath = `/${slug}/jobs`;
	const statsPath = `/${slug}/stats`;

	return (
		<Sidebar collapsible="icon" variant="inset" {...props}>
			<SidebarHeader>
				<AccountSwitcher accounts={accounts} slug={slug} />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={
										pathname === homePath || pathname === `${homePath}/`
									}
									tooltip="Home"
									render={
										<Link
											to="/$account_slug"
											params={{ account_slug: slug }}
											onClick={closeMobileSidebar}
										/>
									}
								>
									<LayoutDashboard />
									<span>Home</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{import.meta.env.DEV ? (
					<SidebarGroup>
						<SidebarGroupLabel>Dev</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										tooltip="Letters"
										render={
											// biome-ignore lint/a11y/useAnchorContent: children merge via useRender
											<a
												href={`${CORE_URL}/letter_opener`}
												target="_blank"
												rel="noreferrer"
												aria-label="Letters"
												onClick={closeMobileSidebar}
											/>
										}
									>
										<Mail />
										<span>Letters</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				) : null}

				{user?.staff ? (
					<SidebarGroup>
						<SidebarGroupLabel>Admin</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={
											pathname === jobsPath ||
											pathname.startsWith(`${jobsPath}/`)
										}
										tooltip="Jobs"
										render={
											<Link
												to="/$account_slug/jobs"
												params={{ account_slug: slug }}
												onClick={closeMobileSidebar}
											/>
										}
									>
										<BriefcaseBusiness />
										<span>Jobs</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={
											pathname === statsPath ||
											pathname.startsWith(`${statsPath}/`)
										}
										tooltip="Stats"
										render={
											<Link
												to="/$account_slug/stats"
												params={{ account_slug: slug }}
												onClick={closeMobileSidebar}
											/>
										}
									>
										<Activity />
										<span>Stats</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				) : null}
			</SidebarContent>

			<SidebarFooter>
				{user ? <SidebarUserMenu user={user} /> : null}
			</SidebarFooter>
		</Sidebar>
	);
}
