import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { safeReturnTo } from "@/lib/auth/return-to";

export function useAdminResource<T>(
	load: () => Promise<T>,
	fallbackError: string,
	slug: string,
) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const search = useRouterState({ select: (s) => s.location.searchStr });
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			setLoading(true);
			setError(null);
			try {
				const response = await load();
				if (!cancelled) setData(response);
			} catch (err) {
				if (cancelled) return;
				if (err instanceof ApiError && err.status === 401) {
					const returnTo = safeReturnTo(`${pathname}${search}`);
					void navigate({
						to: "/sign",
						search: returnTo ? { return_to: returnTo } : {},
					});
					return;
				}
				if (err instanceof ApiError && err.status === 403) {
					void navigate({
						to: "/$account_slug",
						params: { account_slug: slug },
					});
					return;
				}
				setError(err instanceof ApiError ? err.message : fallbackError);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [fallbackError, load, navigate, pathname, search, slug]);

	return { data, error, loading };
}
