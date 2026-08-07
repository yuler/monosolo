import { CORE_URL } from "@/config";
import { clearCsrfToken, ensureCsrfToken } from "@/lib/api/csrf";
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

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isMutatingMethod(method: string): boolean {
	return MUTATING_METHODS.has(method.toUpperCase());
}

export async function apiFetch<T>(
	path: string,
	{
		body,
		auth = false,
		accountScoped = false,
		headers,
		method = "GET",
		...init
	}: ApiOptions = {},
): Promise<T> {
	const requestHeaders = new Headers(headers);
	if (body !== undefined) {
		requestHeaders.set("Content-Type", "application/json");
	}
	requestHeaders.set("Accept", "application/json");

	const token = auth ? getSessionToken() : null;
	if (token) {
		requestHeaders.set("Authorization", `Bearer ${token}`);
	}

	if (accountScoped) {
		const slug = getSelectedAccountSlug();
		if (slug) {
			requestHeaders.set("X-Account-Slug", slug);
		}
	}

	if (isMutatingMethod(method) && !token) {
		requestHeaders.set("X-CSRF-Token", await ensureCsrfToken());
	}

	const response = await fetch(`${CORE_URL}${path}`, {
		...init,
		method,
		credentials: "include",
		headers: requestHeaders,
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	if (response.status === 422) {
		let code: string | undefined;
		try {
			const payload = (await response.clone().json()) as { code?: string };
			code = payload.code;
		} catch {
			// ignore
		}
		if (code === "INVALID_CSRF") {
			clearCsrfToken();
			requestHeaders.set("X-CSRF-Token", await ensureCsrfToken());
			const retry = await fetch(`${CORE_URL}${path}`, {
				...init,
				method,
				credentials: "include",
				headers: requestHeaders,
				body: body === undefined ? undefined : JSON.stringify(body),
			});
			return parseResponse<T>(retry, auth);
		}
	}

	return parseResponse<T>(response, auth);
}

async function parseResponse<T>(response: Response, auth: boolean): Promise<T> {
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
