import { createContext, useContext } from "react";

import type { MeResponse } from "@/lib/api/session";

export type DashboardMeContextValue = {
	me: MeResponse | null;
	loading: boolean;
	error: string | null;
};

const DashboardMeContext = createContext<DashboardMeContextValue>({
	me: null,
	loading: true,
	error: null,
});

export function DashboardMeProvider({
	value,
	children,
}: {
	value: DashboardMeContextValue;
	children: React.ReactNode;
}) {
	return (
		<DashboardMeContext.Provider value={value}>
			{children}
		</DashboardMeContext.Provider>
	);
}

export function useDashboardMe() {
	return useContext(DashboardMeContext);
}
