import { CORE_URL } from "@/config";

let csrfToken: string | null = null;

export function clearCsrfToken(): void {
	csrfToken = null;
}

export async function ensureCsrfToken(): Promise<string> {
	if (csrfToken) return csrfToken;

	const response = await fetch(`${CORE_URL}/api/v1/csrf`, {
		credentials: "include",
		headers: { Accept: "application/json" },
	});

	if (!response.ok) {
		throw new Error("Failed to fetch CSRF token");
	}

	const payload = (await response.json()) as { csrf_token: string };
	csrfToken = payload.csrf_token;
	return csrfToken;
}
