import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { clearSessionToken } from "@/lib/auth/session";

export function useAdminResource<T>(
	load: () => Promise<T>,
	fallbackError: string,
	slug: string,
) {
	const navigate = useNavigate();
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
					clearSessionToken();
					navigate({ to: "/sign" });
					return;
				}
				if (err instanceof ApiError && err.status === 403) {
					navigate({ to: "/$account_slug", params: { account_slug: slug } });
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
	}, [fallbackError, load, navigate, slug]);

	return { data, error, loading };
}
