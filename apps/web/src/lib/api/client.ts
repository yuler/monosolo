import { CORE_URL } from "@/config";
import { getSelectedAccountSlug } from "@/lib/auth/account";
import { clearSessionToken, getSessionToken } from "@/lib/auth/session";

export class ApiError extends Error {
	status: number;
	code?: string;

	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

type ApiOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	auth?: boolean;
	/** When true, sends X-Account-Slug from the selected account (account-scoped APIs). */
	accountScoped?: boolean;
};

export async function apiFetch<T>(
	path: string,
	{
		body,
		auth = false,
		accountScoped = false,
		headers,
		...init
	}: ApiOptions = {},
): Promise<T> {
	const requestHeaders = new Headers(headers);
	if (body !== undefined) {
		requestHeaders.set("Content-Type", "application/json");
	}
	requestHeaders.set("Accept", "application/json");

	if (auth) {
		const token = getSessionToken();
		if (!token) {
			throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
		}
		requestHeaders.set("Authorization", `Bearer ${token}`);
	}

	if (accountScoped) {
		const slug = getSelectedAccountSlug();
		if (slug) {
			requestHeaders.set("X-Account-Slug", slug);
		}
	}

	const response = await fetch(`${CORE_URL}${path}`, {
		...init,
		headers: requestHeaders,
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	if (response.status === 401 && auth) {
		clearSessionToken();
	}

	if (!response.ok) {
		let message = response.statusText || "Request failed";
		let code: string | undefined;
		try {
			const payload = (await response.json()) as {
				message?: string;
				error?: string;
				code?: string;
			};
			message = payload.message ?? payload.error ?? message;
			code = payload.code;
		} catch {
			// ignore JSON parse errors
		}
		throw new ApiError(response.status, message, code);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}
