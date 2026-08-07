import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Building2,
	Check,
	ChevronsUpDown,
	UserRound,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { CORE_URL } from "@/config";
import {
	type AccountSummary,
	resolveSelectedAccount,
	setSelectedAccountSlug,
} from "@/lib/auth/account";
import { cn } from "@/lib/utils";

export function AccountSwitcher({
	accounts,
	slug,
}: {
	accounts: AccountSummary[];
	slug: string;
}) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { isMobile } = useSidebar();
	const [active, setActive] = useState<AccountSummary | null>(
		() =>
			accounts.find((account) => account.slug === slug) ??
			resolveSelectedAccount(accounts),
	);

	useEffect(() => {
		setActive(
			accounts.find((account) => account.slug === slug) ??
				resolveSelectedAccount(accounts),
		);
	}, [accounts, slug]);

	if (!active) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						disabled
						tooltip="No accounts"
						className="group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
					>
						<span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<Building2 className="size-4" />
						</span>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">No accounts</span>
							<span className="truncate text-xs">Create one to continue</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	function selectAccount(account: AccountSummary) {
		setSelectedAccountSlug(account.slug);
		setActive(account);

		const suffix = pathname.startsWith(`/${slug}/`)
			? pathname.slice(`/${slug}`.length)
			: "";

		if (suffix === "/jobs") {
			void navigate({ to: "/$account_slug/jobs", params: { account_slug: account.slug } });
			return;
		}
		if (suffix === "/stats") {
			void navigate({ to: "/$account_slug/stats", params: { account_slug: account.slug } });
			return;
		}
		void navigate({ to: "/$account_slug", params: { account_slug: account.slug } });
	}

	const ActiveIcon = active.personal ? UserRound : Building2;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								tooltip={active.name}
								className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
							/>
						}
					>
						<span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<ActiveIcon className="size-4" />
						</span>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{active.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{active.personal ? "Personal" : "Team"} · /{active.slug}
							</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4" />
					</DropdownMenuTrigger>

					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Accounts
							</DropdownMenuLabel>
							{accounts.map((account) => {
								const Icon = account.personal ? UserRound : Building2;
								const selected = account.id === active.id;
								return (
									<DropdownMenuItem
										key={account.id}
										className="gap-2 p-2"
										onClick={() => selectAccount(account)}
									>
										<span className="flex size-6 items-center justify-center rounded-md border border-border">
											<Icon className="size-3.5 shrink-0" />
										</span>
										<span className="flex-1 truncate">{account.name}</span>
										<Check
											className={cn(
												"size-4",
												selected ? "opacity-100" : "opacity-0",
											)}
										/>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="gap-2 p-2"
								onClick={() => {
									window.open(
										`${CORE_URL}/my/accounts`,
										"_blank",
										"noopener,noreferrer",
									);
								}}
							>
								<span className="flex size-6 items-center justify-center rounded-md border border-border bg-transparent">
									<Users className="size-3.5" />
								</span>
								<span className="font-medium">Manage accounts</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
