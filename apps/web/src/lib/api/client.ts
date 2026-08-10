import { CORE_URL } from "@/config";

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
};

async function request(
	path: string,
	{ body, headers, method = "GET", ...init }: ApiOptions = {},
): Promise<Response> {
	const requestHeaders = new Headers(headers);
	if (body !== undefined) {
		requestHeaders.set("Content-Type", "application/json");
	}
	requestHeaders.set("Accept", "application/json");

	// Mode A (split): CORE_URL is absolute origin. Mode B (proxy): CORE_URL is
	// "" so `path` stays a same-origin relative URL (e.g. `/api/v1/me`).
	// Session is the HttpOnly `session_id` cookie (credentials: "include").
	const url = CORE_URL ? `${CORE_URL}${path}` : path;
	const response = await fetch(url, {
		...init,
		method,
		credentials: "include",
		headers: requestHeaders,
		body: body === undefined ? undefined : JSON.stringify(body),
	});

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

	return response;
}

export async function apiFetch<T>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	const response = await request(path, options);

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

/** Like apiFetch, but also returns response headers (e.g. X-Magic-Link-Code). */
export async function apiFetchWithHeaders<T>(
	path: string,
	options: ApiOptions = {},
): Promise<{ data: T; headers: Headers }> {
	const response = await request(path, options);

	if (response.status === 204) {
		return { data: undefined as T, headers: response.headers };
	}

	return {
		data: (await response.json()) as T,
		headers: response.headers,
	};
}
